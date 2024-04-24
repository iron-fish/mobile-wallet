import { f } from "data-facade";
import { z } from "zod";
import { AccountsMethods } from "./types";
import { wallet } from "../../wallet";
import { AccountFormat, LanguageKey, LanguageUtils } from "@ironfish/sdk";

export const accountsHandlers = f.facade<AccountsMethods>({
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
  // The enums used when exporting are tricky to use with Zod 
  exportAccount: f.handler
    .mutation(async ({ name, format, language, viewOnly }: { name: string, format: AccountFormat, language?: LanguageKey, viewOnly?: boolean }) => {
      if (language && !Object.hasOwn(LanguageUtils.LANGUAGES, language)) {
        throw new Error(`Language ${language} is not supported`);
      }
      const typedLanguage: LanguageKey = language as LanguageKey;

      const account = await wallet.exportAccount(name, format, { language: typedLanguage, viewOnly });
      return account;
    }),
  getAccount: f.handler.input(
    z.object({
      name: z.string(),
    }),
  ).query(async ({ name }) => {
    return await wallet.getAccount(name);
  }),
  getAccounts: f.handler.query(async () => {
    return await wallet.getAccounts();
  }),
  importAccount: f.handler
    .input(
      z.object({
        account: z.string(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ account, name }) => {
      return await wallet.importAccount(account, name);
    }),
  removeAccount: f.handler
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ name }) => {
      await wallet.removeAccount(name);
    }),
  renameAccount: f.handler
    .input(
      z.object({
        name: z.string(),
        newName: z.string(),
      }),
    )
    .mutation(async ({ name, newName }) => {
      await wallet.renameAccount(name, newName);
    }),
});
