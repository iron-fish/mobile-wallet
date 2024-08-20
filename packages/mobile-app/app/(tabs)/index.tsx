import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFacade } from "../../data/facades";
import { useEffect, useState } from "react";
import { LinkButton } from "../../components/LinkButton";

export default function Balances() {
  const facade = useFacade();

  const [account, setAccount] = useState<string>("");

  const getTransactionsResult = facade.getTransactions.useQuery(
    { accountName: account },
    {
      refetchInterval: 1000,
    },
  );

  const getAccountResult = facade.getAccount.useQuery(
    {},
    {
      refetchInterval: 1000,
    },
  );

  const getWalletStatusResult = facade.getWalletStatus.useQuery(undefined, {
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (getAccountResult.data) {
      setAccount(getAccountResult.data.name);
    }
  }, [getAccountResult.data]);

  if (getAccountResult.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (getAccountResult.data === null) {
    return (
      <View style={styles.container}>
        <LinkButton title="Onboarding" href="/onboarding/" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ display: "flex", flexDirection: "row" }}>
        <LinkButton href="/menu/" title="Menu" />
        <LinkButton
          href="/account-select/"
          title={getAccountResult.data?.name ?? "Account 1"}
        />
        <LinkButton
          href={`/account-settings/?accountName=${getAccountResult.data?.name}`}
          title="Account Settings"
        />
      </View>
      <Text>You're currently on Testnet</Text>
      {getAccountResult.data && (
        <>
          <Text>{`${getAccountResult.data.balances.iron.confirmed}`}</Text>
          <Text>{`$IRON`}</Text>
        </>
      )}
      {getWalletStatusResult.data &&
        getWalletStatusResult.data.status === "SCANNING" && (
          // TODO: Only show this if the wallet is behind a certain number of blocks to avoid flickering
          <>
            <Text>{`Blocks Scanned: ${getAccountResult.data?.head?.sequence ?? "--"} / ${getWalletStatusResult.data.latestKnownBlock}`}</Text>
            <Text>Your balances may currently be inaccurate.</Text>
            <Text>Learn More</Text>
          </>
        )}
      <View style={{ display: "flex", flexDirection: "row" }}>
        <LinkButton href="/send/" title="Send" />
        <LinkButton href="/address/" title="Receive" />
      </View>
      <Text style={{ fontWeight: 700, fontSize: 24 }}>Transactions</Text>
      <ScrollView>
        {getTransactionsResult.data?.map((transaction) => (
          <View key={transaction.hash} style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14 }}>{transaction.hash}</Text>
            <Text>Block Sequence: {transaction.blockSequence}</Text>
            <Text>Timestamp: {transaction.timestamp.toString()}</Text>
            <Text>
              {`Notes (${transaction.notes.length}): ${transaction.notes.map((n) => n.value).join(", ")}`}
            </Text>
          </View>
        ))}
      </ScrollView>
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
