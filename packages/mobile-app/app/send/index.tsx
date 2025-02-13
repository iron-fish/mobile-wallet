import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { useFacade } from "../../data/facades";
import { useState, useMemo } from "react";
import { IRON_ASSET_ID_HEX } from "../../data/constants";
import { CurrencyUtils } from "@ironfish/sdk";
import { useQueries } from "@tanstack/react-query";
import { Asset } from "@/data/facades/chain/types";
import { AccountBalance } from "@/data/facades/wallet/types";
import {
  Layout,
  Text,
  Button,
  Input,
  Card,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Icon,
  IndexPath,
  IconProps,
} from "@ui-kitten/components";

const isValidBigInt = (num: string) => {
  if (num.length === 0) return false;
  try {
    const bi = BigInt(num);
    return bi > 0;
  } catch {
    return false;
  }
};

const isValidAmount = (value: string, decimals: number) => {
  if (value.length === 0) return true;
  const parts = value.split(".");
  return parts.length <= 2 && (parts[1]?.length ?? 0) <= decimals;
};

const CheckIcon = (props: IconProps) => (
  <Icon {...props} name="checkmark-outline" />
);

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

  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    for (const asset of getCustomAssets) {
      if (asset.data) {
        map.set(asset.data.id, asset.data);
      }
    }
    return map;
  }, [getCustomAssets]);

  const sendTransaction = facade.sendTransaction.useMutation();

  // Create asset options for the select component
  const assetOptions = useMemo(() => {
    const options = [
      {
        id: IRON_ASSET_ID_HEX,
        title: `IRON (${CurrencyUtils.render(getAccountResult.data?.balances.iron.available ?? "0")})`,
      },
    ];

    getAccountResult.data?.balances.custom.forEach((b) => {
      const asset = assetMap.get(b.assetId);
      if (asset) {
        options.push({
          id: b.assetId,
          title: `${asset.name} (${CurrencyUtils.render(
            b.available,
            false,
            b.assetId,
            asset.verification.status === "verified"
              ? asset.verification
              : undefined,
          )})`,
        });
      }
    });

    return options;
  }, [getAccountResult.data, assetMap]);

  // Find the selected asset index
  const selectedIndex = useMemo(() => {
    return new IndexPath(
      assetOptions.findIndex((option) => option.id === selectedAssetId),
    );
  }, [selectedAssetId, assetOptions]);

  const decimals =
    selectedAssetId === IRON_ASSET_ID_HEX
      ? 8
      : assetMap.get(selectedAssetId)?.verification.status === "verified"
        ? (assetMap.get(selectedAssetId)?.verification.decimals ?? 0)
        : 0;

  return (
    <Layout style={styles.container} level="1">
      <Card style={styles.card}>
        <Text category="h5" style={styles.title}>
          Send Transaction
        </Text>

        <Select
          label="Select Asset"
          style={styles.select}
          selectedIndex={selectedIndex}
          onSelect={(index: IndexPath | IndexPath[]) => {
            if (index instanceof IndexPath) {
              const selected = assetOptions[index.row];
              setSelectedAssetId(selected.id);
            }
          }}
          value={assetOptions[selectedIndex.row]?.title}
        >
          {assetOptions.map((option, index) => (
            <SelectItem
              key={option.id}
              title={option.title}
              accessoryRight={
                index === selectedIndex.row ? CheckIcon : undefined
              }
              style={
                index === selectedIndex.row ? styles.selectedItem : undefined
              }
            />
          ))}
        </Select>

        <Input
          label="Recipient Address"
          placeholder="Enter recipient address"
          value={selectedRecipient}
          onChangeText={setSelectedRecipient}
          status={isValidPublicAddress.data === false ? "danger" : "basic"}
          caption={
            isValidPublicAddress.data === false
              ? "Invalid recipient address"
              : ""
          }
          style={styles.input}
        />

        <Input
          label="Amount"
          placeholder="Enter amount"
          value={amount}
          onChangeText={(value) => {
            if (isValidAmount(value, decimals)) {
              setAmount(value);
            }
          }}
          style={styles.input}
          keyboardType="numeric"
          caption={`Maximum ${decimals} decimal places`}
        />

        <Text category="s1" style={styles.sectionTitle}>
          Transaction Fee
        </Text>
        <RadioGroup
          selectedIndex={selectedFee === "default" ? 0 : 1}
          onChange={(index) =>
            setSelectedFee(index === 0 ? "default" : "custom")
          }
        >
          <Radio>Default Fee</Radio>
          <Radio>Custom Fee</Radio>
        </RadioGroup>

        {selectedFee === "custom" && (
          <Input
            label="Custom Fee Amount"
            placeholder="Enter custom fee"
            value={customFee}
            onChangeText={setCustomFee}
            status={
              !isValidBigInt(customFee) && customFee.length > 0
                ? "danger"
                : "basic"
            }
            style={styles.input}
            keyboardType="numeric"
          />
        )}

        <Button
          style={styles.sendButton}
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
        >
          SEND TRANSACTION
        </Button>
      </Card>
      <StatusBar style="auto" />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    margin: 2,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  select: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sendButton: {
    marginTop: 24,
  },
  selectedItem: {
    backgroundColor: "rgba(143, 155, 179, 0.08)", // Eva's light gray with low opacity
  },
});
