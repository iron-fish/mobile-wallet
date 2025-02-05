import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, View } from "react-native";
import { Network } from "../../../data/constants";
import { wallet } from "../../../data/wallet/wallet";
import { reverseScan } from "../../../data/debug/reverseScan";
import { LinkButton } from "../../../components/LinkButton";

export default function MenuDebug() {
  return (
    <View style={styles.container}>
      <LinkButton title="Pending Transactions" href="/menu/debug/pending/" />
      <LinkButton title="Unspent Notes" href="/menu/debug/unspent/" />
      <LinkButton title="Oreowallet" href="/menu/debug/oreowallet/" />
      <View>
        <Button
          onPress={async () => {
            await reverseScan(wallet, Network.TESTNET);
          }}
          title="Remove Blocks"
        />
      </View>
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
