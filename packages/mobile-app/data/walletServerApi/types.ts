import { Network } from "../constants";
import { LightBlock } from "./lightstreamer";

export type GetLatestBlockResponse = {
  sequence: number;
  hash: string;
};

export interface WalletServerTransformer {
  getLatestBlock(
    network: Network,
    result: GetLatestBlockResponse,
  ): Promise<GetLatestBlockResponse>;
  getBlockByHash(
    network: Network,
    hash: string,
    result: LightBlock,
  ): Promise<LightBlock>;
  getBlockBySequence(
    network: Network,
    sequence: number,
    result: LightBlock,
  ): Promise<LightBlock>;
  getBlockRange(
    network: Network,
    start: number,
    end: number,
    result: string[],
  ): Promise<string[]>;
}
