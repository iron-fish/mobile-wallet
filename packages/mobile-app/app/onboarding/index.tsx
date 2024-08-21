import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text } from "react-native";
import { LinkButton } from "../../components/LinkButton";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Iron Fish</Text>
      <Text>Let's Make Web3 Private</Text>
      <LinkButton title="Create Account" href="/onboarding/create/" />
      <LinkButton
        title="I already have an account"
        href="/onboarding/import-encoded/"
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
