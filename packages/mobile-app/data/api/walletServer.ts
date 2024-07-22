import { Network } from "../constants";
import { LightBlock } from "./lightstreamer";
import * as Uint8ArrayUtils from "../../utils/uint8Array";
import { GetLatestBlockResponse, WalletServerTransformer } from "./types";
import { ForkTester } from "./transformers/forkTester";

const WALLET_SERVER_URLS: Record<Network, string> = {
  [Network.MAINNET]: "http://walletserver.ironfish.network/",
  [Network.TESTNET]:
    "http://testnet-wallet-server.us-west-1.elasticbeanstalk.com/",
};

/**
 * Contains methods for making API requests to the wallet server.
 */
class WalletServer {
  transformers: WalletServerTransformer[] = [ForkTester];

  async getLatestBlock(network: Network): Promise<GetLatestBlockResponse> {
    const url = WALLET_SERVER_URLS[network] + "latest-block";
    console.log("requesting latest block");

    const fetchResult = await fetch(url);
    let latestBlock = (await fetchResult.json()) as GetLatestBlockResponse;

    for (const transformer of this.transformers) {
      latestBlock = await transformer.getLatestBlock(network, latestBlock);
    }

    return latestBlock;
  }

  async getBlockByHash(network: Network, hash: string): Promise<LightBlock> {
    const url = WALLET_SERVER_URLS[network] + `block?hash=${hash}`;
    console.log("requesting block", hash);

    const fetchResult = await fetch(url);
    const json = await fetchResult.json();
    let block = LightBlock.decode(Uint8ArrayUtils.fromHex(json));

    for (const transformer of this.transformers) {
      block = await transformer.getBlockByHash(network, hash, block);
    }

    return block;
  }

  async getBlockBySequence(
    network: Network,
    sequence: number,
  ): Promise<LightBlock> {
    const url = WALLET_SERVER_URLS[network] + `block?sequence=${sequence}`;
    console.log("requesting block", sequence);

    const fetchResult = await fetch(url);
    const json = await fetchResult.json();
    let block = LightBlock.decode(Uint8ArrayUtils.fromHex(json));

    for (const transformer of this.transformers) {
      block = await transformer.getBlockBySequence(network, sequence, block);
    }

    return block;
  }

  async getBlockRange(
    network: Network,
    start: number,
    end: number,
  ): Promise<string[]> {
    const url =
      WALLET_SERVER_URLS[network] + `block-range?start=${start}&end=${end}`;
    console.log("requesting blocks", start, end);

    const fetchResult = await fetch(url);
    let blocks = (await fetchResult.json()) as string[];

    for (const transformer of this.transformers) {
      blocks = await transformer.getBlockRange(network, start, end, blocks);
    }

    return blocks;
  }
}

export const WalletServerApi = new WalletServer();
