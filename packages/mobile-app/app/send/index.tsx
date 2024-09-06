import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, Button, TextInput } from "react-native";
import { useFacade } from "../../data/facades";
import { useState } from "react";

export default function Send() {
  const facade = useFacade();

  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
  );
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const getAccountResult = facade.getAccount.useQuery(
    {},
    {
      refetchInterval: 1000,
    },
  );

  const sendTransaction = facade.sendTransaction.useMutation();

  return (
    <View style={styles.container}>
      <Text>Select asset</Text>
      <Button
        title={`IRON (${getAccountResult.data?.balances.iron.confirmed ?? 0}) ${selectedAssetId === "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c" ? "(selected)" : ""}`}
        onPress={() =>
          setSelectedAssetId(
            "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
          )
        }
      />
      {getAccountResult.data?.balances.custom.map((b) => (
        <Button
          key={b.assetId}
          title={`${b.assetId} (${b.confirmed ?? 0}) ${selectedAssetId === b.assetId ? "(selected)" : ""}`}
          onPress={() => setSelectedAssetId(b.assetId)}
        />
      ))}
      <TextInput
        placeholder="Recipient"
        value={selectedRecipient}
        onChangeText={setSelectedRecipient}
      />
      <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} />
      <Button
        title="Send"
        onPress={() => {
          sendTransaction.mutate({
            accountName: getAccountResult.data?.name ?? "",
            outputs: [
              {
                amount,
                memoHex: "",
                publicAddress: selectedRecipient,
                assetId: selectedAssetId,
              },
            ],
            fee: "1",
          });
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
