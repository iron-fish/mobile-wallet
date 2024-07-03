import { f } from "data-facade";
import { Asset, ChainHandlers } from "./types";

import { isValidPublicAddress } from "ironfish-native-module";

export const chainHandlers = f.facade<ChainHandlers>({
  getAsset: f.handler.query(
    async ({ assetId }: { assetId: string }): Promise<Asset> => {
      // TODO: Implement asset fetching or storage
      return {
        id: assetId,
        name: "$IRON",
        createdTransactionHash: "hash",
        creator: "creator",
        metadata: "metadata",
        owner: "owner",
        nonce: 0,
        // TODO: Implement asset verification
        verification: { status: "unknown" },
        supply: "0",
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
