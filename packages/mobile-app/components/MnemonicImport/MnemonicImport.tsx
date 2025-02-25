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
import { TermsOfService } from "../TermsOfService/TermsOfService";

type MnemonicImportProps = {
  onSuccess: () => void;
  showSuccessModal?: boolean;
};

const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <Spinner size="small" status="basic" />
  </View>
);

export function MnemonicImport({
  onSuccess,
  showSuccessModal = false,
}: MnemonicImportProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  const facade = useFacade();
  const importAccount = facade.importAccount.useMutation();

  const validatePhrase = (text: string) => {
    const words = text.trim().split(/\s+/);
    return words.length === 24;
  };

  const handleImport = async () => {
    if (!validatePhrase(phrase)) {
      setError("Please enter all 24 words of your mnemonic phrase");
      return;
    }

    try {
      await importAccount.mutateAsync({
        account: phrase,
        name: accountName,
      });

      if (showSuccessModal) {
        setModalVisible(true);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      setError(
        "Failed to import account. Please check your mnemonic phrase and try again.",
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
          Mnemonic Phrase Import
        </Text>

        <Text appearance="hint" style={styles.description}>
          Enter your 24 word mnemonic phrase to restore your account
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
          label="Mnemonic Phrase"
          placeholder="Enter your 24 word mnemonic phrase"
          value={phrase}
          onChangeText={(text) => {
            setPhrase(text);
            setError("");
          }}
          style={styles.input}
          size="large"
          multiline
          textStyle={styles.phraseInput}
          status={error ? "danger" : "basic"}
        />

        <TermsOfService checked={confirmChecked} onChange={setConfirmChecked} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          style={styles.button}
          size="large"
          onPress={handleImport}
          accessoryLeft={importAccount.isPending ? LoadingIndicator : undefined}
          disabled={
            importAccount.isPending ||
            !phrase ||
            !accountName ||
            !confirmChecked
          }
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
  phraseInput: {
    minHeight: 120,
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
