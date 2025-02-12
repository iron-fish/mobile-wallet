import { f } from "data-facade";
import { AppHandlers, AppSettings } from "./types";

import { wallet } from "../../wallet/wallet";
import { Network } from "@/data/constants";

export const appHandlers = f.facade<AppHandlers>({
  loadDatabases: f.handler.mutation(async () => {
    if (wallet.state.type !== "STARTED") {
      await wallet.start();
    }
    return "loaded";
  }),
  getAppSettings: f.handler.query(async (): Promise<AppSettings> => {
    // TODO: Implement app settings
    return {
      pin: undefined,
      network: Network.TESTNET,
      hideBalances: "false",
    };
  }),
  getExplorerUrl: f.handler.query(
    async (args?: {
      type: "transaction" | "block";
      hash: string;
    }): Promise<string | null> => {
      // TODO: Handle network switching in getExplorerUrl
      const network: string = "testnet";

      let url;
      if (network === "mainnet") {
        url = "https://explorer.ironfish.network/";
      } else if (network === "testnet") {
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
      // TODO: Implement app settings
      return;
    },
  ),
});
