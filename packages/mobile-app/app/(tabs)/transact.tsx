import { SafeAreaView } from "react-native";
import { Text } from "react-native";
import { LinkButton } from "../../components/LinkButton";

/**
 * This is a placeholder page to show a modal with the Transact options.
 */
export default function Transact() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Transact</Text>
      <LinkButton title="Receive" href="/address/" />
      <Text>Receive assets from another wallet</Text>
      <LinkButton title="Send" href="/send/" />
      <Text>Send assets to another wallet</Text>
    </SafeAreaView>
  );
}
