import React, { useState } from "react";
import { PinInput, Text, VStack } from "@ironfish/tackle-box";

interface PinInputComponentProps {
  pinLength: number;
  onPinChange: (pin: string) => void;
  error?: string | null;
  setError: (error: string | null) => void;
  promptText: string;
}

export function PinInputComponent({
  pinLength,
  onPinChange,
  error,
  setError,
  promptText,
}: PinInputComponentProps) {
  const [pinValue, setPinValue] = useState("");

  const handlePinChange = (value: string) => {
    setError(null);
    setPinValue(value);
    onPinChange(value);
  };

  return (
    <VStack gap={8}>
      <Text size="md" color="textSecondary" textAlign="center">
        {promptText}
      </Text>
      <PinInput
        pinValue={pinValue}
        onChange={handlePinChange}
        pinLength={pinLength}
        aria-label="Security PIN input"
      />
      {error && (
        <Text size="sm" color="textError" textAlign="center">
          {error}
        </Text>
      )}
    </VStack>
  );
}
