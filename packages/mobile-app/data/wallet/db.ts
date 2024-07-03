import { AccountImport } from "@ironfish/sdk/build/src/wallet/walletdb/accountValue";
import { Kysely, Generated, Migrator, sql } from "kysely";
import { ExpoDialect, ExpoMigrationProvider, SQLiteType } from "kysely-expo";
import * as SecureStore from "expo-secure-store";
import { AccountFormat, encodeAccount } from "@ironfish/sdk";
import { Network } from "../constants";

interface AccountNetworkHeadsTable {
  id: Generated<number>;
  accountId: number;
  network: Network;
  sequence: number;
  hash: Uint8Array;
}

interface AccountsTable {
  id: Generated<number>;
  name: string;
  publicAddress: string;
  viewOnlyAccount: string;
  viewOnly: boolean;
}

interface Database {
  accounts: AccountsTable;
  accountNetworkHeads: AccountNetworkHeadsTable;
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
          createAccounts: {
            up: async (db: Kysely<Database>) => {
              console.log("creating accounts");
              await db.schema
                .createTable("accounts")
                .addColumn("id", "integer", (col) =>
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
              console.log("creating accountNetworkHeads");
              await db.schema
                .createTable("accountNetworkHeads")
                .addColumn("id", "integer", (col) =>
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
            },
          },
        },
      }),
    });

    await migrator.migrateToLatest();

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
      .where("accounts.name", "==", name)
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
      .where("accounts.name", "==", name)
      .set("accounts.name", newName)
      .executeTakeFirst();
  }

  async removeAccount(name: string) {
    const account = await this.getAccount(name);
    if (!account) {
      throw new Error(`No account found with name ${name}`);
    }

    await this.db
      .deleteFrom("accountNetworkHeads")
      .where("accountId", "==", account.id)
      .executeTakeFirst();
    const result = await this.db
      .deleteFrom("accounts")
      .where("accounts.name", "==", name)
      .executeTakeFirst();

    if (result.numDeletedRows > 0) {
      try {
        await SecureStore.deleteItemAsync(account.publicAddress, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          requireAuthentication: false,
        });
      } catch {
        console.log(`Failed to delete spending key for account ${name}`);
      }
    }

    return result;
  }

  async getEarliestHead(
    network: Network,
  ): Promise<{ hash: Uint8Array; sequence: number } | null> {
    const result = await this.db
      .selectFrom("accountNetworkHeads")
      .select(["hash", "sequence"])
      .where("network", "==", network)
      .rightJoin("accounts", "accounts.id", "accountNetworkHeads.accountId")
      .orderBy("sequence")
      .executeTakeFirst();
    return result ?? null;
  }

  async getAccountHead(accountId: number, network: Network) {
    const result = await this.db
      .selectFrom("accountNetworkHeads")
      .selectAll()
      .where("accountId", "==", accountId)
      .where("network", "==", network)
      .executeTakeFirst();
    return result ? { hash: result.hash, sequence: result.sequence } : null;
  }

  async getAccountHeads(network: Network) {
    return await this.db
      .selectFrom("accountNetworkHeads")
      .selectAll()
      .where("network", "==", network)
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
      .where("accountId", "==", accountId)
      .where("network", "==", network)
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
}
