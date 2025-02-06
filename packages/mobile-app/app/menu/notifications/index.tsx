import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function MenuNotifications() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button title="Back" onPress={() => router.dismiss()} />
      <Text>Allow Notifications</Text>
      <Text>Sent</Text>
      <Text>Received</Text>
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
