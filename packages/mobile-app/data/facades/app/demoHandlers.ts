import { f } from "data-facade";
import { AppMethods } from "./types";

export const appHandlers = f.facade<AppMethods>({
  loadDatabases: f.handler.mutation(async () => {
    console.log("loadDatabases");
    return 'loaded'
  }),
});
