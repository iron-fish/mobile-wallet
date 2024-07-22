import { AccountImport } from "@ironfish/sdk/build/src/wallet/walletdb/accountValue";
import { Kysely, Generated, Migrator, sql } from "kysely";
import { ExpoDialect, ExpoMigrationProvider, SQLiteType } from "kysely-expo";
import * as SecureStore from "expo-secure-store";
import { AccountFormat, encodeAccount, Note } from "@ironfish/sdk";
import { Network } from "../constants";
import * as Uint8ArrayUtils from "../../utils/uint8Array";

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

interface NotesTable {
  id: Generated<number>;
  accountId: number;
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
  // Depending how we want to search memos, we could store this multiple times. E.g. do we want to
  // allow searching non-utf8-encoded memos? Like searching binary data as hex
  memo: Uint8Array;
}

interface Database {
  accounts: AccountsTable;
  accountNetworkHeads: AccountNetworkHeadsTable;
  transactions: TransactionsTable;
  accountTransactions: AccountTransactionsTable;
  notes: NotesTable;
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
                .addColumn("note", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("position", SQLiteType.Integer)
                .addColumn("assetId", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("sender", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("owner", SQLiteType.Blob, (col) => col.notNull())
                .addColumn("value", SQLiteType.String, (col) => col.notNull())
                .addColumn("memo", SQLiteType.Blob, (col) => col.notNull())
                .execute();
              console.log("created notes");
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
      db.deleteFrom("accountNetworkHeads")
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
    notes: { position: number | null; note: Note }[];
    timestamp: Date;
  }) {
    await this.db.transaction().execute(async (db) => {
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

      for (const note of values.notes) {
        await db
          .insertInto("notes")
          .values({
            accountId: values.accountId,
            transactionHash: values.hash,
            note: new Uint8Array(note.note.serialize()),
            assetId: new Uint8Array(note.note.assetId()),
            owner: Uint8ArrayUtils.fromHex(note.note.owner()),
            sender: Uint8ArrayUtils.fromHex(note.note.sender()),
            value: note.note.value().toString(),
            memo: new Uint8Array(note.note.memo()),
            position: note.position,
          })
          .executeTakeFirst();
      }
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

  async getTransactions(network: Network) {
    return await this.db
      .selectFrom("transactions")
      .selectAll()
      .where("network", "=", network)
      .orderBy("timestamp", "asc")
      .execute();
  }
}
