import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useFacade } from "@/data/facades";
import { CurrencyUtils } from "@ironfish/sdk";
import {
  Layout,
  Text,
  Button,
  Card,
  Icon,
  IconProps,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";

const PlusIcon = (props: IconProps) => <Icon {...props} name="plus-outline" />;

export default function AccountSelect() {
  const router = useRouter();
  const facade = useFacade();

  const getAccountsResult = facade.getAccounts.useQuery(undefined, {
    refetchInterval: 1000,
  });

  const setActiveAccount = facade.setActiveAccount.useMutation();

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
          {getAccountsResult.data?.map((account) => (
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
            accessoryLeft={PlusIcon}
            onPress={() => router.push("/add-account/")}
          >
            Add Account
          </Button>
        </Layout>
        <StatusBar style="auto" />
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
});
