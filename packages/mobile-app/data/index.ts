import { accountsFacade } from "./accounts";

import { FacadeDefinition, Query, createFacadeContext } from "data-facade";

type Facade = FacadeDefinition<{
  getAccounts: Query<(count: number) => string[]>;
  getAllAccounts: Query<() => string[]>;
  getAccountsWithZod: Query<(args: { limit: number }) => string[]>;
}>;

const facadeContext = createFacadeContext(accountsFacade);

export const FacadeProvider = facadeContext.Provider;
export const useFacade = facadeContext.useFacade;
