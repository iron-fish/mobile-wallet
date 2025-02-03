import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { router, useLocalSearchParams } from "expo-router";
import { usePin } from "../../hooks/usePin";
import { PinInputComponent } from "@/components/PinInputComponent";

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "white",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A1A1A1",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

const confirmPinText = "Retype your 4-8 digit PIN to confirm and move forward.";

export default function ConfirmPin() {
  const { createPinValue } = useLocalSearchParams<{ createPinValue: string }>();
  const { pinValue, setPinValue, error, setError, isPinValid, MAX_PIN_LENGTH } =
    usePin();
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.innerContainer}>
        <PinInputComponent
          pinLength={MAX_PIN_LENGTH}
          onPinChange={setPinValue}
          error={error}
          setError={setError}
          promptText={confirmPinText}
        />
        <TouchableOpacity
          style={[styles.button, !isPinValid && styles.buttonDisabled]}
          disabled={!isPinValid}
          onPress={() => {
            if (createPinValue !== pinValue) {
              setError("PINs do not match");
            } else {
              router.push("/onboarding/name-account");
            }
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
