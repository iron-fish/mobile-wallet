import { f } from "data-facade";
import { z } from "zod";

const accounts = ["alice", "bob", "carol"];

async function getAccounts(limit: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return accounts.slice(0, limit);
}

export const accountsFacade = f.facade({
  getAccounts: f.handler.query(async (count: number) => {
    const accounts = await getAccounts(count ?? 1);
    console.log("getAccounts", accounts);
    return accounts;
  }),
  getAllAccounts: f.handler.query(async () => {
    const accounts = await getAccounts(1);
    console.log("getAllAccounts", accounts);
    return accounts;
  }),
  getAccountsWithZod: f.handler
    .input(
      z.object({
        limit: z.number(),
      }),
    )
    .query(async ({ limit }) => {
      const accounts = await getAccounts(limit);
      console.log("getAccountsWithZod", accounts);
      return accounts;
    }),
});
