import { Button } from "@ironfish/ui";
import { View, Text } from "react-native";
import { syncer } from "../../data/syncer"

export default function Contacts() {
  return (
    <View>
      <Text>Contacts</Text>
      <Button onPress={() => {
        syncer.requestBlocks()
      }}>Request Blocks</Button>
    </View>
  );
}
