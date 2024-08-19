import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text } from "react-native";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text>Welcome to Iron Fish</Text>
      <Text>Let's Make Web3 Private</Text>
      <Text>Create Account</Text>
      <Text>I already have an account</Text>
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
