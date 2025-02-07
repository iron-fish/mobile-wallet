import { StyleSheet, View } from "react-native";
import { Button, Layout, Text } from "@ui-kitten/components";
import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";

import { Files } from "@/svgs/Files";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    gap: 24,
  },
  uploadContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  fileName: {
    marginTop: 16,
    textAlign: "center",
  },
});

export default function ImportFile() {
  const [fileName, setFileName] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain"],
      });

      if (!result.canceled) {
        setFileName(result.assets[0].name);
        console.log("Document picked:", result.assets[0]);
      }
    } catch (err) {
      console.log("DocumentPicker Error:", err);
    }
  };

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <View style={styles.uploadContainer}>
          <Files />
          <Text>Upload your JSON or Bech32 file</Text>
          <Button onPress={pickDocument}>Select File</Button>
          {fileName && (
            <Text style={styles.fileName}>Selected: {fileName}</Text>
          )}
        </View>
      </View>
    </Layout>
  );
}
