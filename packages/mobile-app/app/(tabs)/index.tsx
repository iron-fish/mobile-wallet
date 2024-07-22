import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Assert } from "@ironfish/sdk";
import { useFacade } from "../../data/facades";

export default function Balances() {
  const facade = useFacade();

  const getTransactionsResult = facade.getTransactions.useQuery(
    { accountName: "", hash: "" },
    {
      refetchInterval: 1000,
    },
  );

  Assert.isEqual(50, 50);

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
