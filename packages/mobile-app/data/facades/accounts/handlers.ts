import { f } from "data-facade";
import { z } from "zod";
import { AccountsMethods } from "./types";
import { wallet } from "../../wallet";

export const accountsHandlers = f.facade<AccountsMethods>({
  getAccounts: f.handler.query(async () => {
    return await wallet.getAccounts();
  }),
  createAccount: f.handler
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ name }) => {
      const account = await wallet.createAccount(name);
      return account;
    }),
});
