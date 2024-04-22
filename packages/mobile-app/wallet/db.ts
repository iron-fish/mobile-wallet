import { Kysely, Generated, Migrator } from "kysely";
import { ExpoDialect, ExpoMigrationProvider, SQLiteType } from "kysely-expo";

interface AccountsTable {
    id: Generated<number>;
    name: string;
    viewOnlyAccount: string;
}
  
interface Database {
    accounts: AccountsTable;
}

export class WalletDb {
    db: Kysely<Database>;

    constructor(db: Kysely<Database>) {
        this.db = db 
    }

    static async init() {
        const db = new Kysely<Database>({
            dialect: new ExpoDialect({
                database: "wallet.db",
            }),
        })

        const migrator = new Migrator({
            db: db,
            provider: new ExpoMigrationProvider({
              migrations: {
                "createAccounts": {
                  up: async (db: Kysely<Database>) => {
                    console.log("running createAccounts");
                    await db.schema
                      .createTable("accounts")
                      .addColumn("id", "integer", (col) =>
                        col.primaryKey().autoIncrement()
                      )
                      .addColumn("name", SQLiteType.String, (col) => col.notNull())
                      .addColumn("viewOnlyAccount", SQLiteType.String, (col) => col.notNull())
                      .execute();
                  },
                },
              },
            }),
          });

        await migrator.migrateToLatest();

        return new WalletDb(db);
    }

    async createAccount(name: string, viewOnlyAccount: string) {
      const result = await this.db.insertInto("accounts").values({
        name: name,
        viewOnlyAccount: viewOnlyAccount,
      }).executeTakeFirst();
      console.log(result, "result");
      return {
        name: name,
        viewOnlyAccount: viewOnlyAccount,
      };
    }

    async getAccounts() {
      return await this.db.selectFrom("accounts").selectAll('accounts').execute();
    }
}
