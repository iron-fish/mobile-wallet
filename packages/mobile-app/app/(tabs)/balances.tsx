import {
  Box,
  HStack,
  Icon,
  IconButton,
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

      <Box bg="background" flexGrow={1} />
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
