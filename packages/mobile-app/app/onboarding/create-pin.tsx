import { StyleSheet, KeyboardAvoidingView, Platform, View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Button } from "@ironfish/tackle-box";
import { useRouter } from "expo-router";
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
});

const createPinText =
  "Set a 4-8 digit PIN to prevent others from accessing your Iron Fish account.";

export default function CreatePin() {
  const { pinValue, setPinValue, isPinValid, error, setError, MAX_PIN_LENGTH } =
    usePin();
  const headerHeight = useHeaderHeight();
  const router = useRouter();

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
          promptText={createPinText}
        />
        <Button
          disabled={!isPinValid}
          title="Continue"
          onClick={() =>
            router.push({
              pathname: "/onboarding/confirm-pin",
              params: { createPinValue: pinValue },
            })
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}
