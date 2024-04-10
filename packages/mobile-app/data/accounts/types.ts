import { FacadeDefinition, Query } from "data-facade";

export type AccountsMethods = FacadeDefinition<{
  getAccounts: Query<(count: number) => string[]>;
  getAllAccounts: Query<() => string[]>;
  getAccountsWithZod: Query<(args: { limit: number }) => string[]>;
}>;
