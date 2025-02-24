import { Layout } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { FileImport } from "@/components/FileImport/FileImport";

export default function ImportFileScreen() {
  const router = useRouter();

  return (
    <Layout style={styles.container}>
      <FileImport
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
