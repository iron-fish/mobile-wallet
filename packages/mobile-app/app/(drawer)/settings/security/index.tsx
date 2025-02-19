import { StyleSheet, View } from "react-native";
import { Button, Card, Layout, Text } from "@ui-kitten/components";
import { useState } from "react";
import { PinInputComponent } from "@/components/PinInputComponent";
import { useFacade } from "@/data/facades";

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 8;

export default function MenuSecurity() {
  const [step, setStep] = useState<"initial" | "pin" | "confirm">("initial");
  const [pinValue, setPinValue] = useState("");
  const [confirmPinValue, setConfirmPinValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const facade = useFacade();
  const setAppSetting = facade.setAppSetting.useMutation();

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
        await setAppSetting.mutateAsync({
          key: "pin",
          value: pinValue,
        });
        // Reset to initial state after successful PIN change
        setStep("initial");
        setPinValue("");
        setConfirmPinValue("");
      } catch {
        setError("Failed to save PIN. Please try again.");
      }
    }
  };

  const getPromptText = () => {
    if (step === "pin") return "Enter your new PIN (4-8 digits).";
    if (step === "confirm") return "Retype your new PIN to confirm.";
    return "";
  };

  const isStepValid = () => {
    if (step === "pin") return isPinValid(pinValue);
    if (step === "confirm") return isPinValid(confirmPinValue);
    return true;
  };

  return (
    <Layout style={styles.container} level="1">
      {step === "initial" ? (
        <Card style={styles.card}>
          <Text category="h6" style={styles.cardTitle}>
            Security Settings
          </Text>
          <Button onPress={() => setStep("pin")}>Edit PIN</Button>
        </Card>
      ) : (
        <View style={styles.content}>
          <PinInputComponent
            pinLength={step === "pin" ? MAX_PIN_LENGTH : pinValue.length}
            onPinChange={(value) => handlePinChange(value, step === "confirm")}
            error={error}
            setError={setError}
            promptText={getPromptText()}
            value={step === "pin" ? pinValue : confirmPinValue}
          />

          <Layout
            style={{
              width: "100%",
            }}
          >
            <Button
              style={styles.button}
              disabled={!isStepValid()}
              onPress={handleContinue}
            >
              {step === "confirm" ? "Submit" : "Continue"}
            </Button>
            <Button
              style={styles.button}
              appearance="outline"
              onPress={() => {
                setStep("initial");
                setPinValue("");
                setConfirmPinValue("");
                setError("");
              }}
            >
              Cancel
            </Button>
          </Layout>
        </View>
      )}
    </Layout>
  );
}

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
  card: {
    margin: 16,
  },
  cardTitle: {
    marginBottom: 16,
  },
  button: {
    width: "100%",
    marginTop: 16,
  },
});
