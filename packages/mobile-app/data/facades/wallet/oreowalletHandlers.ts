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
import { oreoWallet } from "../../wallet/oreowalletWallet";
import { IRON_ASSET_ID_HEX, Network } from "../../constants";
import * as Uint8ArrayUtils from "../../../utils/uint8Array";

import {
  AccountFormat,
  decodeAccount,
  LanguageKey,
  LanguageUtils,
  TransactionStatus,
} from "@ironfish/sdk";
import { OreowalletServerApi } from "../../oreowalletServerApi/oreowalletServerApi";

export const walletHandlers = f.facade<WalletHandlers>({
  createAccount: f.handler.mutation(
    async ({ name }: { name: string }): Promise<Account> => {
      const account = await oreoWallet.createAccount(Network.MAINNET, name);

      return {
        name: account.name,
        viewOnly: account.viewOnly,
        publicAddress: account.publicAddress,
        balances: {
          iron: {
            assetId: IRON_ASSET_ID_HEX,
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
        active: true,
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

      const account = await oreoWallet.exportAccount(name, format, {
        language: typedLanguage,
        viewOnly,
      });
      return account;
    },
  ),
  getAccount: f.handler.query(
    async ({ name }: { name?: string }): Promise<Account | null> => {
      const account =
        name === undefined
          ? await oreoWallet.getActiveAccountWithHeadAndBalances(
              Network.MAINNET,
            )
          : await oreoWallet.getAccountWithHeadAndBalances(
              Network.MAINNET,
              name,
            );

      if (!account) {
        return null;
      }

      const balances = account.balances.map((b) => {
        return {
          assetId: Uint8ArrayUtils.toHex(b.assetId),
          confirmed: b.confirmed,
          unconfirmed: b.unconfirmed,
          pending: b.pending,
          available: b.available,
        };
      });

      const ironBalance = balances.find(
        (b) => b.assetId === IRON_ASSET_ID_HEX,
      ) ?? {
        assetId: IRON_ASSET_ID_HEX,
        confirmed: "0",
        unconfirmed: "0",
        pending: "0",
        available: "0",
      };
      const customBalances = balances.filter(
        (b) => b.assetId !== IRON_ASSET_ID_HEX,
      );

      const result: Account = {
        name: account.name,
        viewOnly: account.viewOnly,
        publicAddress: account.publicAddress,
        balances: {
          iron: ironBalance,
          custom: customBalances,
        },
        head: account.head
          ? {
              hash: Uint8ArrayUtils.toHex(account.head.hash),
              sequence: account.head.sequence,
            }
          : null,
        // TODO: Implement account settings in Wallet
        settings: {
          balanceAutoHide: false,
        },
        active: !!account.active,
      };
      return result;
    },
  ),
  getAccounts: f.handler.query(async () => {
    const accounts = await oreoWallet.getAccountsWithHeadAndBalances(
      Network.MAINNET,
    );

    return accounts.map((a): Account => {
      const balances = a.balances.map((b) => {
        return {
          assetId: Uint8ArrayUtils.toHex(b.assetId),
          confirmed: b.confirmed,
          unconfirmed: b.unconfirmed,
          pending: b.pending,
          available: b.available,
        };
      });

      const ironBalance = balances.find(
        (b) => b.assetId === IRON_ASSET_ID_HEX,
      ) ?? {
        assetId: IRON_ASSET_ID_HEX,
        confirmed: "0",
        unconfirmed: "0",
        pending: "0",
        available: "0",
      };
      const customBalances = balances.filter(
        (b) => b.assetId !== IRON_ASSET_ID_HEX,
      );

      return {
        name: a.name,
        viewOnly: a.viewOnly,
        publicAddress: a.publicAddress,
        balances: {
          iron: ironBalance,
          custom: customBalances,
        },
        head: a.head
          ? {
              hash: Uint8ArrayUtils.toHex(a.head.hash),
              sequence: a.head.sequence,
            }
          : null,
        // TODO: Implement account settings in Wallet
        settings: {
          balanceAutoHide: false,
        },
        active: !!a.active,
      };
    });
  }),
  setActiveAccount: f.handler.mutation(async ({ name }: { name: string }) => {
    return await oreoWallet.setActiveAccount(name);
  }),
  getEstimatedFees: f.handler.query(
    async (args: {
      accountName: string;
      outputs: { amount: string; assetId: string }[];
    }): Promise<{
      slow: string;
      average: string;
      fast: string;
    }> => {
      throw new Error("Oreowallet does not implement estimated fees");
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
      const txn = await oreoWallet.getTransaction(
        accountName,
        Network.MAINNET,
        txnHash,
      );

      if (!txn) {
        return null;
      }

      return {
        fee: txn.fee,
        timestamp: new Date(txn.timestamp),
        expiration: null,
        hash: txn.hash,
        block:
          txn.blockSequence > 0
            ? {
                hash: "",
                sequence: txn.blockSequence,
              }
            : null,
        submittedSequence: 0,
        assetBalanceDeltas: txn.assetBalanceDeltas.map((abd) => ({
          assetId: abd.assetId,
          delta: abd.delta,
        })),
        status: txn.status as TransactionStatus,
        notes: [
          {
            sender: txn.sender,
            owner: txn.receiver,
            memo: txn.memo ?? "",
            value: txn.value,
            spent: false,
            assetId: "",
            hash: "",
            memoHex: "",
          },
        ],
        burns: [],
        mints: [],
        spends: [],
        type: txn.type as TransactionType,
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
      const txns = await oreoWallet.getTransactions(
        accountName,
        Network.MAINNET,
      );

      return txns.map((txn) => ({
        fee: txn.fee,
        timestamp: new Date(txn.timestamp),
        expiration: null,
        block:
          txn.blockSequence > 0
            ? {
                hash: "",
                sequence: txn.blockSequence,
              }
            : null,
        hash: txn.hash,
        submittedSequence: 0,
        assetBalanceDeltas: txn.assetBalanceDeltas.map((abd) => ({
          assetId: abd.assetId,
          delta: abd.delta,
        })),
        status: txn.status as TransactionStatus,
        notes: [],
        burns: [],
        mints: [],
        spends: [],
        type: txn.type as TransactionType,
      }));
    },
  ),
  getWalletStatus: f.handler.query(
    async ({ accountName }: { accountName: string }): Promise<WalletStatus> => {
      const exportedAcc = await oreoWallet.exportAccount(
        accountName,
        AccountFormat.Base64Json,
        {
          viewOnly: true,
        },
      );

      const decodedAccount = decodeAccount(exportedAcc);

      const response = await OreowalletServerApi.getLatestBlock(
        Network.MAINNET,
        {
          publicAddress: decodedAccount.publicAddress,
          viewKey: decodedAccount.viewKey,
        },
      );
      return {
        status: oreoWallet.scanState.type,
        latestKnownBlock: Number(response.currentBlockIdentifier.index),
      };
    },
  ),
  importAccount: f.handler.mutation(
    async ({
      account,
      name,
    }: {
      account: string;
      name?: string;
    }): Promise<Account> => {
      const importedAccount = await oreoWallet.importAccount(
        Network.MAINNET,
        account,
        name,
      );

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
        active: true,
      };
    },
  ),
  pauseSyncing: f.handler.mutation(async () => {
    oreoWallet.pauseScan();
  }),
  removeAccount: f.handler.mutation(async ({ name }: { name: string }) => {
    await oreoWallet.removeAccount(name);
  }),
  removeAllAccounts: f.handler.mutation(async () => {
    await oreoWallet.removeAllAccounts();
  }),
  renameAccount: f.handler.mutation(
    async ({ name, newName }: { name: string; newName: string }) => {
      await oreoWallet.renameAccount(name, newName);
    },
  ),
  resumeSyncing: f.handler.mutation(async () => {
    oreoWallet.scan();
  }),
  sendTransaction: f.handler.mutation(
    async (args: {
      accountName: string;
      outputs: Output[];
      fee: string;
      expiration?: number;
    }) => {
      const rawTxn = await oreoWallet.createTransaction(
        Network.MAINNET,
        args.accountName,
        args.outputs,
        args.fee,
      );

      const hash = await oreoWallet.postTransaction(
        Network.MAINNET,
        args.accountName,
        rawTxn,
        args.expiration,
      );

      if (!hash) {
        throw new Error("Failed to send transaction");
      }

      return hash;
    },
  ),
  setAccountSettings: f.handler.mutation(
    async (args: { name: string; settings: Partial<AccountSettings> }) => {
      // TODO: Implement setAccountSettings
      return;
    },
  ),
});
