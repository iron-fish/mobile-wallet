import { f } from "data-facade";
import { z } from "zod";
import { AccountsMethods } from "./types";
import { AccountFormat } from "@ironfish/sdk";

let ACCOUNTS = [
  { id: 0, name: "alice", viewOnlyAccount: "alice" },
  { id: 1, name: "bob", viewOnlyAccount: "bob"},
  { id: 2, name: "carol", viewOnlyAccount: "carol"}
];

async function getAccounts(limit: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return ACCOUNTS.slice(0, limit);
}

export const accountsHandlers = f.facade<AccountsMethods>({
  createAccount: f.handler
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ name }) => {
      const existingId = ACCOUNTS.at(-1)?.id
      if (existingId === undefined) {
        throw new Error("No accounts found");
      }
      const account = { id: existingId + 1, name, viewOnlyAccount: name }
      console.log("createAccount", account);
      ACCOUNTS.push(account);
      return account;
    }),
  exportAccount: f.handler
    .input(
      z.object({
        name: z.string(),
        format: z.nativeEnum(AccountFormat),
        language: z.string().optional(),
        viewOnly: z.boolean().optional(),
      }),
    )
    .mutation(async ({ name }) => {
      const account = ACCOUNTS.find((a) => a.name === name)
      if (account === undefined) {
        throw new Error(`No account found with name ${name}`);
      }
      return JSON.stringify(account);
    }),
  getAccount: f.handler.input(
    z.object({
      name: z.string(),
    }),
  ).query(async ({ name }) => {
    const account = ACCOUNTS.find((a) => a.name === name);
    if (account === undefined) {
      throw new Error(`No account found with name ${name}`);
    }
    return account
  }),
  getAccounts: f.handler.query(async () => {
      const accounts = await getAccounts(ACCOUNTS.length);
      console.log("getAccounts", accounts);
      return accounts;
    }),
  importAccount: f.handler
    .input(
      z.object({
        account: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ account, name }) => {
      const existingId = ACCOUNTS.at(-1)?.id
      if (existingId === undefined) {
        throw new Error("No accounts found");
      }
      const importedAccount = { id: existingId + 1, name, viewOnlyAccount: account }
      console.log("createAccount", account);
      ACCOUNTS.push(importedAccount);
      return importedAccount;
    }),
  removeAccount: f.handler
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ name }) => {
      const accountIndex = ACCOUNTS.findIndex((a) => a.name === name);
      ACCOUNTS.splice(accountIndex, 1);
    }),
  renameAccount: f.handler
    .input(
      z.object({
        name: z.string(),
        newName: z.string(),
      }),
    )
    .mutation(async ({ name, newName }) => {
      const account = ACCOUNTS.find((a) => a.name === name);
      if (!account) {
        throw new Error("No account found");
      }
      account.name = newName;
    }),
});
