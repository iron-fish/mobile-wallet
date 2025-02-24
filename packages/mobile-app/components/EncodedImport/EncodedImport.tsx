import { StyleSheet, View } from "react-native";
import {
  Button,
  Input,
  Text,
  Card,
  Modal,
  Spinner,
} from "@ui-kitten/components";
import { useState } from "react";
import { useFacade } from "@/data/facades";

type EncodedImportProps = {
  onSuccess: () => void;
  showSuccessModal?: boolean;
};

const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <Spinner size="small" status="basic" />
  </View>
);

export function EncodedImport({
  onSuccess,
  showSuccessModal = false,
}: EncodedImportProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [encodedKey, setEncodedKey] = useState("");
  const [error, setError] = useState("");

  const facade = useFacade();
  const importAccount = facade.importAccount.useMutation();

  const handleImport = async () => {
    if (!encodedKey.trim()) {
      setError("Please enter your encoded key");
      return;
    }

    try {
      await importAccount.mutateAsync({
        account: encodedKey,
        name: accountName,
      });

      if (showSuccessModal) {
        setModalVisible(true);
      } else {
        onSuccess();
      }
    } catch (error) {
      setError(
        "Failed to import account. Please check your encoded key and try again.",
      );
    }
  };

  return (
    <>
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
          Encoded Key Import
        </Text>

        <Text appearance="hint" style={styles.description}>
          Paste the complete string into the provided text field below.
        </Text>

        <Input
          label="Account Name"
          placeholder="Enter account name"
          value={accountName}
          onChangeText={setAccountName}
          style={styles.input}
          size="large"
        />

        <Input
          label="Encoded Key"
          placeholder="Paste your encoded key here"
          value={encodedKey}
          onChangeText={(text) => {
            setEncodedKey(text);
            setError("");
          }}
          style={styles.input}
          size="large"
          multiline
          textStyle={styles.encodedInput}
          status={error ? "danger" : "basic"}
          maxLength={2000}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          style={styles.button}
          size="large"
          onPress={handleImport}
          accessoryLeft={importAccount.isPending ? LoadingIndicator : undefined}
          disabled={importAccount.isPending || !encodedKey || !accountName}
        >
          {importAccount.isPending ? "Importing..." : "Import Account"}
        </Button>
      </Card>
    </>
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
    marginBottom: 8,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  encodedInput: {
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: "top",
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
