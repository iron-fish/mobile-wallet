import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import {
  Button,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { oreoWallet } from "../../../data/wallet/oreowalletWallet";
import { Network } from "../../../data/constants";
import { useRef, useState } from "react";
import * as Uint8ArrayUtils from "../../../utils/uint8Array";
import { useFacade } from "../../../data/facades";

type Message = {
  id: number;
  type: string;
  data: Record<string, unknown> | null;
};

class MessageHandler {
  activeAccount: { name: string; address: string } | null = null;
  activeAccountName = null;
  connectRequest: {
    resolve: (address: string | null) => void;
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

  async handleMessage(
    data: string,
    showAccountModal: () => void,
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
    } catch (e) {
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
    } else {
      console.error(`Invalid message type: ${message.type}`);
    }
  }
}

export default function MenuDebugBrowser() {
  const webref = useRef<WebView | null>(null);
  const messageHandler = useRef(new MessageHandler());
  const facade = useFacade();

  const [modalVisible, setModalVisible] = useState(false);
  const accounts = facade.getAccounts.useQuery(undefined, {
    enabled: modalVisible,
  });

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
            } else if (message.type === "getBalances") {
                window.rpccalls[message.id].resolve(message.data.balances);
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
        }

        window.ironfish = new Proxy(new IronFishBridge(), {
            get: (obj, property, receiver) => {
                if (!property in obj) {
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
    <View style={styles.container}>
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <SafeAreaView>
          <View style={{ paddingTop: 40, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 20, textAlign: "center" }}>
              This website would like to connect to your wallet. Choose an
              account to connect, or click Cancel.
            </Text>
            <Text style={{ textAlign: "center" }}>
              Choose an account to connect, or click Cancel.
            </Text>
            {accounts.data?.map((a) => (
              <Button
                key={a.name}
                onPress={() => {
                  messageHandler.current.updateActiveAccount({
                    name: a.name,
                    address: a.publicAddress,
                  });
                  setModalVisible(false);
                }}
                title={`${a.name} (${a.balances.iron.confirmed} $IRON)`}
              />
            ))}
            <Button
              onPress={() => {
                messageHandler.current.updateActiveAccount(null);
                setModalVisible(false);
              }}
              title="Cancel"
            />
          </View>
        </SafeAreaView>
      </Modal>
      <WebView
        source={{ uri: "https://testnet.bridge.ironfish.network" }}
        ref={(r) => (webref.current = r)}
        injectedJavaScriptBeforeContentLoaded={js}
        onMessage={(event) => {
          messageHandler.current.handleMessage(
            event.nativeEvent.data,
            () => {
              setModalVisible(true);
            },
            webref.current?.postMessage,
          );
        }}
        webviewDebuggingEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
