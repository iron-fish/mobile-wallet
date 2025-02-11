import { StyleSheet, View } from "react-native";
import { Button, Layout, Modal, Text } from "@ui-kitten/components";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useFacade } from "../../../data/facades";

import { RemoveAccount as RemoveAccountIcon } from "@/svgs/RemoveAccount";

export default function RemoveAccount() {
  const router = useRouter();
  const facade = useFacade();
  const { accountName } = useLocalSearchParams<{ accountName: string }>();
  const removeAccount = facade.removeAccount.useMutation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleRemove = async () => {
    await removeAccount.mutateAsync({ name: accountName });
    setModalVisible(false);
    router.dismissAll();
  };

  return (
    <Layout style={styles.container}>
      {/* Confirmation Modal */}
      <Modal
        visible={modalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text category="h4" style={styles.modalTitle}>
            Are you sure?
          </Text>
          <Button
            style={styles.button}
            status="danger"
            onPress={handleRemove}
            disabled={removeAccount.isPending}
          >
            {removeAccount.isPending ? "Removing..." : "Yes, remove account"}
          </Button>
          <Button
            style={styles.button}
            appearance="ghost"
            onPress={() => setModalVisible(false)}
          >
            I changed my mind
          </Button>
        </View>
      </Modal>

      {/* Main Screen */}
      <View style={styles.content}>
        <RemoveAccountIcon />
        <Text category="h3" style={styles.title}>
          Remove Account:
        </Text>
        <Text category="h4" style={styles.subtitle}>
          {accountName}
        </Text>
        <Text style={styles.description}>
          Even though you are removing this account, you're still able to import
          it at another time. Please be sure to backup your accounts.
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            style={styles.button}
            status="danger"
            onPress={() => setModalVisible(true)}
          >
            Remove
          </Button>
          <Button
            style={styles.button}
            appearance="ghost"
            onPress={() => router.dismiss()}
          >
            Cancel
          </Button>
        </View>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    marginTop: 24,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    color: "#666",
    marginTop: 8,
  },
  buttonContainer: {
    width: "100%",
    marginTop: "auto",
    gap: 8,
  },
  button: {
    width: "100%",
  },
  // Modal styles
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    width: "90%",
    alignSelf: "center",
    gap: 16,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
});
