import {
  Box,
  HStack,
  Icon,
  IconButton,
  Tabs,
  Text,
  VStack,
} from "@ironfish/tackle-box";
import { SafeAreaGradient } from "@/components/SafeAreaGradient/SafeAreaGradient";

const GRADIENT_COLORS = ["#DE83F0", "#FFC2E8"];

export default function Balances() {
  return (
    <SafeAreaGradient from={GRADIENT_COLORS[0]} to={GRADIENT_COLORS[1]}>
      <NavBar />

      <VStack alignItems="center">
        <Text size="3xl">100.55</Text>
        <Text size="lg">IRON</Text>

        <HStack py={8} px={6}>
          <IconButton label="Receive" icon="arrow-receive" />
          <IconButton label="Send" icon="arrow-send" />
          <IconButton label="Bridge" icon="arrows-bridge" />
        </HStack>
      </VStack>

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
            <VStack>
              <Text>Assets</Text>
              <Text>Assets</Text>
              <Text>Assets</Text>
              <Text>Assets</Text>
              <Text>Assets</Text>
            </VStack>
          </Tabs.Content>
          <Tabs.Content value="transactions">
            <VStack>
              <Text>Transactions</Text>
              <Text>Transactions</Text>
              <Text>Transactions</Text>
              <Text>Transactions</Text>
              <Text>Transactions</Text>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </SafeAreaGradient>
  );
}

function NavBar() {
  return (
    <HStack alignItems="center" px={4} py={6}>
      <Icon name="hamburger-menu" />
      <Box flexGrow={1}>
        <Text size="lg" textAlign="center">
          Account 1
        </Text>
      </Box>
      <Icon name="gear" />
    </HStack>
  );
}
