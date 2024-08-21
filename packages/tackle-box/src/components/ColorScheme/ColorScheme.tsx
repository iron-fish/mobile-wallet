import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type Scheme = "_light" | "_dark";

const ColorSchemeContext = createContext<{
  colorScheme: Scheme;
  toggleColorScheme?: () => void;
}>({
  colorScheme: "_light",
  toggleColorScheme: () => {},
});

type Props = {
  children: ReactNode;
  scheme?: Scheme;
};

export function ColorScheme({ children, scheme }: Props) {
  const [globalScheme, setGlobalScheme] = useState<Scheme>("_light");
  const toggleColorScheme = useCallback(() => {
    setGlobalScheme((prev) => (prev === "_light" ? "_dark" : "_light"));
  }, []);

  return (
    <ColorSchemeContext.Provider
      value={{ colorScheme: scheme ?? globalScheme, toggleColorScheme }}
    >
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}
