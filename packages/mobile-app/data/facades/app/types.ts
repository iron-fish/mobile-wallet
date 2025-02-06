import { Query, Mutation } from "data-facade";
import { AppSettingsType } from "../../settings/db";

export type AppSettings = AppSettingsType;

export type AppHandlers = {
  getAppSettings: Query<() => AppSettings>;
  getExplorerUrl: Query<
    (args?: { type: "transaction" | "block"; hash: string }) => string | null
  >;
  loadDatabases: Mutation<() => string>;
  setAppSetting: Mutation<
    (args: { key: keyof AppSettings; value: string | undefined }) => void
  >;
};
