import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinkButton } from "../../components/LinkButton";
import { useFacade } from "../../data/facades";
import { CurrencyUtils } from "@ironfish/sdk";

export default function AccountSelect() {
  const router = useRouter();
  const facade = useFacade();

  const getAccountsResult = facade.getAccounts.useQuery(undefined, {
    refetchInterval: 1000,
  });

  const setActiveAccount = facade.setActiveAccount.useMutation();

  return (
    <View style={styles.container}>
      <Button title="Close" onPress={() => router.dismissAll()} />
      <StatusBar style="auto" />
      {getAccountsResult.data?.map((account) => (
        <View key={account.name}>
          <Button
            onPress={async () => {
              const result = await setActiveAccount.mutateAsync({
                name: account.name,
              });
              console.log(`setActiveAccount: ${result}`);
              router.dismissAll();
            }}
            title={account.name}
          />
          {account.active && <Text>Active</Text>}
          <Text>
            {`${CurrencyUtils.render(account.balances.iron.confirmed)} $IRON`}
          </Text>
        </View>
      ))}
      <LinkButton title="Add Account" href="/add-account/" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
