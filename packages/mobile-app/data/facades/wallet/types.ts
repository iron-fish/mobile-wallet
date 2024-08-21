import { AccountFormat, LanguageKey, TransactionStatus } from "@ironfish/sdk";
import { Query, Mutation } from "data-facade";

export type Account = {
  name: string;
  publicAddress: string;
  head: {
    hash: string;
    sequence: number;
  } | null;
  viewOnly: boolean;
  balances: { iron: AccountBalance; custom: AccountBalance[] };
  settings: AccountSettings;
  active: boolean;
};

export type AccountBalance = {
  assetId: string;
  confirmed: string;
  unconfirmed: string;
  pending: string;
  available: string;
};

export enum TransactionType {
  SEND = "send",
  RECEIVE = "receive",
}

export type AssetBalanceDelta = {
  assetId: string;
  delta: string;
};

export type Transaction = {
  hash: string;
  fee: string;
  expiration: number;
  timestamp: Date;
  submittedSequence: number;
  type: TransactionType;
  status: TransactionStatus;
  assetBalanceDeltas: AssetBalanceDelta[];
  burns: Burn[];
  mints: Mint[];
  blockHash?: string;
  blockSequence?: number;
  notes: Note[];
  spends: Spend[];
};

export type Output = {
  amount: number;
  memo: string;
  publicAddress: string;
  assetId: string;
};

export type Note = {
  hash: string;
  assetId: string;
  value: string;
  memo: string;
  memoHex: string;
  sender: string;
  owner: string;
  spent: boolean;
};

export type Spend = {
  nullifier: string;
  commitment: string;
  size: number;
};

export type Mint = {
  assetId: string;
  value: string;
  transferOwnershipTo?: string;
};

export type Burn = {
  assetId: string;
  value: string;
};

export type WalletStatus = {
  status: "SCANNING" | "PAUSED" | "IDLE";
  latestKnownBlock: number;
};

export type AccountSettings = {
  balanceAutoHide: boolean;
};

export type WalletHandlers = {
  createAccount: Mutation<(args: { name: string }) => Account>;
  exportAccount: Mutation<
    (args: {
      name: string;
      format: AccountFormat;
      viewOnly?: boolean;
      language?: LanguageKey;
    }) => string
  >;
  getAccount: Query<(args: { name?: string }) => Account | null>;
  getAccounts: Query<() => Account[]>;
  setActiveAccount: Mutation<(args: { name: string }) => boolean>;
  getEstimatedFees: Query<
    (args: { accountName: string; outputs: Output[] }) => {
      slow: string;
      average: string;
      fast: string;
    }
  >;
  getTransactions: Query<
    (args: {
      accountName: string;
      options?: {
        limit?: number;
        offset?: number;
        ascending?: boolean;
        assetId?: string;
        address?: string;
      };
    }) => Transaction[]
  >;
  getTransaction: Query<
    (args: { accountName: string; hash: string }) => Transaction | null
  >;
  getWalletStatus: Query<() => WalletStatus>;
  importAccount: Mutation<
    (args: { account: string; name?: string }) => Account
  >;
  pauseSyncing: Mutation<() => void>;
  renameAccount: Mutation<(args: { name: string; newName: string }) => void>;
  removeAccount: Mutation<(args: { name: string }) => void>;
  resumeSyncing: Mutation<() => void>;
  sendTransaction: Mutation<
    (args: {
      accountName: string;
      outputs: {
        amount: number;
        memo: string;
        publicAddress: string;
        assetId: string;
      }[];
      fee: string;
      expiration?: number;
    }) => void
  >;
  setAccountSettings: Mutation<
    (args: { name: string; settings: Partial<AccountSettings> }) => void
  >;
};
