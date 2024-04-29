import { f } from "data-facade";
import { Account, AccountSettings, Output, WalletHandlers, WalletStatus } from "./types";
import { wallet } from "../../wallet";
import { AccountFormat, LanguageKey, LanguageUtils } from "@ironfish/sdk";

export const walletHandlers = f.facade<WalletHandlers>({
  createAccount: f.handler.mutation(async ({ name }: { name: string }): Promise<Account> => {
    const account = await wallet.createAccount(name);
    return {
      name: account.name,
      viewOnly: account.viewOnly,
      publicAddress: account.publicAddress,
      balances: { 
        iron: {
          assetId: "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
          available: "0",
          confirmed: "0",
          pending: "0",
          unconfirmed: "0",
        },
        custom: []
      },
      head: null,
      // TODO: Implement account settings in Wallet
      settings: {
        balanceAutoHide: false,
      }
    };
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
  getAccount: f.handler.query(async ({ name }: { name: string }): Promise<Account> => {
    const account = await wallet.getAccount(name);
    if (!account) {
      throw new Error(`Account ${name} does not exist`);
    }
    const result: Account = {
      name: account.name,
      viewOnly: account.viewOnly,
      publicAddress: account.publicAddress,
      // TODO: Implement balances in Wallet
      balances: { 
        iron: {
          assetId: "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
          available: "0",
          confirmed: "0",
          pending: "0",
          unconfirmed: "0",
        },
        custom: []
      },
      // TODO: Implement account syncing in Wallet
      head: null,
      // TODO: Implement account settings in Wallet
      settings: {
        balanceAutoHide: false,
      }
    };
    return result;
  }),
  getAccounts: f.handler.query(async () => {
    return (await wallet.getAccounts()).map((a): Account => ({
      name: a.name,
      viewOnly: a.viewOnly,
      publicAddress: a.publicAddress,
      // TODO: Implement balances in Wallet
      balances: { 
        iron: {
          assetId: "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
          available: "0",
          confirmed: "0",
          pending: "0",
          unconfirmed: "0",
        },
        custom: []
      },
      // TODO: Implement account syncing in Wallet
      head: null,
      // TODO: Implement account settings in Wallet
      settings: {
        balanceAutoHide: false,
      }
    }));
  }),
  getEstimatedFees: f.handler.query(async (args: { accountName: string, outputs: Output[] }) => {
    // TODO: Implement getEstimatedFees
    return { slow: "0", average: "0", fast: "0" } 
  }),
  getTransaction: f.handler.query(async ({ accountName, hash }: { accountName: string, hash: string }) => {
    // TODO: Implement getTransaction
    throw new Error('getTransaction not yet implemented')
  }),
  getTransactions: f.handler.query(async ({ accountName, hash }: { accountName: string, hash: string, options?: { limit?: number, offset?: number, ascending?: boolean, assetId?: string, address?: string } }) => {
    // TODO: Implement getTransactions
    return [];
  }),
  getWalletStatus: f.handler.query(async (): Promise<WalletStatus> => {
    // TODO: Implement getWalletStatus
    return { status: 'PAUSED', latestKnownBlock: 0 }
  }),
  importAccount: f.handler.mutation(async ({ account, name }: { account: string, name?: string }): Promise<Account> => {
    const importedAccount = await wallet.importAccount(account, name);
    return {
      name: importedAccount.name,
      viewOnly: importedAccount.viewOnly,
      publicAddress: importedAccount.publicAddress,
      balances: { 
        iron: {
          assetId: "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
          available: "0",
          confirmed: "0",
          pending: "0",
          unconfirmed: "0",
        },
        custom: []
      },
      // TODO: Check whether this should be set when supporting account birthdays
      head: null,
      // TODO: Implement account settings in Wallet
      settings: {
        balanceAutoHide: false,
      }
    }
  }),
  pauseSyncing: f.handler.mutation(async () => {

  }),
  removeAccount: f.handler.mutation(async ({ name }: { name: string }) => {
    await wallet.removeAccount(name);
  }),
  renameAccount: f.handler.mutation(async ({ name, newName }: { name: string, newName: string }) => {
    await wallet.renameAccount(name, newName);
  }),
  resumeSyncing: f.handler.mutation(async () => {
    
  }),
  sendTransaction: f.handler.mutation(async (args: { accountName: string, outputs: Output[], fee: string, expiration?: number }) => {
    // TODO: Implement getEstimatedFees
    return
  }),
  setAccountSettings: f.handler.mutation(async (args: { name: string, settings: Partial<AccountSettings> }) => {
    // TODO: Implement setAccountSettings
    return
  }),
});
