import {
  Box,
  HStack,
  Icon,
  IconButton,
  Tabs,
  Text,
  VStack,
  Card,
  useBottomSheet,
  Button,
} from "@ironfish/tackle-box";
import { SafeAreaGradient } from "@/components/SafeAreaGradient/SafeAreaGradient";
import { View } from "react-native";
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

          <Box
            bg="background"
            flexGrow={1}
            borderTopLeftRadius={20}
            borderTopRightRadius={20}
          >
            <Tabs.Root defaultValue="assets">
              <Tabs.List>
                <Tabs.Trigger value="assets">Assets</Tabs.Trigger>
                <Tabs.Trigger value="transactions">Transactions</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="assets">
                <VStack flexGrow={1} p={4} pb={16} gap={4}>
                  <AssetRow />
                  <AssetRow />
                  <AssetRow />
                  <AssetRow />
                  <AssetRow />
                  <AssetRow />
                </VStack>
              </Tabs.Content>
              <Tabs.Content value="transactions">
                <VStack flexGrow={1} p={4} pb={16}>
                  <BottomSheetDemo />
                </VStack>
              </Tabs.Content>
            </Tabs.Root>
          </Box>
        </View>
      </Animated.ScrollView>
    </SafeAreaGradient>
  );
}

function AccountHeader({ offsetY }: { offsetY: SharedValue<number> }) {
  return (
    <Animated.View style={{ transform: [{ translateY: offsetY }] }}>
      <HStack alignItems="center" px={4} py={6}>
        <Icon name="hamburger-menu" />
        <Box flexGrow={1}>
          <Text size="lg" textAlign="center">
            Account 1
          </Text>
        </Box>
        <Icon name="gear" />
      </HStack>
      <VStack alignItems="center">
        <Text size="3xl">100.55</Text>
        <Text size="lg">IRON</Text>

        <HStack py={8} px={6}>
          <IconButton label="Receive" icon="arrow-receive" />
          <IconButton label="Send" icon="arrow-send" />
          <IconButton label="Bridge" icon="arrows-bridge" />
        </HStack>
      </VStack>
    </Animated.View>
  );
}

function AssetBadge() {
  return (
    <Box
      bg="pink"
      height={48}
      width={48}
      minHeight={48}
      minWidth={48}
      borderRadius="full"
    />
  );
}

function AssetRow() {
  return (
    <Card>
      <HStack alignItems="center" gap={3}>
        <AssetBadge />
        <VStack>
          <Text size="sm">$IRON</Text>
          <Text size="sm" color="textSecondary">
            100.55
          </Text>
        </VStack>
        <Icon name="chevron-right" />
      </HStack>
    </Card>
  );
}

function BottomSheetDemo() {
  const bottomSheet = useBottomSheet();

  return (
    <VStack gap={2}>
      <Button
        title="Show Bottom Sheet"
        onClick={() => {
          bottomSheet.show({
            title: "Account Syncing",
            body: <AccountSyncingDetails onClose={bottomSheet.hide} />,
          });
        }}
      />
    </VStack>
  );
}

function AccountSyncingDetails({ onClose }: { onClose: () => void }) {
  return (
    <Box>
      <Text color="textSecondary" textAlign="center">
        The blockchain is currently syncing with your accounts. Your balance may
        be inaccurate and sending transactions will be disabled until the sync
        is done.
      </Text>
      <VStack mt={8} mb={20} gap={4}>
        <VStack>
          <Text color="textSecondary">Node Status:</Text>
          <Text size="lg">Syncing Blocks</Text>
        </VStack>
        <VStack>
          <Text color="textSecondary">Progress:</Text>
          <Text size="lg">42.3%</Text>
        </VStack>
        <VStack>
          <Text color="textSecondary">Blocks Scanned:</Text>
          <Text size="lg">33645/74346</Text>
        </VStack>
      </VStack>
      <Button title="Close" onClick={onClose} />
    </Box>
  );
}
