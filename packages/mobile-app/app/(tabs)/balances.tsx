import { SafeAreaGradient } from "@/components/SafeAreaGradient/SafeAreaGradient";
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  SharedValue,
} from "react-native-reanimated";

const GRADIENT_COLORS = ["#DE83F0", "#FFC2E8"];

export default function Balances() {
  const scrollYOffset = useSharedValue(0);

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
        <View style={styles.container}>
          <AccountHeader offsetY={scrollYOffset} />

          <View style={styles.contentContainer}>
            <TabsRoot defaultTab="assets" />
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaGradient>
  );
}

function TabsRoot({ defaultTab }: { defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "assets" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("assets")}
        >
          <Text style={styles.tabButtonText}>Assets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "transactions" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("transactions")}
        >
          <Text style={styles.tabButtonText}>Transactions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>
        {activeTab === "assets" && (
          <>
            <AssetRow />
            <AssetRow />
            <AssetRow />
            <AssetRow />
            <AssetRow />
            <AssetRow />
          </>
        )}
        {activeTab === "transactions" && <BottomSheetDemo />}
      </View>
    </View>
  );
}

function AccountHeader({ offsetY }: { offsetY: SharedValue<number> }) {
  return (
    <Animated.View style={{ transform: [{ translateY: offsetY }] }}>
      <View style={styles.headerTop}>
        <Text style={styles.menuIcon}>☰</Text>
        <Text style={styles.headerTitle}>Account 1</Text>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </View>
      <View style={styles.headerBalance}>
        <Text style={styles.balanceAmount}>100.55</Text>
        <Text style={styles.balanceCurrency}>IRON</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>↓ Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>↑ Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>⇄ Bridge</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function AssetBadge() {
  return <View style={styles.assetBadge} />;
}

function AssetRow() {
  return (
    <TouchableOpacity style={styles.assetCard}>
      <View style={styles.assetCardContent}>
        <AssetBadge />
        <View style={styles.assetInfo}>
          <Text style={styles.assetSymbol}>$IRON</Text>
          <Text style={styles.assetAmount}>100.55</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function BottomSheetDemo() {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.sheetButton}
        onPress={() => setOpen(true)}
      >
        <Text>Show Bottom Sheet</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.bottomSheet}>
          <AccountSyncingDetails onClose={() => setOpen(false)} />
        </View>
      )}
    </View>
  );
}

function AccountSyncingDetails({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.syncDetails}>
      <Text style={styles.syncText}>
        The blockchain is currently syncing with your accounts. Your balance may
        be inaccurate and sending transactions will be disabled until the sync
        is done.
      </Text>

      <View style={styles.syncStats}>
        <View style={styles.syncRow}>
          <Text style={styles.syncLabel}>Node Status:</Text>
          <Text style={styles.syncValue}>Syncing Blocks</Text>
        </View>
        <View style={styles.syncRow}>
          <Text style={styles.syncLabel}>Progress:</Text>
          <Text style={styles.syncValue}>42.3%</Text>
        </View>
        <View style={styles.syncRow}>
          <Text style={styles.syncLabel}>Blocks Scanned:</Text>
          <Text style={styles.syncValue}>33645/74346</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
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
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E1E1",
  },
  tabButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabButtonText: {
    fontSize: 16,
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
  menuIcon: {
    fontSize: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
  settingsIcon: {
    fontSize: 24,
  },
  headerBalance: {
    alignItems: "center",
    gap: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "600",
  },
  balanceCurrency: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 24,
    gap: 16,
  },
  actionButton: {
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
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
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#fff",
  },
  assetCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  assetInfo: {
    gap: 4,
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: "500",
  },
  assetAmount: {
    fontSize: 14,
    color: "#666",
  },
  chevron: {
    marginLeft: "auto",
    fontSize: 20,
  },
  sheetButton: {
    padding: 16,
    alignItems: "center",
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
    color: "#666",
  },
  syncStats: {
    gap: 16,
    marginVertical: 24,
  },
  syncRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  syncLabel: {
    color: "#666",
  },
  syncValue: {
    fontWeight: "500",
  },
  closeButton: {
    padding: 16,
    alignItems: "center",
  },
});
