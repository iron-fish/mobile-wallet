import { View, StyleSheet, StatusBar, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinkButton } from "../../components/LinkButton";
import { LinearGradient } from "expo-linear-gradient";

import LogoWithText from "../../assets/images/logo-with-text.svg";
import KeyPlantOrchid from "../../assets/images/key-plant--orchid.svg";

const styles = StyleSheet.create({
  background: {
    zIndex: -1,
  },
  verticalStack: {
    gap: 32,
    alignItems: "center",
  },
  buttonStack: {
    gap: 16,
  },
  titleText: {
    fontSize: 24,
    textAlign: "center",
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
          <View style={styles.verticalStack}>
            <LogoWithText height={18} />
            <Text style={styles.titleText}>Let's Make Web3 Private</Text>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: "center",
            }}
          >
            <KeyPlantOrchid style={{ aspectRatio: 0.5 }} />
          </View>
          <View style={styles.buttonStack}>
            <LinkButton
              variant="outlined"
              title="I have an account"
              href="/onboarding/create?next=import-account"
            />
            <LinkButton
              variant="solid"
              title="Create an account"
              href="/onboarding/create/"
            />
          </View>
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
