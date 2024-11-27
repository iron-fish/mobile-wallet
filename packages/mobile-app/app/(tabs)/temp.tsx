import { StyleSheet } from "react-native";
import { Box, HStack, Icon, Text } from "@ironfish/tackle-box";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { RadialGradient, Rect, Stop } from "react-native-svg";

const GRADIENT_COLORS = ["#DE83F0", "#FFC2E8"];

export default function Balances() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Svg style={[StyleSheet.absoluteFill, styles.svg]}>
        <RadialGradient
          id="gradient"
          cx="50%"
          cy="50%"
          rx="80px"
          ry="160px"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={GRADIENT_COLORS[0]} />
          <Stop offset="1" stopColor={GRADIENT_COLORS[1]} />
        </RadialGradient>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradient)" />
      </Svg>

      <HStack>
        <Icon name="hamburger-menu" />
        <Text size="lg">Account 1</Text>
        <Icon name="gear" />
      </HStack>

      <Box bg="white" mt={40}>
        <Text size="lg">Balance</Text>
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "lightblue",
  },
  svg: {
    height: "100%",
    width: "100%",
    zIndex: -1,
  },
});
