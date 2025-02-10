import { Network } from "@/data/constants";
import { Output } from "@/data/facades/wallet/types";
import { oreoWallet } from "@/data/wallet/oreowalletWallet";
import { Button, Modal, SafeAreaView, Text, View } from "react-native";
import { useState, useEffect } from "react";
import { RawTransaction } from "@ironfish/sdk";

type Mint = {
  value: string;
  assetId?: string;
  name?: string;
  metadata?: string;
};

type Burn = {
  value: string;
  assetId: string;
};

type GeneralTransactionData = {
  from: string;
  fee?: string;
  outputs?: Output[];
  mints?: Mint[];
  burns?: Burn[];
};

type DisplayMessage =
  | { type: "loading"; message: string }
  | { type: "error"; message: string }
  | { type: "success"; hash: string; message: string };

export default function SendTransactionModal({
  sendTransactionData,
  cancel,
  success,
}: {
  sendTransactionData: GeneralTransactionData | null;
  cancel: () => void;
  success: (hash: string) => void;
}) {
  const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
    null,
  );
  const [rawTxn, setRawTxn] = useState<RawTransaction | null>(null);

  useEffect(() => {
    let cancel = false;

    setRawTxn(null);
    setDisplayMessage(
      sendTransactionData
        ? { type: "loading", message: "Fetching transaction info..." }
        : null,
    );

    const getRawTxn = async () => {
      if (!sendTransactionData) {
        setDisplayMessage(null);
        return;
      }

      try {
        const rawTxn = await oreoWallet.createTransaction(
          Network.TESTNET,
          sendTransactionData.from,
          sendTransactionData.outputs ?? [],
          sendTransactionData.fee,
        );

        if (!cancel) {
          setRawTxn(rawTxn);
          setDisplayMessage(null);
        }
      } catch (e) {
        setDisplayMessage({
          type: "error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    };
    getRawTxn();

    return () => {
      cancel = true;
    };
  }, [sendTransactionData]);

  const renderBody = () => {
    if (displayMessage) {
      if (displayMessage.type === "loading") {
        return <Text>{displayMessage.message}</Text>;
      } else if (displayMessage.type === "error") {
        return (
          <>
            <Text>{displayMessage.message}</Text>
            <Button title="Close" onPress={cancel} />
          </>
        );
      } else if (displayMessage.type === "success") {
        return (
          <>
            <Text>{displayMessage.message}</Text>
            <Text>{`Transaction hash: ${displayMessage.hash}`}</Text>
            <Button
              title="Close"
              onPress={() => success(displayMessage.hash)}
            />
          </>
        );
      }
    }

    if (rawTxn !== null) {
      return (
        <>
          <Text>
            {`From: ${sendTransactionData?.from} (${rawTxn.outputs[0].note.sender()})`}
          </Text>
          <Text>Fee: {rawTxn.fee.toString()}</Text>
          <View style={{ marginTop: 8 }}>
            <Text>Outputs</Text>
            {rawTxn.outputs?.map((o, i) => {
              let memo;
              try {
                console.log(o.note.memo());
                memo = new TextDecoder().decode(o.note.memo());
              } catch {
                memo = o.note.memo().toString("hex");
              }
              return (
                <View key={i}>
                  <Text>Output {i + 1}</Text>
                  <View style={{ marginLeft: 8 }}>
                    <Text>To: {o.note.owner()}</Text>
                    <Text>Amount: {o.note.value().toString()}</Text>
                    <Text>Asset: {o.note.assetId().toString("hex")}</Text>
                    <Text>Memo: {memo}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Button title="Cancel" onPress={cancel} />
          <Button
            title="Send"
            disabled={!!displayMessage}
            onPress={async () => {
              if (!sendTransactionData) return;
              setDisplayMessage({
                type: "loading",
                message: "Building the transaction. This may take a minute...",
              });
              try {
                const hash = await oreoWallet.postTransaction(
                  Network.TESTNET,
                  sendTransactionData.from,
                  rawTxn,
                );

                if (!hash) {
                  throw new Error(
                    "Failed to send the transaction. Please try again.",
                  );
                }

                setDisplayMessage({
                  type: "success",
                  hash,
                  message: "Transaction sent successfully.",
                });
              } catch (e) {
                setDisplayMessage({
                  type: "error",
                  message:
                    e instanceof Error
                      ? e.message
                      : "Failed to send the transaction. Please try again.",
                });
              }
            }}
          />
        </>
      );
    }

    return <Text>No transaction data</Text>;
  };

  return (
    <Modal
      animationType="slide"
      visible={sendTransactionData != null}
      onRequestClose={cancel}
    >
      <SafeAreaView>
        <View style={{ paddingTop: 40, paddingHorizontal: 4 }}>
          <Text>Send Transaction</Text>
          <Text>This website would like to send a transaction.</Text>
          {renderBody()}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
