import { Note } from "@ironfish/sdk";
import { LightTransaction } from "../api/lightstreamer";
import { Network } from "../constants";
import { WalletDb } from "./db";
import * as UInt8ArrayUtils from "../../utils/uint8Array";

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
    ownerNotes: { position: number; note: Note; nullifier: string }[];
    spenderNotes: { note: Note }[];
    foundNullifiers: Uint8Array[];
  }[] = [];

  readonly nullifierSet = new Set<string>();

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
    ownerNotes: { position: number; note: Note; nullifier: string }[],
    spenderNotes: { note: Note }[],
    foundNullifiers: Uint8Array[],
  ) {
    this.transactions.push({
      accountId,
      hash,
      sequence,
      transaction,
      timestamp,
      ownerNotes,
      spenderNotes,
      foundNullifiers,
    });

    for (const n of ownerNotes) {
      this.nullifierSet.add(n.nullifier);
    }
  }

  /**
   * Writes the cache to the database.
   */
  async write() {
    for (const [k, v] of this.heads) {
      console.log(`updating account ID ${k} head to ${v.sequence}`);
      await this.db.updateAccountHead(k, this.network, v.sequence, v.hash);
    }

    let txn;
    while ((txn = this.transactions.shift())) {
      console.log(
        `saving transaction ${UInt8ArrayUtils.toHex(txn.transaction.hash)} for account ID ${txn.accountId}`,
      );
      await this.db.saveTransaction({
        hash: txn.transaction.hash,
        accountId: txn.accountId,
        blockHash: txn.hash,
        blockSequence: txn.sequence,
        timestamp: txn.timestamp,
        network: this.network,
        ownerNotes: txn.ownerNotes,
        foundNullifiers: txn.foundNullifiers,
        spenderNotes: txn.spenderNotes,
      });

      for (const n of txn.ownerNotes) {
        this.nullifierSet.delete(n.nullifier);
      }
    }
  }

  async hasNullifier(
    nullifier: Uint8Array,
    network: Network,
  ): Promise<boolean> {
    if (this.nullifierSet.has(UInt8ArrayUtils.toHex(nullifier))) {
      return true;
    }

    return await this.db.hasNullifier(nullifier, network);
  }
}
