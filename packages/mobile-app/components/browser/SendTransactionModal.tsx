import { IRON_ASSET_ID_HEX, Network } from "@/data/constants";
import { Output } from "@/data/facades/wallet/types";
import { oreoWallet } from "@/data/wallet/oreowalletWallet";
import { StyleSheet, View } from "react-native";
import { useState, useEffect, useRef } from "react";
import { CurrencyUtils, RawTransaction } from "@ironfish/sdk";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Button, Card, Layout, Spinner, Text } from "@ui-kitten/components";
import { useFacade } from "@/data/facades";
import { useQueries } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Asset } from "@/data/facades/chain/types";
import { setStringAsync } from "expo-clipboard";

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
  network,
  sendTransactionData,
  renderBackdrop,
  cancel,
  success,
}: {
  network: string;
  sendTransactionData: GeneralTransactionData | null;
  renderBackdrop: (props: any) => React.JSX.Element;
  cancel: () => void;
  success: (hash: string) => void;
}) {
  const facade = useFacade();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const [displayMessage, setDisplayMessage] = useState<DisplayMessage | null>(
    null,
  );
  const [rawTxn, setRawTxn] = useState<RawTransaction | null>(null);

  const assetIds = [
    ...new Set(
      rawTxn?.outputs.map((o) => o.note.assetId().toString("hex")) ?? [],
    ),
  ];

  const assetQueries = useQueries({
    queries:
      assetIds.map((assetId) => ({
        queryKey: facade.getAsset.buildQueryKey({ assetId }),
        queryFn: () => facade.getAsset.resolver({ assetId }),
      })) ?? [],
  });

  const assetMap = new Map<
    string,
    { name: string; image?: string; asset: Asset }
  >();
  for (const a of assetQueries) {
    if (a.data) {
      assetMap.set(a.data.id, {
        name:
          a.data?.verification.status === "verified"
            ? a.data.verification.symbol
            : a.data.name,
        image:
          a.data?.verification.status === "verified"
            ? a.data.verification.logoURI
            : undefined,
        asset: a.data,
      });
    }
  }

  const assetBalanceDeltas = new Map();
  if (rawTxn) {
    assetBalanceDeltas.set(IRON_ASSET_ID_HEX, rawTxn?.fee);
    for (const o of rawTxn.outputs) {
      if (o.note.owner() !== o.note.sender()) {
        const assetId = o.note.assetId().toString("hex");
        const currentBalance = assetBalanceDeltas.get(assetId) ?? 0n;
        assetBalanceDeltas.set(assetId, currentBalance + o.note.value());
      }
    }
  }

  useEffect(() => {
    if (sendTransactionData) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [sendTransactionData]);

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
        return (
          <Layout
            style={{
              marginTop: 16,
              marginBottom: 64,
              alignItems: "center",
              gap: 16,
            }}
          >
            <Text category="s1" style={{ textAlign: "center" }}>
              {displayMessage.message}
            </Text>
            <Spinner size="large" />
          </Layout>
        );
      } else if (displayMessage.type === "error") {
        return (
          <Layout
            style={{
              marginTop: 16,
              marginBottom: 32,
              gap: 32,
            }}
          >
            <Layout style={{ gap: 8 }}>
              <Text category="h6">Error</Text>
              <Text>{displayMessage.message}</Text>
            </Layout>
            <Button onPress={cancel} appearance="outline">
              Close
            </Button>
          </Layout>
        );
      } else if (displayMessage.type === "success") {
        return (
          <Layout
            style={{
              marginTop: 16,
              marginBottom: 16,
              gap: 32,
            }}
          >
            <Layout style={{ gap: 8 }}>
              <Text category="h6">Transaction Sent</Text>
              <Text>{displayMessage.message}</Text>
              <Text>Transaction Hash: {displayMessage.hash}</Text>
            </Layout>
            <Layout style={{ gap: 8 }}>
              <Button
                onPress={() => setStringAsync(displayMessage.hash)}
                appearance="outline"
              >
                Copy Transaction Hash
              </Button>
              <Button
                onPress={() => success(displayMessage.hash)}
                appearance="outline"
              >
                Close
              </Button>
            </Layout>
          </Layout>
        );
      }
    }

    if (rawTxn !== null) {
      return (
        <>
          <Layout
            style={{
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Text category="s1">Account</Text>
            <Layout style={{ flex: 1 }}>
              <Text category="s1" numberOfLines={1}>
                {sendTransactionData?.from}
              </Text>
              <Text
                category="s1"
                appearance="hint"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {rawTxn.outputs[0].note.sender()}
              </Text>
            </Layout>
          </Layout>
          <View style={{ gap: 8 }}>
            <Text category="s1">Outputs</Text>
            {rawTxn.outputs?.map((o, i) => {
              let memo;
              try {
                memo = new TextDecoder().decode(o.note.memo());
              } catch {
                memo = o.note.memo().toString("hex");
              }
              const asset = assetMap.get(o.note.assetId().toString("hex"));
              return (
                <Card key={i}>
                  <Layout style={{ flexDirection: "row", gap: 12 }}>
                    <Layout style={styles.assetBadge}>
                      <Image source={asset?.image} style={styles.assetBadge} />
                    </Layout>
                    <Layout style={{ flexDirection: "column", flex: 1 }}>
                      <Layout
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          gap: 4,
                        }}
                      >
                        <Text
                          category="s1"
                          numberOfLines={1}
                          style={{ flex: 1 }}
                        >
                          {asset?.name ?? o.note.assetId().toString("hex")}
                        </Text>
                        <Text
                          category="s1"
                          style={{
                            flexShrink: 0,
                          }}
                        >
                          {CurrencyUtils.render(
                            o.note.value(),
                            false,
                            o.note.assetId().toString("hex"),
                            asset?.asset.verification.status === "verified"
                              ? asset.asset.verification
                              : undefined,
                          )}
                        </Text>
                      </Layout>
                      <Text category="p2" appearance="hint">
                        {`To: ${o.note.owner()}`}
                      </Text>
                      <Text category="p2" appearance="hint">
                        {`Memo: ${memo}`}
                      </Text>
                    </Layout>
                  </Layout>
                </Card>
              );
            })}
          </View>
          <Layout style={{ gap: 4 }}>
            <Layout
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 4,
              }}
            >
              <Text category="s1" appearance="hint">
                Network Fee
              </Text>
              <Text category="s1" appearance="hint">
                {CurrencyUtils.render(rawTxn.fee, false)} IRON
              </Text>
            </Layout>
            <Layout
              style={{
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Text category="s1">Total</Text>
              <Layout style={{ flex: 1, alignItems: "flex-end" }}>
                {[...assetBalanceDeltas.entries()].map(([assetId, delta]) => {
                  const asset = assetMap.get(assetId);
                  return (
                    <Text key={assetId} category="s1">
                      {`${CurrencyUtils.render(delta, false, assetId)} ${asset?.name ?? assetId}`}
                    </Text>
                  );
                })}
              </Layout>
            </Layout>
          </Layout>

          <Layout style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
            <Button onPress={cancel} style={{ flex: 1 }} appearance="outline">
              Cancel
            </Button>
            <Button
              disabled={!!displayMessage}
              onPress={async () => {
                if (!sendTransactionData) return;
                setDisplayMessage({
                  type: "loading",
                  message:
                    "Building the transaction. This may take a minute...",
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
              style={{ flex: 1 }}
            >
              Send
            </Button>
          </Layout>
        </>
      );
    }

    return <Text>No transaction data</Text>;
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={["50%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={
        displayMessage && displayMessage.type === "success"
          ? () => success(displayMessage.hash)
          : cancel
      }
      backgroundStyle={styles.bottomSheetModal}
    >
      <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
        <Layout style={{ flexDirection: "row", gap: 8 }}>
          <Image
            source={network + "favicon.ico"}
            style={{ width: 48, height: 48 }}
          />
          <Layout style={{ gap: 2 }}>
            <Text category="h5">Send Transaction</Text>
            <Text category="s2" appearance="hint">
              {network}
            </Text>
          </Layout>
        </Layout>
        {renderBody()}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  assetBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E1E1E1",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomSheetModal: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,

    elevation: 12,
  },
  bottomSheetContent: {
    padding: 16,
    gap: 16,
  },
  modalSubtitle: {
    textAlign: "center",
  },
});
