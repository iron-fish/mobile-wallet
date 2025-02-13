import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
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
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Icon,
  IndexPath,
  IconProps,
  Modal,
} from "@ui-kitten/components";
import SendConfirmed from "../../svgs/SendConfirmed";
import { useRouter, Stack } from "expo-router";

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
  const router = useRouter();

  const [selectedAssetId, setSelectedAssetId] =
    useState<string>(IRON_ASSET_ID_HEX);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [customFee, setCustomFee] = useState<string>("");
  const [selectedFee, setSelectedFee] = useState<"default" | "custom">(
    "default",
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sentTxHash, setSentTxHash] = useState<string>("");

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
      <Stack.Screen options={{ headerTitle: "Send Transaction" }} />

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
            accessoryRight={index === selectedIndex.row ? CheckIcon : undefined}
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
          isValidPublicAddress.data === false ? "Invalid recipient address" : ""
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
        onChange={(index) => setSelectedFee(index === 0 ? "default" : "custom")}
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
          setShowConfirmation(true);
          setSentTxHash("mock_transaction_hash");
        }}
      >
        SEND TRANSACTION
      </Button>

      <Modal visible={showConfirmation} style={styles.modal}>
        <Layout style={styles.modalContainer}>
          <View style={styles.svgContainer}>
            <SendConfirmed />
          </View>
          <Text category="h1" style={styles.sentText}>
            Sent!
          </Text>
          <Text category="s1" style={styles.amountText}>
            {amount}{" "}
            {selectedAssetId === IRON_ASSET_ID_HEX
              ? "$IRON"
              : (assetMap.get(selectedAssetId)?.name ?? "Unknown")}{" "}
            to:
          </Text>
          <Text category="s1" style={styles.addressText}>
            {selectedRecipient}
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              appearance="filled"
              style={styles.confirmButton}
              onPress={() => {
                console.log("will navigate to", sentTxHash);
              }}
            >
              View Transaction
            </Button>
            <Button
              appearance="outline"
              style={styles.confirmButton}
              onPress={() => {
                setShowConfirmation(false);
                router.back();
              }}
            >
              Close
            </Button>
          </View>
        </Layout>
      </Modal>

      <StatusBar style="auto" />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
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
  modal: {
    width: "100%",
    height: "100%",
    margin: 0, // Remove default margin
  },
  modalContainer: {
    flex: 1,
    width: "100%",
    padding: 32,
    alignItems: "center",
    justifyContent: "center", // Center content vertically
  },
  sentText: {
    marginTop: 24,
    marginBottom: 16,
  },
  amountText: {
    marginBottom: 8,
  },
  addressText: {
    color: "gray",
    textAlign: "center",
    marginBottom: 32,
  },
  viewTxButton: {
    marginBottom: 16,
    width: "100%",
  },
  svgContainer: {
    width: "70%", // Make SVG slightly larger
    aspectRatio: 1,
  },
  buttonContainer: {
    width: "100%",
  },
  confirmButton: {
    marginBottom: 16,
    width: "100%",
  },
});
