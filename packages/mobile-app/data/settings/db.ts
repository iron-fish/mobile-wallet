import { Kysely, Migrator, sql } from "kysely";
import { ExpoDialect, ExpoMigrationProvider, SQLiteType } from "kysely-expo";
import * as FileSystem from "expo-file-system";
import { z } from "zod";
import { Network } from "../constants";

interface SettingsTable {
  key: SettingsKey;
  value: string | undefined;
}

interface Database {
  settings: SettingsTable;
}

export enum SettingsKey {
  PIN = "pin",
  Network = "network",
}

const defaults: AppSettingsType = {
  [SettingsKey.PIN]: undefined,
  [SettingsKey.Network]: Network.MAINNET,
};

export type AppSettingsType = z.infer<typeof schema>;

const schema = z.object({
  [SettingsKey.PIN]: z.string().optional(),
  [SettingsKey.Network]: z.enum([Network.MAINNET, Network.TESTNET]),
});

const partialSchema = schema.partial();

export class SettingsDb {
  db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  static async init() {
    console.log(`db: ${FileSystem.documentDirectory + "SQLite/settings.db"}`);

    const db = new Kysely<Database>({
      dialect: new ExpoDialect({
        database: "settings.db",
        autoAffinityConversion: true,
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
          ["001_createSettings"]: {
            up: async (db: Kysely<Database>) => {
              console.log("creating settings");
              await db.schema
                .createTable("settings")
                .addColumn("key", SQLiteType.String, (col) => col.primaryKey())
                .addColumn("value", SQLiteType.String)
                .execute();
              console.log("created settings");
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

    return new SettingsDb(db);
  }

  async get<T extends SettingsKey>(
    key: T,
  ): Promise<AppSettingsType[T] | undefined> {
    const result = await this.db
      .selectFrom("settings")
      .select("value")
      .where("key", "=", key)
      .executeTakeFirst();

    if (!result || result.value === undefined) {
      return undefined;
    }

    const parsed = partialSchema.parse({ [key]: result.value });

    // TODO: Type this properly so we don't need to cast
    return parsed[key] as AppSettingsType[T] | undefined;
  }

  async getOrDefault<T extends SettingsKey>(
    key: T,
  ): Promise<AppSettingsType[T]> {
    const value = await this.get(key);

    return value ?? defaults[key];
  }

  async getAll(): Promise<Partial<AppSettingsType>> {
    const result = await this.db.selectFrom("settings").selectAll().execute();

    const settings: Partial<Record<SettingsKey, string | undefined>> = {};

    for (const row of result) {
      settings[row.key] = row.value;
    }

    return partialSchema.parse(settings);
  }

  async getAllOrDefault(): Promise<AppSettingsType> {
    const result = await this.getAll();

    return {
      ...defaults,
      ...result,
    };
  }

  async set(key: SettingsKey, value: string | undefined): Promise<void> {
    const parsed = partialSchema.parse({ [key]: value });

    await this.db
      .insertInto("settings")
      .values({ key, value: parsed[key] })
      .onConflict((oc) =>
        oc.columns(["key"]).doUpdateSet({ value: parsed[key] }),
      )
      .executeTakeFirst();
  }
}
