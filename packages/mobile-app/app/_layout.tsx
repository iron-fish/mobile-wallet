import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { useColorScheme, Text } from "react-native";
import { FacadeProvider, useFacade } from "@/data/facades";
import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { AccountProvider } from "@/providers/AccountProvider";
import * as eva from "@eva-design/eva";
import { ApplicationProvider, IconRegistry } from "@ui-kitten/components";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import { PinLockScreen } from "@/components/PinLockScreen/PinLockScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  }),
});

function DatabaseLoader({ children }: { children?: React.ReactNode }) {
  const facade = useFacade();
  const [status, setStatus] = useState<"loading" | "loaded">("loading");
  const { mutateAsync: loadDatabases } = facade.loadDatabases.useMutation();

  useEffect(() => {
    const fn = async () => {
      const result = await loadDatabases(undefined);

      if (result !== "loaded") {
        throw new Error("Failed to load databases");
      }

      setStatus("loaded");
    };
    fn();
  }, [loadDatabases]);

  if (status === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading databases...</Text>
      </SafeAreaView>
    );
  }

  return children;
}

export default function Layout() {
  const scheme = useColorScheme();
  const [loaded] = useFonts({
    Favorit: require("../assets/fonts/ABCFavorit-Regular.otf"),
    FavoritExtended: require("../assets/fonts/ABCFavoritExtended-Regular.otf"),
  });

  if (!loaded) return null;

  return (
    <ThemeProvider value={DefaultTheme}>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={eva.light}>
        <QueryClientProvider client={queryClient}>
          <FacadeProvider>
            <DatabaseLoader>
              <PinLockScreen>
                <AccountProvider>
                  <Stack>
                    <Stack.Screen
                      name="onboarding"
                      options={{
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen
                      name="(drawer)"
                      options={{
                        headerShown: false,
                      }}
                    />
                  </Stack>
                </AccountProvider>
              </PinLockScreen>
            </DatabaseLoader>
          </FacadeProvider>
        </QueryClientProvider>
      </ApplicationProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
