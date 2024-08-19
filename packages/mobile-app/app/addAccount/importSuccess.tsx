import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function AddAccountSuccess() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text>Account Imported!</Text>
      <Text>
        Before you start managing your digital assets, we need to scan the
        blockchain. This may take some time.
      </Text>
      <Button onPress={() => router.dismissAll()} title="Let's go!" />
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
