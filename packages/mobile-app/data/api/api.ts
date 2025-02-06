import { Network } from "../constants";
import { SerializedAsset, SerializedHead } from "./types";

const API_SERVER_URLS: Record<Network, string> = {
  [Network.MAINNET]: "https://api.ironfish.network/",
  [Network.TESTNET]: "https://testnet.api.ironfish.network/",
};

/**
 * Contains methods for making API requests to the Iron Fish API.
 *
 * API documentation: https://api.ironfish.network/docs
 */
class IFApi {
  async getAsset(network: Network, assetId: string): Promise<SerializedAsset> {
    const url = API_SERVER_URLS[network] + `assets/find?id=${assetId}`;
    console.log(
      `requesting asset: ${API_SERVER_URLS[network] + `assets/find?id=${assetId}`}`,
    );

    const fetchResult = await fetch(url);
    let assetDownload = (await fetchResult.json()) as SerializedAsset;

    return assetDownload;
  }

  async getHead(network: Network): Promise<SerializedHead> {
    const url = API_SERVER_URLS[network] + `blocks/head`;
    console.log(`requesting head: ${url}`);

    const fetchResult = await fetch(url);
    let head = (await fetchResult.json()) as SerializedHead;

    return head;
  }
}

export const IronFishApi = new IFApi();
