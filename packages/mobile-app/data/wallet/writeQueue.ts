import { Note } from "@ironfish/sdk";
import { Network } from "../constants";
import { WalletDb } from "./db";
import * as UInt8ArrayUtils from "../../utils/uint8Array";

enum DBWriteType {
  ADD,
  REMOVE,
}

type DBWrite =
  | {
      type: DBWriteType.ADD;
      accountId: number;
      sequence: number;
      hash: Uint8Array;
      transactions: {
        hash: Uint8Array;
        timestamp: Date;
        ownerNotes: {
          position: number;
          note: Note;
          nullifier: string;
          noteTransactionIndex: number;
        }[];
        spenderNotes: { note: Note; noteTransactionIndex: number }[];
        foundNullifiers: Uint8Array[];
      }[];
    }
  | {
      type: DBWriteType.REMOVE;
      accountId: number;
      sequence: number;
      hash: Uint8Array;
      prevHash: Uint8Array;
    };

/**
 * Writing to the database for each connected block for each account has a performance impact on scanning.
 * Typically we'll just be incrementing the account head, so we can cache the updated heads and persist them
 * at intervals.
 */
export class WriteQueue {
  readonly heads: Map<number, { hash: Uint8Array; sequence: number }> =
    new Map();
  readonly db: WalletDb;
  readonly network: Network;

  private writeQueue: DBWrite[] = [];

  readonly nullifierSet = new Set<string>();

  constructor(db: WalletDb, network: Network) {
    this.db = db;
    this.network = network;
  }

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
      ownerNotes: {
        position: number;
        note: Note;
        nullifier: string;
        noteTransactionIndex: number;
      }[];
      spenderNotes: { note: Note; noteTransactionIndex: number }[];
      foundNullifiers: Uint8Array[];
    }[],
  ) {
    this.heads.set(accountId, block);

    const existing = this.writeQueue.findLast((w) => w.accountId === accountId);
    if (
      transactions.length === 0 &&
      existing &&
      existing.type === DBWriteType.ADD &&
      existing.transactions.length === 0
    ) {
      existing.hash = block.hash;
      existing.sequence = block.sequence;
      return;
    }

    this.writeQueue.push({
      type: DBWriteType.ADD,
      accountId,
      sequence: block.sequence,
      hash: block.hash,
      transactions,
    });

    for (const n of transactions.flatMap((t) => t.ownerNotes)) {
      this.nullifierSet.add(n.nullifier);
    }
  }

  removeBlock(
    accountId: number,
    block: { hash: Uint8Array; sequence: number; prevHash: Uint8Array },
  ) {
    this.heads.set(accountId, {
      hash: block.prevHash,
      sequence: block.sequence - 1,
    });

    // There are several unresolved cases with removing blocks, but removing more than a couple
    // blocks should be very uncommon, so they're listed here:
    //
    // * We could remove multiple blocks at a time. Again, the chain shouldn't generally be
    //   removing more than a couple blocks unless something is wrong.
    //
    // * To be totally correct, the nullifier set should only include nullifiers between the DB
    //   head and the writeQueue head, so we should remove nullifiers when we queue up a REMOVE.
    //   However, we're only using the nullifierSet for checking existence, and assuming that the wallet
    //   server validated the blocks correctly, these nullifiers should never be spent until they're readded
    //   (probably by the same transaction on a different block). However, the nullifiers may not ever be
    //   readded, which would cause them to get stuck in our nullifier set forever.
    //
    // * Related to the above, we could merge ADDs and REMOVEs if they apply to the same block.
    this.writeQueue.push({
      type: DBWriteType.REMOVE,
      accountId,
      sequence: block.sequence,
      hash: block.hash,
      prevHash: block.prevHash,
    });
  }

  /**
   * Writes the queue to the database.
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
      if (w.type === DBWriteType.ADD) {
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
      } else if (w.type === DBWriteType.REMOVE) {
        await this.db.removeBlock({
          accountId: w.accountId,
          network: this.network,
          blockHash: w.hash,
          blockSequence: w.sequence,
          prevBlockHash: w.prevHash,
        });
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
