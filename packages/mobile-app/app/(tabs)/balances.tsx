import { SafeAreaGradient } from "@/components/SafeAreaGradient/SafeAreaGradient";
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
  useTheme,
} from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  SharedValue,
} from "react-native-reanimated";

const GRADIENT_COLORS = ["#DE83F0", "#FFC2E8"];

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
const ChevronIcon = (props: IconProps) => (
  <Icon {...props} name="chevron-right-outline" />
);

export default function Balances() {
  const scrollYOffset = useSharedValue(0);
  const theme = useTheme();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollYOffset.value = event.contentOffset.y;
  });

  return (
    <SafeAreaGradient from={GRADIENT_COLORS[0]} to={GRADIENT_COLORS[1]}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Layout style={styles.container}>
          <AccountHeader offsetY={scrollYOffset} />

          <Layout style={styles.contentContainer}>
            <TabsRoot defaultTab="assets" />
          </Layout>
        </Layout>
      </Animated.ScrollView>
    </SafeAreaGradient>
  );
}

function TabsRoot({ defaultTab }: { defaultTab: string }) {
  const [selectedIndex, setSelectedIndex] = useState(
    defaultTab === "assets" ? 0 : 1,
  );

  return (
    <Layout>
      <TabBar
        selectedIndex={selectedIndex}
        onSelect={(index) => setSelectedIndex(index)}
      >
        <Tab title="Assets" />
        <Tab title="Transactions" />
      </TabBar>

      <Layout style={styles.tabContent}>
        {selectedIndex === 0 && (
          <>
            <AssetRow />
            <AssetRow />
            <AssetRow />
            <AssetRow />
            <AssetRow />
            <AssetRow />
          </>
        )}
        {selectedIndex === 1 && <BottomSheetDemo />}
      </Layout>
    </Layout>
  );
}

function AccountHeader({ offsetY }: { offsetY: SharedValue<number> }) {
  return (
    <Animated.View style={{ transform: [{ translateY: offsetY }] }}>
      <Layout style={styles.headerTop}>
        <Button
          appearance="ghost"
          accessoryLeft={MenuIcon}
          style={styles.iconButton}
        />
        <Text category="h5" style={styles.headerTitle}>
          Account 1
        </Text>
        <Button
          appearance="ghost"
          accessoryLeft={SettingsIcon}
          style={styles.iconButton}
        />
      </Layout>
      <Layout style={styles.headerBalance}>
        <Text category="h1" style={styles.balanceAmount}>
          100.55
        </Text>
        <Text category="s1" appearance="hint">
          IRON
        </Text>

        <Layout style={styles.actionButtons}>
          <Button
            appearance="ghost"
            accessoryLeft={ReceiveIcon}
            style={styles.actionButton}
          >
            Receive
          </Button>
          <Button
            appearance="ghost"
            accessoryLeft={SendIcon}
            style={styles.actionButton}
          >
            Send
          </Button>
          <Button
            appearance="ghost"
            accessoryLeft={BridgeIcon}
            style={styles.actionButton}
          >
            Bridge
          </Button>
        </Layout>
      </Layout>
    </Animated.View>
  );
}

function AssetBadge() {
  return <Layout style={styles.assetBadge} />;
}

function AssetRow() {
  return (
    <Card style={styles.assetCard} onPress={() => {}}>
      <Layout style={styles.assetCardContent}>
        <AssetBadge />
        <Layout style={styles.assetInfo}>
          <Text category="s1">$IRON</Text>
          <Text category="p2" appearance="hint">
            100.55
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

function BottomSheetDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Layout>
      <Button onPress={() => setOpen(true)} style={styles.sheetButton}>
        Show Bottom Sheet
      </Button>

      {open && (
        <Layout style={styles.bottomSheet}>
          <AccountSyncingDetails onClose={() => setOpen(false)} />
        </Layout>
      )}
    </Layout>
  );
}

function AccountSyncingDetails({ onClose }: { onClose: () => void }) {
  return (
    <Layout style={styles.syncDetails}>
      <Text appearance="hint" style={styles.syncText}>
        The blockchain is currently syncing with your accounts. Your balance may
        be inaccurate and sending transactions will be disabled until the sync
        is done.
      </Text>

      <Layout style={styles.syncStats}>
        <Layout style={styles.syncRow}>
          <Text appearance="hint">Node Status:</Text>
          <Text>Syncing Blocks</Text>
        </Layout>
        <Layout style={styles.syncRow}>
          <Text appearance="hint">Progress:</Text>
          <Text>42.3%</Text>
        </Layout>
        <Layout style={styles.syncRow}>
          <Text appearance="hint">Blocks Scanned:</Text>
          <Text>33645/74346</Text>
        </Layout>
      </Layout>

      <Button appearance="ghost" onPress={onClose} style={styles.closeButton}>
        Close
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  sheetButton: {
    margin: 16,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  syncDetails: {
    gap: 16,
  },
  syncText: {
    textAlign: "center",
  },
  syncStats: {
    gap: 16,
    marginVertical: 24,
  },
  syncRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  closeButton: {
    marginTop: 8,
  },
});
