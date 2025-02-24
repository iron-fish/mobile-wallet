import { StyleSheet, View } from "react-native";
import {
  Button,
  Input,
  Text,
  Card,
  Modal,
  Spinner,
  Icon,
} from "@ui-kitten/components";
import { useState } from "react";
import { useFacade } from "@/data/facades";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Files } from "@/svgs/Files";
import React from "react";
import { TermsOfService } from "../TermsOfService/TermsOfService";

type FileImportProps = {
  onSuccess: () => void;
  showSuccessModal?: boolean;
};

const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <Spinner size="small" status="basic" />
  </View>
);

export function FileImport({
  onSuccess,
  showSuccessModal = false,
}: FileImportProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  const facade = useFacade();
  const importAccount = facade.importAccount.useMutation();

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
        setError("");
      }
    } catch (err) {
      console.log("DocumentPicker Error:", err);
      setError("Error reading file. Please try again.");
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
    setFileContent(null);
    setError("");
  };

  const handleImport = async () => {
    if (!fileContent) {
      setError("Please select a valid file");
      return;
    }

    try {
      await importAccount.mutateAsync({
        account: fileContent,
        name: accountName,
      });

      if (showSuccessModal) {
        setModalVisible(true);
      } else {
        onSuccess();
      }
    } catch (error) {
      setError(
        "Failed to import account. Please check your file and try again.",
      );
    }
  };

  return (
    <React.Fragment>
      {showSuccessModal && (
        <Modal
          visible={modalVisible}
          backdropStyle={styles.backdrop}
          onBackdropPress={() => setModalVisible(false)}
        >
          <Card disabled style={styles.modalCard}>
            <Text category="h6" style={styles.modalTitle}>
              Account Imported!
            </Text>
            <Text style={styles.modalText} appearance="hint">
              Before you start managing your digital assets, we need to scan the
              blockchain. This may take some time.
            </Text>
            <Button
              onPress={() => {
                setModalVisible(false);
                onSuccess();
              }}
              style={styles.modalButton}
            >
              Let's go!
            </Button>
          </Card>
        </Modal>
      )}

      <Card disabled style={styles.card}>
        <Text category="h6" style={styles.title}>
          File Import
        </Text>

        <Input
          label="Account Name"
          placeholder="Enter account name"
          value={accountName}
          onChangeText={setAccountName}
          style={styles.input}
          size="large"
        />

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
          </View>
        ) : (
          <View style={styles.uploadContainer}>
            <Files />
            <Text>Upload your JSON or Bech32 file</Text>
            <Button onPress={pickDocument}>Select File</Button>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TermsOfService checked={confirmChecked} onChange={setConfirmChecked} />

        <Button
          style={styles.button}
          size="large"
          onPress={handleImport}
          accessoryLeft={importAccount.isPending ? LoadingIndicator : undefined}
          disabled={
            importAccount.isPending ||
            !fileContent ||
            !accountName ||
            !confirmChecked
          }
        >
          {importAccount.isPending ? "Importing..." : "Import Account"}
        </Button>
      </Card>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
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
    marginBottom: 16,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FC",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  fileName: {
    flex: 1,
  },
  trashButton: {
    padding: 8,
  },
  button: {
    marginTop: 8,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalCard: {
    borderRadius: 12,
    margin: 24,
    padding: 16,
  },
  modalTitle: {
    textAlign: "center",
    marginVertical: 16,
  },
  modalText: {
    textAlign: "center",
    marginBottom: 24,
  },
  modalButton: {
    marginTop: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 16,
  },
});
