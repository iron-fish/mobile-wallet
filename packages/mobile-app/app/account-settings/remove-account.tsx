import { StatusBar } from "expo-status-bar";
import { Button, Modal, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFacade } from "../../data/facades";

export default function RemoveAccount() {
  const router = useRouter();
  const facade = useFacade();
  const qc = useQueryClient();

  const { accountName } = useLocalSearchParams<{ accountName: string }>();

  const removeAccount = facade.removeAccount.useMutation({
    onSuccess: async () => {
      await qc.invalidateQueries();
    },
  });

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.container}>
          <Text>Are you sure?</Text>
          <Button
            title="Yes, remove account"
            onPress={async () => {
              await removeAccount.mutateAsync({ name: accountName });
              setModalVisible(false);
              router.dismissAll();
            }}
          />
          <Button
            title="I changed my mind"
            onPress={() => setModalVisible(false)}
          />
        </View>
      </Modal>
      <Button title="Back" onPress={() => router.dismissAll()} />
      <Text>Remove Account</Text>
      <Text>
        Even though you are removing this account, you’re still able to import
        it at another time. Please be sure to backup your accounts.
      </Text>
      <Button title="Remove" onPress={() => setModalVisible(true)} />
      <Button title="Cancel" onPress={() => router.dismiss()} />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
