import * as IronfishNativeModule from "ironfish-native-module";
import { DBTransaction, WalletDb } from "./db";
import {
  AccountFormat,
  LanguageKey,
  Note,
  RawTransaction,
  Transaction,
  TransactionStatus,
  decodeAccountImport,
  encodeAccountImport,
} from "@ironfish/sdk";
import { ChainProcessor } from "../chainProcessor";
import { CONFIRMATIONS, Network } from "../constants";
import * as Uint8ArrayUtils from "../../utils/uint8Array";
import { LightBlock, LightTransaction } from "../walletServerApi/lightstreamer";
import { WriteQueue } from "./writeQueue";
import { AssetLoader } from "./assetLoader";
import { Blockchain } from "../blockchain";
import { WalletServerApi } from "../walletServerApi/walletServer";
import { Consensus, MAINNET, TESTNET } from "@ironfish/sdk";
import { getFee } from "@ironfish/sdk/build/src/memPool";

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

// Used when calculating a transaction's expiration sequence by adding it
// to the latest block sequence returned from the API.
const EXPIRATION_DELTA = 20;

export class Wallet {
  state: WalletState = { type: "STOPPED" };
  scanState: ScanState = { type: "IDLE" };

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

  async getAccountWithHeadAndBalances(network: Network, name: string) {
    assertStarted(this.state);

    const account = await this.state.db.getAccountWithHead(name, network);

    if (!account) return;

    const balancesPromise = this.getBalances(account.id, network);

    const balances = await balancesPromise;

    return {
      ...account,
      balances,
    };
  }

  async getAccountsWithHeadAndBalances(network: Network) {
    assertStarted(this.state);

    const accounts = await this.state.db.getAccountsWithHeads(network);

    return await Promise.all(
      accounts.map(async (a) => {
        const balances = await this.getBalances(a.id, network);
        return {
          ...a,
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

    const balances = await this.getBalances(account.id, network);

    return {
      ...account,
      balances,
    };
  }

  async setActiveAccount(name: string) {
    assertStarted(this.state);

    return this.state.db.setActiveAccount(name);
  }

  async getBalances(accountId: number, network: Network) {
    assertStarted(this.state);

    const unconfirmed = await this.state.db.getBalances(accountId, network);

    const deltas = await this.getUnconfirmedDeltas(
      accountId,
      CONFIRMATIONS,
      network,
    );

    const pendingDeltas = await this.getPendingTransactionBalanceDeltas(
      accountId,
      network,
    );
    const spentNotes = await this.getUnconfirmedAndPendingSpentNotes(
      accountId,
      CONFIRMATIONS,
      network,
    );

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

    // available is the sum of unspent notes. This is equal to the confirmed balance,
    // minus unique notes spent in unconfirmed and pending transactions.
    // notes must be unique, otherwise pending could include the same note spent twice.
    const available: { assetId: Uint8Array; value: string }[] = confirmed.map(
      (balance) => {
        const assetNotes = spentNotes.filter((d) =>
          Uint8ArrayUtils.areEqual(d.assetId, balance.assetId),
        );

        return {
          assetId: balance.assetId,
          value: assetNotes
            .reduce((a, b) => {
              return a - BigInt(b.value);
            }, BigInt(balance.value))
            .toString(),
        };
      },
    );

    // pending is unconfirmed with pending transaction deltas applied
    const pending: { assetId: Uint8Array; value: string }[] = unconfirmed.map(
      (balance) => {
        const assetDeltas = pendingDeltas.filter((d) =>
          Uint8ArrayUtils.areEqual(d.assetId, balance.assetId),
        );

        return {
          assetId: balance.assetId,
          value: assetDeltas
            .reduce((a, b) => {
              return a + BigInt(b.value);
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
        pending: pending[i].value,
        available: available[i].value,
      });
    }

    return balanceReturns;
  }

  /**
   * Returns transaction balance deltas from head - confirmations + 1 to head, inclusive.
   */
  private async getUnconfirmedDeltas(
    accountId: number,
    confirmations: number,
    network: Network,
  ) {
    assertStarted(this.state);

    const chainHead = (await Blockchain.getLatestBlock(network)).sequence;

    if (confirmations <= 0) {
      return [];
    }

    const deltas = await this.state.db.getTransactionBalanceDeltasBySequence(
      accountId,
      network,
      chainHead - confirmations + 1,
      chainHead,
    );

    return deltas;
  }

  /**
   * Returns notes spent from head - confirmations + 1 to head, inclusive, as well as notes
   * spent in pending transactions.
   */
  private async getUnconfirmedAndPendingSpentNotes(
    accountId: number,
    confirmations: number,
    network: Network,
  ) {
    assertStarted(this.state);

    const chainHead = (await Blockchain.getLatestBlock(network)).sequence;

    if (confirmations <= 0) {
      return [];
    }

    const notes = await this.state.db.getUnconfirmedAndPendingSpentNotes(
      accountId,
      network,
      chainHead - confirmations + 1,
    );

    return notes;
  }

  /**
   * Returns transaction balance deltas for transactions not yet on a block.
   */
  private async getPendingTransactionBalanceDeltas(
    accountId: number,
    network: Network,
  ) {
    assertStarted(this.state);

    const deltas = await this.state.db.getPendingTransactionBalanceDeltas(
      accountId,
      network,
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

    const decodedAccount = decodeAccountImport(account.viewOnlyAccount, {
      name,
    });

    if (!account.viewOnly && !options?.viewOnly) {
      decodedAccount.spendingKey = await this.state.db.getSpendingKey(
        account.publicAddress,
      );
    }

    return encodeAccountImport(decodedAccount, format, {
      language: options?.language,
    });
  }

  async importAccount(account: string, name?: string) {
    assertStarted(this.state);

    const decodedAccount = decodeAccountImport(account, {
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

  async removeAllAccounts() {
    assertStarted(this.state);

    await this.state.db.removeAllAccounts();
  }

  private async withTransactionStatus(
    txn: DBTransaction,
    accountHead: number,
  ): Promise<DBTransaction & { status: TransactionStatus }> {
    let status: TransactionStatus;
    const latestBlock = await Blockchain.getLatestBlock(txn.network);

    if (txn.blockSequence === null) {
      // This could be shortened to `txn.expirationSequence &&`,
      // but left explicit for clarity.
      if (
        txn.expirationSequence !== null &&
        txn.expirationSequence > 0 &&
        accountHead >= txn.expirationSequence
      ) {
        status = TransactionStatus.EXPIRED;
      } else {
        status = TransactionStatus.PENDING;
      }
    } else if (latestBlock.sequence - txn.blockSequence >= CONFIRMATIONS) {
      status = TransactionStatus.CONFIRMED;
    } else {
      status = TransactionStatus.UNCONFIRMED;
    }

    return {
      ...txn,
      status,
    };
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

    const txn = await this.state.db.getTransaction(account.id, transactionHash);
    if (!txn) return;

    return await this.withTransactionStatus(txn, account.head?.sequence ?? 0);
  }

  async getTransactionNotes(transactionHash: Uint8Array) {
    assertStarted(this.state);

    return await this.state.db.getTransactionNotes(transactionHash);
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

    const results = await this.state.db.getTransactions(account.id, network);

    return await Promise.all(
      results.map((txn) =>
        this.withTransactionStatus(txn, account.head?.sequence ?? 0),
      ),
    );
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
        notes: {
          position: number;
          note: Note;
          nullifier: string;
          noteTransactionIndex: number;
        }[];
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

    const startingTreeIndex = block.noteSize - hexOutputs.length;
    let currentTransactionIndex = 0;
    let resultIndex = 0;

    const transactions: Map<
      string,
      {
        transaction: LightTransaction;
        notes: {
          note: Note;
          position: number;
          nullifier: string;
          noteTransactionIndex: number;
        }[];
      }
    > = new Map();
    // Assumes the results are ordered by index
    for (const txn of block.transactions) {
      const nextTransactionIndex = currentTransactionIndex + txn.outputs.length;
      const notes = [];
      while (
        results[resultIndex] != null &&
        results[resultIndex].index < nextTransactionIndex
      ) {
        const note = new Note(
          Buffer.from(Uint8ArrayUtils.fromHex(results[resultIndex].note)),
        );
        const position = startingTreeIndex + results[resultIndex].index;
        const nullifier = await IronfishNativeModule.nullifier({
          note: results[resultIndex].note,
          position: position.toString(),
          viewHexKey,
        });
        const noteTransactionIndex =
          results[resultIndex].index - currentTransactionIndex;

        notes.push({ note, position, nullifier, noteTransactionIndex });

        resultIndex++;
      }

      if (notes.length > 0) {
        transactions.set(Uint8ArrayUtils.toHex(txn.hash), {
          transaction: txn,
          notes,
        });
      }

      if (resultIndex >= results.length) {
        break;
      }

      currentTransactionIndex = nextTransactionIndex;
    }

    if (resultIndex !== results.length) {
      console.error(
        "Some decrypted notes were not associated with a transaction",
      );
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
        notes: { note: Note; noteTransactionIndex: number }[];
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

    let currentTransactionIndex = 0;
    let resultIndex = 0;

    const resultTransactions: Map<
      string,
      {
        transaction: LightTransaction;
        notes: { note: Note; noteTransactionIndex: number }[];
      }
    > = new Map();
    // Assumes results are ordered by index
    for (const txn of transactions) {
      const nextTransactionIndex = currentTransactionIndex + txn.outputs.length;
      const notes = [];
      while (
        results[resultIndex] != null &&
        results[resultIndex].index < nextTransactionIndex
      ) {
        const note = new Note(
          Buffer.from(Uint8ArrayUtils.fromHex(results[resultIndex].note)),
        );
        const noteTransactionIndex =
          results[resultIndex].index - currentTransactionIndex;

        notes.push({ note, noteTransactionIndex });

        resultIndex++;
      }

      if (notes.length > 0) {
        resultTransactions.set(Uint8ArrayUtils.toHex(txn.hash), {
          transaction: txn,
          notes,
        });
      }

      if (resultIndex >= results.length) {
        break;
      }

      currentTransactionIndex = nextTransactionIndex;
    }

    if (resultIndex !== results.length) {
      console.error(
        "Some decrypted notes were not associated with a transaction",
      );
    }

    return resultTransactions;
  }

  async scan(network: Network): Promise<boolean> {
    assertStarted(this.state);

    if (this.scanState.type === "SCANNING") {
      return false;
    }
    const abort = new AbortController();
    this.scanState = { type: "SCANNING", abort };

    const cache = new WriteQueue(this.state.db, network);

    let blockProcess = Promise.resolve();
    let performanceTimer = performance.now();
    let finished = false;

    const dbAccounts = await this.state.db.getAccountsWithHeads(network);
    let earliestHead: {
      hash: Uint8Array;
      sequence: number;
    } | null = null;
    let accounts = [];
    for (const dbAccount of dbAccounts) {
      accounts.push({
        ...dbAccount,
        decodedAccount: decodeAccountImport(dbAccount.viewOnlyAccount, {
          name: dbAccount.name,
        }),
      });

      if (dbAccount.head === null) continue;

      if (
        earliestHead === null ||
        dbAccount.head.sequence < earliestHead.sequence
      ) {
        earliestHead = dbAccount.head;
      }
      cache.setHead(dbAccount.id, {
        hash: dbAccount.head.hash,
        sequence: dbAccount.head.sequence,
      });
    }

    const chainProcessor = new ChainProcessor({
      network,
      abort: abort.signal,
      onAdd: (block) => {
        blockProcess = blockProcess.then(async () => {
          if (abort.signal.aborted) {
            return;
          }

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
                  noteTransactionIndex: number;
                }[];
                foundNullifiers: Uint8Array[];
                spenderNotes: {
                  note: Note;
                  noteTransactionIndex: number;
                }[];
              }
            >();

            const transactions = await this.decryptBlockNotesAsOwner(
              block,
              account.decodedAccount.incomingViewKey,
              account.decodedAccount.viewKey,
            );

            // Preload asset info from the API
            const assetIds = new Set<string>(
              [...transactions.values()]
                .flatMap((t) => t.notes)
                .map((n) => Uint8ArrayUtils.toHex(n.note.assetId())),
            );
            for (const assetId of assetIds) {
              this.state.assetLoader.preloadAsset(network, assetId);
            }

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
                // If making this change, make sure to update balance delta calculation
                // in saveTransaction.
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

            cache.writeBlock(
              account.id,
              { hash: block.hash, sequence: block.sequence },
              [...transactionMap.values()].map((txn) => ({
                hash: txn.transaction.hash,
                timestamp: new Date(block.timestamp),
                ownerNotes: txn.ownerNotes,
                spenderNotes: txn.spenderNotes,
                foundNullifiers: txn.foundNullifiers,
              })),
            );
          }
        });
      },
      onRemove: (block) => {
        blockProcess = blockProcess.then(() => {
          if (abort.signal.aborted) {
            return;
          }

          console.log(`Removing block ${block.sequence}`);

          for (const account of accounts) {
            const h = cache.getHead(account.id)?.hash ?? null;

            if (h && Uint8ArrayUtils.areEqual(h, block.hash)) {
              cache.removeBlock(account.id, {
                hash: block.previousBlockHash,
                sequence: block.sequence - 1,
                prevHash: block.previousBlockHash,
              });
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
      this.scanState = this.scanState.abort.signal.aborted
        ? { type: "PAUSED" }
        : { type: "IDLE" };
      console.log(`finished in ${performance.now() - performanceTimer}ms`);
    }

    return hashChanged;
  }

  pauseScan() {
    if (this.scanState.type === "SCANNING") {
      this.scanState.abort.abort();
    } else if (this.scanState.type === "IDLE") {
      this.scanState = { type: "PAUSED" };
    }
  }

  async getAsset(network: Network, assetId: string) {
    assertStarted(this.state);

    return this.state.assetLoader.getAsset(network, assetId);
  }

  private async getActiveTransactionVersion(network: Network) {
    // TODO IFL-2898 Consider fetching the active transaction version from the API
    // so we don't have to deploy a new version when setting the activation sequence.
    const latestBlock = await Blockchain.getLatestBlock(network);
    let consensus;
    if (network === Network.MAINNET) {
      consensus = new Consensus(MAINNET.consensus);
    } else if (network === Network.TESTNET) {
      consensus = new Consensus(TESTNET.consensus);
    } else {
      throw new Error("Unsupported network");
    }
    return consensus.getActiveTransactionVersion(latestBlock.sequence);
  }

  private async fundOutputs(
    network: Network,
    accountId: number,
    outputs: { assetId: string; amount: string }[],
  ) {
    assertStarted(this.state);

    const assetAmounts = new Map<string, bigint>();
    for (const output of outputs) {
      assetAmounts.set(
        output.assetId,
        (assetAmounts.get(output.assetId) ?? 0n) + BigInt(output.amount),
      );
    }

    const notesToSpend: {
      note: Uint8Array;
      position: number;
      nullifier: Uint8Array;
    }[] = [];
    // for each asset in assetAmounts
    for (let [assetId, amount] of assetAmounts) {
      let { sequence: latestSequence } =
        await Blockchain.getLatestBlock(network);

      // fetch unspent notes
      const unspentNotes = await this.state.db.getUnspentNotes(
        latestSequence,
        CONFIRMATIONS,
        accountId,
        Uint8ArrayUtils.fromHex(assetId),
        network,
      );

      // take notes until we have enough to cover the amount
      for (const note of unspentNotes) {
        if (amount <= 0n) {
          break;
        }
        if (note.position === null || note.nullifier === null) {
          throw new Error(
            "Note position and nullifier should not be null on unspent notes",
          );
        }
        notesToSpend.push({
          note: note.note,
          position: note.position,
          nullifier: note.nullifier,
        });
        amount -= BigInt(note.value);
      }

      // throw if we run out of unspent notes
      if (amount > 0n) {
        throw new Error(`Insufficient balance for asset ${assetId}`);
      }
    }

    return notesToSpend;
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

    // Attempt to fund the transaction
    const notesToSpend = await this.fundOutputs(network, account.id, outputs);

    const activeTxnVersion = await this.getActiveTransactionVersion(network);
    const rawTxn = new RawTransaction(activeTxnVersion);
    rawTxn.spends = notesToSpend.map((note) => ({
      note: new Note(Buffer.from(note.note)),
      // We don't need to assemble witnesses to estimate transaction fees
      witness: [] as any,
    }));
    rawTxn.outputs = await Promise.all(
      outputs.map(async (output) => {
        return {
          note: new Note(
            Buffer.from(
              await IronfishNativeModule.createNote({
                owner: Uint8ArrayUtils.fromHex(account.publicAddress),
                value: output.amount,
                memo: new Uint8Array(),
                assetId: Uint8ArrayUtils.fromHex(output.assetId),
                sender: Uint8ArrayUtils.fromHex(account.publicAddress),
              }),
            ),
          ),
        };
      }),
    );

    const size = rawTxn.postedSize();

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
    outputs: {
      amount: string;
      assetId: string;
      publicAddress: string;
      memoHex: string;
    }[],
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

    console.log(`Account fetched in: ${performance.now() - lastTime}ms`);
    lastTime = performance.now();

    // Attempt to fund the transaction
    const notesToSpend = await this.fundOutputs(network, account.id, outputs);

    console.log(`Unspent notes fetched in: ${performance.now() - lastTime}ms`);
    lastTime = performance.now();

    // Call noteWitness API for each note you want to spend
    const witnesses = notesToSpend.map((note) =>
      WalletServerApi.getNoteWitness(network, note.position, CONFIRMATIONS),
    );

    // Call createNote for each output you want to create
    const notes = await Promise.all(
      outputs.map((output) =>
        IronfishNativeModule.createNote({
          assetId: Uint8ArrayUtils.fromHex(output.assetId),
          owner: Uint8ArrayUtils.fromHex(output.publicAddress),
          sender: Uint8ArrayUtils.fromHex(account.publicAddress),
          value: output.amount.toString(),
          memo: Uint8ArrayUtils.fromHex(output.memoHex),
        }),
      ),
    );

    const witnessResults = await Promise.all(witnesses);
    if (witnessResults.length !== notesToSpend.length) {
      throw new Error("witnesses don't match");
    }

    const txnVersion = await this.getActiveTransactionVersion(network);

    console.log(
      `Witnesses and notes prepared in ${performance.now() - lastTime}ms`,
    );
    lastTime = performance.now();

    // Call createTransaction with the spends and outputs
    const spendComponents = notesToSpend.map((note, i) => ({
      note: Uint8ArrayUtils.toHex(note.note),
      witnessRootHash: witnessResults[i].rootHash,
      witnessTreeSize: witnessResults[i].treeSize.toString(),
      witnessAuthPath: witnessResults[i].authPath,
    }));

    const spendingKey = await this.state.db.getSpendingKey(
      account.publicAddress,
    );
    if (spendingKey === null) {
      throw new Error("Spending key not found");
    }

    let { sequence: latestSequence } = await Blockchain.getLatestBlock(network);

    const expirationSequence = latestSequence + EXPIRATION_DELTA;
    // TODO: Implement proper transaction fees
    const result = await IronfishNativeModule.createTransaction(
      txnVersion,
      fee,
      expirationSequence,
      spendComponents,
      notes.map((note) => Uint8ArrayUtils.toHex(note)),
      Uint8ArrayUtils.fromHex(spendingKey),
    );

    console.log(`Transaction created in ${performance.now() - lastTime}ms`);
    lastTime = performance.now();
    console.log(Uint8ArrayUtils.toHex(result));

    const txn = new Transaction(Buffer.from(result));
    const decodedAccount = decodeAccountImport(account.viewOnlyAccount, {
      name: account.name,
    });

    // We could create change notes ourselves to avoid decryption altogether.
    const decryptedNotes = await IronfishNativeModule.decryptNotesForSpender(
      txn.notes.map((note) => Uint8ArrayUtils.toHex(note.serialize())),
      decodedAccount.outgoingViewKey,
    );

    if (decryptedNotes.length !== txn.notes.length) {
      console.error("All notes should be decryptable by the spender");
    }

    const ownerNotes = [];
    const spenderNotes = [];
    for (const hexNote of decryptedNotes) {
      const note = new Note(Buffer.from(Uint8ArrayUtils.fromHex(hexNote.note)));
      if (note.owner() === decodedAccount.publicAddress) {
        ownerNotes.push({ note, noteTransactionIndex: hexNote.index });
      } else {
        spenderNotes.push({ note, noteTransactionIndex: hexNote.index });
      }
    }

    const broadcastResult = await WalletServerApi.broadcastTransaction(
      network,
      result,
    );

    if (!broadcastResult.accepted) {
      console.error("Transaction was not accepted by the network");
      return;
    }

    if (!broadcastResult.broadcasted) {
      console.error("Transaction was not broadcasted by the network");
      return;
    }

    // Save the transaction in a pending state in the database
    const hash = await IronfishNativeModule.hashTransaction(result);

    await this.state.db.savePendingTransaction({
      accountId: account.id,
      network,
      hash,
      timestamp: new Date(),
      expirationSequence: expirationSequence,
      fee,
      foundNullifiers: notesToSpend.map((note) => note.nullifier),
      spenderNotes,
      ownerNotes,
    });

    console.log(`Transaction saved in ${performance.now() - lastTime}ms`);

    return hash;
  }
}

export const wallet = new Wallet();
