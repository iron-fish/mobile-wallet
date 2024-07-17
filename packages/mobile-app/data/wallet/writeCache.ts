import { LightTransaction } from "../api/lightstreamer";
import { Network } from "../constants";
import { WalletDb } from "./db";

/**
 * Writing to the database for each connected block for each account has a performance impact on scanning.
 * Typically we'll just be incrementing the account head, so we can cache the updated heads and persist them
 * at intervals.
 */
export class WriteCache {
  readonly heads: Map<number, { hash: Uint8Array; sequence: number }> =
    new Map();

  readonly transactions: {
    accountId: number;
    hash: Uint8Array;
    sequence: number;
    timestamp: Date;
    transaction: LightTransaction;
  }[] = [];

  constructor(
    readonly db: WalletDb,
    readonly network: Network,
  ) {}

  getHead(id: number): { hash: Uint8Array; sequence: number } | undefined {
    return this.heads.get(id);
  }

  setHead(id: number, head: { hash: Uint8Array; sequence: number }) {
    this.heads.set(id, head);
  }

  pushTransaction(
    accountId: number,
    hash: Uint8Array,
    sequence: number,
    timestamp: Date,
    transaction: LightTransaction,
  ) {
    this.transactions.push({
      accountId,
      hash,
      sequence,
      transaction,
      timestamp,
    });
  }

  /**
   * Writes the cache to the database.
   */
  async write() {
    for (const [k, v] of this.heads) {
      console.log(`updating account ID ${k} head to ${v.sequence}`);
      await this.db.updateAccountHead(k, this.network, v.sequence, v.hash);
    }

    let txn = this.transactions.pop();
    while (txn) {
      console.log(`saving transaction for account ID ${txn.accountId}`);
      await this.db.saveTransaction({
        hash: txn.transaction.hash,
        accountId: txn.accountId,
        blockHash: txn.hash,
        blockSequence: txn.sequence,
        timestamp: txn.timestamp,
        network: this.network,
      });
      txn = this.transactions.pop();
    }
  }
}
