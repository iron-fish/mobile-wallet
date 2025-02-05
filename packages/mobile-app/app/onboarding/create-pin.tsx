import {
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { PinInputComponent } from "@/components/PinInputComponent";
import { useState } from "react";
import { useFacade } from "../../data/facades";

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
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const facade = useFacade();
  const createAccount = facade.createAccount.useMutation();

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
        router.push("/(tabs)/");
      } catch (error12) {
        console.error(error12);
        setNameError("Failed to create account. Please try again.");
      }
    }
  };

  const isStepValid = () => {
    if (step === "pin") return isPinValid(pinValue);
    if (step === "confirm") return isPinValid(confirmPinValue);
    return accountName.length >= 3;
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
          <View
            style={[styles.stepDot, step === "name" && styles.stepDotActive]}
          />
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
            pinLength={MAX_PIN_LENGTH}
            onPinChange={(value) => handlePinChange(value, step === "confirm")}
            error={error}
            setError={setError}
            promptText={getPromptText()}
            value={step === "pin" ? pinValue : confirmPinValue}
          />
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
    </KeyboardAvoidingView>
  );
}
