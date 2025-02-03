import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";

interface PinInputComponentProps {
  pinLength: number;
  onPinChange: (pin: string) => void;
  error?: string | null;
  setError: (error: string | null) => void;
  promptText: string;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  promptText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  pinInput: {
    width: "80%",
    height: 50,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    ...Platform.select({
      ios: {
        padding: 12,
      },
      android: {
        padding: 8,
      },
    }),
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    textAlign: "center",
  },
});

export function PinInputComponent({
  pinLength,
  onPinChange,
  error,
  setError,
  promptText,
}: PinInputComponentProps) {
  const [pinValue, setPinValue] = useState("");

  const handlePinChange = (value: string) => {
    // Only allow numbers and limit to pinLength
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, pinLength);
    setError(null);
    setPinValue(numericValue);
    onPinChange(numericValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.promptText}>{promptText}</Text>
      <TextInput
        style={styles.pinInput}
        value={pinValue}
        onChangeText={handlePinChange}
        keyboardType="number-pad"
        maxLength={pinLength}
        secureTextEntry={true}
        autoFocus={true}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
