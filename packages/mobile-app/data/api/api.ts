import * as FileSystem from "expo-file-system";
import { Network } from "../constants";
import { SerializedAsset } from "./types";

const API_SERVER_URLS: Record<Network, string> = {
  [Network.MAINNET]: "https://api.ironfish.network/",
  [Network.TESTNET]: "https://testnet.api.ironfish.network/",
};

export type AssetFile = SerializedAsset & { updatedAt: number };

/**
 * Contains methods for making API requests to the Iron Fish API.
 *
 * API documentation: https://api.ironfish.network/docs
 */
class IFApi {
  private async getAssetsDir(network: Network): Promise<string> {
    const directory =
      FileSystem.cacheDirectory + `assets/${network.toString()}/`;
    try {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    } catch (e) {
      console.log(e);
    }
    return directory;
  }

  async getAsset(network: Network, assetId: string): Promise<SerializedAsset> {
    const assetsDir = await this.getAssetsDir(network);
    // console.log(assetsDir);

    const assetFile = assetsDir + `${assetId}.json`;
    const assetFileInfo = await FileSystem.getInfoAsync(assetFile);
    if (assetFileInfo.exists) {
      const manifestString = await FileSystem.readAsStringAsync(assetFile, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const manifest = JSON.parse(manifestString) as AssetFile;
      const fiveMinutesAsMilliseconds = 1000 * 60 * 5;
      if (manifest.updatedAt >= Date.now() - fiveMinutesAsMilliseconds) {
        return manifest;
      }
    }

    const url = API_SERVER_URLS[network] + `assets/find?id=${assetId}`;
    console.log(
      `requesting asset: ${API_SERVER_URLS[network] + `assets/find?id=${assetId}`}`,
    );

    const fetchResult = await fetch(url);
    let assetDownload = (await fetchResult.json()) as SerializedAsset;
    let assetFileData: AssetFile = {
      ...assetDownload,
      updatedAt: Date.now(),
    };

    await FileSystem.writeAsStringAsync(
      assetFile,
      JSON.stringify(assetFileData),
      {
        encoding: FileSystem.EncodingType.UTF8,
      },
    );

    return assetFileData;
  }
}

export const IronFishApi = new IFApi();
