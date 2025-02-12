import { View, Text, StyleSheet } from "react-native";
import { Button, Layout } from "@ui-kitten/components";

interface PinInputComponentProps {
  pinLength: number;
  onPinChange: (pin: string) => void;
  error?: string | null;
  setError?: (error: string | null) => void;
  promptText: string;
  value: string;
}

export function PinInputComponent({
  pinLength,
  onPinChange,
  error,
  setError,
  promptText,
  value,
}: PinInputComponentProps) {
  const handleNumberPress = (num: string) => {
    if (value.length < pinLength) {
      const newValue = value + num;
      setError?.(null);
      onPinChange(newValue);
    }
  };

  const handleDelete = () => {
    const newValue = value.slice(0, -1);
    setError?.(null);
    onPinChange(newValue);
  };

  const renderNumberButton = (num: string) => (
    <Button
      appearance="outline"
      style={styles.numberButton}
      onPress={() => handleNumberPress(num)}
    >
      {num}
    </Button>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.promptText}>{promptText}</Text>

      <View style={styles.dotsContainer}>
        {Array.from({ length: pinLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < value.length ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
      </View>

      <Layout style={styles.keypadContainer}>
        <Layout style={styles.keypadRow}>
          {renderNumberButton("1")}
          {renderNumberButton("2")}
          {renderNumberButton("3")}
        </Layout>
        <Layout style={styles.keypadRow}>
          {renderNumberButton("4")}
          {renderNumberButton("5")}
          {renderNumberButton("6")}
        </Layout>
        <Layout style={styles.keypadRow}>
          {renderNumberButton("7")}
          {renderNumberButton("8")}
          {renderNumberButton("9")}
        </Layout>
        <Layout style={styles.keypadRow}>
          <View style={styles.numberButton} />
          {renderNumberButton("0")}
          <Button
            appearance="ghost"
            style={styles.numberButton}
            onPress={handleDelete}
          >
            ←
          </Button>
        </Layout>
      </Layout>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
    padding: 16,
  },
  promptText: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
  },
  dotEmpty: {
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: "#000",
  },
  keypadContainer: {
    gap: 16,
    alignItems: "center",
  },
  keypadRow: {
    flexDirection: "row",
    gap: 16,
  },
  numberButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  errorText: {
    color: "red",
    marginTop: 16,
    textAlign: "center",
  },
});
