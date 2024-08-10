import { LightBlock } from "./api/lightstreamer";
import { Network } from "./constants";
import { WalletServerApi } from "./api/walletServer";
import { Blockchain } from "./blockchain";
import * as Uint8ArrayUtils from "../utils/uint8Array";

/**
 * Fetches blocks from the wallet server (or cache) and, on calling update, calls onRemove
 * and onAdd to move from head to the latest block.
 *
 * For example, if head is A1, and the wallet server returns B2 as the new head:
 *      G -> A1
 *        -> B1 -> B2
 *
 * You'll get
 * - onRemove(A1)
 * - onAdd(B1)
 * - onAdd(B2)
 */
export class ChainProcessor {
  readonly network: Network;
  abort: AbortSignal;
  head: Readonly<{ hash: Uint8Array; sequence: number }> | null = null;
  onAdd: (block: LightBlock) => unknown;
  onRemove: (block: LightBlock) => unknown;

  constructor(options: {
    network: Network;
    abort: AbortSignal;
    onAdd: (block: LightBlock) => unknown;
    onRemove: (block: LightBlock) => unknown;
  }) {
    this.network = options.network;
    this.abort = options.abort;
    this.onAdd = options.onAdd;
    this.onRemove = options.onRemove;
  }

  async update(): Promise<{
    hashChanged: boolean;
  }> {
    const oldHash = this.head;

    if (!this.head) {
      const genesisBlock = await WalletServerApi.getBlockBySequence(
        this.network,
        1,
      );
      this.onAdd(genesisBlock);
      this.head = { hash: genesisBlock.hash, sequence: genesisBlock.sequence };
    }

    // Freeze this value in case it changes while we're updating the head
    const latest = await WalletServerApi.getLatestBlock(this.network);
    const chainHead = {
      hash: Uint8ArrayUtils.fromHex(latest.hash),
      sequence: latest.sequence,
    };
    console.log("Chain Processor Latest Block: ", chainHead);

    if (Uint8ArrayUtils.areEqual(chainHead.hash, this.head.hash)) {
      return { hashChanged: false };
    }

    const result = await Blockchain.iterateFrom(this.network, this.head);
    if (result.needsReset) {
      throw new Error("No path from chain processor head to chain head.");
    }

    for (const block of result.blocksToRemove) {
      if (this.abort.aborted)
        return { hashChanged: !oldHash || this.head.hash !== oldHash.hash };

      this.onRemove(block);
      this.head = {
        hash: block.previousBlockHash,
        sequence: block.sequence - 1,
      };
    }

    await Blockchain.iterateTo(
      this.network,
      this.head,
      chainHead,
      (block) => {
        this.onAdd(block);
        this.head = { hash: block.hash, sequence: block.sequence };
      },
      this.abort,
    );

    return { hashChanged: !oldHash || this.head.hash !== oldHash.hash };
  }
}
