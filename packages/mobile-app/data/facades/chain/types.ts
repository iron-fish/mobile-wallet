import { Mutation, Query } from "data-facade";

export type VerifiedAssetMetadata = {
  symbol: string;
  decimals?: number;
  logoURI?: string;
  website?: string;
};

export type AssetVerification =
  | { status: "unverified" | "unknown" }
  | ({ status: "verified" } & VerifiedAssetMetadata);

export type Asset = {
  id: string;
  name: string;
  owner: string;
  creator: string;
  metadata: string;
  createdTransactionHash: string;
  createdTransactionTimestamp: string;
  verification: AssetVerification;
  supply: string | null;
};

export type ChainHandlers = {
  getAsset: Query<(args: { assetId: string }) => Asset | null>;
  getNetworkInfo: Query<() => { networkId: number }>;
  isValidPublicAddress: Query<(args: { address: string }) => boolean>;
  requestFaucetTokens: Mutation<
    (args: { address: string; email: string }) => boolean
  >;
};
