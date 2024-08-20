export interface SerializedAsset {
  object: "asset";
  created_transaction_hash: string;
  created_transaction_timestamp: string;
  id: number;
  identifier: string;
  metadata: string;
  name: string;
  creator: string;
  owner: string;
  supply: string;
  verified_metadata: SerializedVerifiedAssetMetadata | null;
}

export interface SerializedVerifiedAssetMetadata {
  created_at: string;
  updated_at: string;
  symbol: string;
  decimals?: number;
  logo_uri?: string;
  website?: string;
}
