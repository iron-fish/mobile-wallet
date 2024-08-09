import * as IronfishNativeModule from "ironfish-native-module";
import { WalletDb } from "./db";
import {
  AccountFormat,
  LanguageKey,
  Note,
  decodeAccount,
  encodeAccount,
} from "@ironfish/sdk";
import { ChainProcessor } from "../chainProcessor";
import { Network } from "../constants";
import * as Uint8ArrayUtils from "../../utils/uint8Array";
import { LightBlock, LightTransaction } from "../api/lightstreamer";
import { WriteCache } from "./writeCache";
import { WalletServerApi } from "../api/walletServer";

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

    const key = IronfishNativeModule.generateKey();
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

  async getBalances(accountId: number, network: Network) {
    assertStarted(this.state);

    const unconfirmed = await this.state.db.getBalances(accountId, network);

    const deltas = await this.getUnconfirmedDeltas(accountId, network);
    const confirmed: { assetId: Uint8Array; value: string }[] = unconfirmed.map(
      (balance) => {
        const assetDeltas = deltas.filter((d) =>
          Uint8ArrayUtils.areEqual(d.assetId, balance.assetId),
        );

        return {
          assetId: balance.assetId,
          value: assetDeltas
            .reduce((a, b) => {
              return a - BigInt(b.value);
            }, BigInt(balance.value))
            .toString(),
        };
      },
    );

    // Caution, this makes the assumption that unconfirmed and confirmed are ordered the same
    const balanceReturns = [];
    for (let i = 0; i < unconfirmed.length; i++) {
      balanceReturns.push({
        assetId: unconfirmed[i].assetId,
        confirmed: confirmed[i].value,
        unconfirmed: unconfirmed[i].value,
      });
    }

    return balanceReturns;
  }

  /**
   * Returns transaction balance deltas from head - confirmationRange + 1 to head, inclusive.
   */
  private async getUnconfirmedDeltas(accountId: number, network: Network) {
    assertStarted(this.state);

    const chainHead = (await WalletServerApi.getLatestBlock(network)).sequence;
    // TODO: Make confirmation range configurable
    const confirmationRange = 2;

    if (confirmationRange <= 0) {
      return [];
    }

    const deltas = await this.state.db.getTransactionBalanceDeltasBySequence(
      accountId,
      network,
      chainHead - confirmationRange + 1,
      chainHead,
    );

    return deltas;
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

  async getTransaction(accountName: string, transactionHash: Uint8Array) {
    assertStarted(this.state);

    const account = await this.getAccount(accountName);
    if (account == null) {
      throw new Error(`No account found with name ${accountName}`);
    }

    return await this.state.db.getTransaction(account.id, transactionHash);
  }

  async getTransactionNotes(transactionHash: Uint8Array) {
    assertStarted(this.state);

    return await this.state.db.getTransactionNotes(transactionHash);
  }

  async getTransactions(accountName: string, network: Network) {
    assertStarted(this.state);

    const account = await this.getAccount(accountName);
    if (account == null) {
      throw new Error(`No account found with name ${accountName}`);
    }

    return await this.state.db.getTransactions(account.id, network);
  }

  async getUnspentNotes(accountName: string, network: Network) {
    assertStarted(this.state);

    const account = await this.getAccount(accountName);
    if (account == null) {
      throw new Error(`No account found with name ${accountName}`);
    }

    return await this.state.db.getUnspentNotes(account.id, network);
  }

  private async decryptBlockNotesAsOwner(
    block: LightBlock,
    incomingHexKey: string,
    viewHexKey: string,
  ): Promise<
    Map<
      string,
      {
        transaction: LightTransaction;
        notes: { position: number; note: Note; nullifier: string }[];
      }
    >
  > {
    assertStarted(this.state);

    const hexOutputs = block.transactions
      .flatMap((transaction) => transaction.outputs)
      .map((output) => Uint8ArrayUtils.toHex(output.note));

    const results = await IronfishNativeModule.decryptNotesForOwner(
      hexOutputs,
      incomingHexKey,
    );

    if (results.length === 0) {
      return new Map();
    }

    const startingNoteIndex = block.noteSize - hexOutputs.length;

    const transactions: Map<
      string,
      {
        transaction: LightTransaction;
        notes: { position: number; note: Note; nullifier: string }[];
      }
    > = new Map();
    for (const result of results) {
      const output = hexOutputs[result.index];
      const outputBuffer = Uint8ArrayUtils.fromHex(output);

      // find a transaction with a matching output
      const transaction = block.transactions.find((transaction) =>
        transaction.outputs.some((o) =>
          Uint8ArrayUtils.areEqual(o.note, outputBuffer),
        ),
      );

      if (!transaction) {
        console.error("Transaction not found");
        continue;
      }

      const note = new Note(Buffer.from(Uint8ArrayUtils.fromHex(result.note)));
      const position = startingNoteIndex + result.index;
      const nullifier = await IronfishNativeModule.nullifier(
        Uint8ArrayUtils.toHex(note.serialize()),
        position.toString(),
        viewHexKey,
      );

      const hexHash = Uint8ArrayUtils.toHex(transaction.hash);
      const txnStore = transactions.get(hexHash);
      if (txnStore) {
        txnStore.notes.push({ note, position, nullifier });
      } else {
        transactions.set(hexHash, {
          transaction,
          notes: [{ note, position, nullifier }],
        });
      }
    }

    return transactions;
  }

  private async decryptNotesAsSpender(
    transactions: LightTransaction[],
    outgoingHexKey: string,
  ): Promise<
    Map<
      string,
      {
        transaction: LightTransaction;
        notes: { note: Note }[];
      }
    >
  > {
    assertStarted(this.state);

    const hexOutputs = transactions
      .flatMap((transaction) => transaction.outputs)
      .map((output) => Uint8ArrayUtils.toHex(output.note));

    if (hexOutputs.length === 0) {
      return new Map();
    }

    const results = await IronfishNativeModule.decryptNotesForSpender(
      hexOutputs,
      outgoingHexKey,
    );

    if (results.length === 0) {
      return new Map();
    }

    const resultTransactions: Map<
      string,
      {
        transaction: LightTransaction;
        notes: { note: Note }[];
      }
    > = new Map();
    for (const result of results) {
      const output = hexOutputs[result.index];
      const outputBuffer = Uint8ArrayUtils.fromHex(output);

      // find a transaction with a matching output
      const transaction = transactions.find((transaction) =>
        transaction.outputs.some((o) =>
          Uint8ArrayUtils.areEqual(o.note, outputBuffer),
        ),
      );

      if (!transaction) {
        console.error("Transaction not found");
        continue;
      }

      const note = new Note(Buffer.from(Uint8ArrayUtils.fromHex(result.note)));

      const hexHash = Uint8ArrayUtils.toHex(transaction.hash);
      const txnStore = resultTransactions.get(hexHash);
      if (txnStore) {
        txnStore.notes.push({ note });
      } else {
        resultTransactions.set(hexHash, {
          transaction,
          notes: [{ note }],
        });
      }
    }

    return resultTransactions;
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

            if (
              (h === null && block.sequence !== 1) ||
              (h !== null && !Uint8ArrayUtils.areEqual(h, prevHash))
            ) {
              continue;
            }

            const transactionMap = new Map<
              string,
              {
                transaction: LightTransaction;
                ownerNotes: {
                  position: number;
                  note: Note;
                  nullifier: string;
                }[];
                foundNullifiers: Uint8Array[];
                spenderNotes: {
                  note: Note;
                }[];
              }
            >();

            const transactions = await this.decryptBlockNotesAsOwner(
              block,
              account.decodedAccount.incomingViewKey,
              account.decodedAccount.viewKey,
            );

            for (const [hash, transaction] of transactions.entries()) {
              const txn = transactionMap.get(hash);
              if (txn) {
                txn.ownerNotes = txn.ownerNotes.concat(transaction.notes);
              } else {
                transactionMap.set(hash, {
                  transaction: transaction.transaction,
                  ownerNotes: transaction.notes,
                  foundNullifiers: [],
                  spenderNotes: [],
                });
              }
            }

            // Check if you're a sender on the transactions.
            let transactionsWithSpends = new Set<LightTransaction>();
            for (const transaction of block.transactions) {
              for (const nullifier of transaction.spends) {
                // TODO: It may be possible to check only the first nullifier
                // in a transaction as a performance optimization, if only
                // one account can spend notes in a transaction.
                if (
                  !(await cache.hasNullifier(nullifier.nf, Network.TESTNET))
                ) {
                  continue;
                }

                transactionsWithSpends.add(transaction);
                const hexHash = Uint8ArrayUtils.toHex(transaction.hash);
                const txn = transactionMap.get(hexHash);
                if (txn) {
                  txn.foundNullifiers.push(nullifier.nf);
                } else {
                  transactionMap.set(hexHash, {
                    transaction,
                    ownerNotes: [],
                    foundNullifiers: [nullifier.nf],
                    spenderNotes: [],
                  });
                }
              }
            }

            const decryptedSpendTransactions = await this.decryptNotesAsSpender(
              [...transactionsWithSpends],
              account.decodedAccount.outgoingViewKey,
            );

            for (const [hash, value] of decryptedSpendTransactions.entries()) {
              const txn = transactionMap.get(hash);
              if (txn) {
                // TODO: Only decrypt notes that haven't already been decrypted
                const ownerSet = new Set(
                  txn.ownerNotes.map((n) =>
                    Uint8ArrayUtils.toHex(n.note.serialize()),
                  ),
                );

                txn.spenderNotes = txn.spenderNotes.concat(
                  value.notes.filter(
                    (n) =>
                      !ownerSet.has(Uint8ArrayUtils.toHex(n.note.serialize())),
                  ),
                );
              } else {
                transactionMap.set(hash, {
                  transaction: value.transaction,
                  ownerNotes: [],
                  foundNullifiers: [],
                  spenderNotes: value.notes,
                });
              }
            }

            for (const transaction of transactionMap.values()) {
              cache.pushTransaction(
                account.id,
                block.hash,
                block.sequence,
                new Date(block.timestamp),
                transaction.transaction,
                transaction.ownerNotes,
                transaction.spenderNotes,
                transaction.foundNullifiers,
              );
            }

            cache.setHead(account.id, {
              hash: block.hash,
              sequence: block.sequence,
            });
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
