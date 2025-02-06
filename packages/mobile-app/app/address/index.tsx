import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, View, Text } from "react-native";
import { useRouter } from "expo-router";

export default function Address() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button title="Close" onPress={() => router.dismiss()} />
      <Text>Your Iron Fish Address</Text>
      <Text>
        0000af669834a5b8ece63383e596202260ec2d8d31c089c63db007972d6d9fd5
      </Text>
      <Text>Use this address to receive assets on the Iron Fish network</Text>
      <Button title="Copy Address" />
      <Button title="Share" />
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
