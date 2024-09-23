import { Network } from "../constants";
import { LightBlock } from "./lightstreamer";
import * as Uint8ArrayUtils from "../../utils/uint8Array";
import {
  BroadcastTransactionResponse,
  GetFeeRatesResponse,
  GetLatestBlockResponse,
  GetNoteWitnessResponse,
  WalletServerTransformer,
} from "./types";
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
    console.log(`requesting blocks - start: ${start}, end: ${end}`);

    const fetchResult = await fetch(url);
    let blocks = (await fetchResult.json()) as string[];

    for (const transformer of this.transformers) {
      blocks = await transformer.getBlockRange(network, start, end, blocks);
    }

    return blocks;
  }

  async getFeeRates(network: Network): Promise<GetFeeRatesResponse> {
    const url = WALLET_SERVER_URLS[network] + `fee-rates`;

    console.log(`requesting fee rates`);

    const fetchResult = await fetch(url);
    let rates = (await fetchResult.json()) as GetFeeRatesResponse;

    for (const transformer of this.transformers) {
      rates = await transformer.getFeeRates(network, rates);
    }

    return rates;
  }

  async getNoteWitness(
    network: Network,
    index: number,
    confirmations?: number,
  ): Promise<GetNoteWitnessResponse> {
    const url =
      WALLET_SERVER_URLS[network] +
      `note-witness?index=${index}${confirmations != null ? `&confirmations=${confirmations}` : ``}`;

    console.log(
      `requesting note witness - index: ${index} confirmations: ${confirmations}`,
    );

    const fetchResult = await fetch(url);
    let witness = (await fetchResult.json()) as GetNoteWitnessResponse;

    for (const transformer of this.transformers) {
      witness = await transformer.getNoteWitness(
        network,
        index,
        confirmations,
        witness,
      );
    }

    return witness;
  }

  async broadcastTransaction(
    network: Network,
    transaction: Uint8Array,
  ): Promise<BroadcastTransactionResponse> {
    const url = WALLET_SERVER_URLS[network] + `transaction`;

    console.log(`broadcasting transaction`);
    console.log(JSON.stringify(Uint8ArrayUtils.toHex(transaction)));

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Uint8ArrayUtils.toHex(transaction)),
    });

    if (!fetchResult.ok) {
      const errText = `Error ${fetchResult.status}: ${await fetchResult.text()}`;
      console.error(errText);
      throw new Error(errText);
    }

    let response = (await fetchResult.json()) as BroadcastTransactionResponse;

    for (const transformer of this.transformers) {
      response = await transformer.broadcastTransaction(
        network,
        transaction,
        response,
      );
    }

    return response;
  }
}

export const WalletServerApi = new WalletServer();
