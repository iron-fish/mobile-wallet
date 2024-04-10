import { accountsHandlers } from "./accounts/handlers";
import { AccountsMethods } from "./accounts/types";

import { createFacadeContext } from "data-facade";

const facadeContext = createFacadeContext(
  accountsHandlers satisfies AccountsMethods,
);

export const FacadeProvider = facadeContext.Provider;
export const useFacade = facadeContext.useFacade;
