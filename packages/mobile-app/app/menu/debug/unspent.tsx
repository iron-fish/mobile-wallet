import { StatusBar } from "expo-status-bar";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { IRON_ASSET_ID_HEX, Network } from "../../../data/constants";
import { wallet } from "../../../data/wallet/wallet";
import { Blockchain } from "../../../data/blockchain";
import * as Uint8ArrayUtils from "../../../utils/uint8Array";
import { useState } from "react";

export default function MenuDebugUnspentNotes() {
  const [notes, setNotes] = useState<
    {
      assetId: Uint8Array;
      value: string;
    }[]
  >();

  const [balances, setBalances] = useState<
    {
      assetId: Uint8Array;
      confirmed: string;
      unconfirmed: string;
      pending: string;
      available: string;
    }[]
  >();

  const sum =
    notes?.reduce((prev, cur) => {
      console.log(BigInt(cur.value).toString());
      return prev + BigInt(cur.value);
    }, BigInt(0)) ?? BigInt(0);

  return (
    <View style={styles.container}>
      <View>
        <Button
          onPress={async () => {
            if (wallet.state.type !== "STARTED") {
              return;
            }
            const account = await wallet.getActiveAccountWithHeadAndBalances(
              Network.TESTNET,
            );
            if (!account) {
              return;
            }
            setBalances(account.balances);
            const seq = await Blockchain.getLatestBlock(Network.TESTNET);
            const notes = await wallet.state.db.getUnspentNotes(
              seq.sequence,
              2,
              account?.id,
              Uint8ArrayUtils.fromHex(IRON_ASSET_ID_HEX),
              Network.TESTNET,
            );
            setNotes(notes);
          }}
          title="Get Notes"
        />
      </View>
      <View>
        {balances?.map((balance, i) => (
          <View key={i}>
            <Text>{Uint8ArrayUtils.toHex(balance.assetId)}</Text>
            <Text>Confirmed: {balance.confirmed}</Text>
            <Text>Unconfirmed: {balance.unconfirmed}</Text>
            <Text>Pending: {balance.pending}</Text>
            <Text>Available: {balance.available}</Text>
          </View>
        ))}
        {notes && (
          <Text>
            Total: {sum.toString()} ({notes?.length ?? 0} notes)
          </Text>
        )}
      </View>
      <ScrollView>
        {notes?.map((note, i) => (
          <View key={i} style={{ marginVertical: 5 }}>
            <Text>{note.value}</Text>
            <Text>{Uint8ArrayUtils.toHex(note.assetId)}</Text>
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
