import { accountsHandlers as accountsDemoHandlers } from "./accounts/demoHandlers";
import { accountsHandlers } from "./accounts/handlers";
import { appHandlers as appDemoHandlers } from "./app/demoHandlers";
import { appHandlers } from "./app/handlers";
import { createFacadeContext } from "data-facade";

const DEMO = false;

export const facadeContext = createFacadeContext(DEMO ? {
    ...accountsDemoHandlers,
    ...appDemoHandlers,
} : {
    ...accountsHandlers,
    ...appHandlers,
});

export const FacadeProvider = facadeContext.Provider;
export const useFacade = facadeContext.useFacade;
