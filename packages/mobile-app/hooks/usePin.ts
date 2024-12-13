import { useState } from "react";

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 8;

export function usePin() {
  const [pinValue, setPinValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Check if the pin value is valid length and only contains numbers
  const isPinValid =
    pinValue.length >= MIN_PIN_LENGTH &&
    pinValue.length <= MAX_PIN_LENGTH &&
    /^[0-9]*$/.test(pinValue);

  const handlePinChange = (value: string) => {
    setError(null);
    setPinValue(value);
  };

  return {
    pinValue,
    setPinValue: handlePinChange,
    error,
    setError,
    isPinValid,
    MIN_PIN_LENGTH,
    MAX_PIN_LENGTH,
  };
}
