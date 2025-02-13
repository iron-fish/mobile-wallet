import { f } from "data-facade";
import { Asset, ChainHandlers } from "./types";

import { isValidPublicAddress } from "ironfish-native-module";
import { Network } from "../../constants";
import { wallet } from "../../wallet/wallet";

export const chainHandlers = f.facade<ChainHandlers>({
  getAsset: f.handler.query(
    async ({ assetId }: { assetId: string }): Promise<Asset | null> => {
      const asset = await wallet.getAsset(Network.TESTNET, assetId);

      if (!asset) {
        return null;
      }

      return {
        id: assetId,
        name: asset.name,
        createdTransactionHash: asset.createdTransactionHash,
        createdTransactionTimestamp: asset.createdTransactionTimestamp,
        creator: asset.creator,
        metadata: asset.metadata,
        owner: asset.owner,
        verification: !asset.verified
          ? { status: "unverified" }
          : {
              status: "verified",
              symbol: asset.symbol ?? asset.name,
              decimals: asset.decimals ?? undefined,
              logoURI: asset.logoURI ?? undefined,
              website: asset.website ?? undefined,
            },
        supply: asset.supply,
      };
    },
  ),
  isValidPublicAddress: f.handler.query(({ address }: { address: string }) => {
    return isValidPublicAddress(address);
  }),
  requestFaucetTokens: f.handler.mutation(
    async ({ address, email }: { address: string; email: string }) => {
      // TODO: Implement faucet
      return true;
    },
  ),
});
