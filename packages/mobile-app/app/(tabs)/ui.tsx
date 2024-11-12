import { useColorScheme, View, Text } from "react-native";
import { Button, Box } from "@ironfish/tackle-box";
import { useState } from "react";

export default function UiKit() {
  const scheme = useColorScheme();
  const [count, setCount] = useState(0);
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
      <Button disabled title="Press me" onClick={() => setCount(count + 1)} />

      <Box>
        <Text>Hello</Text>
      </Box>
    </View>
  );
}
