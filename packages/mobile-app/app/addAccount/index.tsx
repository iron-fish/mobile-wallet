import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinkButton } from "../../components/LinkButton";

export default function AddAccount() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button title="Close" onPress={() => router.dismissAll()} />
      <Text>Add a new account</Text>
      <LinkButton title="Create new account" href="/addAccount/create/" />
      <Text>Import an existing account</Text>
      <Text>Mnemonic Phrase</Text>
      <LinkButton title="Encoded Key" href="/addAccount/importEncoded/" />
      <Text>File</Text>
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
