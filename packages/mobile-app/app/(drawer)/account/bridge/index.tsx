import { WebView } from "react-native-webview";
import { StyleSheet, View } from "react-native";
import { Button, Card, Layout, Text } from "@ui-kitten/components";
import { oreoWallet } from "@/data/wallet/oreowalletWallet";
import { Network } from "@/data/constants";
import { useCallback, useRef, useState } from "react";
import * as Uint8ArrayUtils from "@/utils/uint8Array";
import { useFacade } from "@/data/facades";
import { Output } from "@/data/facades/wallet/types";
import SendTransactionModal from "@/components/browser/SendTransactionModal";
import { Image } from "expo-image";
import Stack from "expo-router/stack";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { SettingsKey } from "@/data/settings/db";

type Message = {
  id: number;
  type: string;
  data: Record<string, unknown> | null;
};

const BRIDGE_URLS: Record<Network, string> = {
  [Network.MAINNET]: "https://bridge.ironfish.network/",
  [Network.TESTNET]: "https://testnet.bridge.ironfish.network/",
};

export type Mint = {
  value: string;
  assetId?: string;
  name?: string;
  metadata?: string;
};

export type Burn = {
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

class MessageHandler {
  activeAccount: { name: string; address: string } | null = null;
  connectRequest: {
    resolve: (address: string | null) => void;
    reject: () => void;
  } | null = null;
  sendTransactionRequest: {
    resolve: (transaction: string) => void;
    reject: () => void;
  } | null = null;

  async updateActiveAccount(
    activeAccount: { name: string; address: string } | null,
  ) {
    this.activeAccount = activeAccount;
    if (this.connectRequest) {
      this.connectRequest.resolve(activeAccount?.address ?? null);
      this.connectRequest = null;
    }
  }

  async rejectSendTransactionRequest() {
    this.sendTransactionRequest?.reject();
    this.sendTransactionRequest = null;
  }

  async resolveSendTransactionRequest(transaction: string) {
    this.sendTransactionRequest?.resolve(transaction);
    this.sendTransactionRequest = null;
  }

  async handleMessage(
    data: string,
    showAccountModal: () => void,
    showSendTransactionModal: (data: GeneralTransactionData) => void,
    postMessage?: (data: string) => void,
  ) {
    console.log(data);
    let message: Message;
    try {
      message = JSON.parse(data);
      if (
        typeof message.id !== "number" ||
        typeof message.type !== "string" ||
        typeof message.data !== "object"
      ) {
        throw new Error("Invalid message");
      }
    } catch {
      console.error(`Invalid message: ${data}`);
      return;
    }

    if (message.type === "connect") {
      showAccountModal();
      const address = await new Promise<string | null>((resolve, reject) => {
        this.connectRequest = { resolve, reject };
      });
      postMessage?.(
        JSON.stringify({
          id: message.id,
          type: "connect",
          data: { address },
        }),
      );
    } else if (message.type === "disconnect") {
      this.updateActiveAccount(null);
      postMessage?.(
        JSON.stringify({
          id: message.id,
          type: "disconnect",
          data: null,
        }),
      );
    } else if (message.type === "getBalances") {
      if (oreoWallet.state.type !== "STARTED" || !this.activeAccount) {
        console.error("Wallet not started");
        return;
      }
      const data = await oreoWallet.getAccountWithHeadAndBalances(
        Network.TESTNET,
        this.activeAccount.name,
      );
      if (!data) {
        console.error(`No account found with name ${this.activeAccount.name}`);
        return;
      }

      const newBalances = await Promise.all(
        data.balances.map(async (b) => {
          const hexId = Uint8ArrayUtils.toHex(b.assetId);
          const asset = await oreoWallet.getAsset(Network.TESTNET, hexId);
          return {
            assetId: hexId,
            balance: b.confirmed,
            assetName: asset?.name ?? hexId,
          };
        }),
      );

      postMessage?.(
        JSON.stringify({
          id: message.id,
          type: "getBalances",
          data: {
            balances: newBalances,
          },
        }),
      );
    } else if (message.type === "generalTransaction") {
      if (!message.data) {
        console.error("No data");
        return;
      }
      const data = message.data as GeneralTransactionData;
      if (data.from !== this.activeAccount?.address) {
        console.error("From address does not match active account");
        return;
      }
      if (data.mints && data.mints.length > 0) {
        console.error("Mints are not supported");
        return;
      }
      if (data.burns && data.burns.length > 0) {
        console.error("Burns are not supported");
        return;
      }

      showSendTransactionModal({
        ...data,
        // Replace the public address with the name of the account
        from: this.activeAccount.name,
      });
      const transaction = await new Promise<string>((resolve, reject) => {
        this.sendTransactionRequest = { resolve, reject };
      });
      postMessage?.(
        JSON.stringify({
          id: message.id,
          type: "generalTransaction",
          data: { transaction },
        }),
      );
    } else {
      console.error(`Invalid message type: ${message.type}`);
    }
  }
}

export default function MenuDebugBrowser() {
  const webref = useRef<WebView | null>(null);
  const messageHandler = useRef(new MessageHandler());
  const facade = useFacade();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const settings = facade.getAppSettings.useQuery(undefined);
  const network = settings.data
    ? BRIDGE_URLS[settings.data[SettingsKey.Network]]
    : null;

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [sendTransactionData, setSendTransactionData] =
    useState<GeneralTransactionData | null>(null);
  const account = facade.getAccount.useQuery(
    {},
    {
      enabled: accountModalVisible,
    },
  );

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
    setAccountModalVisible(true);
  }, []);

  const handleDismissModalPress = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
    setAccountModalVisible(false);
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const js = `
        window.addEventListener('message', (event) => {
            console.log(event.data);
            let message;
            try {
                message = JSON.parse(event.data);
                if (typeof message.id !== "number" || typeof message.type !== "string" || typeof message.data !== "object") {
                    throw new Error("Invalid message");
                }            
            } catch (e) {
                console.error(\`Invalid message: $\{event.data\}\`);
                return;
            }

            if (message.type === "connect") {
                window.rpccalls[message.id].resolve(message.data.address);
            } else if (message.type === "disconnect") {
                window.rpccalls[message.id].resolve(null);
            } else if (message.type === "getBalances") {
                window.rpccalls[message.id].resolve(message.data.balances);
            } else if (message.type === "generalTransaction") {
                window.rpccalls[message.id].resolve(message.data.transaction);
            } else if (message.type === "error") {
                window.rpccalls[message.id].reject(message.data.error);
            }
        });

        window.rpccounter = 0;
        window.rpccalls = {};

        class IronFishBridge {
            #address;
            constructor() {
                this.#address = null;
            }
            get address() {
                return this.#address;
            }
            async connect() {
                const id = window.rpccounter++;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    id,
                    type: "connect",
                    data: null,
                }));
                const result = await new Promise((resolve, reject) => {
                    window.rpccalls[id] = { resolve, reject };
                });
                if (result == null) {
                  throw new Error("No account selected");
                }
                this.#address = result;
                console.log(result);
                return result;
            }
            async disconnect() {
                const id = window.rpccounter++;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    id,
                    type: "disconnect",
                    data: null,
                }));
                const result = await new Promise((resolve, reject) => {
                    window.rpccalls[id] = { resolve, reject };
                });
                this.#address = null;
                console.log("Disconnected");
                return null;
            }
            async getBalances() {
                if (!this.#address) {
                    throw new Error("Connect first");
                }
                const id = window.rpccounter++;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    id,
                    type: "getBalances",
                    data: null,
                }));
                const result = await new Promise((resolve, reject) => {
                    window.rpccalls[id] = { resolve, reject };
                });
                console.log(result);
                return result;
            }
            async generalTransaction(e) {
              if (!this.#address) {
                throw new Error("Connect first");
              }
              const id = window.rpccounter++;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                  id,
                  type: "generalTransaction",
                  data: e,
              }));
              const result = await new Promise((resolve, reject) => {
                  window.rpccalls[id] = { resolve, reject };
              });
              console.log(result);
              return result;
            }
        }

        window.ironfish = new Proxy(new IronFishBridge(), {
            get: (obj, property, receiver) => {
                if (!(property in obj)) {
                    const message = \`ERROR: Please implement $\{property\} in IronFishBridge\`;
                    console.error(message);
                    return;
                }
                const val = obj[property];
                if (val instanceof Function) {
                    return function (...args) {
                        return val.apply(this === receiver ? obj : this, args);
                    };
                } else {
                 return val;
                }
            },
        });
    `;

  return (
    <BottomSheetModalProvider>
      <Stack.Screen
        options={{
          headerTitle: "Bridge",
          headerBackTitle: "Back",
        }}
      />
      {network && (
        <View style={styles.container}>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={["50%"]}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            onDismiss={() => {
              messageHandler.current.updateActiveAccount(null);
              setAccountModalVisible(false);
            }}
            backgroundStyle={styles.bottomSheetModal}
          >
            <BottomSheetView style={styles.bottomSheetContent}>
              <Layout style={{ flexDirection: "row", gap: 8 }}>
                <Image
                  source={network + "favicon.ico"}
                  style={{ width: 48, height: 48 }}
                />
                <Layout style={{ gap: 2 }}>
                  <Text category="h5">Iron Fish Bridge</Text>
                  <Text category="s2" appearance="hint">
                    {network}
                  </Text>
                </Layout>
              </Layout>
              <Text style={styles.modalSubtitle}>
                Allow this site to view your account's balances and
                transactions?
              </Text>
              <Card>
                <Text category="h6">{account.data?.name}</Text>
                <Text category="s2" appearance="hint">
                  {account.data?.publicAddress}
                </Text>
              </Card>
              <Layout
                style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}
              >
                <Button
                  onPress={() => {
                    if (!account.data) {
                      console.error("No account loaded");
                      return;
                    }
                    messageHandler.current.updateActiveAccount({
                      name: account.data.name,
                      address: account.data.publicAddress,
                    });
                    handleDismissModalPress();
                  }}
                  style={{ flex: 1 }}
                >
                  Confirm
                </Button>
                <Button
                  onPress={() => {
                    messageHandler.current.updateActiveAccount(null);
                    handleDismissModalPress();
                  }}
                  style={{ flex: 1 }}
                  appearance="outline"
                >
                  Cancel
                </Button>
              </Layout>
            </BottomSheetView>
          </BottomSheetModal>
          <SendTransactionModal
            sendTransactionData={sendTransactionData}
            cancel={() => {
              messageHandler.current.rejectSendTransactionRequest();
              setSendTransactionData(null);
            }}
            success={(hash) => {
              messageHandler.current.resolveSendTransactionRequest(hash);
              setSendTransactionData(null);
            }}
          />
          <WebView
            source={{ uri: network }}
            ref={(r) => (webref.current = r)}
            injectedJavaScriptBeforeContentLoaded={js}
            onMessage={(event) => {
              messageHandler.current.handleMessage(
                event.nativeEvent.data,
                handlePresentModalPress,
                (data) => {
                  setSendTransactionData(data);
                },
                webref.current?.postMessage,
              );
            }}
            webviewDebuggingEnabled
          />
        </View>
      )}
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
