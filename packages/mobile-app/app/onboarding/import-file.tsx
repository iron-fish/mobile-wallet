import { StyleSheet, View } from "react-native";
import { Button, Input, Layout, Text, Icon } from "@ui-kitten/components";
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
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FC",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileName: {
    flex: 1,
  },
  trashButton: {
    padding: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
});

export default function ImportFile() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [nameError, setNameError] = useState("");

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

  const handleRemoveFile = () => {
    setFileName(null);
  };

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <View>
          <Input
            label="Account Name"
            placeholder="Account Name"
            value={accountName}
            onChangeText={(text) => {
              setAccountName(text);
              setNameError("");
            }}
            status={nameError ? "danger" : "basic"}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        {fileName ? (
          <View style={styles.fileRow}>
            <Text style={styles.fileName}>{fileName}</Text>
            <Button
              appearance="ghost"
              status="basic"
              accessoryLeft={(props) => (
                <Icon {...props} name="trash-outline" />
              )}
              onPress={handleRemoveFile}
              style={styles.trashButton}
            />
          </View>
        ) : (
          <View style={styles.uploadContainer}>
            <Files />
            <Text>Upload your JSON or Bech32 file</Text>
            <Button onPress={pickDocument}>Select File</Button>
          </View>
        )}

        <Button
          onPress={() => {
            /* TODO: Handle import */
          }}
          disabled={!accountName || !fileName}
        >
          Continue
        </Button>
      </View>
    </Layout>
  );
}
