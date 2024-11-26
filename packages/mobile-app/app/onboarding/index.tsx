import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Image } from "react-native";
import { LinkButton } from "../../components/LinkButton";
import { VStack } from "@ironfish/tackle-box";

import LogoWithText from "../../assets/logo-with-text.svg";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <VStack gap={10}>
          <LogoWithText />
          <Text>Let's Make Web3 Private</Text>
        </VStack>
        <VStack gap={10}>
          <LinkButton
            styleVariant="outline"
            title="I have an account"
            href="/onboarding/import-encoded/"
          />
          <LinkButton
            styleVariant="solid"
            title="Create Account"
            href="/onboarding/create/"
          />
          <StatusBar style="auto" />
        </VStack>
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
});
