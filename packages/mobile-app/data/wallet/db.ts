import { AccountImport } from "@ironfish/sdk/build/src/wallet/walletdb/accountValue";
import { Kysely, Generated, Migrator, sql } from "kysely";
import { ExpoDialect, ExpoMigrationProvider, SQLiteType } from "kysely-expo";
import * as SecureStore from "expo-secure-store";
import { AccountFormat, encodeAccount } from "@ironfish/sdk";
import { Network } from "../constants";

interface AccountsTable {
  id: Generated<number>;
  name: string;
  publicAddress: string;
  viewOnlyAccount: string;
  viewOnly: boolean;
}

interface AccountNetworkHeadsTable {
  id: Generated<number>;
  accountId: number;
  network: Network;
  sequence: number;
  hash: Uint8Array;
}

interface TransactionsTable {
  hash: Uint8Array;
  network: Network;
  timestamp: Date;
  blockSequence: number | null;
  blockHash: Uint8Array | null;
}

interface AccountTransactionsTable {
  id: Generated<number>;
  accountId: number;
  transactionHash: Uint8Array;
  // TODO: narrow this further, like Network
  transactionType: string;
}

interface Database {
  accounts: AccountsTable;
  accountNetworkHeads: AccountNetworkHeadsTable;
  transactions: TransactionsTable;
  accountTransactions: AccountTransactionsTable;
}

export class WalletDb {
  db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  static async init() {
    const db = new Kysely<Database>({
      dialect: new ExpoDialect({
        database: "wallet.db",
      }),
    });

    const migrator = new Migrator({
      db: db,
      provider: new ExpoMigrationProvider({
        migrations: {
          ["001_createAccounts"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating accounts");
              await db.schema
                .createTable("accounts")
                .addColumn("id", SQLiteType.Integer, (col) =>
                  col.primaryKey().autoIncrement(),
                )
                .addColumn("name", SQLiteType.String, (col) =>
                  col.notNull().unique(),
                )
                .addColumn("publicAddress", SQLiteType.String, (col) =>
                  col.notNull().unique(),
                )
                .addColumn("viewOnlyAccount", SQLiteType.String, (col) =>
                  col.notNull(),
                )
                .addColumn("viewOnly", SQLiteType.Boolean, (col) =>
                  col.notNull(),
                )
                .execute();
              console.log("created accounts");
            },
          },
          ["002_createAccountNetworkHeads"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating accountNetworkHeads");
              await db.schema
                .createTable("accountNetworkHeads")
                .addColumn("id", SQLiteType.Integer, (col) =>
                  col.primaryKey().autoIncrement(),
                )
                .addColumn("accountId", SQLiteType.Integer, (col) =>
                  col.notNull().references("accounts.id"),
                )
                .addColumn("network", SQLiteType.String, (col) =>
                  col.notNull().check(sql`network IN ("mainnet", "testnet")`),
                )
                .addColumn("sequence", SQLiteType.Integer, (col) =>
                  col.notNull(),
                )
                .addColumn("hash", SQLiteType.Blob, (col) => col.notNull())
                .execute();
              console.log("created accountNetworkHeads");
            },
          },
          ["003_createTransactions"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating transactions");
              await db.schema
                .createTable("transactions")
                .addColumn("hash", SQLiteType.Blob, (col) => col.primaryKey())
                .addColumn("network", SQLiteType.String, (col) =>
                  col.notNull().check(sql`network IN ("mainnet", "testnet")`),
                )
                .addColumn("timestamp", SQLiteType.DateTime)
                .addColumn("blockSequence", SQLiteType.Integer)
                .addColumn("blockHash", SQLiteType.Blob)
                .execute();
              console.log("created transactions");
            },
          },
          ["004_createAccountTransactions"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating account transactions");
              await db.schema
                .createTable("accountTransactions")
                .addColumn("id", SQLiteType.Integer, (col) =>
                  col.primaryKey().autoIncrement(),
                )
                .addColumn("transactionHash", SQLiteType.Blob, (col) =>
                  col.notNull().references("transactions.hash"),
                )
                .addColumn("accountId", SQLiteType.Integer, (col) =>
                  col.notNull().references("accounts.id"),
                )
                .addColumn("transactionType", SQLiteType.String, (col) =>
                  col.notNull(),
                )
                .execute();
              console.log("created account transactions");
            },
          },
        },
      }),
    });

    const { error, results } = await migrator.migrateToLatest();

    for (const result of results ?? []) {
      if (result.status === "Success") {
        console.log(`Ran migration "${result.migrationName}"`);
      } else if (result.status === "Error") {
        console.error(`failed to run migration "${result.migrationName}"`);
      }
    }

    if (error) {
      console.error("failed to run `migrateToLatest`");
      console.error(error);
    }

    return new WalletDb(db);
  }

  async createAccount(account: AccountImport) {
    const viewOnlyAccount = encodeAccount(
      { ...account, spendingKey: null },
      AccountFormat.Base64Json,
    );

    const accountValues = {
      name: account.name,
      publicAddress: account.publicAddress,
      viewOnlyAccount: viewOnlyAccount,
      viewOnly: account.spendingKey === null,
    };

    const result = await this.db
      .insertInto("accounts")
      .values(accountValues)
      .executeTakeFirst();

    if (account.spendingKey) {
      await SecureStore.setItemAsync(
        account.publicAddress,
        account.spendingKey,
        {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          requireAuthentication: false,
        },
      );
    }

    return {
      id: Number(result.insertId),
      ...accountValues,
    };
  }

  async getAccounts() {
    return await this.db.selectFrom("accounts").selectAll().execute();
  }

  async getAccount(name: string) {
    return await this.db
      .selectFrom("accounts")
      .selectAll()
      .where("accounts.name", "=", name)
      .executeTakeFirst();
  }

  async getSpendingKey(publicAddress: string) {
    return await SecureStore.getItemAsync(publicAddress, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireAuthentication: false,
    });
  }

  async renameAccount(name: string, newName: string) {
    return await this.db
      .updateTable("accounts")
      .where("accounts.name", "=", name)
      .set("accounts.name", newName)
      .executeTakeFirst();
  }

  async removeAccount(name: string) {
    const account = await this.getAccount(name);
    if (!account) {
      throw new Error(`No account found with name ${name}`);
    }

    const result = await this.db.transaction().execute(async (db) => {
      this.db
        .deleteFrom("accountNetworkHeads")
        .where("accountId", "=", account.id)
        .executeTakeFirstOrThrow();

      await this.db
        .deleteFrom("accountTransactions")
        .where("accountId", "=", account.id)
        .executeTakeFirstOrThrow();

      return await this.db
        .deleteFrom("accounts")
        .where("accounts.id", "=", account.id)
        .executeTakeFirst();
    });

    if (result.numDeletedRows > 0) {
      try {
        await SecureStore.deleteItemAsync(account.publicAddress, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          requireAuthentication: false,
        });
      } catch {
        console.log(`Failed to delete spending key for account ${name}`);
      }

      // Clean up any orphaned transactions
      await this.db
        .deleteFrom("transactions")
        .where(({ eb, not, exists, selectFrom }) =>
          not(
            exists(
              selectFrom("accountTransactions")
                .selectAll()
                .whereRef("transactionHash", "=", "transactions.hash"),
            ),
          ),
        )
        .executeTakeFirst();
    }

    return result;
  }

  async getAccountHead(accountId: number, network: Network) {
    const result = await this.db
      .selectFrom("accountNetworkHeads")
      .selectAll()
      .where("accountId", "=", accountId)
      .where("network", "=", network)
      .executeTakeFirst();
    return result ? { hash: result.hash, sequence: result.sequence } : null;
  }

  async getAccountHeads(network: Network) {
    return await this.db
      .selectFrom("accountNetworkHeads")
      .selectAll()
      .where("network", "=", network)
      .execute();
  }

  async updateAccountHead(
    accountId: number,
    network: Network,
    sequence: number,
    hash: Uint8Array,
  ) {
    const result = await this.db
      .updateTable("accountNetworkHeads")
      .where("accountId", "=", accountId)
      .where("network", "=", network)
      .set({
        hash: hash,
        sequence: sequence,
      })
      .executeTakeFirst();

    if (result.numUpdatedRows === BigInt(0)) {
      await this.db
        .insertInto("accountNetworkHeads")
        .values({
          accountId: accountId,
          network: network,
          hash: hash,
          sequence: sequence,
        })
        .executeTakeFirst();
    }
  }

  async saveTransaction(values: {
    hash: Uint8Array;
    accountId: number;
    network: Network;
    blockSequence: number | null;
    blockHash: Uint8Array | null;
    timestamp: Date;
  }) {
    return await this.db.transaction().execute(async (db) => {
      // One transaction could apply to multiple accounts
      await db
        .insertInto("transactions")
        .values({
          hash: values.hash,
          network: values.network,
          blockSequence: values.blockSequence,
          blockHash: values.blockHash,
          timestamp: values.timestamp,
        })
        .onConflict((oc) => oc.column("hash").doNothing())
        .executeTakeFirstOrThrow();

      await db
        .insertInto("accountTransactions")
        .values({
          accountId: values.accountId,
          transactionHash: values.hash,
          // TODO: implement transaction type
          transactionType: "receive",
        })
        .executeTakeFirst();
    });
  }

  async getTransaction(accountId: number, hash: Uint8Array) {
    return await this.db
      .selectFrom("accountTransactions")
      .innerJoin(
        "transactions",
        "transactions.hash",
        "accountTransactions.transactionHash",
      )
      .selectAll()
      .where((eb) =>
        eb.and([
          eb("accountId", "=", accountId),
          eb("transactionHash", "=", hash),
        ]),
      )
      .fullJoin(
        "transactions",
        "transactions.hash",
        "accountTransactions.transactionHash",
      )
      .limit(1)
      .executeTakeFirst();
  }

  async getTransactions(network: Network) {
    return await this.db
      .selectFrom("transactions")
      .selectAll()
      .where("network", "=", network)
      .orderBy("timestamp", "asc")
      .execute();
  }
}
