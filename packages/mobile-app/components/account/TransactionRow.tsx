import { useFacade } from "@/data/facades";
import { Transaction, TransactionType } from "@/data/facades/wallet/types";
import { Text, Card, Layout } from "@ui-kitten/components";
import { useQueries } from "@tanstack/react-query";
import { StyleSheet } from "react-native";
import { Asset } from "@/data/facades/chain/types";
import { IRON_ASSET_ID_HEX } from "@/data/constants";
import { TransactionStatus } from "@ironfish/sdk";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ReceiveArrow } from "@/svgs/ReceiveArrow";
import { SendArrow } from "@/svgs/SendArrow";
import * as CurrencyUtils from "@/utils/currency";
import { useHideBalances } from "@/hooks/useHideBalances";

function renderTransactionType(txType: TransactionType): string {
  switch (txType) {
    case TransactionType.SEND:
      return "Sent";
    case TransactionType.RECEIVE:
      return "Received";
    case TransactionType.MINER:
      return "Mined";
    default:
      // Type guard to ensure all cases are handled
      const c: never = txType;
      return c;
  }
}

function renderTransactionStatus(transaction: Transaction): string {
  switch (transaction.status) {
    case TransactionStatus.CONFIRMED:
      return new Date(transaction.timestamp).toLocaleString();
    case TransactionStatus.EXPIRED:
      return "Expired";
    case TransactionStatus.PENDING:
    case TransactionStatus.UNCONFIRMED:
      return "Pending";
    case TransactionStatus.UNKNOWN:
      return "Unknown";
    default:
      // Type guard to ensure all cases are handled
      const c: never = transaction.status;
      return c;
  }
}

const SendOrReceiveCircle = ({
  transactionType,
}: {
  transactionType: TransactionType;
}) => {
  return (
    <Layout
      style={{
        position: "absolute",
        width: 16,
        height: 16,
        bottom: 0,
        right: 0,
        borderRadius: 8,
        backgroundColor:
          transactionType === TransactionType.SEND ? "#FFFFFF" : "#C7F182",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {transactionType === TransactionType.SEND ? (
        <SendArrow />
      ) : (
        <ReceiveArrow />
      )}
    </Layout>
  );
};

const bigintAbs = (value: string): bigint => {
  const bigintValue = BigInt(value);
  return bigintValue < 0 ? -bigintValue : bigintValue;
};

const assetBalanceCompare = (
  a: { delta: string },
  b: { delta: string },
): number => {
  const bigintA = bigintAbs(a.delta);
  const bigintB = bigintAbs(b.delta);
  if (bigintA < bigintB) return 1;
  if (bigintA > bigintB) return -1;
  return 0;
};

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const facade = useFacade();
  const router = useRouter();
  const hideBalances = useHideBalances();

  const getAssets = useQueries({
    queries:
      transaction.assetBalanceDeltas.map((delta) => {
        return {
          queryFn: () => facade.getAsset.resolver({ assetId: delta.assetId }),
          queryKey: facade.getAsset.buildQueryKey({ assetId: delta.assetId }),
        };
      }) ?? [],
  });

  const isLoading = getAssets.some((asset) => asset.isLoading);
  if (isLoading) {
    return null;
  }

  const assetMap = new Map<string, Asset>();
  for (const asset of getAssets) {
    if (asset.data) {
      assetMap.set(asset.data.id, asset.data);
    }
  }

  const adjustedBalanceDeltas = transaction.assetBalanceDeltas
    .map((delta) => {
      const feeAdjustedDelta =
        delta.assetId === IRON_ASSET_ID_HEX &&
        transaction.type === TransactionType.SEND
          ? (BigInt(delta.delta) + BigInt(transaction.fee ?? 0n)).toString()
          : delta.delta;
      return { ...delta, delta: feeAdjustedDelta };
    })
    .filter((delta) => delta.delta !== "0")
    .sort((a, b) => assetBalanceCompare(a, b))
    .map((delta) => {
      const asset = assetMap.get(delta.assetId);
      const symbol =
        asset?.verification.status === "verified"
          ? asset.verification.symbol
          : (asset?.name ?? delta.assetId);

      let renderedDelta = CurrencyUtils.renderWithoutDecimals(
        delta.delta,
        delta.assetId,
        asset?.verification.status === "verified"
          ? asset.verification
          : undefined,
      );

      const bigintDelta = BigInt(delta.delta);
      renderedDelta = bigintDelta > 0 ? `+${renderedDelta}` : renderedDelta;

      return {
        assetId: delta.assetId,
        symbol: symbol,
        delta: renderedDelta,
      };
    });

  const imageAsset =
    adjustedBalanceDeltas.length === 1
      ? assetMap.get(adjustedBalanceDeltas[0].assetId)
      : undefined;
  const image =
    imageAsset?.verification.status === "verified"
      ? imageAsset.verification.logoURI
      : undefined;

  return (
    <Card
      key={transaction.hash}
      style={styles.transactionCard}
      onPress={() =>
        router.push(`/(drawer)/account/transaction/${transaction.hash}`)
      }
    >
      <Layout style={{ flexDirection: "row", gap: 12 }}>
        <Layout style={styles.assetBadge}>
          <Image source={image} style={styles.assetBadge} />
          <SendOrReceiveCircle transactionType={transaction.type} />
        </Layout>
        <Layout style={{ flexDirection: "column", flex: 1 }}>
          {adjustedBalanceDeltas.map((delta) => {
            return (
              <Layout
                key={delta.assetId}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 4,
                }}
              >
                <Text category="s1" numberOfLines={1} style={{ flex: 1 }}>
                  {renderTransactionType(transaction.type)} {delta.symbol}
                </Text>
                <Text
                  category="s1"
                  style={{
                    flexShrink: 0,
                    color: delta.delta.startsWith("-") ? "black" : "#5BA54C",
                  }}
                >
                  {hideBalances ? "•••••" : delta.delta}
                </Text>
              </Layout>
            );
          })}
          <Text category="p2" appearance="hint">
            {renderTransactionStatus(transaction)}
          </Text>
        </Layout>
      </Layout>
    </Card>
  );
}

const styles = StyleSheet.create({
  assetBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E1E1E1",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  transactionCard: {
    marginVertical: 4,
  },
});
