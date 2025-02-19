import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
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
} from "@ui-kitten/components";

const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <Spinner size="small" status="basic" />
  </View>
);

export default function ImportEncoded() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("Account Name");
  const [encodedAccount, setEncodedAccount] = useState("");

  const facade = useFacade();
  const importAccount = facade.importAccount.useMutation();

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
            value={encodedAccount}
            onChangeText={setEncodedAccount}
            style={styles.input}
            size="large"
            multiline
            textStyle={styles.encodedInput}
          />

          <Button
            style={styles.button}
            size="large"
            onPress={async () => {
              await importAccount.mutateAsync({
                account: encodedAccount,
                name: accountName,
              });
              setModalVisible(true);
            }}
            accessoryLeft={
              importAccount.isPending ? LoadingIndicator : undefined
            }
            disabled={
              importAccount.isPending || !encodedAccount || !accountName
            }
          >
            {importAccount.isPending ? "Importing..." : "Import Account"}
          </Button>
        </Card>

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
    minHeight: 80,
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
