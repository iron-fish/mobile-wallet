import { createFacadeContext } from "data-facade";
import { accountsHandlers } from "./accounts/handlers";

const facadeContext = createFacadeContext(accountsHandlers);

export const FacadeProvider = facadeContext.Provider;
export const useFacade = facadeContext.useFacade;
