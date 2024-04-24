import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { FacadeProvider } from "../data";
import { useColorScheme } from "react-native";
import { UIKitProvider } from "@ironfish/ui";

const queryClient = new QueryClient();

export default function Layout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <UIKitProvider colorScheme={scheme || "light"}>
        <QueryClientProvider client={queryClient}>
          <FacadeProvider>
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </FacadeProvider>
        </QueryClientProvider>
      </UIKitProvider>
    </ThemeProvider>
  );
}
