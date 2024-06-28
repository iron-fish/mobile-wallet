import "../../globals";

import { Button } from "@ironfish/ui";
import { View, Text } from "react-native";
import { generateForks } from "../../data/api/walletServer";
import { wallet } from "../../data/wallet/wallet";

import { Network } from "../../data/constants";

export default function Contacts() {
  return (
    <View>
      <Text>Contacts</Text>
      <Button
        onPress={() => {
          wallet.scan(Network.TESTNET);
        }}
      >
        Request Blocks
      </Button>
      <Button
        onPress={() => {
          generateForks();
        }}
      >
        Generate Forks
      </Button>
    </View>
  );
}
