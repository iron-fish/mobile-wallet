import { createContext, useContext, useEffect, ReactNode } from "react";
import { useRouter, useSegments } from "expo-router";
import { useFacade } from "@/data/facades";
import { ActivityIndicator, SafeAreaView, Text } from "react-native";
import { StyleSheet } from "react-native";
import { Account } from "@/data/facades/wallet/types";

interface AccountContextType {
  isLoading: boolean;
  account: Account | null;
  accountName: string;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const facade = useFacade();
  const router = useRouter();
  const segments = useSegments();

  const getAccountResult = facade.getAccount.useQuery(
    {},
    {
      refetchInterval: 5000,
    },
  );

  useEffect(() => {
    if (getAccountResult.isLoading) return;

    const isOnboarding = segments[0] === "onboarding";

    const hasAccount = getAccountResult.data !== null;
    console.log(
      "AccountProvider - segments:",
      segments,
      "hasAccount:",
      hasAccount,
      "isOnboarding:",
      isOnboarding,
    );

    if (!hasAccount && !isOnboarding) {
      // Redirect to the onboarding flow if there's no account
      router.replace("/onboarding");
    } else if (hasAccount && isOnboarding) {
      // Redirect to the main app if we already have an account
      router.replace("/(drawer)/account");
      console.log("Redirecting to /(drawer)/account");
    }
  }, [getAccountResult.data, getAccountResult.isLoading, segments, router]);

  if (getAccountResult.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading account...</Text>
      </SafeAreaView>
    );
  }

  const value: AccountContextType = {
    isLoading: getAccountResult.isLoading,
    account: getAccountResult.data as Account | null,
    accountName: getAccountResult.data?.name ?? "",
  };

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
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
