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
        <View style={{ flexGrow: 1 }}>
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
      <View style={styles.tabList}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "assets" && styles.activeTab]}
          onPress={() => setActiveTab("assets")}
        >
          <Text style={styles.tabText}>Assets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
          onPress={() => setActiveTab("transactions")}
        >
          <Text style={styles.tabText}>Transactions</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "assets" && (
        <View style={styles.tabContent}>
          <AssetRow />
          <AssetRow />
          <AssetRow />
          <AssetRow />
          <AssetRow />
          <AssetRow />
        </View>
      )}
      {activeTab === "transactions" && (
        <View style={styles.tabContent}>
          <BottomSheetDemo />
        </View>
      )}
    </View>
  );
}

function AccountHeader({ offsetY }: { offsetY: SharedValue<number> }) {
  return (
    <Animated.View style={{ transform: [{ translateY: offsetY }] }}>
      <View style={styles.headerTop}>
        <Text>☰</Text>
        <Text style={styles.headerTitle}>Account 1</Text>
        <Text>⚙️</Text>
      </View>
      <View style={styles.headerContent}>
        <Text style={styles.balanceText}>100.55</Text>
        <Text style={styles.currencyText}>IRON</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Text>↓</Text>
            <Text>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text>↑</Text>
            <Text>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text>⇄</Text>
            <Text>Bridge</Text>
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
    <View style={styles.card}>
      <View style={styles.assetRow}>
        <AssetBadge />
        <View>
          <Text>$IRON</Text>
          <Text style={styles.secondaryText}>100.55</Text>
        </View>
        <Text>›</Text>
      </View>
    </View>
  );
}

function BottomSheetDemo() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.bottomSheetDemo}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.buttonText}>Show Bottom Sheet</Text>
      </TouchableOpacity>

      {isVisible && (
        <View style={styles.bottomSheet}>
          <AccountSyncingDetails onClose={() => setIsVisible(false)} />
        </View>
      )}
    </View>
  );
}

function AccountSyncingDetails({ onClose }: { onClose: () => void }) {
  return (
    <View>
      <Text style={styles.secondaryText}>
        The blockchain is currently syncing with your accounts. Your balance may
        be inaccurate and sending transactions will be disabled until the sync
        is done.
      </Text>
      <View style={styles.syncDetails}>
        <View>
          <Text style={styles.secondaryText}>Node Status:</Text>
          <Text style={styles.detailText}>Syncing Blocks</Text>
        </View>
        <View>
          <Text style={styles.secondaryText}>Progress:</Text>
          <Text style={styles.detailText}>42.3%</Text>
        </View>
        <View>
          <Text style={styles.secondaryText}>Blocks Scanned:</Text>
          <Text style={styles.detailText}>33645/74346</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: "#fff",
    flexGrow: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabList: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 64,
    gap: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingVertical: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
  },
  headerContent: {
    alignItems: "center",
  },
  balanceText: {
    fontSize: 32,
  },
  currencyText: {
    fontSize: 18,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 24,
    gap: 16,
  },
  iconButton: {
    alignItems: "center",
    gap: 8,
  },
  assetBadge: {
    backgroundColor: "pink",
    height: 48,
    width: 48,
    borderRadius: 24,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  secondaryText: {
    color: "#666",
  },
  bottomSheetDemo: {
    gap: 8,
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  syncDetails: {
    marginTop: 32,
    marginBottom: 80,
    gap: 16,
  },
  detailText: {
    fontSize: 18,
  },
});
