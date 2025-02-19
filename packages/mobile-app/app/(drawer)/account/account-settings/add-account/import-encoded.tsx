import { StatusBar } from "expo-status-bar";
import { Button, Modal, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useFacade } from "@/data/facades";

export default function ImportEncoded() {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [accountName, setAccountName] = useState("Account Name");
  const [encodedAccount, setEncodedAccount] = useState("");

  const facade = useFacade();

  const importAccount = facade.importAccount.useMutation();

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.container}>
          <Text>Account Imported!</Text>
          <Text>
            Before you start managing your digital assets, we need to scan the
            blockchain. This may take some time.
          </Text>
          <Button
            title="Let's go!"
            onPress={async () => {
              router.dismissAll();
              setModalVisible(false);
            }}
          />
        </View>
      </Modal>
      <Text>Paste the complete string into the provided text field below.</Text>
      <TextInput
        placeholder="Account Name"
        value={accountName}
        onChangeText={setAccountName}
      />
      <TextInput
        placeholder="Encoded Key"
        value={encodedAccount}
        onChangeText={setEncodedAccount}
      />
      <Button
        title="Continue"
        onPress={async () => {
          await importAccount.mutateAsync({
            account: encodedAccount,
            name: accountName,
          });
          setModalVisible(true);
        }}
      />
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
