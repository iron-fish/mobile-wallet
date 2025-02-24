import { StatusBar } from "expo-status-bar";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { Network } from "@/data/constants";
import { wallet } from "@/data/wallet/wallet";
import * as Uint8ArrayUtils from "@/utils/uint8Array";
import { useState } from "react";

export default function MenuDebugPending() {
  const [transactions, setTransactions] = useState<
    {
      hash: Uint8Array;
    }[]
  >();

  const refreshTransactions = async () => {
    if (wallet.state.type !== "STARTED") {
      return;
    }
    const account = await wallet.getActiveAccountWithHeadAndBalances(
      Network.TESTNET,
    );
    if (!account) {
      return;
    }
    const txns = await wallet.state.db.getPendingTransactions(
      account.id,
      Network.TESTNET,
    );
    console.log(`txns: ${txns.length}`);

    setTransactions(txns);
  };

  return (
    <View style={styles.container}>
      <View>
        <Button
          onPress={async () => {
            await refreshTransactions();
          }}
          title="Get Pending Transactions"
        />
      </View>
      <ScrollView>
        {transactions?.map((txn, i) => (
          <View key={i} style={{ marginVertical: 5 }}>
            <Text>{Uint8ArrayUtils.toHex(txn.hash)}</Text>
            <Button
              onPress={async () => {
                if (wallet.state.type !== "STARTED") {
                  return;
                }
                await wallet.state.db.removePendingTransaction(txn.hash);
                await refreshTransactions();
              }}
              title="Delete"
            />
          </View>
        ))}
      </ScrollView>
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
