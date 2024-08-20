import { f } from "data-facade";
import { Asset, ChainHandlers } from "./types";

import { isValidPublicAddress } from "ironfish-native-module";
import { IronFishApi } from "../../api/api";
import { Network } from "../../constants";

export const chainHandlers = f.facade<ChainHandlers>({
  getAsset: f.handler.query(
    async ({ assetId }: { assetId: string }): Promise<Asset> => {
      const asset = await IronFishApi.getAsset(Network.TESTNET, assetId);

      return {
        id: assetId,
        name: asset.name,
        createdTransactionHash: asset.created_transaction_hash,
        createdTransactionTimestamp: asset.created_transaction_timestamp,
        creator: asset.creator,
        metadata: asset.metadata,
        owner: asset.owner,
        verification:
          asset.verified_metadata === null
            ? { status: "unverified" }
            : {
                status: "verified",
                createdAt: asset.verified_metadata.created_at,
                updatedAt: asset.verified_metadata.updated_at,
                symbol: asset.verified_metadata.symbol,
                decimals: asset.verified_metadata.decimals,
                logoURI: asset.verified_metadata.logo_uri,
                website: asset.verified_metadata.website,
              },
        supply: asset.supply,
      };
    },
  ),
  getNetworkInfo: f.handler.query(async () => {
    // TODO: Implement network switching
    return { networkId: 0 };
  }),
  isValidPublicAddress: f.handler.query(
    async ({ address }: { address: string }) => {
      return isValidPublicAddress(address);
    },
  ),
  requestFaucetTokens: f.handler.mutation(
    async ({ address, email }: { address: string; email: string }) => {
      // TODO: Implement faucet
      return true;
    },
  ),
});
