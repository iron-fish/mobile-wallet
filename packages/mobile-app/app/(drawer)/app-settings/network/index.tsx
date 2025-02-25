import {
  Button,
  Modal,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { useFacade } from "@/data/facades";
import { SettingsKey } from "@/data/settings/db";
import { Network } from "@/data/constants";
import { AccountFormat } from "@ironfish/sdk";

export default function MenuNetwork() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isChangingNetwork, setIsChangingNetwork] = useState(false);
  const [pendingNetwork, setPendingNetwork] = useState<Network | null>(null);

  const facade = useFacade();
  const setAppSetting = facade.setAppSetting.useMutation();
  const getAccounts = facade.getAccounts.useQuery();
  const exportAccount = facade.exportAccount.useMutation();
  const importAccount = facade.importAccount.useMutation();
  const networkSetting = facade.getAppSettings.useQuery();

  const currentNetwork =
    networkSetting.data?.[SettingsKey.Network] ?? Network.MAINNET;

  const handleNetworkPress = (network: Network) => {
    if (network !== currentNetwork) {
      setPendingNetwork(network);
      setModalVisible(true);
    }
  };

  const handleNetworkChange = async (network: Network) => {
    setIsChangingNetwork(true);
    try {
      // First update the network setting
      await setAppSetting.mutateAsync({
        key: SettingsKey.Network,
        value: network,
      });

      // Re-import all accounts for the new network
      const accounts = getAccounts.data ?? [];
      for (const account of accounts) {
        // Export the account first
        const encodedAccount = await exportAccount.mutateAsync({
          name: account.name,
          format: AccountFormat.Base64Json,
        });
        // Then import it for the new network
        try {
          await importAccount.mutateAsync({
            account: encodedAccount,
            name: account.name,
          });
        } catch (error) {
          console.error(error);
        }
      }
    } finally {
      setIsChangingNetwork(false);
      setModalVisible(false);
      setPendingNetwork(null);
    }
  };

  if (getAccounts.isLoading || networkSetting.isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal animationType="fade" visible={modalVisible} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isChangingNetwork ? (
              <>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.modalText}>
                  Changing network and re-importing accounts...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  Switch to {pendingNetwork}?
                </Text>
                <Text style={styles.modalText}>
                  Switching networks will upload your accounts to the{" "}
                  {pendingNetwork} server. It may take a few minutes for your
                  accounts to sync.
                </Text>
                <View style={styles.modalButtons}>
                  <Button
                    title="Yes, Change Network"
                    onPress={() => handleNetworkChange(pendingNetwork!)}
                    color="#007AFF"
                  />
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setModalVisible(false);
                      setPendingNetwork(null);
                    }}
                    color="#666"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <TouchableOpacity
          style={[
            styles.networkOption,
            currentNetwork === Network.MAINNET && styles.networkOptionSelected,
          ]}
          onPress={() => handleNetworkPress(Network.MAINNET)}
        >
          <View style={styles.networkInfo}>
            <Text style={styles.networkTitle}>Mainnet</Text>
            <Text style={styles.networkDescription}>
              The live blockchain network where real transactions with value
              occur.
            </Text>
            {currentNetwork === Network.MAINNET && (
              <Text style={styles.selectedText}>(Selected)</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.networkOption,
            currentNetwork === Network.TESTNET && styles.networkOptionSelected,
          ]}
          onPress={() => handleNetworkPress(Network.TESTNET)}
        >
          <View style={styles.networkInfo}>
            <Text style={styles.networkTitle}>Testnet</Text>
            <Text style={styles.networkDescription}>
              A separate environment for testing without real asset risks.
            </Text>
            {currentNetwork === Network.TESTNET && (
              <Text style={styles.selectedText}>(Selected)</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  networkOption: {
    backgroundColor: "#F8F9FC",
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  networkOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },
  networkInfo: {
    alignItems: "center",
  },
  networkTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  networkDescription: {
    textAlign: "center",
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  selectedText: {
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    width: "100%",
    gap: 12,
  },
});
