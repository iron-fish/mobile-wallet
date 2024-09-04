import { Network } from "../../constants";
import { LightBlock } from "../lightstreamer";
import {
  GetFeeRatesResponse,
  GetLatestBlockResponse,
  GetNoteWitnessResponse,
  WalletServerTransformer,
} from "../types";
import * as Uint8ArrayUtils from "../../../utils/uint8Array";

const getRandomHash = () =>
  new Uint8Array(Math.random().toString().slice(2).split("").map(Number));

/**
 * ForkTester simulates forks in the blockchain by replacing hash and previousHash
 * on blocks returned from the Wallet Server. Usage:
 *
 * 1. Set ForkTester.simulateForking = true
 * 2. Adjust ForkTester.forkLength to be larger, if necessary
 * 2. Sync up an account to the latest block
 * 3. Call generateForks with your network
 * 4. Call sync on the account again. You should notice the account switch from the main chain
 *    to the generated fork.
 */
class ForkTesterClass implements WalletServerTransformer {
  readonly forks = new Map<number, Uint8Array>();

  simulateForking = false;
  readonly forkLength = 2;

  clearForks() {
    if (!this.simulateForking) {
      console.error("Turn on SIMULATE_FORKING to generate forks");
    }

    this.forks.clear();
  }

  async generateForks(startingSequence: number) {
    if (!this.simulateForking) {
      console.error("Turn on SIMULATE_FORKING to generate forks");
    }

    this.forks.clear();

    for (let i = 0; i <= this.forkLength; i++) {
      this.forks.set(startingSequence - i, getRandomHash());
    }
  }

  private updateFork(block: LightBlock) {
    if (this.forks.has(block.sequence)) {
      block.hash = this.forks.get(block.sequence)! as Buffer;
    }

    if (this.forks.has(block.sequence - 1)) {
      block.previousBlockHash = this.forks.get(block.sequence - 1)! as Buffer;
    }
  }

  getLatestBlock(
    network: Network,
    result: GetLatestBlockResponse,
  ): Promise<GetLatestBlockResponse> {
    if (this.simulateForking && this.forks.has(result.sequence)) {
      result.hash = Uint8ArrayUtils.toHex(this.forks.get(result.sequence)!);
    }
    return Promise.resolve(result);
  }
  getBlockByHash(
    network: Network,
    hash: string,
    result: LightBlock,
  ): Promise<LightBlock> {
    if (this.simulateForking) {
      this.updateFork(result);
    }
    return Promise.resolve(result);
  }
  getBlockBySequence(
    network: Network,
    sequence: number,
    result: LightBlock,
  ): Promise<LightBlock> {
    if (this.simulateForking) {
      this.updateFork(result);
    }
    return Promise.resolve(result);
  }
  getBlockRange(
    network: Network,
    start: number,
    end: number,
    result: string[],
  ): Promise<string[]> {
    if (this.simulateForking) {
      const newBlocks = [];
      for (const b of result) {
        const block = LightBlock.decode(Uint8ArrayUtils.fromHex(b));
        this.updateFork(block);
        newBlocks.push(
          Uint8ArrayUtils.toHex(LightBlock.encode(block).finish()),
        );
      }
      return Promise.resolve(newBlocks);
    }
    return Promise.resolve(result);
  }
  getNoteWitness(
    network: Network,
    index: number,
    confirmations: number | undefined,
    result: GetNoteWitnessResponse,
  ): Promise<GetNoteWitnessResponse> {
    return Promise.resolve(result);
  }
  getFeeRates(
    network: Network,
    result: GetFeeRatesResponse,
  ): Promise<GetFeeRatesResponse> {
    return Promise.resolve(result);
  }
}

export const ForkTester = new ForkTesterClass();
