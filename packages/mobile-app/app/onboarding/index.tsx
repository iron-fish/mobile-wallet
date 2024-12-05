import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinkButton } from "../../components/LinkButton";
import { VStack, Text } from "@ironfish/tackle-box";
import { LinearGradient } from "expo-linear-gradient";

import LogoWithText from "../../assets/images/logo-with-text.svg";
import KeyPlantOrchid from "../../assets/images/key-plant--orchid.svg";

const styles = StyleSheet.create({
  background: {
    zIndex: -1,
  },
});

export default function Onboarding() {
  return (
    <>
      <StatusBar barStyle="default" />
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: "#FFF4E0" }}
      >
        <View style={{ flex: 1, padding: 24 }}>
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
      </SafeAreaView>
      {/*
       * For setting the bottom safe area color
       * https://medium.com/@calebmackdaven/setting-background-color-with-safeareaview-in-react-native-1ca621ccd9a
       */}
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 0, backgroundColor: "#DE83F0" }}
      />
    </>
  );
}
