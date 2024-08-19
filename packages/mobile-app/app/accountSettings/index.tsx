import { StatusBar } from "expo-status-bar";
import { StyleSheet, Switch, Text, View } from "react-native";
import { LinkButton } from "../../components/LinkButton";
import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useFacade } from "../../data/facades";

export default function AccountSettings() {
  const { accountName } = useLocalSearchParams<{ accountName: string }>();
  if (accountName === undefined) {
    throw new Error("accountName is required");
  }

  const facade = useFacade();

  const [hideBalances, setHideBalances] = useState(false);

  const getAccountResult = facade.getAccount.useQuery(
    { name: accountName },
    {
      refetchInterval: 1000,
    },
  );

  return (
    <View style={styles.container}>
      <LinkButton
        title={`${getAccountResult.data?.name} (${getAccountResult.data?.balances.iron.confirmed} $IRON)`}
        href="/accountSelect"
      />
      <LinkButton title="Account Name" href="/accountSettings/accountName" />
      <LinkButton title="Address" href="/address" />
      <LinkButton
        title="Export Account"
        href="/accountSettings/exportAccount/"
      />
      <View
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        <Text>Hide Balances</Text>
        <Switch value={hideBalances} onValueChange={setHideBalances} />
      </View>
      <LinkButton
        title="Remove Account"
        href={`/accountSettings/removeAccount/?accountName=${getAccountResult.data?.name}`}
      />
      <LinkButton title="Add Account" href="/addAccount/" />
      <StatusBar style="auto" />
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
