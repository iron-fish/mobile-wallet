import { Stack } from "expo-router";
import { Text } from 'react-native';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { FacadeProvider, useFacade } from "../data/facades";
import React, { useEffect } from "react";

const queryClient = new QueryClient();

function DatabaseLoader({ loading, children }: { loading: React.ReactNode, children?: React.ReactNode }) {
  const facade = useFacade();
  const [status, setStatus] = React.useState<string>("loading");
  const loadDatabases = facade.loadDatabases.useMutation();

  useEffect(() => {
    const fn = async () => {
      const result = await loadDatabases.mutateAsync(undefined);
      setStatus(result)
    }
    fn()
  }, [])

  if (status === "loading") {
    return loading;
  } else if (status === 'loaded') {
    return children;
  } else {
    throw new Error(`Unknown status ${status}`);
  }
}

export default function Layout() {
  return (
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
  );
}
