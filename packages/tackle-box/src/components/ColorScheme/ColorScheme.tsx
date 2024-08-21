import React, { createContext, ReactNode, useContext } from "react";

type Scheme = "_light" | "_dark";

const ColorSchemeContext = createContext<Scheme>("_light");

type Props = {
  children: ReactNode;
  value?: Scheme;
};

export function ColorScheme({ children, value }: Props) {
  return (
    <ColorSchemeContext.Provider value={value ?? "_light"}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}
