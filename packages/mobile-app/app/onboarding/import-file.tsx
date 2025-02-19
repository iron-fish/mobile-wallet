import { StyleSheet, View } from "react-native";
import { Button, Input, Layout, Text, Icon } from "@ui-kitten/components";
import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useFacade } from "@/data/facades";
import * as FileSystem from "expo-file-system";

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
  const router = useRouter();
  const facade = useFacade();
  const importAccount = facade.importAccount.useMutation();

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [nameError, setNameError] = useState("");
  const [fileError, setFileError] = useState("");

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain"],
      });

      if (!result.canceled) {
        setFileName(result.assets[0].name);
        const content = await FileSystem.readAsStringAsync(
          result.assets[0].uri,
        );
        setFileContent(content);
        setFileError("");
      }
    } catch (err) {
      console.log("DocumentPicker Error:", err);
      setFileError("Error reading file. Please try again.");
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
    setFileContent(null);
    setFileError("");
  };

  const handleContinue = async () => {
    let hasError = false;

    if (accountName.length < 3) {
      setNameError("Account name must be at least 3 characters");
      hasError = true;
    }

    if (!fileContent) {
      setFileError("Please select a valid file");
      hasError = true;
    }

    if (hasError) return;

    try {
      await importAccount.mutateAsync({
        account: fileContent,
        name: accountName,
      });
      router.replace("/(drawer)/account");
    } catch (error) {
      console.error("Import error:", error);
      // Handle other errors
      setFileError(
        "Failed to import account. Please check your file and try again.",
      );
    }
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
          <View>
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
            {fileError ? (
              <Text style={styles.errorText}>{fileError}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.uploadContainer}>
            <Files />
            <Text>Upload your JSON or Bech32 file</Text>
            <Button onPress={pickDocument}>Select File</Button>
            {fileError ? (
              <Text style={styles.errorText}>{fileError}</Text>
            ) : null}
          </View>
        )}

        <Button
          onPress={handleContinue}
          disabled={!accountName || !fileContent || importAccount.isPending}
        >
          {importAccount.isPending ? "Importing..." : "Continue"}
        </Button>
      </View>
    </Layout>
  );
}
