import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { Text } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useColorScheme } from "react-native";
import { FacadeProvider, useFacade } from "../data/facades";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

function DatabaseLoader({
  loading,
  children,
}: {
  loading: React.ReactNode;
  children?: React.ReactNode;
}) {
  const facade = useFacade();
  const [status, setStatus] = useState<string>("loading");
  const { mutateAsync: loadDatabases } = facade.loadDatabases.useMutation();

  useEffect(() => {
    const fn = async () => {
      const result = await loadDatabases(undefined);
      setStatus(result);
    };
    fn();
  }, [loadDatabases]);

  if (status === "loading") {
    return loading;
  } else if (status === "loaded") {
    return children;
  } else {
    throw new Error(`Unknown status ${status}`);
  }
}

export default function Layout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <FacadeProvider>
          <DatabaseLoader loading={<Text>Loading databases...</Text>}>
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </DatabaseLoader>
        </FacadeProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
