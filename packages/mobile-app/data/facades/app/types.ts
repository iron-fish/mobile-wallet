import { Query, Mutation } from "data-facade";

export type AppSettings = {
  locale: string;
  theme: string;
  network: 'mainnet' | 'testnet';
  mainnetWalletServer: string;
  testnetWalletServer: string;
}

export type AppHandlers = {
  getAppSettings: Query<() => AppSettings>;
  getExplorerUrl: Query<(args?: { type: 'transaction' | 'block', hash: string }) => string | null>;
  loadDatabases: Mutation<() => string>;
  setAppSettings: Mutation<(args: { settings: Partial<AppSettings> }) => void>;
};
