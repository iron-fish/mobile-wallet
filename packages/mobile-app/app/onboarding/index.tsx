import { View, StyleSheet } from "react-native";
import { LinkButton } from "../../components/LinkButton";
import { VStack, Text } from "@ironfish/tackle-box";
import { LinearGradient } from "expo-linear-gradient";

import LogoWithText from "../../assets/images/logo-with-text.svg";
import KeyPlantOrchid from "../../assets/images/key-plant--orchid.svg";
import { Stack } from "expo-router";

const styles = StyleSheet.create({
  background: {
    zIndex: -1,
  },
});

export default function Onboarding() {
  return (
    <View
      style={{
        paddingTop: 80,
        paddingBottom: 24,
        paddingHorizontal: 24,
        flex: 1,
      }}
    >
      <LinearGradient
        colors={["#FFF4E0", "#DE83F0"]}
        locations={[0, 1]}
        style={[StyleSheet.absoluteFillObject, styles.background]}
      />
      <VStack alignItems="center" gap={8}>
        <LogoWithText height={18} />
        <Text textAlign="center" size="3xl">
          Let's Make Web3 Private
        </Text>
      </VStack>
      <View
        style={{
          flex: 1,
          alignItems: "center",
        }}
      >
        <KeyPlantOrchid style={{ aspectRatio: 0.5 }} />
      </View>
      <VStack gap={4}>
        <LinkButton
          variant="outline"
          title="I have an account"
          href="/onboarding/import-encoded/"
        />
        <LinkButton
          variant="solid"
          title="Create an account"
          href="/onboarding/create/"
        />
        <LinkButton
          variant="ghost"
          title="Language preferences"
          href="/onboarding/language/"
        />
      </VStack>
    </View>
  );
}
