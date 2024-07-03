import { f } from "data-facade";
import { z } from "zod";
import {
  Account,
  AccountSettings,
  Output,
  Transaction,
  TransactionType,
  WalletHandlers,
  WalletStatus,
} from "./types";
import { AccountFormat, LanguageKey, TransactionStatus } from "@ironfish/sdk";
import { generateKey } from "ironfish-native-module";

const ACCOUNTS: Account[] = [
  {
    name: "alice",
    publicAddress: "alice",
    head: null,
    viewOnly: false,
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
    settings: { balanceAutoHide: false },
  },
  {
    name: "bob",
    publicAddress: "bob",
    head: null,
    viewOnly: true,
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
    settings: { balanceAutoHide: false },
  },
  {
    name: "carol",
    publicAddress: "carol",
    head: null,
    viewOnly: false,
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
    settings: { balanceAutoHide: false },
  },
];

const WALLET_STATUS: WalletStatus = {
  status: "SYNCING",
  latestKnownBlock: 523142,
};

setTimeout(() => {
  WALLET_STATUS.latestKnownBlock++;
}, 60000);

async function getAccounts(limit: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return ACCOUNTS.slice(0, limit);
}

export const walletDemoHandlers = f.facade<WalletHandlers>({
  createAccount: f.handler.mutation(async ({ name }: { name: string }) => {
    const k = generateKey();
    const account: Account = {
      name,
      publicAddress: k.publicAddress,
      head: null,
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
      viewOnly: false,
      settings: { balanceAutoHide: false },
    };
    console.log("createAccount", account);
    ACCOUNTS.push(account);
    return account;
  }),
  // The enums used when exporting are tricky to use with Zod
  exportAccount: f.handler.mutation(
    async ({
      name,
    }: {
      name: string;
      format: AccountFormat;
      language?: LanguageKey;
      viewOnly?: boolean;
    }) => {
      const account = ACCOUNTS.find((a) => a.name === name);
      if (account === undefined) {
        throw new Error(`No account found with name ${name}`);
      }
      return JSON.stringify(account);
    },
  ),
  getAccount: f.handler.query(async ({ name }: { name: string }) => {
    const account = ACCOUNTS.find((a) => a.name === name);
    if (account === undefined) {
      throw new Error(`No account found with name ${name}`);
    }
    return account;
  }),
  getAccounts: f.handler.query(async () => {
    const accounts = await getAccounts(ACCOUNTS.length);
    console.log("getAccounts", accounts);
    return accounts;
  }),
  getEstimatedFees: f.handler.query(
    async (args: { accountName: string; outputs: Output[] }) => {
      return { slow: "0.00000001", average: "0.00000002", fast: "0.00000003" };
    },
  ),
  getTransaction: f.handler.query(
    async ({
      accountName,
      hash,
    }: {
      accountName: string;
      hash: string;
    }): Promise<Transaction> => {
      return {
        hash: hash,
        timestamp: new Date().setDate(new Date().getDate() - 1),
        assetBalanceDeltas: [
          {
            assetId:
              "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
            delta: "20",
          },
        ],
        fee: "1",
        expiration: 0,
        blockHash:
          "00000000000004e987a7404874bf27beee12180aef982a3f730981ac25ffe642",
        submittedSequence: 0,
        status: TransactionStatus.CONFIRMED,
        type: TransactionType.RECEIVE,
        burns: [],
        mints: [],
        notes: [
          {
            assetId:
              "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
            hash: "3434291950e34661d8a89114dd77524ad95e7cb78fe50d29f1c9067adc1c2d4c",
            memo: "Hello world",
            memoHex: "48656c6c6f20776f726c64",
            value: "20",
            spent: false,
            owner:
              "3f6d1bc503f78729c3b203b3ed28791d25e4d8e54cc803f06805749a1424880e",
            sender:
              "7e5070ea40b3ff7a8c54697084abed1b4dd86c026235eb8d23e6412431a36833",
          },
        ],
        spends: [],
      };
    },
  ),
  getTransactions: f.handler.query(
    async ({
      accountName,
      hash,
    }: {
      accountName: string;
      hash: string;
      options?: {
        limit?: number;
        offset?: number;
        ascending?: boolean;
        assetId?: string;
        address?: string;
      };
    }): Promise<Transaction[]> => {
      return [
        {
          hash: hash,
          timestamp: new Date().setDate(new Date().getDate() - 1),
          assetBalanceDeltas: [
            {
              assetId:
                "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
              delta: "20",
            },
          ],
          fee: "1",
          expiration: 0,
          blockHash:
            "00000000000004e987a7404874bf27beee12180aef982a3f730981ac25ffe642",
          submittedSequence: 0,
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.RECEIVE,
          burns: [],
          mints: [],
          notes: [
            {
              assetId:
                "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
              hash: "3434291950e34661d8a89114dd77524ad95e7cb78fe50d29f1c9067adc1c2d4c",
              memo: "Hello world",
              memoHex: "48656c6c6f20776f726c64",
              value: "20",
              spent: false,
              owner:
                "3f6d1bc503f78729c3b203b3ed28791d25e4d8e54cc803f06805749a1424880e",
              sender:
                "7e5070ea40b3ff7a8c54697084abed1b4dd86c026235eb8d23e6412431a36833",
            },
          ],
          spends: [],
        },
      ];
    },
  ),
  getWalletStatus: f.handler.query(async () => {
    return WALLET_STATUS;
  }),
  importAccount: f.handler.mutation(
    async ({ account, name }: { account: string; name: string }) => {
      const k = generateKey();
      const importedAccount: Account = {
        name,
        publicAddress: k.publicAddress,
        viewOnly: false,
        head: null,
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
        settings: { balanceAutoHide: false },
      };
      console.log("importAccount", account);
      ACCOUNTS.push(importedAccount);
      return importedAccount;
    },
  ),
  pauseSyncing: f.handler.mutation(async () => {
    WALLET_STATUS.status = "PAUSED";
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
  renameAccount: f.handler.mutation(
    async ({ name, newName }: { name: string; newName: string }) => {
      const account = ACCOUNTS.find((a) => a.name === name);
      if (!account) {
        throw new Error("No account found");
      }
      account.name = newName;
    },
  ),
  resumeSyncing: f.handler.mutation(async () => {
    WALLET_STATUS.status = "SYNCING";
  }),
  sendTransaction: f.handler.mutation(
    async (args: {
      accountName: string;
      outputs: Output[];
      fee: string;
      expiration?: number;
    }) => {
      return;
    },
  ),
  setAccountSettings: f.handler.mutation(
    async ({
      name,
      settings,
    }: {
      name: string;
      settings: Partial<AccountSettings>;
    }) => {
      const account = ACCOUNTS.find((a) => a.name === name);
      if (!account) {
        throw new Error("No account found");
      }
      account.settings = { ...account.settings, ...settings };
    },
  ),
});
