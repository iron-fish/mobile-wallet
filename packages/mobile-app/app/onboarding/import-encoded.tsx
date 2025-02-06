import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { Button, Input, Layout, Modal, Text } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useFacade } from "../../data/facades";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  inputContainer: {
    gap: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 8,
    alignItems: "center",
    gap: 16,
  },
});

export default function ImportEncoded() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [encodedAccount, setEncodedAccount] = useState("");

  const facade = useFacade();
  const importAccount = facade.importAccount.useMutation();

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <Text category="h5" style={{ textAlign: "center" }}>
          Import Encoded Account
        </Text>

        <Text>
          Paste the complete string into the provided text field below.
        </Text>

        <View style={styles.inputContainer}>
          <Input
            label="Account Name"
            placeholder="Enter account name"
            value={accountName}
            onChangeText={setAccountName}
          />

          <Input
            label="Encoded Key"
            placeholder="Paste encoded key here"
            value={encodedAccount}
            onChangeText={setEncodedAccount}
            multiline
          />
        </View>

        <Button
          onPress={async () => {
            await importAccount.mutateAsync({
              account: encodedAccount,
              name: accountName,
            });
            setModalVisible(true);
          }}
        >
          Import Account
        </Button>
      </View>

      <Modal visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text category="h6">Account Imported!</Text>
            <Text>
              Before you start managing your digital assets, we need to scan the
              blockchain. This may take some time.
            </Text>
            <Button
              onPress={() => {
                router.push("/(tabs)/");
                setModalVisible(false);
              }}
            >
              Let's go!
            </Button>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </Layout>
  );
}
