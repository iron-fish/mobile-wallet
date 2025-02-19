import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Linking } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Layout,
  Text,
  Button,
  Divider,
  Icon,
  IconProps,
  Spinner,
} from "@ui-kitten/components";
import { useFacade } from "../../data/facades";
import { CurrencyUtils } from "@ironfish/sdk";
import { useQueries } from "@tanstack/react-query";
import { IRON_ASSET_ID_HEX } from "../../data/constants";

const ExternalLinkIcon = (props: IconProps) => (
  <Icon {...props} name="external-link-outline" />
);

export default function TransactionDetails() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const facade = useFacade();

  const transactionQuery = facade.getTransaction.useQuery(
    {
      accountName: facade.getAccount.useQuery({}).data?.name ?? "",
      hash,
    },
    {
      enabled: !!hash,
    },
  );

  // Get assets for all balance deltas
  const assetQueries = useQueries({
    queries:
      transactionQuery.data?.assetBalanceDeltas.map((delta) => ({
        queryKey: facade.getAsset.buildQueryKey({ assetId: delta.assetId }),
        queryFn: () => facade.getAsset.resolver({ assetId: delta.assetId }),
        enabled: !!delta.assetId,
      })) ?? [],
  });

  const openInExplorer = () => {
    Linking.openURL(`https://explorer.ironfish.network/transaction/${hash}`);
  };

  if (transactionQuery.isLoading || assetQueries.some((q) => q.isLoading)) {
    return (
      <Layout style={styles.container}>
        <Spinner size="large" />
      </Layout>
    );
  }

  if (!transactionQuery.data) {
    return (
      <Layout style={styles.container}>
        <Text>Transaction not found</Text>
      </Layout>
    );
  }

  const transaction = transactionQuery.data;
  console.log(`########################`);
  console.log("transaction", transaction);
  console.log(`########################`);

  // Create a map of assetId to asset data
  const assetMap = new Map();
  assetQueries.forEach((query) => {
    if (query.data) {
      assetMap.set(query.data.id, query.data);
    }
  });

  // Calculate total amount for each asset
  const assetAmounts = transaction.assetBalanceDeltas.reduce(
    (acc, delta) => {
      const asset = assetMap.get(delta.assetId);
      console.log("asset", asset);
      const assetName =
        asset?.verification.status === "verified"
          ? asset.verification.symbol
          : (asset?.name ?? delta.assetId);

      return {
        ...acc,
        [assetName]: (acc[assetName] || 0n) + BigInt(delta.delta),
      };
    },
    {} as Record<string, bigint>,
  );

  console.log(`$$$$$$`);
  console.log("assetAmounts", assetAmounts);
  console.log(`$$$$$$`);

  // Get the main asset and transaction type
  const mainAssetAmount = Object.entries(assetAmounts)[0] || [];
  const [mainAssetName, mainAmount] = mainAssetAmount;
  const isReceived = mainAmount > 0n;

  return (
    <Layout style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
        }}
      />

      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text category="h3" style={styles.transactionType}>
          {isReceived ? "Received" : "Sent"}
        </Text>
        <Text category="h2" style={styles.mainAmount}>
          {CurrencyUtils.render(
            (mainAmount < 0n ? -mainAmount : mainAmount).toString(),
            false,
          )}{" "}
          {mainAssetName}
        </Text>
        <Text category="s1" appearance="hint" style={styles.timestamp}>
          {new Date(transaction.timestamp).toLocaleString()}
        </Text>
      </View>

      {/* Transaction Details */}
      <View style={styles.detailsSection}>
        <View style={styles.section}>
          <Text category="s1" style={styles.label}>
            {isReceived ? "From" : "To"}
          </Text>
          <Text style={styles.value} selectable>
            {isReceived
              ? transaction.notes[0]?.sender
              : transaction.notes[0]?.owner}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text category="s1" style={styles.label}>
            Transaction Hash
          </Text>
          <Text style={styles.value} selectable>
            {hash}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text category="s1" style={styles.label}>
            Status
          </Text>
          <Text style={styles.value}>
            {transaction.status.charAt(0).toUpperCase() +
              transaction.status.slice(1).toLowerCase()}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {transaction.fee && (
          <>
            <View style={styles.section}>
              <Text category="s1" style={styles.label}>
                Fee
              </Text>
              <Text style={styles.value}>
                {CurrencyUtils.render(transaction.fee)} $IRON
              </Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {transaction.notes.some((note) => note.memo) && (
          <>
            <View style={styles.section}>
              <Text category="s1" style={styles.label}>
                Memo
              </Text>
              <Text style={styles.value}>
                {transaction.notes.find((note) => note.memo)?.memo}
              </Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        <Button
          style={styles.explorerButton}
          accessoryRight={ExternalLinkIcon}
          onPress={openInExplorer}
        >
          View on Explorer
        </Button>
      </View>

      <StatusBar style="auto" />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    padding: 32,
    paddingTop: 80,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  transactionType: {
    marginBottom: 8,
  },
  mainAmount: {
    marginBottom: 8,
  },
  timestamp: {
    marginBottom: 16,
  },
  detailsSection: {
    padding: 32,
    flex: 1,
  },
  section: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  divider: {
    marginVertical: 8,
  },
  explorerButton: {
    marginTop: 24,
  },
});
