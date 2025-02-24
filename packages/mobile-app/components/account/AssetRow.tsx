import { Layout, Text, Card } from "@ui-kitten/components";
import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import { useHideBalances } from "@/hooks/useHideBalances";

export function AssetRow({
  name,
  amount,
  verified,
  image,
  forceHideBalance,
}: {
  name: string;
  amount: string;
  verified: boolean;
  image?: string;
  forceHideBalance?: boolean;
}) {
  const hideBalancesGlobal = useHideBalances();
  const hideBalances =
    forceHideBalance !== undefined ? forceHideBalance : hideBalancesGlobal;

  return (
    <Card style={styles.assetCard}>
      <Layout style={styles.assetCardContent}>
        <Layout style={styles.assetBadge}>
          <Image source={image} style={styles.assetBadge} />
        </Layout>
        <Layout style={styles.assetInfo}>
          <Text category="s1">
            {name} {verified ? "(Verified)" : ""}
          </Text>
          <Text category="p2" appearance="hint">
            {hideBalances ? "•••••" : amount}
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
  assetCard: {
    marginVertical: 4,
  },
  assetCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  assetInfo: {
    gap: 4,
    flex: 1,
  },
});
