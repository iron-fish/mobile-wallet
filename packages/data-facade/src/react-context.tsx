import { FacadeFn } from "./types";
import React, { type ReactNode, createContext, useContext } from "react";

export function createFacadeContext<TObject extends ReturnType<FacadeFn>>(
  facadesObject: TObject,
) {
  const FacadeContext = createContext(facadesObject);

  function FacadeProvider({ children }: { children: ReactNode }) {
    return (
      <FacadeContext.Provider value={facadesObject}>
        {children}
      </FacadeContext.Provider>
    );
  }

  function useFacade() {
    return useContext(FacadeContext);
  }

  return {
    Provider: FacadeProvider,
    useFacade,
  };
}
