import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, Button, TextInput } from "react-native";
import { useFacade } from "../../data/facades";
import { useState } from "react";
import { IRON_ASSET_ID_HEX } from "../../data/constants";
import { CurrencyUtils } from "@ironfish/sdk";
import { useQueries } from "@tanstack/react-query";
import { Asset } from "@/data/facades/chain/types";
import { AccountBalance } from "@/data/facades/wallet/types";

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

  const [selectedAssetId, setSelectedAssetId] =
    useState<string>(IRON_ASSET_ID_HEX);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [customFee, setCustomFee] = useState<string>("");
  const [selectedFee, setSelectedFee] = useState<"default" | "custom">(
    "default",
  );

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

  const getCustomAssets = useQueries({
    queries:
      getAccountResult.data?.balances.custom.map((b: AccountBalance) => {
        return {
          refetchInterval: 1000,
          queryFn: () => facade.getAsset.resolver({ assetId: b.assetId }),
          queryKey: facade.getAsset.buildQueryKey({ assetId: b.assetId }),
        };
      }) ?? [],
  });

  const assetMap = new Map<string, Asset>();
  for (const asset of getCustomAssets) {
    if (asset.data) {
      assetMap.set(asset.data.id, asset.data);
    }
  }

  const sendTransaction = facade.sendTransaction.useMutation();

  return (
    <View style={styles.container}>
      {isValidPublicAddress.data === false && <Text>Invalid recipient</Text>}
      <Text>Select asset</Text>
      <Button
        title={`IRON (${CurrencyUtils.render(getAccountResult.data?.balances.iron.available ?? "0")}) ${selectedAssetId === IRON_ASSET_ID_HEX ? "(selected)" : ""}`}
        onPress={() => setSelectedAssetId(IRON_ASSET_ID_HEX)}
      />
      {getAccountResult.data?.balances.custom.map((b) => {
        const asset = assetMap.get(b.assetId);
        return (
          <Button
            key={b.assetId}
            title={`${asset?.name} (${CurrencyUtils.render(b.available, false, b.assetId, asset?.verification.status === "verified" ? asset.verification : undefined)}) ${selectedAssetId === b.assetId ? "(selected)" : ""}`}
            onPress={() => setSelectedAssetId(b.assetId)}
          />
        );
      })}
      <TextInput
        placeholder="Recipient"
        value={selectedRecipient}
        onChangeText={setSelectedRecipient}
      />
      <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} />
      <Text style={{ fontSize: 20 }}>Fees</Text>
      <Button
        title={`Default${selectedFee === "default" ? " (selected)" : ""}`}
        onPress={() => setSelectedFee("default")}
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
            fee: selectedFee === "default" ? undefined : customFee,
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
