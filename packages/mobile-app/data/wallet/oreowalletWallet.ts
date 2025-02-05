import * as IronfishNativeModule from "ironfish-native-module";
import { WalletDb } from "./db";
import {
  AccountFormat,
  LanguageKey,
  RawTransactionSerde,
  decodeAccount,
  encodeAccount,
} from "@ironfish/sdk";
import { Network } from "../constants";
import * as Uint8ArrayUtils from "../../utils/uint8Array";
import { AssetLoader } from "./assetLoader";
import { Blockchain } from "../blockchain";
import { Output } from "../facades/wallet/types";
import { getFee } from "@ironfish/sdk/build/src/memPool";
import { OreowalletServerApi } from "../oreowalletServerApi/oreowalletServerApi";

type StartedState = { type: "STARTED"; db: WalletDb; assetLoader: AssetLoader };
type WalletState = { type: "STOPPED" } | { type: "LOADING" } | StartedState;
type ScanState =
  // Not scanning, and a scan can be started
  | { type: "IDLE" }
  // Not scanning, and a scan cannot be started
  | { type: "PAUSED" }
  // Scanning
  | { type: "SCANNING"; abort: AbortController };

function assertStarted(state: WalletState): asserts state is StartedState {
  if (state.type !== "STARTED") {
    throw new Error("Wallet is not started");
  }
}

// TODO: Make confirmations configurable
const CONFIRMATIONS = 2;

// Used when calculating a transaction's expiration sequence by adding it
// to the latest block sequence returned from the API.
const EXPIRATION_DELTA = 20;

export class Wallet {
  state: WalletState = { type: "STOPPED" };
  scanState: ScanState = { type: "SCANNING", abort: new AbortController() };

  async start() {
    if (this.state.type !== "STOPPED") {
      throw new Error("Wallet is not stopped");
    }

    this.state = { type: "LOADING" };

    const db = await WalletDb.init();

    this.state = { type: "STARTED", db, assetLoader: new AssetLoader(db) };
  }

  async stop() {
    this.state = { type: "STOPPED" };
  }

  async createAccount(network: Network, name: string) {
    assertStarted(this.state);

    const key = IronfishNativeModule.generateKey();

    const latestBlock = await OreowalletServerApi.getLatestBlock(network);

    await OreowalletServerApi.importAccount(network, {
      viewKey: key.viewKey,
      incomingViewKey: key.incomingViewKey,
      outgoingViewKey: key.outgoingViewKey,
      publicAddress: key.publicAddress,
      createdAt: {
        hash: latestBlock.currentBlockIdentifier.hash,
        sequence: Number(latestBlock.currentBlockIdentifier.index),
      },
    });

    return await this.state.db.createAccount({
      createdAt: {
        hash: Buffer.from(latestBlock.currentBlockIdentifier.hash, "hex"),
        sequence: Number(latestBlock.currentBlockIdentifier.index),
      },
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

  async getAccountWithHeadAndBalances(network: Network, name: string) {
    assertStarted(this.state);

    const account = await this.state.db.getAccount(name);

    if (!account) return;

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name: account.name,
    });

    const status = await OreowalletServerApi.getAccountStatus(network, {
      publicAddress: account.publicAddress,
      viewKey: decodedAccount.viewKey,
    });

    const balances = await this.getBalances(account.id, network);

    return {
      ...account,
      head: status.account.head
        ? {
            hash: Uint8ArrayUtils.fromHex(status.account.head.hash),
            sequence: Number(status.account.head.sequence),
          }
        : undefined,
      balances: balances,
    };
  }

  async getAccountsWithHeadAndBalances(network: Network) {
    assertStarted(this.state);

    const accounts = await this.state.db.getAccountsWithHeads(network);

    return await Promise.all(
      accounts.map(async (a) => {
        const balances = await this.getBalances(a.id, network);

        const decodedAccount = decodeAccount(a.viewOnlyAccount, {
          name: a.name,
        });

        const status = await OreowalletServerApi.getAccountStatus(network, {
          publicAddress: a.publicAddress,
          viewKey: decodedAccount.viewKey,
        });
        return {
          ...a,
          head: status.account.head
            ? {
                hash: Uint8ArrayUtils.fromHex(status.account.head.hash),
                sequence: Number(status.account.head.sequence),
              }
            : undefined,
          balances,
        };
      }),
    );
  }

  async getAccount(name: string) {
    assertStarted(this.state);

    return this.state.db.getAccount(name);
  }

  async getActiveAccountWithHeadAndBalances(network: Network) {
    assertStarted(this.state);

    const account = await this.state.db.getActiveAccountWithHead(network);

    if (!account) return;

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name: account.name,
    });

    const balances = await this.getBalances(account.id, network);
    const status = await OreowalletServerApi.getAccountStatus(network, {
      publicAddress: account.publicAddress,
      viewKey: decodedAccount.viewKey,
    });

    return {
      ...account,
      head: status.account.head
        ? {
            hash: Uint8ArrayUtils.fromHex(status.account.head.hash),
            sequence: Number(status.account.head.sequence),
          }
        : undefined,
      balances,
    };
  }

  async setActiveAccount(name: string) {
    assertStarted(this.state);

    return this.state.db.setActiveAccount(name);
  }

  async getBalances(
    accountId: number,
    network: Network,
  ): Promise<
    {
      assetId: Uint8Array;
      confirmed: string;
      unconfirmed: string;
      pending: string;
      available: string;
    }[]
  > {
    assertStarted(this.state);

    const account = await this.state.db.getAccountById(accountId);
    if (!account) return [];

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name: account.name,
    });

    const response = await OreowalletServerApi.getBalances(
      network,
      { publicAddress: account.publicAddress, viewKey: decodedAccount.viewKey },
      CONFIRMATIONS,
    );

    return response.balances.map((b) => ({
      ...b,
      assetId: Uint8ArrayUtils.fromHex(b.assetId),
    }));
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

  async importAccount(network: Network, account: string, name?: string) {
    assertStarted(this.state);

    const decodedAccount = decodeAccount(account, {
      name,
    });

    await OreowalletServerApi.importAccount(network, {
      viewKey: decodedAccount.viewKey,
      incomingViewKey: decodedAccount.incomingViewKey,
      outgoingViewKey: decodedAccount.outgoingViewKey,
      publicAddress: decodedAccount.publicAddress,
      createdAt: decodedAccount.createdAt
        ? {
            hash: Uint8ArrayUtils.toHex(decodedAccount.createdAt.hash),
            sequence: decodedAccount.createdAt.sequence,
          }
        : undefined,
    });

    return await this.state.db.createAccount(decodedAccount);
  }

  async renameAccount(name: string, newName: string) {
    assertStarted(this.state);

    await this.state.db.renameAccount(name, newName);
  }

  async removeAccount(name: string) {
    assertStarted(this.state);

    // TODO: Should this remove the account from the server? It could still
    // be imported by other clients, so likely not.

    await this.state.db.removeAccount(name);
  }

  async getTransaction(
    accountName: string,
    network: Network,
    transactionHash: Uint8Array,
  ) {
    assertStarted(this.state);

    const account = await this.state.db.getAccountWithHead(
      accountName,
      network,
    );
    if (account == null) {
      throw new Error(`No account found with name ${accountName}`);
    }

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name: account.name,
    });

    const txn = await OreowalletServerApi.getTransaction(
      network,
      { publicAddress: account.publicAddress, viewKey: decodedAccount.viewKey },
      Uint8ArrayUtils.toHex(transactionHash),
    );

    return txn;
  }

  async getTransactionNotes(transactionHash: Uint8Array) {
    assertStarted(this.state);

    return [];
  }

  async getTransactions(accountName: string, network: Network) {
    assertStarted(this.state);

    const account = await this.state.db.getAccountWithHead(
      accountName,
      network,
    );
    if (account == null) {
      throw new Error(`No account found with name ${accountName}`);
    }

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name: account.name,
    });

    const results = await OreowalletServerApi.getTransactions(
      network,
      { publicAddress: account.publicAddress, viewKey: decodedAccount.viewKey },
      50,
    );

    return results.transactions;
  }

  async scan(): Promise<boolean> {
    assertStarted(this.state);

    return true;
  }

  pauseScan() {
    return;
  }

  async getAsset(network: Network, assetId: string) {
    assertStarted(this.state);

    return this.state.assetLoader.getAsset(network, assetId);
  }

  async estimateFees(
    network: Network,
    accountName: string,
    outputs: { assetId: string; amount: string }[],
  ) {
    assertStarted(this.state);

    // Make sure the account exists
    const account = await this.state.db.getAccount(accountName);
    if (account == null) {
      throw new Error(`No account found with name ${accountName}`);
    }

    if (account.viewOnly) {
      throw new Error("Cannot send transactions from a view-only account");
    }

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name: account.name,
    });

    // Attempt to fund the transaction
    const createTransactionResponse =
      await OreowalletServerApi.createTransaction(
        network,
        {
          publicAddress: account.publicAddress,
          viewKey: decodedAccount.viewKey,
        },
        {
          outputs: outputs.map((output) => ({
            publicAddress: account.publicAddress,
            amount: output.amount,
          })),
          fee: "1",
        },
      );

    const rawTxn = RawTransactionSerde.deserialize(
      Buffer.from(createTransactionResponse.transaction, "hex"),
    );

    const size = rawTxn.postedSize("");

    const feeRates = await Blockchain.getFeeRates(Network.TESTNET);

    return {
      slow: getFee(BigInt(feeRates.slow), size).toString(),
      average: getFee(BigInt(feeRates.average), size).toString(),
      fast: getFee(BigInt(feeRates.fast), size).toString(),
    };
  }

  async sendTransaction(
    network: Network,
    accountName: string,
    outputs: Output[],
    fee: string,
    // TODO: Implement transaction expiration
    expiration?: number,
  ) {
    assertStarted(this.state);
    let lastTime = performance.now();
    // Make sure the account exists
    const account = await this.state.db.getAccount(accountName);

    if (account == null) {
      throw new Error(`No account found with name ${accountName}`);
    }

    if (account.viewOnly) {
      throw new Error("Cannot send transactions from a view-only account");
    }

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name: account.name,
    });

    console.log(`Account fetched in: ${performance.now() - lastTime}ms`);
    lastTime = performance.now();

    const createTransactionResult = await OreowalletServerApi.createTransaction(
      network,
      { publicAddress: account.publicAddress, viewKey: decodedAccount.viewKey },
      {
        outputs,
        fee,
      },
    );

    const rawTransaction = RawTransactionSerde.deserialize(
      Buffer.from(createTransactionResult.transaction, "hex"),
    );

    // Call createNote for each output you want to create
    const notes = await Promise.all(
      rawTransaction.outputs.map((output) =>
        IronfishNativeModule.createNote({
          assetId: output.note.assetId(),
          owner: Uint8ArrayUtils.fromHex(output.note.owner()),
          sender: Uint8ArrayUtils.fromHex(output.note.sender()),
          value: output.note.value().toString(),
          memo: output.note.memo(),
        }),
      ),
    );

    // Call createTransaction with the spends and outputs
    const spendComponents = rawTransaction.spends.map((spend) => ({
      note: Uint8ArrayUtils.toHex(spend.note.serialize()),
      witnessRootHash: Uint8ArrayUtils.toHex(spend.witness.serializeRootHash()),
      witnessTreeSize: spend.witness.treeSize().toString(),
      witnessAuthPath: spend.witness.authPath().map((authPath) => ({
        hashOfSibling: Uint8ArrayUtils.toHex(authPath.hashOfSibling()),
        side: authPath.side(),
      })),
    }));

    console.log(
      `Notes and spends prepared in ${performance.now() - lastTime}ms`,
    );
    lastTime = performance.now();

    const spendingKey = await this.state.db.getSpendingKey(
      account.publicAddress,
    );
    if (spendingKey === null) {
      throw new Error("Spending key not found");
    }

    const latestBlock = await OreowalletServerApi.getLatestBlock(network);

    console.log(`Latest block fetched in ${performance.now() - lastTime}ms`);
    lastTime = performance.now();

    const expirationSequence =
      Number(latestBlock.currentBlockIdentifier.index) + EXPIRATION_DELTA;
    // TODO: Implement proper transaction fees
    const postedTransaction = await IronfishNativeModule.createTransaction(
      rawTransaction.version,
      fee,
      expirationSequence,
      spendComponents,
      notes.map((note) => Uint8ArrayUtils.toHex(note)),
      Uint8ArrayUtils.fromHex(spendingKey),
    );

    console.log(`Transaction posted in ${performance.now() - lastTime}ms`);
    lastTime = performance.now();

    const broadcastResult = await OreowalletServerApi.broadcastTransaction(
      network,
      { publicAddress: account.publicAddress, viewKey: decodedAccount.viewKey },
      Uint8ArrayUtils.toHex(postedTransaction),
    );

    if (!broadcastResult.accepted) {
      console.error("Transaction was not accepted by the network");
      return;
    }

    console.log(
      `Transaction ${broadcastResult.hash} broadcast in ${performance.now() - lastTime}ms`,
    );
  }
}

export const oreoWallet = new Wallet();
