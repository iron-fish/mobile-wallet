import { AccountFormat, LanguageKey } from "@ironfish/sdk";
import { Query, Mutation } from "data-facade";

export type Account = {
  id: number;
  name: string;
  viewOnlyAccount: string;
}

export type AccountsMethods = {
  createAccount: Mutation<(args: { name: string }) => Account>;
  exportAccount: Mutation<(args: { name: string, format: AccountFormat, viewOnly?: boolean, language?: LanguageKey }) => string>;
  getAccount: Query<(args: { name: string }) => Account>;
  getAccounts: Query<() => Account[]>;
  importAccount: Mutation<(args: { account: string; name?: string }) => Account>;
  renameAccount: Mutation<(args: { name: string; newName: string }) => void>;
  removeAccount: Mutation<(args: { name: string; }) => void>;
};
