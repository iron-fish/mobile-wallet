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

export interface SerializedHead {
  id: number;
  hash: string;
  sequence: number;
  previous_block_hash: string;
  main: boolean;
  difficulty: number;
  transactions_count: number;
  timestamp: string;
  graffiti: string;
  size: number;
  time_since_last_block_ms: number;
  object: "block";
  hash_rate: number;
  reward: string;
  circulating_supply: number;
  total_supply: number;
}
