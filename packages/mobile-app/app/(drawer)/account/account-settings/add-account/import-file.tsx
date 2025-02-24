import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ScrollView } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useState } from "react";
import { useFacade } from "@/data/facades";
import {
  Layout,
  Text,
  Card,
  Button,
  Input,
  Modal,
  Spinner,
  Icon,
} from "@ui-kitten/components";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Files } from "@/svgs/Files";

const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <Spinner size="small" status="basic" />
  </View>
);

export default function ImportFile() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [error, setError] = useState("");

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
      setModalVisible(true);
    } catch (error) {
      setError(
        "Failed to import account. Please check your file and try again.",
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Account Import",
          headerBackTitle: "Back",
        }}
      />

      <Layout style={styles.container} level="1">
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
              onPress={async () => {
                router.dismissAll();
                setModalVisible(false);
              }}
              style={styles.modalButton}
            >
              Let's go!
            </Button>
          </Card>
        </Modal>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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

            <Button
              style={styles.button}
              size="large"
              onPress={handleImport}
              accessoryLeft={
                importAccount.isPending ? LoadingIndicator : undefined
              }
              disabled={importAccount.isPending || !fileContent || !accountName}
            >
              {importAccount.isPending ? "Importing..." : "Import Account"}
            </Button>
          </Card>
        </ScrollView>

        <StatusBar style="auto" />
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
