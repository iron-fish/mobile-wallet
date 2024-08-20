import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

export default function AccountName() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button title="Back" onPress={() => router.dismiss()} />

      <View>
        <Text>Account Name</Text>
        <TextInput placeholder="Account 1" />
      </View>
      <Button title="Save" />
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
