import { StyleSheet, View, Linking } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import React from "react";
import {
  Layout,
  Text,
  Button,
  Divider,
  Icon,
  IconProps,
  Spinner,
} from "@ui-kitten/components";
import { useFacade } from "../../../../data/facades";
import { CurrencyUtils } from "@ironfish/sdk";
import { useQueries } from "@tanstack/react-query";
import { setStringAsync } from "expo-clipboard";

const ExternalLinkIcon = (props: IconProps) => (
  <Icon {...props} name="external-link-outline" />
);

const formatTimestamp = (date: Date) => {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CopyableText = ({ text, style }: { text: string; style?: any }) => {
  const copyToClipboard = async () => {
    await setStringAsync(text);
  };

  return (
    <View style={styles.copyContainer}>
      <Text style={[style, styles.copyText]} selectable>
        {text}
      </Text>
      <Button
        appearance="ghost"
        accessoryLeft={(props) => <Icon {...props} name="copy-outline" />}
        onPress={copyToClipboard}
        style={styles.copyButton}
      />
    </View>
  );
};

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
        <Stack.Screen
          options={{
            headerTitle: "",
            headerTransparent: true,
          }}
        />

        {/* Header Section Skeleton */}
        <View style={styles.headerSection}>
          <Spinner size="large" style={styles.spinner} />
          <Text category="s1" appearance="hint">
            Loading transaction details...
          </Text>
        </View>

        {/* Details Section Skeleton */}
        <View style={styles.detailsSection}>
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <View style={styles.section}>
                <View style={styles.skeletonLabel} />
                <View style={styles.skeletonValue} />
              </View>
              <Divider style={styles.divider} />
            </React.Fragment>
          ))}
        </View>
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

  // Create a map of assetId to asset data
  const assetMap = new Map();
  assetQueries.forEach((query) => {
    if (query.data) {
      assetMap.set(query.data.id, query.data);
    }
  });

  // TEMPORARY: Currently assuming the first balance delta represents the main transaction amount
  const mainDelta = transaction.assetBalanceDeltas[0];
  const asset = assetMap.get(mainDelta.assetId);
  const mainAssetName =
    asset?.verification.status === "verified"
      ? asset.verification.symbol
      : (asset?.name ?? mainDelta.assetId);
  const mainAmount = BigInt(mainDelta.delta);
  const isReceived = mainAmount > 0n;

  if (transactionQuery.error) {
    return (
      <Layout style={[styles.container, styles.centerContent]}>
        <Text category="h6" style={styles.errorText}>
          Failed to load transaction
        </Text>
        <Button onPress={() => transactionQuery.refetch()}>Try Again</Button>
      </Layout>
    );
  }

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
        {transaction.notes[0]?.sender === transaction.notes[0]?.owner ? (
          <>
            <Text category="h3" style={styles.transactionType}>
              Self Transaction
            </Text>
            <Text category="s1" appearance="hint" style={styles.timestamp}>
              Balances may not be accurately shown
            </Text>
            <Text category="s1" appearance="hint" style={styles.timestamp}>
              {formatTimestamp(new Date(transaction.timestamp))}
            </Text>
          </>
        ) : (
          <>
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
              {formatTimestamp(new Date(transaction.timestamp))}
            </Text>
          </>
        )}
      </View>

      {/* Transaction Details */}
      <View style={styles.detailsSection}>
        <View style={styles.section}>
          <Text category="s1" style={styles.label}>
            {isReceived ? "From" : "To"}
          </Text>
          <CopyableText
            text={
              isReceived
                ? transaction.notes[0]?.sender
                : transaction.notes[0]?.owner
            }
            style={styles.value}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text category="s1" style={styles.label}>
            Transaction Hash
          </Text>
          <CopyableText text={hash} style={styles.value} />
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
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    padding: 24,
    paddingTop: 100,
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
  copyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyText: {
    flex: 1,
  },
  copyButton: {
    padding: 0,
    marginLeft: 8,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginBottom: 16,
    textAlign: "center",
  },
  spinner: {
    marginBottom: 16,
  },
  skeletonLabel: {
    height: 20,
    width: 100,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonValue: {
    height: 24,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    width: "100%",
  },
});
