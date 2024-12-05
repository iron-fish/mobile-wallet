import { f } from "data-facade";
import {
  Account,
  AccountSettings,
  Output,
  Transaction,
  WalletHandlers,
  WalletStatus,
} from "./types";
import { wallet } from "../../wallet/wallet";
import { IRON_ASSET_ID_HEX, Network } from "../../constants";
import * as Uint8ArrayUtils from "../../../utils/uint8Array";

import { AccountFormat, LanguageKey, LanguageUtils } from "@ironfish/sdk";
import { Blockchain } from "../../blockchain";

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

      const account = await wallet.exportAccount(name, format, {
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
          ? await wallet.getActiveAccountWithHeadAndBalances(Network.TESTNET)
          : await wallet.getAccountWithHeadAndBalances(Network.TESTNET, name);

      if (!account) {
        return null;
      }

      const balances = (
        await wallet.getBalances(account.id, Network.TESTNET)
      ).map((b) => {
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
    const accounts = await wallet.getAccountsWithHeadAndBalances(
      Network.TESTNET,
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
    return await wallet.setActiveAccount(name);
  }),
  getEstimatedFees: f.handler.query(
    async (args: {
      accountName: string;
      outputs: { amount: string; assetId: string }[];
    }) => {
      return await wallet.estimateFees(
        Network.TESTNET,
        args.accountName,
        args.outputs,
      );
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
      const txn = await wallet.getTransaction(
        accountName,
        Network.TESTNET,
        txnHash,
      );

      if (!txn) {
        return null;
      }

      const notes = await wallet.getTransactionNotes(txnHash);

      return {
        fee: txn.fee,
        timestamp: txn.timestamp,
        expiration: txn.expirationSequence,
        hash: Uint8ArrayUtils.toHex(txn.hash),
        block:
          txn.blockSequence && txn.blockHash
            ? {
                hash: Uint8ArrayUtils.toHex(txn.blockHash),
                sequence: txn.blockSequence,
              }
            : null,
        submittedSequence: 0,
        assetBalanceDeltas: [],
        status: txn.status,
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
        type: txn.type,
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
        fee: txn.fee,
        timestamp: txn.timestamp,
        expiration: txn.expirationSequence,
        block:
          txn.blockHash && txn.blockSequence
            ? {
                hash: Uint8ArrayUtils.toHex(txn.blockHash),
                sequence: txn.blockSequence,
              }
            : null,
        hash: Uint8ArrayUtils.toHex(txn.hash),
        submittedSequence: 0,
        assetBalanceDeltas: [],
        status: txn.status,
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
        type: txn.type,
      }));
    },
  ),
  getWalletStatus: f.handler.query(async (): Promise<WalletStatus> => {
    const block = await Blockchain.getLatestBlock(Network.TESTNET);
    return { status: wallet.scanState.type, latestKnownBlock: block.sequence };
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
            assetId: IRON_ASSET_ID_HEX,
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
    wallet.pauseScan();
  }),
  removeAccount: f.handler.mutation(async ({ name }: { name: string }) => {
    await wallet.removeAccount(name);
  }),
  renameAccount: f.handler.mutation(
    async ({ name, newName }: { name: string; newName: string }) => {
      await wallet.renameAccount(name, newName);
    },
  ),
  resumeSyncing: f.handler.mutation(async () => {
    wallet.scan(Network.TESTNET);
  }),
  sendTransaction: f.handler.mutation(
    async (args: {
      accountName: string;
      outputs: Output[];
      fee: string;
      expiration?: number;
    }) => {
      await wallet.sendTransaction(
        Network.TESTNET,
        args.accountName,
        args.outputs,
        args.fee,
      );
    },
  ),
  setAccountSettings: f.handler.mutation(
    async (args: { name: string; settings: Partial<AccountSettings> }) => {
      // TODO: Implement setAccountSettings
      return;
    },
  ),
});
