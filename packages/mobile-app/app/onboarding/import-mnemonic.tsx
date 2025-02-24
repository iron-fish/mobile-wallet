import { Layout } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { MnemonicImport } from "@/components/MnemonicImport/MnemonicImport";

export default function ImportMnemonicScreen() {
  const router = useRouter();

  return (
    <Layout style={styles.container}>
      <MnemonicImport
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
