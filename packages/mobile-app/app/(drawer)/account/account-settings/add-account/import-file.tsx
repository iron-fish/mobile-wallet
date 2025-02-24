import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { Layout } from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { FileImport } from "@/components/FileImport/FileImport";
import React from "react";

export default function ImportFileScreen() {
  const router = useRouter();

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerTitle: "Account Import",
          headerBackTitle: "Back",
        }}
      />

      <Layout style={styles.container} level="1">
        <FileImport
          onSuccess={() => router.dismissAll()}
          showSuccessModal={true}
        />
      </Layout>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
