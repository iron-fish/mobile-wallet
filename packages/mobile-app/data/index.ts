import { accountsFacade } from "./accounts";

import { FacadeDefinition, Query, createFacadeContext } from "data-facade";

type FacadeMethods = FacadeDefinition<{
  getAccounts: Query<(count: number) => string[]>;
  getAllAccounts: Query<() => string[]>;
  getAccountsWithZod: Query<(args: { limit: number }) => string[]>;
}>;

const facadeContext = createFacadeContext(
  accountsFacade satisfies FacadeMethods,
);

export const FacadeProvider = facadeContext.Provider;
export const useFacade = facadeContext.useFacade;
