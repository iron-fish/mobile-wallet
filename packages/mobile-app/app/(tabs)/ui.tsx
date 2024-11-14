import { useColorScheme, View, Text } from "react-native";
import { Button, Box, Input } from "@ironfish/tackle-box";
import { useState } from "react";

export default function UiKit() {
  const scheme = useColorScheme();
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState("");

  return (
    <View
      style={{
        gap: 10,
        padding: 10,
        backgroundColor: scheme === "dark" ? "#333" : "#fff",
      }}
    >
      <Text>Count: {count}</Text>
      <Button title="Press me" onClick={() => setCount(count + 1)} />
      <Box>
        <Button disabled title="Press me" onClick={() => setCount(count + 1)} />
      </Box>
      <Text>Input value: {inputValue}</Text>
      <Input
        value={inputValue}
        onChange={(value: string) => setInputValue(value)}
        label="Enter your name"
      />
    </View>
  );
}
