import { walletDemoHandlers } from "./wallet/demoHandlers";
import { walletHandlers } from "./wallet/handlers";
import { appDemoHandlers } from "./app/demoHandlers";
import { appHandlers } from "./app/handlers";
import { createFacadeContext } from "data-facade";
import { chainHandlers } from "./chain/handlers";
import { chainDemoHandlers } from "./chain/demoHandlers";
import { contactsDemoHandlers } from "./contacts/demoHandlers";

const DEMO = true;

export const facadeContext = createFacadeContext(
  DEMO
    ? {
        ...appDemoHandlers,
        ...chainDemoHandlers,
        ...contactsDemoHandlers,
        ...walletDemoHandlers,
      }
    : {
        ...appHandlers,
        ...chainHandlers,
        ...contactsDemoHandlers,
        ...walletHandlers,
      },
);

export const FacadeProvider = facadeContext.Provider;
export const useFacade = facadeContext.useFacade;
