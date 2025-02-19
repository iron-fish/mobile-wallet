import { StyleSheet, View } from "react-native";
import { Button, Input, Layout, Text } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useFacade } from "@/data/facades";

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
  phraseInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
});

export default function ImportMnemonic() {
  const router = useRouter();
  const [accountName, setAccountName] = useState("");
  const [phrase, setPhrase] = useState("");
  const [nameError, setNameError] = useState("");
  const [phraseError, setPhraseError] = useState("");

  const facade = useFacade();
  const importAccount = facade.importAccount.useMutation();

  const validatePhrase = (text: string) => {
    const words = text.trim().split(/\s+/);
    return words.length === 24;
  };

  const handleContinue = async () => {
    let hasError = false;

    if (accountName.length < 3) {
      setNameError("Account name must be at least 3 characters");
      hasError = true;
    }

    if (!validatePhrase(phrase)) {
      setPhraseError("Please enter all 24 words of your mnemonic phrase");
      hasError = true;
    }

    if (hasError) return;

    try {
      await importAccount.mutateAsync({
        account: phrase,
        name: accountName,
      });
      router.replace("/(drawer)/account");
    } catch (error) {
      console.error("Import account error:", error);
      setPhraseError(
        "Failed to import account. Please check your mnemonic phrase and try again.",
      );
    }
  };

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <Text category="p1" style={styles.description}>
          Restore an existing account with your 24 word mnemonic phrase
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
              label="Mnemonic Phrase"
              placeholder="Mnemonic phrase"
              value={phrase}
              onChangeText={(text) => {
                setPhrase(text);
                setPhraseError("");
              }}
              multiline
              textStyle={styles.phraseInput}
              status={phraseError ? "danger" : "basic"}
            />
            {phraseError ? (
              <Text style={styles.errorText}>{phraseError}</Text>
            ) : null}
          </View>
        </View>

        <Button onPress={handleContinue} disabled={!accountName || !phrase}>
          Continue
        </Button>
      </View>
    </Layout>
  );
}
