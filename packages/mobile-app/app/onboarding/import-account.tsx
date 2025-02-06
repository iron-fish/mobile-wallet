import { StyleSheet, View } from "react-native";
import { Button, Layout, Text } from "@ui-kitten/components";
import { useRouter } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 16,
  },
});

export default function ImportAccount() {
  const router = useRouter();

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Import Method</Text>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() => router.push("/onboarding/import-mnemonic")}
            size="large"
          >
            Mnemonic phrase
          </Button>

          <Button
            onPress={() => router.push("/onboarding/import-encoded")}
            size="large"
          >
            Encoded key
          </Button>

          <Button
            onPress={() => router.push("/onboarding/import-file")}
            size="large"
          >
            File
          </Button>
        </View>
      </View>
    </Layout>
  );
}
