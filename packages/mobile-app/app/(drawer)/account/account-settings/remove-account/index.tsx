import React from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useState } from "react";
import { useFacade } from "@/data/facades";
import { Button, Card, Layout, Modal, Text } from "@ui-kitten/components";
import { RemoveAccount as RemoveAccountIcon } from "@/svgs/RemoveAccount";

export default function RemoveAccount() {
  const router = useRouter();
  const facade = useFacade();
  const { accountName } = useLocalSearchParams<{ accountName: string }>();
  const removeAccount = facade.removeAccount.useMutation();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Remove Account",
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
              Are you sure?
            </Text>
            <Button
              style={[styles.modalButton, styles.removeButton]}
              onPress={async () => {
                await removeAccount.mutateAsync({ name: accountName });
                setModalVisible(false);
                router.dismissAll();
              }}
            >
              Yes, remove account
            </Button>
            <Button
              style={styles.modalButton}
              appearance="ghost"
              onPress={() => setModalVisible(false)}
            >
              I changed my mind
            </Button>
          </Card>
        </Modal>

        <View style={styles.content}>
          <View style={styles.ctaContainer}>
            <RemoveAccountIcon />
            <Text category="s1" style={styles.title}>
              Remove Account:
            </Text>
            <Text category="s1" style={styles.accountName}>
              {accountName}
            </Text>

            <Text style={styles.description} appearance="hint">
              Even though you are removing this account, you're still able to
              import it at another time. Please be sure to backup your accounts.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              style={[styles.button, styles.removeButton]}
              onPress={() => setModalVisible(true)}
            >
              Remove
            </Button>
            <Button
              style={styles.button}
              appearance="ghost"
              status="basic"
              onPress={() => router.dismiss()}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    gap: 16,
    justifyContent: "space-between",
  },
  ctaContainer: {
    alignItems: "center",
    gap: 8,
    marginTop: 40,
  },
  title: {
    textAlign: "center",
    letterSpacing: 0.8,
    fontSize: 24,
  },
  accountName: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 0.8,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 8,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
  },
  removeButton: {
    backgroundColor: "#F15929",
    borderColor: "#F15929",
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
    marginBottom: 24,
  },
  modalButton: {
    marginTop: 8,
    borderRadius: 8,
  },
});
