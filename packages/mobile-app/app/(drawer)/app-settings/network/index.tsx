import {
  Button,
  Modal,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useFacade } from "@/data/facades";
import { SettingsKey } from "@/data/settings/db";
import { Network } from "@/data/constants";
import { AccountFormat } from "@ironfish/sdk";

export default function MenuNetwork() {
  const [modalVisible, setModalVisible] = useState(false);
  const [isChangingNetwork, setIsChangingNetwork] = useState(false);

  const facade = useFacade();
  const setAppSetting = facade.setAppSetting.useMutation();
  const getAccounts = facade.getAccounts.useQuery();
  const exportAccount = facade.exportAccount.useMutation();
  const importAccount = facade.importAccount.useMutation();
  const networkSetting = facade.getAppSettings.useQuery();

  const currentNetwork =
    networkSetting.data?.[SettingsKey.Network] ?? Network.MAINNET;
  const targetNetwork =
    currentNetwork === Network.MAINNET ? Network.TESTNET : Network.MAINNET;

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
      <Modal animationType="slide" visible={modalVisible}>
        <View style={styles.container}>
          {isChangingNetwork ? (
            <>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>
                Changing network and re-importing accounts...
              </Text>
            </>
          ) : (
            <>
              <Text>Switch to {targetNetwork}?</Text>
              <Text>
                Switching networks will upload your accounts to the{" "}
                {targetNetwork} server. It may take a few minutes for your
                accounts to sync.
              </Text>
              <Button
                title="Yes, Change Network"
                onPress={() => handleNetworkChange(targetNetwork)}
              />
              <Button
                title="I changed my mind"
                onPress={() => setModalVisible(false)}
              />
            </>
          )}
        </View>
      </Modal>
      <View style={styles.networkOption}>
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
      </View>
      <View style={styles.networkOption}>
        <View style={styles.networkInfo}>
          <Text style={styles.networkTitle}>Testnet</Text>
          <Text style={styles.networkDescription}>
            A separate environment for testing without real asset risks.
          </Text>
          {currentNetwork === Network.TESTNET && (
            <Text style={styles.selectedText}>(Selected)</Text>
          )}
        </View>
      </View>
      <Button title="Change Network" onPress={() => setModalVisible(true)} />
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
  networkOption: {
    width: "100%",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  networkInfo: {
    alignItems: "center",
  },
  networkTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  networkDescription: {
    textAlign: "center",
    color: "#666",
    marginBottom: 8,
  },
  selectedText: {
    color: "#007AFF",
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
