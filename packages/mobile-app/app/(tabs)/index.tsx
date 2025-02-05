import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFacade } from "../../data/facades";
import { useState } from "react";
import { LinkButton } from "../../components/LinkButton";
import { useQueries } from "@tanstack/react-query";
import { Asset } from "../../data/facades/chain/types";
import { useAccount } from "../../providers/AccountProvider";

interface Balance {
  assetId: string;
  confirmed: string;
  available: string;
}

export default function Balances() {
  const facade = useFacade();
  const { account, accountName, isLoading } = useAccount();

  const [visibleView, setVisibleView] = useState<"transactions" | "assets">(
    "transactions",
  );

  const getTransactionsResult = facade.getTransactions.useQuery(
    { accountName },
    {
      refetchInterval: 5000,
    },
  );

  const getCustomAssets = useQueries({
    queries:
      account?.balances.custom.map((b: Balance) => {
        return {
          refetchInterval: 1000,
          queryFn: () => facade.getAsset.resolver({ assetId: b.assetId }),
          queryKey: facade.getAsset.buildQueryKey({ assetId: b.assetId }),
        };
      }) ?? [],
  });
  const assetMap = new Map<string, Asset>();
  for (const asset of getCustomAssets) {
    if (asset.data) {
      assetMap.set(asset.data.id, asset.data);
    }
  }

  const getIronAsset = facade.getAsset.useQuery(
    {
      assetId: account?.balances.iron.assetId ?? "",
    },
    {
      refetchInterval: 1000,
      enabled: !!account,
    },
  );

  const getWalletStatusResult = facade.getWalletStatus.useQuery(
    { accountName },
    {
      refetchInterval: 5000,
      enabled: accountName !== "",
    },
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ display: "flex", flexDirection: "row" }}>
        <LinkButton href="/menu/" title="Menu" />
        <LinkButton
          href="/account-select/"
          title={accountName || "Account 1"}
        />
        <LinkButton
          href={`/account-settings/?accountName=${accountName}`}
          title="Account Settings"
        />
      </View>
      <Text>You're currently on Mainnet</Text>
      {account && (
        <>
          <Text>
            {account.balances.iron.confirmed === account.balances.iron.available
              ? `${account.balances.iron.confirmed}`
              : `${account.balances.iron.confirmed} (${account.balances.iron.available} available to spend)`}
          </Text>
          {getIronAsset.data && (
            <Text>{`${getIronAsset.data.verification.status === "verified" ? `${getIronAsset.data.verification.symbol} (Verified)` : `${getIronAsset.data.name} (Unverified)`}`}</Text>
          )}
        </>
      )}
      {getWalletStatusResult.data &&
        getWalletStatusResult.data.status === "SCANNING" && (
          // TODO: Only show this if the wallet is behind a certain number of blocks to avoid flickering
          <View style={{ backgroundColor: "#eee" }}>
            <Text>{`Blocks Scanned: ${account?.head?.sequence ?? "--"} / ${getWalletStatusResult.data.latestKnownBlock}`}</Text>
            <Text>Your balances may currently be inaccurate.</Text>
            <Text>Learn More</Text>
          </View>
        )}
      <View style={{ display: "flex", flexDirection: "row" }}>
        <LinkButton href="/send/" title="Send" />
        <LinkButton href="/address/" title="Receive" />
      </View>
      <View style={{ display: "flex", flexDirection: "row", gap: 16 }}>
        <Pressable onPress={() => setVisibleView("transactions")}>
          <Text style={{ fontWeight: 700, fontSize: 24 }}>Transactions</Text>
        </Pressable>
        <Pressable onPress={() => setVisibleView("assets")}>
          <Text style={{ fontWeight: 700, fontSize: 24 }}>Assets</Text>
        </Pressable>
      </View>
      <ScrollView>
        {visibleView === "transactions" &&
          getTransactionsResult.data?.map((transaction) => (
            <View key={transaction.hash} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 14 }}>{transaction.hash}</Text>
              <Text>Block Sequence: {transaction.block?.sequence ?? ""}</Text>
              <Text>Timestamp: {transaction.timestamp.toString()}</Text>
              <Text>Status: {transaction.status.toString()}</Text>
              <Text>Type: {transaction.type.toString()}</Text>
            </View>
          ))}
        {visibleView === "assets" && account && (
          <View>
            <View>
              <Text>
                {getIronAsset.data
                  ? getIronAsset.data.verification.status === "verified"
                    ? `${getIronAsset.data.verification.symbol} (Verified)`
                    : `${getIronAsset.data.name} (Unverified)`
                  : account.balances.iron.assetId}
              </Text>
              <Text>{account.balances.iron.confirmed}</Text>
            </View>
            {account.balances.custom.map((balance) => {
              const asset = assetMap.get(balance.assetId);

              return (
                <View key={balance.assetId}>
                  <Text>
                    {asset
                      ? asset.verification.status === "verified"
                        ? `${asset.verification.symbol} (Verified)`
                        : `${asset.name} (Unverified)`
                      : balance.assetId}
                  </Text>
                  <Text>{balance.confirmed}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
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
