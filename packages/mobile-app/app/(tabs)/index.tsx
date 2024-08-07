import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFacade } from "../../data/facades";
import { useEffect, useState } from "react";

export default function Balances() {
  const facade = useFacade();

  const [account, setAccount] = useState<string>("");

  const getTransactionsResult = facade.getTransactions.useQuery(
    { accountName: account },
    {
      refetchInterval: 1000,
    },
  );

  const getAccountsResult = facade.getAccounts.useQuery();

  useEffect(() => {
    if (getAccountsResult.data?.[0]) {
      setAccount(getAccountsResult.data[0].name);
    }
  }, [getAccountsResult.data]);

  return (
    <View style={styles.container}>
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
