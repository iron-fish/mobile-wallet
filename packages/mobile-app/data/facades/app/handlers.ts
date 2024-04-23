import { f } from "data-facade";
import { AppMethods } from "./types";

import { wallet } from "../../wallet";

export const appHandlers = f.facade<AppMethods>({
  loadDatabases: f.handler.mutation(async () => {
    if (wallet.state.type !== 'STARTED') {
      await wallet.start();
    }
    return 'loaded'
  }),
});
