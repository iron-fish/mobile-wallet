import { StatusBar } from "expo-status-bar";
import { Button, Modal, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function MenuNetwork() {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Modal animationType="slide" visible={modalVisible}>
        <View style={styles.container}>
          <Text>Switch to Testnet?</Text>
          <Text>
            Switching networks requires a blockchain rescan, which may take time
            based on your last sync.
          </Text>
          <Button
            title="Yes, Change Network"
            onPress={() => setModalVisible(false)}
          />
          <Button
            title="I changed my mind"
            onPress={() => setModalVisible(false)}
          />
        </View>
      </Modal>
      <Button title="Back" onPress={() => router.dismiss()} />
      <Text>Mainnet</Text>
      <Text>
        The live blockchain network where real transactions with value occur.
      </Text>
      <Text>Testnet</Text>
      <Text>A separate environment for testing without real asset risks.</Text>
      <Button title="Change Network" onPress={() => setModalVisible(true)} />
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
