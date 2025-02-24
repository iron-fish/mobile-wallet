import { StyleSheet, View } from "react-native";
import { Button, CheckBox, Input, Layout, Text } from "@ui-kitten/components";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useFacade } from "@/data/facades";
import Hyperlink from "react-native-hyperlink";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    gap: 24,
  },
  description: {
    textAlign: "center",
    marginBottom: 8,
  },
  inputContainer: {
    gap: 16,
  },
  encodedInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
});

export default function ImportEncoded() {
  const router = useRouter();
  const [accountName, setAccountName] = useState("");
  const [encodedKey, setEncodedKey] = useState("");
  const [nameError, setNameError] = useState("");
  const [encodedError, setEncodedError] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  const facade = useFacade();
  const importAccount = facade.importAccount.useMutation();

  const handleContinue = async () => {
    let hasError = false;

    if (accountName.length < 3) {
      setNameError("Account name must be at least 3 characters");
      hasError = true;
    }

    if (!encodedKey.trim()) {
      setEncodedError("Please enter your encoded key");
      hasError = true;
    }

    if (hasError) return;

    try {
      await importAccount.mutateAsync({
        account: encodedKey,
        name: accountName,
      });
      router.replace("/(drawer)/account");
    } catch (error) {
      console.error("Import account error:", error);
      setEncodedError(
        "Failed to import account. Please check your encoded key and try again.",
      );
    }
  };

  return (
    <Layout style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Import Encoded",
          headerBackTitle: "Back",
        }}
      />
      <View style={styles.content}>
        <Text category="p1" style={styles.description}>
          Paste the complete string into the provided text field below.
        </Text>

        <View style={styles.inputContainer}>
          <View>
            <Input
              label="Account Name"
              placeholder="Account Name"
              value={accountName}
              onChangeText={(text) => {
                setAccountName(text);
                setNameError("");
              }}
              status={nameError ? "danger" : "basic"}
            />
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
          </View>

          <View>
            <Input
              label="Encoded Key"
              placeholder="Encoded key"
              value={encodedKey}
              onChangeText={(text) => {
                setEncodedKey(text);
                setEncodedError("");
              }}
              multiline
              textStyle={styles.encodedInput}
              status={encodedError ? "danger" : "basic"}
            />
            {encodedError ? (
              <Text style={styles.errorText}>{encodedError}</Text>
            ) : null}
          </View>
        </View>

        <CheckBox checked={confirmChecked} onChange={setConfirmChecked}>
          <Hyperlink
            linkDefault
            linkStyle={{ color: "#2980b9" }}
            linkText={(url) =>
              url === "https://oreowallet.com/agreement"
                ? "Oreowallet Terms of Service"
                : url
            }
          >
            <Text>
              I agree to the https://oreowallet.com/agreement and agree to
              upload my view keys to the Oreowallet server.
            </Text>
          </Hyperlink>
        </CheckBox>

        <Button
          onPress={handleContinue}
          disabled={
            !accountName ||
            !encodedKey ||
            importAccount.isPending ||
            !confirmChecked
          }
        >
          {importAccount.isPending ? "Importing..." : "Continue"}
        </Button>
      </View>
    </Layout>
  );
}
