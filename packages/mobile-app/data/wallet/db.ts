import { AccountImport } from "@ironfish/sdk/build/src/wallet/walletdb/accountValue";
import { Kysely, Generated, Migrator, sql } from "kysely";
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
  // Note index in the merkle tree could also be derived from the note size on the
  // transaction, but stored here for convenience.
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
}

interface NullifiersTable {
  noteId: number;
  nullifier: Uint8Array;
  transactionHash: Uint8Array | null;
  accountId: number;
  network: Network;
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
  nullifiers: NullifiersTable;
  balances: BalancesTable;
  assets: AssetsTable;
}

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
                .addColumn("position", SQLiteType.Integer)
                .addColumn("assetId", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("sender", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("owner", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("value", SQLiteType.String, (col) => col.notNull())
                .addColumn("valueNum", SQLiteType.Number, (col) =>
                  col.notNull(),
                )
                .addColumn("memo", SQLiteType.Blob, (col) => col.notNull())
                .execute();
              console.log("created notes");
            },
          },
          ["006_createNullifiers"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating nullifiers");
              await db.schema
                .createTable("nullifiers")
                .addColumn("noteId", SQLiteType.Number, (col) =>
                  col.primaryKey().references("notes.id"),
                )
                .addColumn("nullifier", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("transactionHash", SQLiteType.Blob, (col) =>
                  col.references("transactions.hash"),
                )
                .addColumn("accountId", SQLiteType.Integer, (col) =>
                  col.notNull().references("accounts.id"),
                )
                .addColumn("network", SQLiteType.String, (col) =>
                  col.notNull().check(sql`network IN ("mainnet", "testnet")`),
                )
                .execute();

              await db.schema
                .createIndex("idx_nullifiers_nullifier")
                .on("nullifiers")
                .column("nullifier")
                .execute();

              console.log("created nullifiers");
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

    const result = await this.db.transaction().execute(async (db) => {
      const result = await db
        .insertInto("accounts")
        .values(accountValues)
        .executeTakeFirstOrThrow();

      if (result.insertId === undefined) {
        throw new Error("Failed to insert account");
      }

      // Assumes you always want to change active accounts when adding a new one
      await db
        .updateTable("activeAccount")
        .set("accountId", Number(result.insertId))
        .execute();

      return result;
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

    return {
      id: Number(result.insertId),
      ...accountValues,
    };
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
      .set("accounts.name", newName)
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
        .deleteFrom("nullifiers")
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

  async saveBlock(values: {
    accountId: number;
    network: Network;
    blockSequence: number;
    blockHash: Uint8Array;
    transactions: {
      hash: Uint8Array;
      ownerNotes: { position: number | null; note: Note; nullifier: string }[];
      foundNullifiers: Uint8Array[];
      spenderNotes: { note: Note }[];
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
            .innerJoin("nullifiers", "nullifiers.noteId", "notes.id")
            .selectAll()
            .where((eb) =>
              eb.and([
                eb("nullifiers.nullifier", "in", txn.foundNullifiers),
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

        // One transaction could apply to multiple accounts
        await db
          .insertInto("transactions")
          .values({
            hash: txn.hash,
            network: values.network,
            blockSequence: values.blockSequence,
            blockHash: values.blockHash,
            timestamp: txn.timestamp,
          })
          .onConflict((oc) => oc.column("hash").doNothing())
          .executeTakeFirstOrThrow();

        await db
          .insertInto("accountTransactions")
          .values({
            accountId: values.accountId,
            transactionHash: txn.hash,
            type: transactionType,
          })
          .executeTakeFirstOrThrow();

        for (const note of txn.ownerNotes) {
          const result = await db
            .insertInto("notes")
            .values({
              accountId: values.accountId,
              network: values.network,
              transactionHash: txn.hash,
              note: new Uint8Array(note.note.serialize()),
              assetId: new Uint8Array(note.note.assetId()),
              owner: Uint8ArrayUtils.fromHex(note.note.owner()),
              sender: Uint8ArrayUtils.fromHex(note.note.sender()),
              value: note.note.value().toString(),
              valueNum: Number(note.note.value()),
              memo: new Uint8Array(note.note.memo()),
              position: note.position,
            })
            .executeTakeFirst();

          if (!result.insertId) {
            throw new Error();
          }

          await db
            .insertInto("nullifiers")
            .values({
              noteId: Number(result.insertId),
              nullifier: Uint8ArrayUtils.fromHex(note.nullifier),
              accountId: values.accountId,
              network: values.network,
              transactionHash: null,
            })
            .executeTakeFirst();
        }

        for (const nullifier of txn.foundNullifiers) {
          await db
            .updateTable("nullifiers")
            .set("transactionHash", txn.hash)
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
              assetId: new Uint8Array(note.note.assetId()),
              owner: Uint8ArrayUtils.fromHex(note.note.owner()),
              sender: Uint8ArrayUtils.fromHex(note.note.sender()),
              value: note.note.value().toString(),
              valueNum: Number(note.note.value()),
              memo: new Uint8Array(note.note.memo()),
              position: null,
            })
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

      // If nullifiers were created in this transaction, remove them
      await db
        .deleteFrom("nullifiers")
        .where((eb) =>
          eb(
            "nullifiers.noteId",
            "in",
            eb
              .selectFrom("notes")
              .innerJoin(
                "transactions",
                "transactions.hash",
                "notes.transactionHash",
              )
              .where("transactions.blockHash", "==", values.blockHash)
              .select("notes.id"),
          ),
        )
        .executeTakeFirstOrThrow();

      // If nullifiers were found in this transaction, mark them as unfound
      await db
        .updateTable("nullifiers")
        .where((eb) =>
          eb(
            "nullifiers.transactionHash",
            "in",
            eb
              .selectFrom("transactions")
              .where("blockHash", "==", values.blockHash)
              .select("transactions.hash"),
          ),
        )
        .set("transactionHash", null)
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
    accountId: number,
    assetId: Uint8Array,
    network: Network,
  ) {
    // TODO: Consider the confirmation range
    return await this.db
      .selectFrom("notes")
      .leftJoin("nullifiers", "nullifiers.noteId", "notes.id")
      .selectAll()
      .where((eb) =>
        eb.and([
          eb("notes.accountId", "=", accountId),
          eb("notes.assetId", "=", assetId),
          eb("notes.network", "=", network),
          // Assumes we don't set note position on sent notes
          eb("notes.position", "is not", null),
          eb("nullifiers.transactionHash", "is", null),
        ]),
      )
      // Spends the largest notes first
      .orderBy("notes.valueNum", "desc")
      .execute();
  }

  async saveNullifier(
    nullifier: Uint8Array,
    network: Network,
  ): Promise<boolean> {
    const result = await this.db
      .selectNoFrom(({ exists, selectFrom }) =>
        exists(
          selectFrom("nullifiers")
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

  async hasNullifier(
    nullifier: Uint8Array,
    network: Network,
  ): Promise<boolean> {
    const result = await this.db
      .selectNoFrom(({ exists, selectFrom }) =>
        exists(
          selectFrom("nullifiers")
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
      .selectAll()
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
