import { Modal, SafeAreaView, Button } from "react-native";
import { router } from "expo-router";
import { Text } from "react-native";
import { LinkButton } from "../../components/LinkButton";

/**
 * This is a placeholder page to show a modal with the Transact options.
 */
export default function Transact() {
  const isPresented = router.canGoBack();

  return (
    <Modal animationType="slide">
      <SafeAreaView style={{ flex: 1 }}>
        <Text>Transact</Text>
        <LinkButton title="Receive" href="/address/" />
        <Text>Receive assets from another wallet</Text>
        <LinkButton title="Send" href="/send/" />
        <Text>Send assets to another wallet</Text>
        {isPresented && <Button title="Close" onPress={() => router.back()} />}
      </SafeAreaView>
    </Modal>
  );
}
