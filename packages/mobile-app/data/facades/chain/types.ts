import { Mutation, Query } from "data-facade";

export type VerifiedAssetMetadata = {
  createdAt: string;
  updatedAt: string;
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
  supply?: string;
};

export type ChainHandlers = {
  getAsset: Query<(args: { assetId: string }) => Asset>;
  getNetworkInfo: Query<() => { networkId: number }>;
  isValidPublicAddress: Query<(args: { address: string }) => boolean>;
  requestFaucetTokens: Mutation<
    (args: { address: string; email: string }) => boolean
  >;
};
