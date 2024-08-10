import { Note } from "@ironfish/sdk";
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

  private writeQueue: {
    accountId: number;
    sequence: number;
    hash: Uint8Array;
    transactions: {
      hash: Uint8Array;
      timestamp: Date;
      ownerNotes: { position: number; note: Note; nullifier: string }[];
      spenderNotes: { note: Note }[];
      foundNullifiers: Uint8Array[];
    }[];
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

  writeBlock(
    accountId: number,
    block: { hash: Uint8Array; sequence: number },
    transactions: {
      hash: Uint8Array;
      timestamp: Date;
      ownerNotes: { position: number; note: Note; nullifier: string }[];
      spenderNotes: { note: Note }[];
      foundNullifiers: Uint8Array[];
    }[],
  ) {
    this.heads.set(accountId, block);

    const existing = this.writeQueue.findLast((w) => w.accountId === accountId);
    if (
      transactions.length === 0 &&
      existing &&
      existing.transactions.length === 0
    ) {
      existing.hash = block.hash;
      existing.sequence = block.sequence;
      return;
    }

    this.writeQueue.push({
      accountId,
      sequence: block.sequence,
      hash: block.hash,
      transactions,
    });

    for (const n of transactions.flatMap((t) => t.ownerNotes)) {
      this.nullifierSet.add(n.nullifier);
    }
  }

  /**
   * Writes the cache to the database.
   */
  async write() {
    if (!this.writeQueue.length) return;

    // Reset the write queue so new cached writes aren't added while
    // we're writing to the database.
    // TODO: Handle errors if the write fails. The account head should probably be frozen
    // until the write is successful.
    const writeQueue = this.writeQueue;
    this.writeQueue = [];

    let w;
    while ((w = writeQueue.shift())) {
      await this.db.saveBlock({
        accountId: w.accountId,
        network: this.network,
        blockHash: w.hash,
        blockSequence: w.sequence,
        transactions: w.transactions,
      });

      for (const n of w.transactions.flatMap((t) => t.ownerNotes)) {
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
