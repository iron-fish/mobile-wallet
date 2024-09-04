import { Network } from "../constants";
import { LightBlock } from "./lightstreamer";

export type GetLatestBlockResponse = {
  sequence: number;
  hash: string;
};

export type GetNoteWitnessResponse = {
  authPath: { side: "Left" | "Right"; hashOfSibling: string }[];
  rootHash: string;
  treeSize: number;
};

export type GetFeeRatesResponse = {
  slow: string;
  average: string;
  fast: string;
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
  getNoteWitness(
    network: Network,
    index: number,
    confirmations: number | undefined,
    result: GetNoteWitnessResponse,
  ): Promise<GetNoteWitnessResponse>;
  getFeeRates(
    network: Network,
    result: GetFeeRatesResponse,
  ): Promise<GetFeeRatesResponse>;
}
