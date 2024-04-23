import { f } from "data-facade";
import { z } from "zod";
import { AccountsMethods } from "./types";

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
  getAccounts: f.handler.query(async () => {
    const accounts = await getAccounts(ACCOUNTS.length);
    console.log("getAccounts", accounts);
    return accounts;
  }),
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
});
