import { walletDemoHandlers } from "./wallet/demoHandlers";
import { walletHandlers } from "./wallet/oreowalletHandlers";
import { appDemoHandlers } from "./app/demoHandlers";
import { appHandlers } from "./app/oreowalletHandlers";
import { createFacadeContext } from "data-facade";
import { chainHandlers } from "./chain/oreowalletHandlers";
import { chainDemoHandlers } from "./chain/demoHandlers";
import { contactsDemoHandlers } from "./contacts/demoHandlers";

const DEMO_API = Boolean(process.env.EXPO_PUBLIC_DEMO_API ?? true);

export const facadeContext = createFacadeContext(
  DEMO_API
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
