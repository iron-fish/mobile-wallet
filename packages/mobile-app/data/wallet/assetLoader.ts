import { Network } from "../constants";
import { WalletDb } from "./db";
import { SerializedAsset } from "../api/types";
import { IronFishApi } from "../api/api";
import * as Uint8ArrayUtils from "../../utils/uint8Array";

/**
 * Milliseconds after which an asset is considered out-of-date.
 */
const ASSET_UPDATE_MS = 1000 * 60 * 5;

export class AssetLoader {
  private readonly db: WalletDb;

  /**
   * Set of hex-encoded asset identifiers for assets that have been previously
   * loaded by this AssetLoader.
   */
  private readonly preloadedAssets = {
    [Network.MAINNET]: new Set<string>(),
    [Network.TESTNET]: new Set<string>(),
  };

  /**
   * Ongoing asset loads, indexed by network and hex-encoded asset identifier.
   */
  private readonly assetLoads = {
    [Network.MAINNET]: new Map<string, Promise<SerializedAsset>>(),
    [Network.TESTNET]: new Map<string, Promise<SerializedAsset>>(),
  };

  constructor(db: WalletDb) {
    this.db = db;
  }

  /**
   * Reads asset from the database, returning undefined if no asset exists.
   * Fetches asset from the API in the background if the asset is out-of-date.
   */
  async getAsset(network: Network, assetId: Uint8Array) {
    const asset = await this.db.getAsset(network, assetId);

    // If out-of-date, queue a new fetch that updates the asset when it returns
    if (!asset || asset.updatedAt.valueOf() < Date.now() - ASSET_UPDATE_MS) {
      this.loadAsset(network, Uint8ArrayUtils.toHex(assetId));
    }

    // Return current asset immediately
    return asset;
  }

  /**
   * Fetches asset from the API into the database in a non-blocking way.
   * Does nothing if the asset has already been fetched.
   */
  preloadAsset(network: Network, assetId: string): void {
    if (
      this.preloadedAssets[network].has(assetId) ||
      this.assetLoads[network].has(assetId)
    ) {
      return;
    }

    this.loadAsset(network, assetId).catch((e) => {
      console.error(`Failed to preload asset ${assetId}:`);
    });
  }

  private loadAsset(
    network: Network,
    assetId: string,
  ): Promise<SerializedAsset> {
    const assetLoad = this.assetLoads[network].get(assetId);
    if (assetLoad) {
      return assetLoad;
    }

    const newAssetLoad = IronFishApi.getAsset(network, assetId)
      .then(async (asset) => {
        await this.db.setAsset(network, asset);
        this.preloadedAssets[network].add(assetId);
        return asset;
      })
      .finally(() => {
        this.assetLoads[network].delete(assetId);
      });

    this.assetLoads[network].set(assetId, newAssetLoad);

    return newAssetLoad;
  }
}
