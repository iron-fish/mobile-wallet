import { StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useFacade } from "@/data/facades";
import { CurrencyUtils } from "@ironfish/sdk";
import { Layout, Text, Button, Card, Spinner } from "@ui-kitten/components";
import React from "react";

export default function AccountSelect() {
  const router = useRouter();
  const facade = useFacade();

  const getAccountsResult = facade.getAccounts.useQuery(undefined, {
    refetchInterval: 1000,
  });

  const setActiveAccount = facade.setActiveAccount.useMutation();

  const renderLoadingSkeleton = () => (
    <Layout style={[styles.content, styles.loadingContainer]}>
      <Spinner size="large" />
    </Layout>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Select Account",
          headerBackTitle: "Back",
        }}
      />
      <Layout style={styles.container}>
        <Layout style={styles.content}>
          {getAccountsResult.isLoading
            ? renderLoadingSkeleton()
            : getAccountsResult.data?.map((account) => (
                <Card
                  key={account.name}
                  style={styles.accountCard}
                  onPress={async () => {
                    const result = await setActiveAccount.mutateAsync({
                      name: account.name,
                    });
                    console.log(`setActiveAccount: ${result}`);
                    router.dismissAll();
                  }}
                >
                  <Layout style={styles.accountInfo}>
                    <Layout>
                      <Text category="s1">{account.name}</Text>
                      <Text category="p2" appearance="hint">
                        {`${CurrencyUtils.render(account.balances.iron.confirmed)} $IRON`}
                      </Text>
                    </Layout>
                    {account.active && (
                      <Text status="success" category="c1">
                        Active
                      </Text>
                    )}
                  </Layout>
                </Card>
              ))}
          <Button
            style={styles.addButton}
            onPress={() =>
              router.push("/(drawer)/account/account-settings/add-account")
            }
          >
            Add Account
          </Button>
        </Layout>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  accountCard: {
    marginVertical: 4,
  },
  accountInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: {
    marginTop: 8,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
