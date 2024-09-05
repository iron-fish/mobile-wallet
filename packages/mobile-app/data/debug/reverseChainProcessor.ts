import { LightBlock } from "../walletServerApi/lightstreamer";
import { Network } from "../constants";
import { WalletServerApi } from "../walletServerApi/walletServer";
import * as Uint8ArrayUtils from "../../utils/uint8Array";
import { RecentBlocks } from "../recentBlocks";

/**
 * Fetches blocks from the wallet server (or cache) and, on calling update, calls onRemove
 * to move from head back to the genesis block.
 */
export class ReverseChainProcessor {
  readonly network: Network;
  abort: AbortSignal;
  head: { hash: Uint8Array; sequence: number };
  onRemove: (block: LightBlock) => unknown;

  constructor(options: {
    network: Network;
    head: { hash: Uint8Array; sequence: number };
    abort: AbortSignal;
    onRemove: (block: LightBlock) => unknown;
  }) {
    this.network = options.network;
    this.abort = options.abort;
    this.head = options.head;
    this.onRemove = options.onRemove;
  }

  async update(): Promise<{
    hashChanged: boolean;
  }> {
    let oldHash = this.head.hash;

    while (this.head.sequence > 1) {
      if (this.abort.aborted) {
        return {
          hashChanged: !Uint8ArrayUtils.areEqual(this.head.hash, oldHash),
        };
      }

      let currentBlock =
        (await RecentBlocks.getRecentBlock(this.network, this.head.sequence)) ??
        (await WalletServerApi.getBlockBySequence(
          this.network,
          this.head.sequence,
        ));

      if (!currentBlock) {
        console.error(`No block found for sequence ${this.head.sequence}`);
        continue;
      }

      this.onRemove(currentBlock);
      this.head = {
        sequence: currentBlock.sequence - 1,
        hash: currentBlock.previousBlockHash,
      };
    }

    return {
      hashChanged: !Uint8ArrayUtils.areEqual(this.head.hash, oldHash),
    };
  }
}
