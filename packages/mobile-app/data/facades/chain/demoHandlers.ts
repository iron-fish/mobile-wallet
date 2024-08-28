import { f } from "data-facade";
import { Asset, ChainHandlers } from "./types";

import { isValidPublicAddress } from "ironfish-native-module";

export const chainDemoHandlers = f.facade<ChainHandlers>({
  getAsset: f.handler.query(
    async ({ assetId }: { assetId: string }): Promise<Asset | null> => {
      return {
        id: assetId,
        name: "$IRON",
        createdTransactionHash: "hash",
        createdTransactionTimestamp: new Date().toISOString(),
        creator: "creator",
        metadata: "metadata",
        owner: "owner",
        verification: { status: "unverified" },
        supply: "1",
      };
    },
  ),
  getNetworkInfo: f.handler.query(async () => {
    return { networkId: 0 };
  }),
  isValidPublicAddress: f.handler.query(
    async ({ address }: { address: string }) => {
      return isValidPublicAddress(address);
    },
  ),
  requestFaucetTokens: f.handler.mutation(
    async ({ address, email }: { address: string; email: string }) => {
      return true;
    },
  ),
});
