import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Layout,
  Text,
  Button,
  Card,
  Tab,
  TabBar,
  Icon,
  IconProps,
  Spinner,
  Modal,
} from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { setStringAsync } from "expo-clipboard";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useFacade } from "../../data/facades";
import { useQueries } from "@tanstack/react-query";
import { Asset } from "../../data/facades/chain/types";
import { useAccount } from "../../providers/AccountProvider";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CurrencyUtils } from "@ironfish/sdk";

const MenuIcon = (props: IconProps) => <Icon {...props} name="menu-outline" />;
const SettingsIcon = (props: IconProps) => (
  <Icon {...props} name="settings-outline" />
);
const ReceiveIcon = (props: IconProps) => (
  <Icon {...props} name="download-outline" />
);
const SendIcon = (props: IconProps) => (
  <Icon {...props} name="upload-outline" />
);
const BridgeIcon = (props: IconProps) => (
  <Icon {...props} name="swap-outline" />
);

interface Balance {
  assetId: string;
  confirmed: string;
  available: string;
}

export default function Balances() {
  const facade = useFacade();
  const { account, accountName, isLoading } = useAccount();
  const scrollYOffset = useSharedValue(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollYOffset.value = event.contentOffset.y;
  });

  const copyAddressToClipboard = async () => {
    if (account) {
      await setStringAsync(account.publicAddress);
    }
  };

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

  if (isLoading || !account) {
    return (
      <SafeAreaView>
        <Layout style={[styles.container, styles.loadingContainer]}>
          <Spinner size="large" />
        </Layout>
      </SafeAreaView>
    );
  }

  const isSyncing = getWalletStatusResult.data?.status === "SCANNING";
  const syncProgress = isSyncing
    ? ((account?.head?.sequence ?? 0) /
        (getWalletStatusResult.data?.latestKnownBlock ?? 1)) *
      100
    : 100;

  return (
    <SafeAreaView>
      <Modal
        visible={addressModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setAddressModalVisible(false)}
      >
        <Card disabled style={styles.modalCard}>
          <Text category="h6" style={styles.modalTitle}>
            Your Iron Fish Address
          </Text>
          <Text selectable style={styles.address}>
            {account.publicAddress}
          </Text>
          <Button onPress={copyAddressToClipboard} style={{ marginBottom: 8 }}>
            Copy Address
          </Button>
          <Button
            appearance="ghost"
            onPress={() => setAddressModalVisible(false)}
          >
            Close
          </Button>
        </Card>
      </Modal>

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Layout style={styles.container}>
          {/* Header Section */}
          <Animated.View style={{ transform: [{ translateY: scrollYOffset }] }}>
            <Layout style={styles.headerTop}>
              <Button
                appearance="ghost"
                accessoryLeft={MenuIcon}
                style={styles.iconButton}
                onPress={() => router.push("/menu/")}
              />
              <Text category="h5" style={styles.headerTitle}>
                {accountName || "Account 1"}
              </Text>
              <Button
                appearance="ghost"
                accessoryLeft={SettingsIcon}
                style={styles.iconButton}
                onPress={() =>
                  router.push(`/account-settings/?accountName=${accountName}`)
                }
              />
            </Layout>
            <Layout style={styles.headerBalance}>
              <Text category="h1" style={styles.balanceAmount}>
                {CurrencyUtils.render(account?.balances.iron.confirmed ?? "0")}
              </Text>
              <Text category="s1" appearance="hint">
                {getIronAsset.data?.verification.status === "verified"
                  ? getIronAsset.data.verification.symbol
                  : (getIronAsset.data?.name ?? "IRON")}
              </Text>

              <Layout style={styles.actionButtons}>
                <Button
                  appearance="ghost"
                  accessoryLeft={ReceiveIcon}
                  style={styles.actionButton}
                  onPress={() => setAddressModalVisible(true)}
                >
                  Receive
                </Button>
                <Button
                  appearance="ghost"
                  accessoryLeft={SendIcon}
                  style={styles.actionButton}
                  onPress={() => router.push("/send/")}
                >
                  Send
                </Button>
                <Button
                  appearance="ghost"
                  accessoryLeft={BridgeIcon}
                  style={styles.actionButton}
                  onPress={() => router.push("/menu/debug/browser")}
                >
                  Bridge
                </Button>
              </Layout>
            </Layout>
          </Animated.View>

          <Layout style={styles.contentContainer}>
            {/* Syncing Status */}
            {isSyncing && (
              <Card style={styles.syncCard}>
                <Text appearance="hint" style={styles.syncText}>
                  The blockchain is currently syncing with your accounts. Your
                  balance may be inaccurate and sending transactions will be
                  disabled until the sync is done.
                </Text>
                <Layout style={styles.syncStats}>
                  <Layout style={styles.syncRow}>
                    <Text appearance="hint">Progress:</Text>
                    <Text>{syncProgress.toFixed(1)}%</Text>
                  </Layout>
                  <Layout style={styles.syncRow}>
                    <Text appearance="hint">Blocks Scanned:</Text>
                    <Text>
                      {account?.head?.sequence ?? 0}/
                      {getWalletStatusResult.data?.latestKnownBlock ?? 0}
                    </Text>
                  </Layout>
                </Layout>
              </Card>
            )}

            {/* Tabs Section */}
            <TabBar
              selectedIndex={selectedIndex}
              onSelect={(index) => setSelectedIndex(index)}
            >
              <Tab title="Assets" />
              <Tab title="Transactions" />
            </TabBar>

            <Layout style={styles.tabContent}>
              {selectedIndex === 0 && account && (
                <>
                  {/* Iron Asset */}
                  <AssetRow
                    name={
                      getIronAsset.data?.verification.status === "verified"
                        ? getIronAsset.data.verification.symbol
                        : (getIronAsset.data?.name ?? "IRON")
                    }
                    amount={CurrencyUtils.render(
                      account.balances.iron.confirmed,
                    )}
                    verified={
                      getIronAsset.data?.verification.status === "verified"
                    }
                  />

                  {/* Custom Assets */}
                  {account.balances.custom.map((balance) => {
                    const asset = assetMap.get(balance.assetId);
                    return (
                      <AssetRow
                        key={balance.assetId}
                        name={
                          asset?.verification.status === "verified"
                            ? asset.verification.symbol
                            : (asset?.name ?? balance.assetId)
                        }
                        amount={CurrencyUtils.render(
                          balance.confirmed,
                          false,
                          balance.assetId,
                          asset?.verification.status === "verified"
                            ? asset.verification
                            : undefined,
                        )}
                        verified={asset?.verification.status === "verified"}
                      />
                    );
                  })}
                </>
              )}

              {selectedIndex === 1 && (
                <>
                  {getTransactionsResult.data?.map((transaction) => (
                    <Card key={transaction.hash} style={styles.transactionCard}>
                      <Text category="s1">{transaction.type.toString()}</Text>
                      <Text category="p2" appearance="hint">
                        Block: {transaction.block?.sequence ?? "Pending"}
                      </Text>
                      <Text category="p2" appearance="hint">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </Text>
                      <Text category="p2" appearance="hint">
                        Status: {transaction.status.toString()}
                      </Text>
                    </Card>
                  ))}
                </>
              )}
            </Layout>
          </Layout>
        </Layout>
      </Animated.ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function AssetRow({
  name,
  amount,
  verified,
}: {
  name: string;
  amount: string;
  verified: boolean;
}) {
  return (
    <Card style={styles.assetCard}>
      <Layout style={styles.assetCardContent}>
        <Layout style={styles.assetBadge} />
        <Layout style={styles.assetInfo}>
          <Text category="s1">
            {name} {verified ? "(Verified)" : ""}
          </Text>
          <Text category="p2" appearance="hint">
            {amount}
          </Text>
        </Layout>
        <Icon
          style={styles.chevron}
          fill="#8F9BB3"
          name="chevron-right-outline"
        />
      </Layout>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  headerTop: {
    flexDirection: "row",
    padding: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  iconButton: {
    padding: 0,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerBalance: {
    alignItems: "center",
    gap: 8,
  },
  balanceAmount: {
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 24,
    gap: 16,
    justifyContent: "center",
  },
  actionButton: {
    flexDirection: "column",
  },
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
  chevron: {
    width: 24,
    height: 24,
  },
  syncCard: {
    margin: 16,
    marginTop: 0,
  },
  syncText: {
    textAlign: "center",
    marginBottom: 16,
  },
  syncStats: {
    gap: 8,
  },
  syncRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  transactionCard: {
    marginVertical: 4,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalCard: {
    margin: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  address: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 30,
  },
});
