import { AccountImport } from "@ironfish/sdk/build/src/wallet/walletdb/accountValue";
import { Kysely, Generated, Migrator } from "kysely";
import { ExpoDialect, ExpoMigrationProvider, SQLiteType} from "kysely-expo";
import * as SecureStore from 'expo-secure-store';
import { AccountFormat, encodeAccount } from "@ironfish/sdk";

interface AccountsTable {
    id: Generated<number>;
    name: string;
    publicAddress: string;
    viewOnlyAccount: string;
    viewOnly: boolean;
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
                    console.log("running createAccounts migration");
                    await db.schema
                      .createTable("accounts")
                      .addColumn("id", "integer", (col) =>
                        col.primaryKey().autoIncrement()
                      )
                      .addColumn("name", SQLiteType.String, (col) => col.notNull().unique())
                      .addColumn("publicAddress", SQLiteType.String, (col) => col.notNull().unique())
                      .addColumn("viewOnlyAccount", SQLiteType.String, (col) => col.notNull())
                      .addColumn("viewOnly", SQLiteType.Boolean, (col) => col.notNull())
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
      const viewOnlyAccount = encodeAccount({...account, spendingKey: null}, AccountFormat.Base64Json);

      const accountValues = {
        name: account.name,
        publicAddress: account.publicAddress,
        viewOnlyAccount: viewOnlyAccount,
        viewOnly: account.spendingKey !== null,
      }

      const result = await this.db.insertInto("accounts").values(accountValues).executeTakeFirst();

      if (account.spendingKey) {
        await SecureStore.setItemAsync(account.publicAddress, account.spendingKey, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          requireAuthentication: false,
        });
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
      return await this.db.selectFrom("accounts").selectAll().where('accounts.name', '==', name).executeTakeFirst();
    }

    async getSpendingKey(publicAddress: string) {
      return await SecureStore.getItemAsync(publicAddress, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        requireAuthentication: false,
      })
    }

    async renameAccount(name: string, newName: string) {
      return await this.db.updateTable("accounts").where('accounts.name', '==', name).set('accounts.name', newName).executeTakeFirst();
    }

    async removeAccount(name: string) {
      const account = await this.getAccount(name)
      if (!account) {
        throw new Error(`No account found with name ${name}`)
      }

      const result = await this.db.deleteFrom("accounts").where('accounts.name', '==', name).executeTakeFirst();

      if (result.numDeletedRows > 0) {
        try {
          await SecureStore.deleteItemAsync(account.publicAddress, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            requireAuthentication: false,
          })
        } catch {
          console.log(`Failed to delete spending key for account ${name}`)
        }
      }

      return result;
    }
}
