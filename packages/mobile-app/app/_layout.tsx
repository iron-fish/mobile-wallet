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

import { useColorScheme } from "react-native";
import { FacadeProvider, useFacade } from "../data/facades";
import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { BottomSheetProvider, Text } from "@ironfish/tackle-box";

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
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading databases...</Text>
      </SafeAreaView>
    );
  } else if (status === "loaded") {
    return children;
  } else {
    throw new Error(`Unknown status ${status}`);
  }
}

export default function Layout() {
  const scheme = useColorScheme();
  const [loaded] = useFonts({
    Favorit: require("../assets/fonts/ABCFavorit-Regular.otf"),
    FavoritExtended: require("../assets/fonts/ABCFavoritExtended-Regular.otf"),
  });

  if (!loaded) return null;

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <FacadeProvider>
          <DatabaseLoader>
            <BottomSheetProvider>
              <Stack>
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="onboarding"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack>
            </BottomSheetProvider>
          </DatabaseLoader>
        </FacadeProvider>
      </QueryClientProvider>
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
