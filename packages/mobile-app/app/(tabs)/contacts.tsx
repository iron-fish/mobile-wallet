import { View, Text, Button, StyleSheet, Modal, TextInput } from "react-native";

import { StatusBar } from "expo-status-bar";
import { LinkButton } from "../../components/LinkButton";
import { useState } from "react";

export default function Contacts() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.container}>
          <Text>Add Contact</Text>
          <TextInput placeholder="Name" />
          <TextInput placeholder="Address" />
          <TextInput placeholder="Add note (Optional)" />
          <Button title="Add Contact" onPress={() => setModalVisible(false)} />
          <Button title="Close" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
      <LinkButton title="Menu" href="/menu/" />
      <Button title="Add" onPress={() => setModalVisible(true)} />

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
