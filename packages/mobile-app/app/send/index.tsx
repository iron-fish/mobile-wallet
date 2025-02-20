import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import React, { useState, useMemo } from "react";
import { useFacade } from "../../data/facades";
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
import Rubics from "../../svgs/Rubics";
import { useRouter, Stack } from "expo-router";
import {
  isValidBigInt,
  convertAmountToMinor,
  isValidAmount,
  enforceDecimals,
  getAssetDecimals,
} from "../../utils/send.utils";

const CheckIcon = (props: IconProps) => (
  <Icon {...props} name="checkmark-outline" />
);

// First add a new type for the transaction state
type TransactionState = "sending" | "sent" | "idle";

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
  const [sentTxHash, setSentTxHash] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [transactionState, setTransactionState] =
    useState<TransactionState>("idle");

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

  // Add the mutation
  const sendTransactionMutation = facade.sendTransaction.useMutation();

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

  // Add amount validation
  const amountError = useMemo(() => {
    if (!amount) return undefined;

    if (!isValidAmount(amount, selectedAssetId, assetMap)) {
      const asset =
        selectedAssetId === IRON_ASSET_ID_HEX
          ? undefined
          : assetMap.get(selectedAssetId);
      const decimals = getAssetDecimals(asset) ?? 8;
      return `Maximum ${decimals} decimal places allowed`;
    }

    return undefined;
  }, [amount, selectedAssetId, assetMap]);

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
          const sanitized = enforceDecimals(value, selectedAssetId, assetMap);
          setAmount(sanitized);
        }}
        style={styles.input}
        status={amountError ? "danger" : "basic"}
        caption={
          amountError ||
          (assetMap.get(selectedAssetId)?.verification.status === "unverified"
            ? "No decimals allowed"
            : `Up to ${
                selectedAssetId === IRON_ASSET_ID_HEX
                  ? "8"
                  : (getAssetDecimals(assetMap.get(selectedAssetId)) ?? "0")
              } decimal places`)
        }
        keyboardType="decimal-pad"
      />

      <Input
        label="Memo (Optional)"
        placeholder="Enter a memo for this transaction"
        value={memo}
        onChangeText={setMemo}
        style={styles.input}
        maxLength={100}
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
          transactionState !== "idle" ||
          isValidPublicAddress.data !== true ||
          !amount ||
          !!amountError ||
          (selectedFee === "custom" && !isValidBigInt(customFee))
        }
        onPress={async () => {
          try {
            setTransactionState("sending");

            const [amountInMinorUnits] =
              convertAmountToMinor(amount, selectedAssetId, assetMap) ?? [];

            if (!amountInMinorUnits) {
              throw new Error("Invalid amount");
            }

            const outputs = [
              {
                publicAddress: selectedRecipient,
                amount: amountInMinorUnits.toString(),
                memo: memo,
                assetId: selectedAssetId,
              },
            ];

            const fee = selectedFee === "custom" ? customFee : "1";

            const hash = await sendTransactionMutation.mutateAsync({
              accountName: getAccountResult.data?.name ?? "",
              outputs,
              fee,
            });

            setSentTxHash(hash);
            setTransactionState("sent");
          } catch (error) {
            console.error("Failed to send transaction:", error);
            setTransactionState("idle");
          }
        }}
      >
        SEND TRANSACTION
      </Button>

      <Modal visible={transactionState !== "idle"} style={styles.modal}>
        <Layout style={styles.modalContainer}>
          <View style={styles.svgContainer}>
            {transactionState === "sending" ? <Rubics /> : <SendConfirmed />}
          </View>
          <Text category="h1" style={styles.sentText}>
            {transactionState === "sending" ? "Sending..." : "Sent!"}
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
          {memo && (
            <Text category="s1" style={styles.memoText}>
              Memo: {memo}
            </Text>
          )}
          <View style={styles.buttonContainer}>
            {transactionState === "sent" && (
              <>
                <Button
                  appearance="filled"
                  style={styles.confirmButton}
                  onPress={() => {
                    setTransactionState("idle");
                    router.replace(`/transaction/${sentTxHash}`);
                  }}
                >
                  View Transaction
                </Button>
                <Button
                  appearance="outline"
                  style={styles.confirmButton}
                  onPress={() => {
                    setTransactionState("idle");
                    router.back();
                  }}
                >
                  Close
                </Button>
              </>
            )}
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
    width: "70%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  confirmButton: {
    marginBottom: 16,
    width: "100%",
  },
  memoText: {
    color: "gray",
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
});
