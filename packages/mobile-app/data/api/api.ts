import { Network } from "../constants";
import { SerializedAsset } from "./types";

const WALLET_SERVER_URLS: Record<Network, string> = {
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
    const url = WALLET_SERVER_URLS[network] + `/assets/find?id=${assetId}`;

    console.log("requesting asset");

    const fetchResult = await fetch(url);
    let asset = (await fetchResult.json()) as SerializedAsset;

    return asset;
  }
}

export const IronFishApi = new IFApi();
