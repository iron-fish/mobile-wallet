import { AccountImport } from "@ironfish/sdk/build/src/wallet/walletdb/accountValue";
import { Kysely, Generated, Migrator, sql, Selectable } from "kysely";
import { ExpoDialect, ExpoMigrationProvider, SQLiteType } from "kysely-expo";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import { AccountFormat, encodeAccount, Note } from "@ironfish/sdk";
import { Network } from "../constants";
import * as Uint8ArrayUtils from "../../utils/uint8Array";
import { TransactionType } from "../facades/wallet/types";
import { SerializedAsset } from "../api/types";
interface AccountsTable {
  id: Generated<number>;
  name: string;
  publicAddress: string;
  viewOnlyAccount: string;
  viewOnly: boolean;
}

/**
 * Table with a singleton row marking the active account.
 */
interface ActiveAccountTable {
  id: number;
  accountId: number | null;
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
  // Expiration sequence is only set on transactions generated on-device.
  expirationSequence: number | null;
  // Fee is only set on transactions generated on-device.
  fee: string | null;
}

interface AccountTransactionsTable {
  id: Generated<number>;
  accountId: number;
  transactionHash: Uint8Array;
  type: TransactionType;
}

interface TransactionBalanceDeltasTable {
  id: Generated<number>;
  accountId: number;
  transactionHash: Uint8Array;
  assetId: Uint8Array;
  value: string;
}

interface NotesTable {
  id: Generated<number>;
  accountId: number;
  network: Network;
  transactionHash: Uint8Array;
  // Building proofs takes a full note, so we'll store the whole thing.
  // If storage is an issue, we could fall back to re-decrypting the notes
  // to get the full note.
  note: Uint8Array;
  // The index of the note within the transaction. Notes can be reused, so combining
  // the transaction hash and the index provides a unique identifier for a note (aka outpoint).
  noteTransactionIndex: number;
  // Note index in the merkle tree. Could also be derived from the note size on the
  // transaction, but stored here for convenience.
  // Can be null for:
  //   * Notes that are owned in a pending transaction
  //   * Notes that are not owned
  position: number | null;
  // The rest of the fields are primarily to allow searching/filtering in SQLite.
  assetId: Uint8Array;
  sender: Uint8Array;
  owner: Uint8Array;
  // SQLite max integer size is signed 64-bit. We'll probably need to sort notes by value
  // (e.g. we do this in the SDK to spend certain notes first), so we could either cram the value
  // into a signed integer and special-case large values (assume values <0 are largest), or store
  // the value as a Uint8Array (I think we do this for the keys in leveldb)
  value: string;
  valueNum: number;
  // Depending how we want to search memos, we could store this multiple times. E.g. do we want to
  // allow searching non-utf8-encoded memos? Like searching binary data as hex
  memo: Uint8Array;
  // Can be null for:
  //   * Notes that are not owned
  //   * Notes that are owned in a pending transaction
  nullifier: Uint8Array | null;
  // Can be null for:
  //   * Notes have not been spent
  //   * Notes that are not owned
  nullifierTransactionHash: Uint8Array | null;
}

interface BalancesTable {
  id: Generated<number>;
  accountId: number;
  network: Network;
  assetId: Uint8Array;
  value: string;
}

interface AssetsTable {
  id: Generated<number>;
  network: Network;
  assetId: Uint8Array;
  updatedAt: Date;
  name: string;
  owner: string;
  creator: string;
  metadata: string;
  createdTransactionHash: string;
  createdTransactionTimestamp: string;
  verified: boolean;
  supply: string | null;
  symbol: string | null;
  decimals: number | null;
  logoURI: string | null;
  website: string | null;
}

interface Database {
  accounts: AccountsTable;
  activeAccount: ActiveAccountTable;
  accountNetworkHeads: AccountNetworkHeadsTable;
  transactions: TransactionsTable;
  accountTransactions: AccountTransactionsTable;
  transactionBalanceDeltas: TransactionBalanceDeltasTable;
  notes: NotesTable;
  balances: BalancesTable;
  assets: AssetsTable;
}

export type DBAccount = Selectable<AccountsTable>;

export type DBTransaction = Selectable<TransactionsTable> &
  Selectable<AccountTransactionsTable>;

class BalanceDeltas {
  balanceDeltas = new Map<string, bigint>();

  add(assetId: Uint8Array, noteValue: bigint) {
    const hexAssetId = Uint8ArrayUtils.toHex(assetId);
    const existingValue = this.balanceDeltas.get(hexAssetId) ?? 0n;
    this.balanceDeltas.set(hexAssetId, existingValue + noteValue);
  }

  subtract(assetId: Uint8Array, noteValue: bigint) {
    const hexAssetId = Uint8ArrayUtils.toHex(assetId);
    const existingValue = this.balanceDeltas.get(hexAssetId) ?? 0n;
    this.balanceDeltas.set(hexAssetId, existingValue - noteValue);
  }

  [Symbol.iterator]() {
    return this.balanceDeltas.entries();
  }
}

export class WalletDb {
  db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  static async init() {
    console.log(`db: ${FileSystem.documentDirectory + "SQLite/wallet.db"}`);

    const db = new Kysely<Database>({
      dialect: new ExpoDialect({
        database: "wallet.db",
        autoAffinityConversion: true,
        onError: (error) => {
          console.error(error);
        },
      }),
      log: ["error"],
    });

    // WAL mode is generally faster, and I don't think any of the listed
    // downsides apply: https://www.sqlite.org/draft/wal.html
    // So opting to default to enabling WAL mode and can disable if we run
    // into issues on Android/iOS.
    sql`PRAGMA journal_mode=WAL`.execute(db);

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
                .addUniqueConstraint("accountnetworkheads_accountId_network", [
                  "accountId",
                  "network",
                ])
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
                .addColumn("expirationSequence", SQLiteType.Integer)
                .addColumn("fee", SQLiteType.String)
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
                .addColumn("type", SQLiteType.String, (col) =>
                  col.notNull().check(sql`type IN ("receive", "send")`),
                )
                .addUniqueConstraint("accountTransactions_accountId_hash", [
                  "accountId",
                  "transactionHash",
                ])
                .execute();
              console.log("created account transactions");
            },
          },
          ["005_createNotes"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating notes");
              await db.schema
                .createTable("notes")
                .addColumn("id", SQLiteType.Integer, (col) =>
                  col.primaryKey().autoIncrement(),
                )
                .addColumn("transactionHash", SQLiteType.Blob, (col) =>
                  col.notNull().references("transactions.hash"),
                )
                .addColumn("accountId", SQLiteType.Integer, (col) =>
                  col.notNull().references("accounts.id"),
                )
                .addColumn("network", SQLiteType.String, (col) =>
                  col.notNull().check(sql`network IN ("mainnet", "testnet")`),
                )
                .addColumn("note", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("noteTransactionIndex", SQLiteType.Integer, (col) =>
                  col.notNull(),
                )
                .addColumn("position", SQLiteType.Integer)
                .addColumn("assetId", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("sender", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("owner", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("value", SQLiteType.String, (col) => col.notNull())
                .addColumn("valueNum", SQLiteType.Number, (col) =>
                  col.notNull(),
                )
                .addColumn("memo", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("nullifier", SQLiteType.Blob)
                .addColumn("nullifierTransactionHash", SQLiteType.Blob)
                .addUniqueConstraint(
                  "notes_accountId_transactionHash_noteTransactionIndex",
                  ["accountId", "transactionHash", "noteTransactionIndex"],
                )
                .execute();

              await db.schema
                .createIndex("idx_notes_nullifier")
                .on("notes")
                .column("nullifier")
                .execute();

              console.log("created notes");
            },
          },
          ["007_createBalances"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating balances");
              await db.schema
                .createTable("balances")
                .addColumn("id", SQLiteType.Integer, (col) =>
                  col.primaryKey().autoIncrement(),
                )
                .addColumn("accountId", SQLiteType.Integer, (col) =>
                  col.notNull().references("accounts.id"),
                )
                .addColumn("network", SQLiteType.String, (col) =>
                  col.notNull().check(sql`network IN ("mainnet", "testnet")`),
                )
                .addColumn("assetId", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("value", SQLiteType.String, (col) => col.notNull())
                .addUniqueConstraint("balances_accountId_network_assetId", [
                  "accountId",
                  "network",
                  "assetId",
                ])
                .execute();
              console.log("created balances");
            },
          },
          ["008_createTransactionBalanceDeltas"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating transaction balance deltas");
              await db.schema
                .createTable("transactionBalanceDeltas")
                .addColumn("id", SQLiteType.Integer, (col) =>
                  col.primaryKey().autoIncrement(),
                )
                .addColumn("accountId", SQLiteType.Integer, (col) =>
                  col.notNull().references("accounts.id"),
                )
                .addColumn("transactionHash", SQLiteType.Blob, (col) =>
                  col.notNull().references("transactions.hash"),
                )
                .addColumn("assetId", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("value", SQLiteType.String, (col) => col.notNull())
                .addUniqueConstraint(
                  "transactionbalancedeltas_accountId_hash_assetId",
                  ["accountId", "transactionHash", "assetId"],
                )
                .execute();
              console.log("created transaction balance deltas");
            },
          },
          ["009_createActiveAccount"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating active account");
              await db.schema
                .createTable("activeAccount")
                .addColumn("id", SQLiteType.Integer, (col) =>
                  col
                    .primaryKey()
                    .notNull()
                    .defaultTo(1)
                    .check(sql`id = 1`),
                )
                .addColumn("accountId", SQLiteType.Integer, (col) =>
                  col.references("accounts.id"),
                )
                .execute();
              await db
                .insertInto("activeAccount")
                .values({ id: 1, accountId: null })
                .execute();
              console.log("created active account");
            },
          },
          ["009_createAssets"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating assets");
              await db.schema
                .createTable("assets")
                .addColumn("id", SQLiteType.Integer, (col) =>
                  col.primaryKey().autoIncrement(),
                )
                .addColumn("updatedAt", SQLiteType.DateTime, (col) =>
                  col.notNull(),
                )
                .addColumn("assetId", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("network", SQLiteType.String, (col) =>
                  col.notNull().check(sql`network IN ("mainnet", "testnet")`),
                )
                .addColumn("name", SQLiteType.String, (col) => col.notNull())
                .addColumn("owner", SQLiteType.String, (col) => col.notNull())
                .addColumn("creator", SQLiteType.String, (col) => col.notNull())
                .addColumn("metadata", SQLiteType.String, (col) =>
                  col.notNull(),
                )
                .addColumn("createdTransactionHash", SQLiteType.String, (col) =>
                  col.notNull(),
                )
                .addColumn(
                  "createdTransactionTimestamp",
                  SQLiteType.String,
                  (col) => col.notNull(),
                )
                .addColumn("supply", SQLiteType.String)
                .addColumn("verified", SQLiteType.Boolean)
                .addColumn("symbol", SQLiteType.String)
                .addColumn("decimals", SQLiteType.Number)
                .addColumn("logoURI", SQLiteType.String)
                .addColumn("website", SQLiteType.String)
                .addUniqueConstraint("assets_assetId_network", [
                  "assetId",
                  "network",
                ])
                .execute();
              console.log("created assets");
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

  /**
   * Creates a new account in the database and sets it to the active account.
   * Returns the existing account if one already exists with the same public address.
   */
  async createAccount(account: AccountImport): Promise<DBAccount> {
    const viewOnlyAccount = encodeAccount(
      { ...account, spendingKey: null },
      AccountFormat.Base64Json,
    );

    console.log("account", account);

    const result = await this.db.transaction().execute(async (db) => {
      const insertResult = await db
        .insertInto("accounts")
        .values({
          name: account.name,
          publicAddress: account.publicAddress,
          viewOnlyAccount: viewOnlyAccount,
          viewOnly: account.spendingKey === null,
        })
        .onConflict((oc) => oc.column("publicAddress").doNothing())
        .executeTakeFirst();

      // TODO: We're returning the existing account to make it easy to switch networks
      // using the oreowallet server -- we can just re-import all accounts. But this
      // doesn't consider:
      //   * If the new account has same public address but different name
      //   * If the new account has same public address but adds/removes spending key
      if (!insertResult.numInsertedOrUpdatedRows) {
        console.log("returning existing account");
        return await db
          .selectFrom("accounts")
          .selectAll()
          .where("accounts.publicAddress", "=", account.publicAddress)
          .executeTakeFirstOrThrow();
      }

      console.log("returning new account");

      // Only set as active account if this was a new insert
      await db
        .updateTable("activeAccount")
        .set("accountId", Number(insertResult.insertId))
        .execute();

      return {
        id: Number(insertResult.insertId),
        name: account.name,
        publicAddress: account.publicAddress,
        viewOnlyAccount: viewOnlyAccount,
        viewOnly: account.spendingKey === null,
      };
    });

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

    return result;
  }

  async getAccountById(id: number) {
    return await this.db
      .selectFrom("accounts")
      .leftJoin("activeAccount", "accounts.id", "activeAccount.accountId")
      .selectAll("accounts")
      .select((eb) => [
        eb("activeAccount.accountId", "is not", null).as("active"),
      ])
      .where("accounts.id", "=", id)
      .executeTakeFirst();
  }

  async getAccount(name: string) {
    return await this.db
      .selectFrom("accounts")
      .leftJoin("activeAccount", "accounts.id", "activeAccount.accountId")
      .selectAll("accounts")
      .select((eb) => [
        eb("activeAccount.accountId", "is not", null).as("active"),
      ])
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
      .set({
        name: newName,
      })
      .executeTakeFirst();
  }

  async removeAccount(name: string) {
    const account = await this.getAccount(name);
    if (!account) {
      throw new Error(`No account found with name ${name}`);
    }

    const result = await this.db.transaction().execute(async (db) => {
      await db
        .deleteFrom("transactionBalanceDeltas")
        .where("accountId", "=", account.id)
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("accountNetworkHeads")
        .where("accountId", "=", account.id)
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("accountTransactions")
        .where("accountId", "=", account.id)
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("notes")
        .where("accountId", "=", account.id)
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("balances")
        .where("accountId", "=", account.id)
        .executeTakeFirstOrThrow();

      await db
        .updateTable("activeAccount")
        .set((eb) => ({
          accountId: eb
            .selectFrom("accounts")
            .select("id")
            .where("id", "!=", account.id)
            .limit(1),
        }))
        .execute();

      return await db
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

  async removeAllAccounts() {
    const accounts = await this.db.selectFrom("accounts").selectAll().execute();

    await this.db.transaction().execute(async (db) => {
      await db.deleteFrom("balances").execute();
      await db.deleteFrom("accountNetworkHeads").execute();
      await db.deleteFrom("accountTransactions").execute();
      await db.deleteFrom("transactions").execute();
      await db.deleteFrom("activeAccount").execute();
      await db.deleteFrom("accounts").execute();
    });

    // Clean up spending keys from secure storage
    for (const account of accounts) {
      try {
        await SecureStore.deleteItemAsync(account.publicAddress, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          requireAuthentication: false,
        });
      } catch {
        console.log(
          `Failed to delete spending key for account ${account.name}`,
        );
      }
    }
  }

  async setActiveAccount(name: string) {
    const result = await this.db
      .updateTable("activeAccount")
      .from("accounts")
      .set((eb) => ({
        accountId: eb.ref("accounts.id"),
      }))
      .where("accounts.name", "=", name)
      .executeTakeFirstOrThrow();

    return result.numUpdatedRows > 0;
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
        .onConflict((oc) =>
          oc.columns(["accountId", "network"]).doUpdateSet({
            hash: hash,
            sequence: sequence,
          }),
        )
        .executeTakeFirst();
    }
  }

  async getActiveAccountWithHead(network: Network) {
    return await this.db.transaction().execute(async (db) => {
      const account = await db
        .selectFrom("activeAccount")
        .innerJoin("accounts", "accounts.id", "activeAccount.accountId")
        .select([
          "accounts.id",
          "accounts.name",
          "accounts.publicAddress",
          "accounts.viewOnly",
          "accounts.viewOnlyAccount",
        ])
        // Should always be true
        .select((eb) => [
          eb("activeAccount.accountId", "==", eb.ref("accounts.id")).as(
            "active",
          ),
        ])
        .executeTakeFirst();

      console.log("active", account);

      if (!account) return;

      const head = await db
        .selectFrom("accountNetworkHeads")
        .select(["sequence", "hash"])
        .where((eb) =>
          eb.and([
            eb("network", "=", network),
            eb("accountId", "==", account.id),
          ]),
        )
        .executeTakeFirst();

      return {
        ...account,
        head: head ?? null,
      };
    });
  }

  async getAccountWithHead(name: string, network: Network) {
    return await this.db.transaction().execute(async (db) => {
      const account = await db
        .selectFrom("accounts")
        .leftJoin("activeAccount", "accounts.id", "activeAccount.accountId")
        .selectAll("accounts")
        .select((eb) => [
          eb("activeAccount.accountId", "is not", null).as("active"),
        ])
        .where("accounts.name", "=", name)
        .executeTakeFirst();

      if (!account) return;

      const head = await db
        .selectFrom("accountNetworkHeads")
        .select(["sequence", "hash"])
        .where((eb) =>
          eb.and([
            eb("network", "=", network),
            eb("accountId", "==", account.id),
          ]),
        )
        .executeTakeFirst();

      return {
        ...account,
        head: head ?? null,
      };
    });
  }

  async getAccountsWithHeads(network: Network) {
    const result = await this.db.transaction().execute(async (db) => {
      const accountPromise = db
        .selectFrom("accounts")
        .leftJoin("activeAccount", "accounts.id", "activeAccount.accountId")
        .selectAll("accounts")
        .select((eb) => [
          eb("activeAccount.accountId", "is not", null).as("active"),
        ])
        .execute();

      const headPromise = db
        .selectFrom("accountNetworkHeads")
        .selectAll()
        .where("network", "=", network)
        .execute();

      return {
        accounts: await accountPromise,
        heads: await headPromise,
      };
    });

    const headsMap = new Map(
      result.heads.map((head) => [
        head.accountId,
        { hash: head.hash, sequence: head.sequence },
      ]),
    );

    return result.accounts.map((account) => ({
      ...account,
      head: headsMap.get(account.id) ?? null,
    }));
  }

  async getPendingTransactions(accountId: number, network: Network) {
    return await this.db
      .selectFrom("transactions")
      .innerJoin(
        "accountTransactions",
        "transactions.hash",
        "accountTransactions.transactionHash",
      )
      .selectAll("transactions")
      .where((eb) =>
        eb.and([
          eb("accountTransactions.accountId", "=", accountId),
          eb("transactions.blockSequence", "is", null),
          eb("transactions.network", "=", network),
        ]),
      )
      .execute();
  }

  async removePendingTransaction(hash: Uint8Array) {
    await this.db.transaction().execute(async (db) => {
      const transaction = await db
        .selectFrom("transactions")
        .select("blockSequence")
        .where("hash", "=", hash)
        .executeTakeFirst();

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.blockSequence !== null) {
        throw new Error("Cannot remove a transaction that is in a block");
      }

      await db
        .deleteFrom("accountTransactions")
        .where("transactionHash", "=", hash)
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("notes")
        .where("transactionHash", "=", hash)
        .executeTakeFirstOrThrow();

      await db
        .updateTable("notes")
        .set({
          nullifierTransactionHash: null,
        })
        .where("nullifierTransactionHash", "=", hash)
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("transactionBalanceDeltas")
        .where("transactionHash", "=", hash)
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("transactions")
        .where("hash", "=", hash)
        .executeTakeFirstOrThrow();
    });
  }

  async savePendingTransaction(values: {
    accountId: number;
    network: Network;
    hash: Uint8Array;
    timestamp: Date;
    expirationSequence: number;
    fee: string;
    ownerNotes: { note: Note; noteTransactionIndex: number }[];
    foundNullifiers: Uint8Array[];
    spenderNotes: { note: Note; noteTransactionIndex: number }[];
  }) {
    await this.db.transaction().execute(async (db) => {
      const balanceDeltas = new BalanceDeltas();

      // Note that we can't rely on spenderNotes alone for subtracting from balance deltas
      // because they don't include transaction fees.
      if (values.foundNullifiers.length > 0) {
        const spentNotes = await db
          .selectFrom("notes")
          .select(["notes.assetId", "notes.value"])
          .where((eb) =>
            eb.and([
              eb("notes.nullifier", "in", values.foundNullifiers),
              eb("notes.accountId", "=", values.accountId),
            ]),
          )
          .execute();

        if (spentNotes.length !== values.foundNullifiers.length) {
          console.error("Some nullifiers were not found in the database");
        }

        for (const note of spentNotes) {
          balanceDeltas.subtract(note.assetId, BigInt(note.value));
        }
      }
      for (const note of values.ownerNotes) {
        balanceDeltas.add(note.note.assetId(), note.note.value());
      }

      // One transaction could apply to multiple accounts
      await db
        .insertInto("transactions")
        .values({
          hash: values.hash,
          network: values.network,
          blockSequence: null,
          blockHash: null,
          timestamp: values.timestamp,
          expirationSequence: values.expirationSequence,
          fee: values.fee,
        })
        .executeTakeFirstOrThrow();

      await db
        .insertInto("accountTransactions")
        .values({
          accountId: values.accountId,
          transactionHash: values.hash,
          type: TransactionType.SEND,
        })
        .executeTakeFirstOrThrow();

      for (const note of values.ownerNotes) {
        await db
          .insertInto("notes")
          .values({
            accountId: values.accountId,
            network: values.network,
            transactionHash: values.hash,
            note: new Uint8Array(note.note.serialize()),
            noteTransactionIndex: note.noteTransactionIndex,
            assetId: new Uint8Array(note.note.assetId()),
            owner: Uint8ArrayUtils.fromHex(note.note.owner()),
            sender: Uint8ArrayUtils.fromHex(note.note.sender()),
            value: note.note.value().toString(),
            valueNum: Number(note.note.value()),
            memo: new Uint8Array(note.note.memo()),
            position: null,
            nullifier: null,
            nullifierTransactionHash: null,
          })
          .executeTakeFirst();
      }

      for (const nullifier of values.foundNullifiers) {
        await db
          .updateTable("notes")
          .set("nullifierTransactionHash", values.hash)
          .where("nullifier", "=", nullifier)
          .executeTakeFirstOrThrow();
      }

      for (const note of values.spenderNotes) {
        await db
          .insertInto("notes")
          .values({
            accountId: values.accountId,
            network: values.network,
            transactionHash: values.hash,
            note: new Uint8Array(note.note.serialize()),
            noteTransactionIndex: note.noteTransactionIndex,
            assetId: new Uint8Array(note.note.assetId()),
            owner: Uint8ArrayUtils.fromHex(note.note.owner()),
            sender: Uint8ArrayUtils.fromHex(note.note.sender()),
            value: note.note.value().toString(),
            valueNum: Number(note.note.value()),
            memo: new Uint8Array(note.note.memo()),
            position: null,
            nullifier: null,
            nullifierTransactionHash: null,
          })
          .executeTakeFirstOrThrow();
      }

      for (const delta of balanceDeltas) {
        await db
          .insertInto("transactionBalanceDeltas")
          .values({
            accountId: values.accountId,
            assetId: Uint8ArrayUtils.fromHex(delta[0]),
            transactionHash: values.hash,
            value: delta[1].toString(),
          })
          .executeTakeFirstOrThrow();
      }
    });
  }

  async saveBlock(values: {
    accountId: number;
    network: Network;
    blockSequence: number;
    blockHash: Uint8Array;
    transactions: {
      hash: Uint8Array;
      ownerNotes: {
        position: number | null;
        note: Note;
        nullifier: string;
        noteTransactionIndex: number;
      }[];
      foundNullifiers: Uint8Array[];
      spenderNotes: { note: Note; noteTransactionIndex: number }[];
      timestamp: Date;
    }[];
  }) {
    if (values.transactions.length === 0) {
      await this.db
        .insertInto("accountNetworkHeads")
        .values({
          accountId: values.accountId,
          network: values.network,
          hash: values.blockHash,
          sequence: values.blockSequence,
        })
        .onConflict((oc) =>
          oc.columns(["accountId", "network"]).doUpdateSet({
            hash: values.blockHash,
            sequence: values.blockSequence,
          }),
        )
        .executeTakeFirstOrThrow();
      return;
    }

    const address = (
      await this.db
        .selectFrom("accounts")
        .select("publicAddress")
        .where("id", "=", values.accountId)
        .executeTakeFirst()
    )?.publicAddress;
    if (address === undefined) {
      throw new Error(`Account with ID ${values.accountId} not found`);
    }

    await this.db.transaction().execute(async (db) => {
      await db
        .insertInto("accountNetworkHeads")
        .values({
          accountId: values.accountId,
          network: values.network,
          hash: values.blockHash,
          sequence: values.blockSequence,
        })
        .onConflict((oc) =>
          oc.columns(["accountId", "network"]).doUpdateSet({
            hash: values.blockHash,
            sequence: values.blockSequence,
          }),
        )
        .executeTakeFirstOrThrow();

      for (const txn of values.transactions) {
        // Intended to match the logic in ironfish sdk's getTransactionType
        const allNotes = [...txn.ownerNotes, ...txn.spenderNotes];
        const transactionType =
          txn.foundNullifiers.length !== 0 ||
          allNotes[0].note.sender() === address
            ? TransactionType.SEND
            : TransactionType.RECEIVE;

        const balanceDeltas = new BalanceDeltas();

        // Note that we can't rely on spenderNotes alone for subtracting from balance deltas
        // because they don't include transaction fees.
        if (txn.foundNullifiers.length > 0) {
          const spentNotes = await db
            .selectFrom("notes")
            .selectAll()
            .where((eb) =>
              eb.and([
                eb("notes.nullifier", "in", txn.foundNullifiers),
                eb("notes.accountId", "=", values.accountId),
              ]),
            )
            .execute();

          if (spentNotes.length !== txn.foundNullifiers.length) {
            console.error("Some nullifiers were not found in the database");
          }

          for (const note of spentNotes) {
            balanceDeltas.subtract(note.assetId, BigInt(note.value));
          }
        }
        for (const note of txn.ownerNotes) {
          balanceDeltas.add(note.note.assetId(), note.note.value());
        }

        await db
          .insertInto("transactions")
          .values({
            hash: txn.hash,
            network: values.network,
            blockSequence: values.blockSequence,
            blockHash: values.blockHash,
            timestamp: txn.timestamp,
          })
          // One transaction could apply to multiple accounts
          // Might be updating a pending txn to an on-chain txn
          .onConflict((oc) =>
            oc.column("hash").doUpdateSet({
              blockHash: values.blockHash,
              blockSequence: values.blockSequence,
              timestamp: txn.timestamp,
            }),
          )
          .executeTakeFirstOrThrow();

        const r = await db
          .insertInto("accountTransactions")
          .values({
            accountId: values.accountId,
            transactionHash: txn.hash,
            type: transactionType,
          })
          // Transaction might already be pending
          .onConflict((oc) =>
            oc.columns(["accountId", "transactionHash"]).doNothing(),
          )
          .executeTakeFirstOrThrow();

        if (r.insertId) {
          console.log("new");
        } else {
          console.log("update");
        }

        for (const note of txn.ownerNotes) {
          await db
            .insertInto("notes")
            .values({
              accountId: values.accountId,
              network: values.network,
              transactionHash: txn.hash,
              note: new Uint8Array(note.note.serialize()),
              noteTransactionIndex: note.noteTransactionIndex,
              assetId: new Uint8Array(note.note.assetId()),
              owner: Uint8ArrayUtils.fromHex(note.note.owner()),
              sender: Uint8ArrayUtils.fromHex(note.note.sender()),
              value: note.note.value().toString(),
              valueNum: Number(note.note.value()),
              memo: new Uint8Array(note.note.memo()),
              position: note.position,
              nullifier: Uint8ArrayUtils.fromHex(note.nullifier),
              nullifierTransactionHash: null,
            })
            .onConflict((oc) =>
              oc
                .columns([
                  "accountId",
                  "transactionHash",
                  "noteTransactionIndex",
                ])
                .doUpdateSet({
                  position: note.position,
                  nullifier: Uint8ArrayUtils.fromHex(note.nullifier),
                  nullifierTransactionHash: null,
                }),
            )
            .executeTakeFirst();
        }

        for (const nullifier of txn.foundNullifiers) {
          await db
            .updateTable("notes")
            .set("nullifierTransactionHash", txn.hash)
            .where("nullifier", "=", nullifier)
            .executeTakeFirstOrThrow();
        }

        for (const note of txn.spenderNotes) {
          await db
            .insertInto("notes")
            .values({
              accountId: values.accountId,
              network: values.network,
              transactionHash: txn.hash,
              note: new Uint8Array(note.note.serialize()),
              noteTransactionIndex: note.noteTransactionIndex,
              assetId: new Uint8Array(note.note.assetId()),
              owner: Uint8ArrayUtils.fromHex(note.note.owner()),
              sender: Uint8ArrayUtils.fromHex(note.note.sender()),
              value: note.note.value().toString(),
              valueNum: Number(note.note.value()),
              memo: new Uint8Array(note.note.memo()),
              position: null,
              nullifier: null,
              nullifierTransactionHash: null,
            })
            .onConflict((oc) => oc.doNothing())
            .executeTakeFirstOrThrow();
        }

        for (const delta of balanceDeltas) {
          // This could be done with the SQLite decimal extension, but it's not available
          // in the Expo SQLite driver.
          const existingBalance = BigInt(
            (
              await db
                .selectFrom("balances")
                .select("value")
                .where((eb) =>
                  eb.and([
                    eb("accountId", "=", values.accountId),
                    eb("network", "=", values.network),
                    eb("assetId", "=", Uint8ArrayUtils.fromHex(delta[0])),
                  ]),
                )
                .executeTakeFirst()
            )?.value ?? "0",
          );

          await db
            .insertInto("balances")
            .values({
              accountId: values.accountId,
              network: values.network,
              assetId: Uint8ArrayUtils.fromHex(delta[0]),
              value: (existingBalance + delta[1]).toString(),
            })
            .onConflict((oc) =>
              oc.columns(["accountId", "network", "assetId"]).doUpdateSet({
                value: (existingBalance + delta[1]).toString(),
              }),
            )
            .executeTakeFirstOrThrow();

          await db
            .insertInto("transactionBalanceDeltas")
            .values({
              accountId: values.accountId,
              assetId: Uint8ArrayUtils.fromHex(delta[0]),
              transactionHash: txn.hash,
              value: delta[1].toString(),
            })
            .onConflict((oc) =>
              oc
                .columns(["accountId", "transactionHash", "assetId"])
                .doNothing(),
            )
            .executeTakeFirstOrThrow();
        }
      }
    });
  }

  async removeBlock(values: {
    accountId: number;
    network: Network;
    blockHash: Uint8Array;
    blockSequence: number;
    prevBlockHash: Uint8Array;
  }) {
    return await this.db.transaction().execute(async (db) => {
      await db
        .insertInto("accountNetworkHeads")
        .values({
          accountId: values.accountId,
          network: values.network,
          hash: values.prevBlockHash,
          sequence: values.blockSequence - 1,
        })
        .onConflict((oc) =>
          oc.columns(["accountId", "network"]).doUpdateSet({
            hash: values.prevBlockHash,
            sequence: values.blockSequence - 1,
          }),
        )
        .executeTakeFirstOrThrow();

      // Update balances
      const balanceDeltas = await db
        .selectFrom("transactionBalanceDeltas")
        .selectAll()
        .innerJoin(
          "transactions",
          "transactions.hash",
          "transactionBalanceDeltas.transactionHash",
        )
        .where("transactions.blockHash", "==", values.blockHash)
        .execute();

      if (balanceDeltas.length > 0) {
        console.log("balances");

        const balances = await db
          .selectFrom("balances")
          .selectAll()
          .where((eb) =>
            eb.and([
              eb("accountId", "=", values.accountId),
              eb("network", "=", values.network),
            ]),
          )
          .execute();

        const balanceMap = new Map(
          balances.map((b) => [
            Uint8ArrayUtils.toHex(b.assetId),
            BigInt(b.value),
          ]),
        );

        for (const delta of balanceDeltas) {
          const assetId = Uint8ArrayUtils.toHex(delta.assetId);
          const existingBalance = balanceMap.get(assetId);
          if (existingBalance === undefined) {
            console.error(`Existing balance not found for asset ${assetId}`);
          }
          balanceMap.set(
            assetId,
            (existingBalance ?? 0n) - BigInt(delta.value),
          );
        }

        for (const [assetId, value] of balanceMap) {
          await db
            .insertInto("balances")
            .values({
              accountId: values.accountId,
              network: values.network,
              assetId: Uint8ArrayUtils.fromHex(assetId),
              value: value.toString(),
            })
            .onConflict((oc) =>
              oc.columns(["accountId", "network", "assetId"]).doUpdateSet({
                value: value.toString(),
              }),
            )
            .executeTakeFirstOrThrow();
        }

        await db
          .deleteFrom("transactionBalanceDeltas")
          .where((eb) =>
            eb(
              "transactionBalanceDeltas.transactionHash",
              "in",
              eb
                .selectFrom("transactions")
                .where("blockHash", "==", values.blockHash)
                .select("transactions.hash"),
            ),
          )
          .execute();
      }

      // If nullifiers were found in this transaction, mark them as unfound
      await db
        .updateTable("notes")
        .where((eb) =>
          eb(
            "nullifierTransactionHash",
            "in",
            eb
              .selectFrom("transactions")
              .where("blockHash", "==", values.blockHash)
              .select("transactions.hash"),
          ),
        )
        .set("nullifierTransactionHash", null)
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("notes")
        .where((eb) =>
          eb(
            "notes.transactionHash",
            "in",
            eb
              .selectFrom("transactions")
              .where("blockHash", "==", values.blockHash)
              .select("transactions.hash"),
          ),
        )
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("accountTransactions")
        .where((eb) =>
          eb(
            "accountTransactions.transactionHash",
            "in",
            eb
              .selectFrom("transactions")
              .select("transactions.hash")
              .where("blockHash", "==", values.blockHash),
          ),
        )
        .executeTakeFirstOrThrow();

      await db
        .deleteFrom("transactions")
        .where("blockHash", "==", values.blockHash)
        .executeTakeFirstOrThrow();
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
      .limit(1)
      .executeTakeFirst();
  }

  async getTransactionNotes(hash: Uint8Array) {
    return await this.db
      .selectFrom("notes")
      .selectAll()
      .where("transactionHash", "=", hash)
      .execute();
  }

  async getTransactions(accountId: number, network: Network) {
    return await this.db
      .selectFrom("accountTransactions")
      .innerJoin(
        "transactions",
        "transactions.hash",
        "accountTransactions.transactionHash",
      )
      .selectAll()
      .where((eb) =>
        eb.and([eb("accountId", "=", accountId), eb("network", "=", network)]),
      )
      .orderBy("transactions.timestamp", "asc")
      .execute();
  }

  async getUnspentNotes(
    latestBlock: number,
    confirmations: number,
    accountId: number,
    assetId: Uint8Array,
    network: Network,
  ) {
    return await this.db.transaction().execute(async (db) => {
      const accountHead = await db
        .selectFrom("accountNetworkHeads")
        .select("accountNetworkHeads.sequence")
        .where((eb) =>
          eb.and([
            eb("accountId", "=", accountId),
            eb("network", "=", network),
          ]),
        )
        .executeTakeFirst();
      const accountSequence = accountHead?.sequence ?? 0;

      return await db
        .selectFrom("notes")
        .leftJoin(
          "transactions as noteTransaction",
          "noteTransaction.hash",
          "notes.transactionHash",
        )
        .leftJoin(
          "transactions as nullifierTransaction",
          "nullifierTransaction.hash",
          "notes.nullifierTransactionHash",
        )
        .selectAll("notes")
        .where((eb) =>
          eb.and([
            eb("notes.accountId", "=", accountId),
            eb("notes.assetId", "=", assetId),
            eb("notes.network", "=", network),
            // Assumes we don't set note position on sent notes
            eb("notes.position", "is not", null),
            eb(
              "noteTransaction.blockSequence",
              "<=",
              latestBlock - confirmations,
            ),
            eb.or([
              // if the nullifier is unused, the note is unspent
              eb("notes.nullifierTransactionHash", "is", null),
              // if the nullifier is in a transaction, the transaction is not on a block,
              // and the transaction is expired, the note is unspent
              eb.and([
                eb("nullifierTransaction.blockSequence", "is", null),
                // 0-expiration means the transaction never expires
                eb("nullifierTransaction.expirationSequence", ">", 0),
                // TODO: We could use confirmations here, but undecided on whether it's worth
                // delaying expiration for the chance that the transaction might be reorged onto
                // a different block.
                eb(
                  "nullifierTransaction.expirationSequence",
                  "<=",
                  accountSequence,
                ),
              ]),
            ]),
          ]),
        )
        // Spends the largest notes first
        .orderBy("notes.valueNum", "desc")
        .execute();
    });
  }

  async hasNullifier(
    nullifier: Uint8Array,
    network: Network,
  ): Promise<boolean> {
    const result = await this.db
      .selectNoFrom(({ exists, selectFrom }) =>
        exists(
          selectFrom("notes")
            .where((eb) =>
              eb.and([
                eb("nullifier", "=", nullifier),
                eb("network", "=", network),
              ]),
            )
            .select(sql`1`.as("_")),
        ).as("exists"),
      )
      .executeTakeFirstOrThrow();
    return Boolean(result.exists);
  }

  async getBalances(accountId: number, network: Network) {
    return await this.db
      .selectFrom("balances")
      .selectAll()
      .where((eb) =>
        eb.and([eb("accountId", "=", accountId), eb("network", "=", network)]),
      )
      .execute();
  }

  async getTransactionBalanceDeltasBySequence(
    accountId: number,
    network: Network,
    startSequence: number,
    endSequence: number,
  ) {
    return await this.db
      .selectFrom("transactionBalanceDeltas")
      .innerJoin(
        "transactions",
        "transactions.hash",
        "transactionBalanceDeltas.transactionHash",
      )
      .selectAll("transactionBalanceDeltas")
      .where((eb) =>
        eb.and([
          eb("transactions.blockSequence", ">=", startSequence),
          eb("transactions.blockSequence", "<=", endSequence),
          eb("transactions.network", "=", network),
          eb("transactionBalanceDeltas.accountId", "=", accountId),
        ]),
      )
      .execute();
  }

  async getPendingTransactionBalanceDeltas(
    accountId: number,
    network: Network,
  ) {
    return await this.db.transaction().execute(async (db) => {
      const accountHead = await db
        .selectFrom("accountNetworkHeads")
        .select("accountNetworkHeads.sequence")
        .where((eb) =>
          eb.and([
            eb("accountId", "=", accountId),
            eb("network", "=", network),
          ]),
        )
        .executeTakeFirst();
      const accountSequence = accountHead?.sequence ?? 0;

      return await db
        .selectFrom("transactionBalanceDeltas")
        .innerJoin(
          "transactions",
          "transactions.hash",
          "transactionBalanceDeltas.transactionHash",
        )
        .selectAll("transactionBalanceDeltas")
        .where((eb) =>
          eb.and([
            eb("transactions.network", "=", network),
            eb("transactionBalanceDeltas.accountId", "=", accountId),
            eb("transactions.blockSequence", "is", null),
            eb.or([
              eb("transactions.expirationSequence", "==", 0),
              // TODO: We could treat transactions as unexpired until after accountSequence + confirmations,
              // since the transaction could reorg onto a different block.
              eb("transactions.expirationSequence", ">", accountSequence),
            ]),
          ]),
        )
        .execute();
    });
  }

  async getUnconfirmedAndPendingSpentNotes(
    accountId: number,
    network: Network,
    start: number,
  ) {
    return await this.db.transaction().execute(async (db) => {
      const accountHead = await db
        .selectFrom("accountNetworkHeads")
        .select("accountNetworkHeads.sequence")
        .where((eb) =>
          eb.and([
            eb("accountId", "=", accountId),
            eb("network", "=", network),
          ]),
        )
        .executeTakeFirst();
      const accountSequence = accountHead?.sequence ?? 0;

      return await db
        .selectFrom("notes")
        .innerJoin(
          "transactions",
          "transactions.hash",
          "notes.nullifierTransactionHash",
        )
        .selectAll("notes")
        .where((eb) =>
          eb.and([
            eb("notes.accountId", "=", accountId),
            eb("notes.network", "=", network),
            eb.or([
              eb("transactions.blockSequence", ">=", start),
              eb.and([
                eb("transactions.blockSequence", "is", null),
                eb.or([
                  eb("transactions.expirationSequence", "==", 0),
                  // TODO: We could treat transactions as unexpired until after accountSequence + confirmations,
                  // since the transaction could reorg onto a different block.
                  eb("transactions.expirationSequence", ">", accountSequence),
                ]),
              ]),
            ]),
          ]),
        )
        .execute();
    });
  }

  async getAsset(network: Network, assetId: Uint8Array) {
    return await this.db
      .selectFrom("assets")
      .selectAll()
      .where((eb) =>
        eb.and([eb("network", "=", network), eb("assetId", "=", assetId)]),
      )
      .executeTakeFirst();
  }

  async setAsset(network: Network, serializedAsset: SerializedAsset) {
    return await this.db
      .insertInto("assets")
      .values({
        assetId: Uint8ArrayUtils.fromHex(serializedAsset.identifier),
        createdTransactionHash: serializedAsset.created_transaction_hash,
        createdTransactionTimestamp:
          serializedAsset.created_transaction_timestamp,
        creator: serializedAsset.creator,
        metadata: serializedAsset.metadata,
        owner: serializedAsset.owner,
        name: serializedAsset.name,
        network: network,
        updatedAt: new Date(),
        verified: !!serializedAsset.verified_metadata,
        decimals: serializedAsset.verified_metadata?.decimals ?? null,
        logoURI: serializedAsset.verified_metadata?.logo_uri ?? null,
        supply: serializedAsset.supply ?? null,
        symbol: serializedAsset.verified_metadata?.symbol ?? null,
        website: serializedAsset.verified_metadata?.website ?? null,
      })
      .onConflict((oc) =>
        oc.columns(["assetId", "network"]).doUpdateSet({
          assetId: Uint8ArrayUtils.fromHex(serializedAsset.identifier),
          createdTransactionHash: serializedAsset.created_transaction_hash,
          createdTransactionTimestamp:
            serializedAsset.created_transaction_timestamp,
          creator: serializedAsset.creator,
          metadata: serializedAsset.metadata,
          owner: serializedAsset.owner,
          name: serializedAsset.name,
          network: network,
          updatedAt: new Date(),
          verified: !!serializedAsset.verified_metadata,
          decimals: serializedAsset.verified_metadata?.decimals ?? null,
          logoURI: serializedAsset.verified_metadata?.logo_uri ?? null,
          supply: serializedAsset.supply ?? null,
          symbol: serializedAsset.verified_metadata?.symbol ?? null,
          website: serializedAsset.verified_metadata?.website ?? null,
        }),
      )
      .executeTakeFirst();
  }
}
