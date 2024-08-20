import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinkButton } from "../components/LinkButton";
import { useFacade } from "../data/facades";

export default function AccountSelect() {
  const router = useRouter();
  const facade = useFacade();

  const getAccountsResult = facade.getAccounts.useQuery(undefined, {
    refetchInterval: 1000,
  });

  return (
    <View style={styles.container}>
      <Button title="Close" onPress={() => router.dismissAll()} />
      <StatusBar style="auto" />
      {getAccountsResult.data?.map((account) => (
        <View key={account.name}>
          <Text>{account.name}</Text>
          <Text>{`${account.balances.iron.confirmed} $IRON`}</Text>
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
