import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { Layout } from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { MnemonicImport } from "@/components/MnemonicImport/MnemonicImport";

export default function ImportMnemonicScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Account Import",
          headerBackTitle: "Back",
        }}
      />

      <Layout style={styles.container} level="1">
        <MnemonicImport
          onSuccess={() => router.dismissAll()}
          showSuccessModal={true}
        />
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
