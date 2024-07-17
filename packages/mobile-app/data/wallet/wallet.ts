import { generateKey, decryptNotesForOwner } from "ironfish-native-module";
import { WalletDb } from "./db";
import {
  AccountFormat,
  LanguageKey,
  decodeAccount,
  encodeAccount,
} from "@ironfish/sdk";
import { ChainProcessor } from "../chainProcessor";
import { Network } from "../constants";
import * as Uint8ArrayUtils from "../../utils/uint8Array";
import { LightBlock, LightTransaction } from "../api/lightstreamer";
import { WriteCache } from "./writeCache";

type StartedState = { type: "STARTED"; db: WalletDb };
type WalletState = { type: "STOPPED" } | { type: "LOADING" } | StartedState;

function assertStarted(state: WalletState): asserts state is StartedState {
  if (state.type !== "STARTED") {
    throw new Error("Wallet is not started");
  }
}

class Wallet {
  state: WalletState = { type: "STOPPED" };

  async start() {
    if (this.state.type !== "STOPPED") {
      throw new Error("Wallet is not stopped");
    }

    this.state = { type: "LOADING" };

    const db = await WalletDb.init();

    this.state = { type: "STARTED", db };
  }

  async stop() {
    this.state = { type: "STOPPED" };
  }

  async createAccount(name: string) {
    assertStarted(this.state);

    const key = generateKey();
    return await this.state.db.createAccount({
      // TODO: support account birthdays on new accounts
      createdAt: null,
      spendingKey: key.spendingKey,
      incomingViewKey: key.incomingViewKey,
      outgoingViewKey: key.outgoingViewKey,
      proofAuthorizingKey: key.proofAuthorizingKey,
      publicAddress: key.publicAddress,
      version: 4,
      viewKey: key.viewKey,
      name,
    });
  }

  async getAccount(name: string) {
    assertStarted(this.state);

    return this.state.db.getAccount(name);
  }

  async getAccounts() {
    assertStarted(this.state);

    return this.state.db.getAccounts();
  }

  async getAccountHeads(network: Network) {
    assertStarted(this.state);

    return this.state.db.getAccountHeads(network);
  }

  async exportAccount(
    name: string,
    format: AccountFormat,
    options?: { viewOnly?: boolean; language?: LanguageKey },
  ) {
    assertStarted(this.state);

    const account = await this.state.db.getAccount(name);
    if (account == null) {
      throw new Error(`No account found with name ${name}`);
    }

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name,
    });

    if (!account.viewOnly && !options?.viewOnly) {
      decodedAccount.spendingKey = await this.state.db.getSpendingKey(
        account.publicAddress,
      );
    }

    return encodeAccount(decodedAccount, format, {
      language: options?.language,
    });
  }

  async importAccount(account: string, name?: string) {
    assertStarted(this.state);

    const decodedAccount = decodeAccount(account, {
      name,
    });

    return await this.state.db.createAccount(decodedAccount);
  }

  async renameAccount(name: string, newName: string) {
    assertStarted(this.state);

    await this.state.db.renameAccount(name, newName);
  }

  async removeAccount(name: string) {
    assertStarted(this.state);

    await this.state.db.removeAccount(name);
  }

  async getTransactions(network: Network) {
    assertStarted(this.state);

    return await this.state.db.getTransactions(network);
  }

  private async connectBlock(
    block: LightBlock,
    incomingHexKey: string,
  ): Promise<LightTransaction[]> {
    assertStarted(this.state);

    const hexOutputs = block.transactions
      .flatMap((transaction) => transaction.outputs)
      .map((output) => Uint8ArrayUtils.toHex(output.note));

    const results = await decryptNotesForOwner(hexOutputs, incomingHexKey);

    if (results.length === 0) {
      return [];
    }

    const transactions: Map<string, LightTransaction> = new Map();
    for (const result of results) {
      const output = hexOutputs[result.index];
      const outputBuffer = Uint8ArrayUtils.fromHex(output);

      // find a transaction with a matching output
      const transaction = block.transactions.find((transaction) =>
        transaction.outputs.some((output) =>
          Uint8ArrayUtils.areEqual(output.note, outputBuffer),
        ),
      );

      if (!transaction) {
        console.error("Transaction not found");
        continue;
      }

      console.log(Uint8ArrayUtils.toHex(transaction.hash));

      transactions.set(Uint8ArrayUtils.toHex(transaction.hash), transaction);
    }

    console.log("block seq", block.sequence);

    return [...transactions.values()];
  }

  async scan(network: Network): Promise<boolean> {
    assertStarted(this.state);

    const cache = new WriteCache(this.state.db, network);

    let blockProcess = Promise.resolve();
    let performanceTimer = performance.now();
    let finished = false;

    // todo: lock scanning

    const dbAccounts = await this.state.db.getAccounts();
    let accounts = dbAccounts.map((account) => {
      return {
        ...account,
        decodedAccount: decodeAccount(account.viewOnlyAccount, {
          name: account.name,
        }),
      };
    });
    const accountHeads = await this.state.db.getAccountHeads(network);
    let earliestHead = null;
    for (const h of accountHeads) {
      if (
        earliestHead === null ||
        (earliestHead && h.sequence < earliestHead.sequence)
      ) {
        earliestHead = h;
      }
      cache.setHead(h.accountId, {
        hash: h.hash,
        sequence: h.sequence,
      });
    }

    const chainProcessor = new ChainProcessor({
      network,
      onAdd: (block) => {
        blockProcess = blockProcess.then(async () => {
          assertStarted(this.state);

          const prevHash = block.previousBlockHash;

          for (const account of accounts) {
            const h = cache.getHead(account.id)?.hash ?? null;

            if (h === null || Uint8ArrayUtils.areEqual(h, prevHash)) {
              const transactions = await this.connectBlock(
                block,
                account.decodedAccount.incomingViewKey,
              );

              for (const transaction of transactions) {
                cache.pushTransaction(
                  account.id,
                  block.hash,
                  block.sequence,
                  new Date(block.timestamp),
                  transaction,
                );
              }

              cache.setHead(account.id, {
                hash: block.hash,
                sequence: block.sequence,
              });
            }
          }
        });
      },
      onRemove: (block) => {
        blockProcess = blockProcess.then(() => {
          console.log(`Removing block ${block.sequence}`);

          for (const account of accounts) {
            const h = cache.getHead(account.id)?.hash ?? null;

            if (h && Uint8ArrayUtils.areEqual(h, block.hash)) {
              // TODO: Implement disconnect block
              cache.setHead(account.id, {
                hash: block.previousBlockHash,
                sequence: block.sequence - 1,
              });
              // TODO: Remove transactions
            }
          }
        });
      },
    });

    const saveLoop = async () => {
      assertStarted(this.state);

      await cache.write();

      if (!finished) {
        saveLoopTimeout = setTimeout(saveLoop, 1000);
      }
    };
    let saveLoopTimeout = setTimeout(saveLoop, 1000);

    chainProcessor.head = earliestHead;

    let hashChanged = false;
    try {
      hashChanged = (await chainProcessor.update()).hashChanged;
    } finally {
      await blockProcess;
      finished = true;
      clearTimeout(saveLoopTimeout);
      await saveLoop();
      console.log(`finished in ${performance.now() - performanceTimer}ms`);
    }

    return hashChanged;
  }
}

export const wallet = new Wallet();
