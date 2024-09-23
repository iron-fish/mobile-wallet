import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, Button, TextInput } from "react-native";
import { useFacade } from "../../data/facades";
import { useState } from "react";

const isValidBigInt = (num: string) => {
  if (num.length === 0) return false;
  try {
    const bi = BigInt(num);
    return bi > 0;
  } catch {
    return false;
  }
};

export default function Send() {
  const facade = useFacade();

  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c",
  );
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [customFee, setCustomFee] = useState<string>("");
  const [selectedFee, setSelectedFee] = useState<
    "slow" | "average" | "fast" | "custom"
  >("average");

  const getAccountResult = facade.getAccount.useQuery(
    {},
    {
      refetchInterval: 1000,
    },
  );

  const isValidPublicAddress = facade.isValidPublicAddress.useQuery(
    {
      address: selectedRecipient,
    },
    {
      enabled: selectedRecipient.length > 0,
    },
  );

  const estimatedFees = facade.getEstimatedFees.useQuery(
    {
      accountName: getAccountResult.data?.name ?? "",
      outputs: [{ amount, assetId: selectedAssetId }],
    },
    {
      enabled: () => {
        return !!getAccountResult.data && isValidBigInt(amount);
      },
    },
  );

  const sendTransaction = facade.sendTransaction.useMutation();

  return (
    <View style={styles.container}>
      {isValidPublicAddress.data === false && <Text>Invalid recipient</Text>}
      {estimatedFees.isError && (
        <Text>Error: {estimatedFees.error.message}</Text>
      )}
      <Text>Select asset</Text>
      <Button
        title={`IRON (${getAccountResult.data?.balances.iron.available ?? 0}) ${selectedAssetId === "51f33a2f14f92735e562dc658a5639279ddca3d5079a6d1242b2a588a9cbf44c" ? "(selected)" : ""}`}
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
      <Text style={{ fontSize: 20 }}>Fees</Text>
      <Button
        title={`Slow: ${estimatedFees.data?.slow ?? ""}${selectedFee === "slow" ? " (selected)" : ""}`}
        onPress={() => setSelectedFee("slow")}
      />
      <Button
        title={`Average: ${estimatedFees.data?.average ?? ""}${selectedFee === "average" ? " (selected)" : ""}`}
        onPress={() => setSelectedFee("average")}
      />
      <Button
        title={`Fast: ${estimatedFees.data?.fast ?? ""}${selectedFee === "fast" ? " (selected)" : ""}`}
        onPress={() => setSelectedFee("fast")}
      />
      <TextInput
        placeholder="Custom fee"
        value={customFee}
        onChangeText={setCustomFee}
      />
      <Button
        title={`Custom${selectedFee === "custom" ? " (selected)" : ""}`}
        onPress={() => setSelectedFee("custom")}
      />

      <Button
        title="Send"
        disabled={
          isValidPublicAddress.data !== true ||
          !estimatedFees.isSuccess ||
          (selectedFee === "custom" && !isValidBigInt(customFee))
        }
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
