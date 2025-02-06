import { f } from "data-facade";
import { AppHandlers, AppSettings } from "./types";

import { oreoWallet } from "../../wallet/oreowalletWallet";
import { SettingsKey } from "@/data/settings/db";
import { SettingsManager } from "@/data/settings/manager";
import { Network } from "@/data/constants";

export const appHandlers = f.facade<AppHandlers>({
  loadDatabases: f.handler.mutation(async () => {
    if (oreoWallet.state.type !== "STARTED") {
      await oreoWallet.start();
    }
    await SettingsManager.start();
    return "loaded";
  }),
  getAppSettings: f.handler.query(async (): Promise<AppSettings> => {
    return await SettingsManager.db().getAllOrDefault();
  }),
  getExplorerUrl: f.handler.query(
    async (args?: {
      type: "transaction" | "block";
      hash: string;
    }): Promise<string | null> => {
      const network = await SettingsManager.db().getOrDefault(
        SettingsKey.Network,
      );

      let url;
      if (network === Network.MAINNET) {
        url = "https://explorer.ironfish.network/";
      } else if (network === Network.TESTNET) {
        url = "https://testnet.explorer.ironfish.network/";
      } else {
        return null;
      }

      if (args?.type === "block") {
        return `${url}blocks/${args.hash}`;
      } else if (args?.type === "transaction") {
        return `${url}transaction/${args.hash}`;
      }
      return url;
    },
  ),
  setAppSetting: f.handler.mutation(
    async (args: { key: keyof AppSettings; value: string | undefined }) => {
      await SettingsManager.db().set(args.key, args.value);
    },
  ),
});
