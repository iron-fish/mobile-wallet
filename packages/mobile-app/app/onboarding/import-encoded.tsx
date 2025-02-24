import { Layout } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { EncodedImport } from "@/components/EncodedImport/EncodedImport";

export default function ImportEncodedScreen() {
  const router = useRouter();

  return (
    <Layout style={styles.container}>
      <EncodedImport
        onSuccess={() => router.replace("/(drawer)/account")}
        showSuccessModal={false}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
});
