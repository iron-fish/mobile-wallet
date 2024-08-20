import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function MenuTheme() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button title="Back" onPress={() => router.dismiss()} />
      <Text>Follow system settings</Text>
      <Text>Always light</Text>
      <Text>Always dark</Text>
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
