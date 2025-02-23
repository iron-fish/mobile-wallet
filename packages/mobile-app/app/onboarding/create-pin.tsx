import {
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Linking,
} from "react-native";
import Hyperlink from "react-native-hyperlink";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PinInputComponent } from "@/components/PinInputComponent";
import { useState } from "react";
import { useFacade } from "@/data/facades";
import { CheckBox } from "@ui-kitten/components";

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  stepIndicator: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "lightgray",
  },
  stepDotActive: {
    backgroundColor: "#007AFF",
  },
  nameContainer: {
    width: "100%",
    gap: 12,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
  },
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A1A1A1",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function CreatePin() {
  const [step, setStep] = useState<"pin" | "confirm" | "name">("pin");
  const [pinValue, setPinValue] = useState("");
  const [confirmPinValue, setConfirmPinValue] = useState("");
  const [accountName, setAccountName] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const facade = useFacade();
  const createAccount = facade.createAccount.useMutation();
  const setAppSetting = facade.setAppSetting.useMutation();
  const isImportFlow = next === "import-account";

  const isPinValid = (pin: string) => {
    return (
      pin.length >= MIN_PIN_LENGTH &&
      pin.length <= MAX_PIN_LENGTH &&
      /^[0-9]*$/.test(pin)
    );
  };

  const handlePinChange = (value: string, isConfirm: boolean) => {
    setError(null);
    if (isConfirm) {
      setConfirmPinValue(value);
    } else {
      setPinValue(value);
    }
  };

  const handleContinue = async () => {
    if (step === "pin") {
      if (!isPinValid(pinValue)) {
        setError("PIN must be 4-8 digits");
        return;
      }
      setStep("confirm");
      setConfirmPinValue(""); // Reset confirmation value
      return;
    }

    if (step === "confirm") {
      if (pinValue !== confirmPinValue) {
        setError("PINs do not match");
        setConfirmPinValue(""); // Reset confirmation value on mismatch
        return;
      }

      try {
        // Save the PIN when it's confirmed
        await setAppSetting.mutateAsync({
          key: "pin",
          value: pinValue,
        });
      } catch {
        setError("Failed to save PIN. Please try again.");
        return;
      }

      // If we're in the import flow, go to import selection
      if (next === "import-account") {
        router.push("/onboarding/import-account");
        return;
      }

      setStep("name");
      return;
    }

    if (step === "name") {
      if (accountName.length < 3) {
        setNameError("Account name must be at least 3 characters");
        return;
      }

      try {
        await createAccount.mutateAsync({ name: accountName });
        router.replace("/(drawer)/account");
      } catch (error12) {
        console.error(error12);
        setNameError("Failed to create account. Please try again.");
      }
    }
  };

  const isStepValid = () => {
    if (step === "pin") return isPinValid(pinValue);
    if (step === "confirm") return isPinValid(confirmPinValue);
    return accountName.length >= 3 && confirmChecked;
  };

  const getPromptText = () => {
    if (step === "pin")
      return "Set a 4-8 digit PIN to prevent others from accessing your Iron Fish account.";
    if (step === "confirm") return "Retype your PIN to confirm.";
    return "";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.content}>
        <View style={styles.stepIndicator}>
          <View
            style={[styles.stepDot, step === "pin" && styles.stepDotActive]}
          />
          <View
            style={[styles.stepDot, step === "confirm" && styles.stepDotActive]}
          />
          {!isImportFlow && (
            <View
              style={[styles.stepDot, step === "name" && styles.stepDotActive]}
            />
          )}
        </View>

        {step === "name" ? (
          <View style={styles.nameContainer}>
            <Text>Choose a name for your account (minimum 3 characters).</Text>
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              value={accountName}
              onChangeText={(text) => {
                setAccountName(text);
                setNameError("");
              }}
              placeholder="Enter account name"
              autoFocus
            />
          </View>
        ) : (
          <PinInputComponent
            pinLength={step === "pin" ? MAX_PIN_LENGTH : pinValue.length}
            onPinChange={(value) => handlePinChange(value, step === "confirm")}
            error={error}
            setError={setError}
            promptText={getPromptText()}
            value={step === "pin" ? pinValue : confirmPinValue}
          />
        )}

        <View style={{ width: "100%", gap: 16 }}>
          {step === "name" && (
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
          )}
          <TouchableOpacity
            style={[styles.button, !isStepValid() && styles.buttonDisabled]}
            disabled={!isStepValid()}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>
              {step === "name" ? "Create Account" : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
