import { Query, Mutation } from "data-facade";

export type AccountsMethods = {
  getAccounts: Query<(count: number) => string[]>;
  getAllAccounts: Query<() => string[]>;
  getAccountsWithZod: Query<(args: { limit: number }) => string[]>;
  createAccount: Mutation<(account: string) => string[]>;
  createAccountWithZod: Mutation<(args: { account: string }) => string[]>;
};
