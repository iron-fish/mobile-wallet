import { f } from "data-facade";
import {
  Account,
  AccountSettings,
  Output,
  Transaction,
  TransactionType,
  WalletHandlers,
  WalletStatus,
} from "./types";
import { wallet } from "../../wallet/wallet";
import { Network } from "../../constants";
import * as Uint8ArrayUtils from "../../../utils/uint8Array";

import {
  AccountFormat,
  LanguageKey,
  LanguageUtils,
  TransactionStatus,
} from "@ironfish/sdk";

export const walletHandlers = f.facade<WalletHandlers>({
  createAccount: f.handler.mutation(
    async ({ name }: { name: string }): Promise<Account> => {
      const account = await wallet.createAccount(name);
      return {
        name: account.name,
        viewOnly: account.viewOnly,
        publicAddress: account.publicAddress,
        balances: {
          iron: {
            assetId:
              "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
            available: "0",
            confirmed: "0",
            pending: "0",
            unconfirmed: "0",
          },
          custom: [],
        },
        head: null,
        // TODO: Implement account settings in Wallet
        settings: {
          balanceAutoHide: false,
        },
      };
    },
  ),
  // The enums used when exporting are tricky to use with Zod
  exportAccount: f.handler.mutation(
    async ({
      name,
      format,
      language,
      viewOnly,
    }: {
      name: string;
      format: AccountFormat;
      language?: LanguageKey;
      viewOnly?: boolean;
    }) => {
      if (language && !Object.hasOwn(LanguageUtils.LANGUAGES, language)) {
        throw new Error(`Language ${language} is not supported`);
      }
      const typedLanguage: LanguageKey = language as LanguageKey;

      const account = await wallet.exportAccount(name, format, {
        language: typedLanguage,
        viewOnly,
      });
      return account;
    },
  ),
  getAccount: f.handler.query(
    async ({ name }: { name: string }): Promise<Account> => {
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
            assetId:
              "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
            available: "0",
            confirmed: "0",
            pending: "0",
            unconfirmed: "0",
          },
          custom: [],
        },
        // TODO: Implement account syncing in Wallet
        head: null,
        // TODO: Implement account settings in Wallet
        settings: {
          balanceAutoHide: false,
        },
      };
      return result;
    },
  ),
  getAccounts: f.handler.query(async () => {
    const accounts = await wallet.getAccounts();
    const heads = new Map(
      (await wallet.getAccountHeads(Network.TESTNET)).map((h) => [
        h.accountId,
        h,
      ]),
    );
    return accounts.map((a): Account => {
      const h = heads.get(a.id);
      let head = null;
      if (h) {
        head = { hash: Uint8ArrayUtils.toHex(h.hash), sequence: h.sequence };
      }

      return {
        name: a.name,
        viewOnly: a.viewOnly,
        publicAddress: a.publicAddress,
        // TODO: Implement balances in Wallet
        balances: {
          iron: {
            assetId:
              "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
            available: "0",
            confirmed: "0",
            pending: "0",
            unconfirmed: "0",
          },
          custom: [],
        },
        head,
        // TODO: Implement account settings in Wallet
        settings: {
          balanceAutoHide: false,
        },
      };
    });
  }),
  getEstimatedFees: f.handler.query(
    async (args: { accountName: string; outputs: Output[] }) => {
      // TODO: Implement getEstimatedFees
      return { slow: "0", average: "0", fast: "0" };
    },
  ),
  getTransaction: f.handler.query(
    async ({
      accountName,
      hash,
    }: {
      accountName: string;
      hash: string;
    }): Promise<Transaction | null> => {
      const txnHash = Uint8ArrayUtils.fromHex(hash);
      const txn = await wallet.getTransaction(accountName, txnHash);

      if (!txn) {
        return null;
      }

      const notes = await wallet.getTransactionNotes(txnHash);

      return {
        // TODO: Implement transaction fees
        fee: "",
        timestamp: txn.timestamp,
        // TODO: Implement transaction expiration
        expiration: 0,
        hash: Uint8ArrayUtils.toHex(txn.hash),
        blockSequence: txn.blockSequence ?? undefined,
        submittedSequence: 0,
        assetBalanceDeltas: [],
        status: TransactionStatus.CONFIRMED,
        notes: notes.map((n) => ({
          assetId: Uint8ArrayUtils.toHex(n.assetId),
          // TODO: implement utf8 memo decoding
          memo: Uint8ArrayUtils.toHex(n.memo),
          memoHex: Uint8ArrayUtils.toHex(n.memo),
          owner: Uint8ArrayUtils.toHex(n.owner),
          sender: Uint8ArrayUtils.toHex(n.sender),
          value: n.value,
          // TODO: implement note hash
          hash: "",
          // TODO: Implement spent
          spent: false,
        })),
        burns: [],
        mints: [],
        spends: [],
        // TODO: Implement transaction type
        type: TransactionType.RECEIVE,
      };
    },
  ),
  getTransactions: f.handler.query(
    async ({
      accountName,
    }: {
      accountName: string;
      options?: {
        limit?: number;
        offset?: number;
        ascending?: boolean;
        assetId?: string;
        address?: string;
      };
    }): Promise<Transaction[]> => {
      const txns = await wallet.getTransactions(accountName, Network.TESTNET);

      // TODO: Make a better query for this
      const txnsWithNotes = await Promise.all(
        txns.map(async (txn) => {
          const notes = await wallet.getTransactionNotes(txn.hash);
          return { txn, notes };
        }),
      );

      return txnsWithNotes.map(({ txn, notes }) => ({
        // TODO: Implement transaction fees
        fee: "",
        timestamp: txn.timestamp,
        // TODO: Implement transaction expiration
        expiration: 0,
        hash: Uint8ArrayUtils.toHex(txn.hash),
        blockHash: txn.blockHash
          ? Uint8ArrayUtils.toHex(txn.blockHash)
          : undefined,
        blockSequence: txn.blockSequence ?? undefined,
        submittedSequence: 0,
        assetBalanceDeltas: [],
        status: TransactionStatus.CONFIRMED,
        notes: notes.map((n) => ({
          assetId: Uint8ArrayUtils.toHex(n.assetId),
          // TODO: implement utf8 memo decoding
          memo: Uint8ArrayUtils.toHex(n.memo),
          memoHex: Uint8ArrayUtils.toHex(n.memo),
          owner: Uint8ArrayUtils.toHex(n.owner),
          sender: Uint8ArrayUtils.toHex(n.sender),
          value: n.value,
          // TODO: implement note hash
          hash: "",
          // TODO: Implement spent
          spent: false,
        })),
        burns: [],
        mints: [],
        spends: [],
        // TODO: Implement transaction type when accountName is implemented
        type: TransactionType.RECEIVE,
      }));
    },
  ),
  getWalletStatus: f.handler.query(async (): Promise<WalletStatus> => {
    // TODO: Implement getWalletStatus
    return { status: "PAUSED", latestKnownBlock: 0 };
  }),
  importAccount: f.handler.mutation(
    async ({
      account,
      name,
    }: {
      account: string;
      name?: string;
    }): Promise<Account> => {
      const importedAccount = await wallet.importAccount(account, name);
      return {
        name: importedAccount.name,
        viewOnly: importedAccount.viewOnly,
        publicAddress: importedAccount.publicAddress,
        balances: {
          iron: {
            assetId:
              "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
            available: "0",
            confirmed: "0",
            pending: "0",
            unconfirmed: "0",
          },
          custom: [],
        },
        // TODO: Check whether this should be set when supporting account birthdays
        head: null,
        // TODO: Implement account settings in Wallet
        settings: {
          balanceAutoHide: false,
        },
      };
    },
  ),
  pauseSyncing: f.handler.mutation(async () => {}),
  removeAccount: f.handler.mutation(async ({ name }: { name: string }) => {
    await wallet.removeAccount(name);
  }),
  renameAccount: f.handler.mutation(
    async ({ name, newName }: { name: string; newName: string }) => {
      await wallet.renameAccount(name, newName);
    },
  ),
  resumeSyncing: f.handler.mutation(async () => {}),
  sendTransaction: f.handler.mutation(
    async (args: {
      accountName: string;
      outputs: Output[];
      fee: string;
      expiration?: number;
    }) => {
      // TODO: Implement getEstimatedFees
      return;
    },
  ),
  setAccountSettings: f.handler.mutation(
    async (args: { name: string; settings: Partial<AccountSettings> }) => {
      // TODO: Implement setAccountSettings
      return;
    },
  ),
});
