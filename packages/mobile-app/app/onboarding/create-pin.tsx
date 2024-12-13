import { StyleSheet, View, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Box, Button, PinInput, Text, VStack, css } from "@ironfish/tackle-box";

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
  },
  root: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    // backgroundColor: "white",
  },
  cell: {
    width: 40,
    height: 40,
    lineHeight: 40,
    fontSize: 24,
    borderWidth: 2,
    borderColor: "transparent",
    textAlign: "center",
    borderRadius: 10,
  },
  filledCell: {
    width: 40,
    height: 40,
    lineHeight: 40,
    fontSize: 24,
    borderWidth: 2,
    borderColor: "transparent",
    textAlign: "center",
    borderRadius: 10,
    color: "red",
  },
  focusCell: {
    borderColor: "#000",
  },
});

export default function CreatePin() {
  const [value, setValue] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <VStack gap={16}>
        <Text color="textSecondary" textAlign="center">
          Set a 4-8 digit PIN to prevent others from accessing your Iron Fish
          account.
        </Text>
        <PinInput
          pinValue={value}
          onChange={setValue}
          pinLength={8}
          aria-label="Security PIN input"
        />
      </VStack>
      <Button title="Continue" />
    </KeyboardAvoidingView>
  );
}
