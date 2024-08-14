import { View, Text, Button } from "react-native";
import { wallet } from "../../data/wallet/wallet";

import { Network } from "../../data/constants";

export default function Contacts() {
  return (
    <View>
      <Text>Contacts</Text>
      <Button
        title="Request Blocks"
        onPress={() => {
          wallet.scan(Network.TESTNET);
        }}
      />
    </View>
  );
}
