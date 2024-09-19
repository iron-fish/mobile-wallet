import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useFacade } from "../../../data/facades";
import { Network } from "../../../data/constants";
import { wallet } from "../../../data/wallet/wallet";
import { reverseScan } from "../../../data/debug/reverseScan";
import { LinkButton } from "../../../components/LinkButton";

export default function MenuDebug() {
  const facade = useFacade();

  const walletStatus = facade.getWalletStatus.useQuery(undefined, {
    refetchInterval: 1000,
  });

  const pauseSyncing = facade.pauseSyncing.useMutation();
  const resumeSyncing = facade.resumeSyncing.useMutation();

  return (
    <View style={styles.container}>
      <LinkButton title="Pending Transactions" href="/menu/debug/pending/" />
      <LinkButton title="Unspent Notes" href="/menu/debug/unspent/" />
      <View>
        {walletStatus.data && (
          <>
            <Text>{`Scan status: ${walletStatus.data.status}`}</Text>
            <Text>{`Latest known block: ${walletStatus.data.latestKnownBlock}`}</Text>
          </>
        )}
        <Text>{}</Text>
        <Button
          onPress={() => {
            resumeSyncing.mutate(undefined);
          }}
          title="Resume Syncing"
        />
        <Button
          onPress={() => {
            pauseSyncing.mutateAsync(undefined);
          }}
          title="Pause Syncing"
        />
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
