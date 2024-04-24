import { Query, Mutation } from "data-facade";

export type Account = {
  id: number;
  name: string;
  viewOnlyAccount: string;
}

export type AccountsMethods = {
  getAccounts: Query<() => Account[]>;
  createAccount: Mutation<(args: { name: string }) => Account>;
  exportAccount: Mutation<(args: { name: string }) => string>;
};
