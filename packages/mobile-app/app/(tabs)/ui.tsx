import { useColorScheme, View, Text } from "react-native";
import { Button, Box, HStack, VStack } from "@ironfish/tackle-box";
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
      <Box height="auto" bg="pink" borderWidth={2} borderColor="gray">
        <Button title="Press me" onClick={() => setCount(count + 1)} />
        <Button disabled title="Press me" onClick={() => setCount(count + 1)} />
      </Box>

      <HStack
        gap={4}
        height="auto"
        bg="pink"
        borderWidth={8}
        borderColor="gray"
      >
        <Button title="Press me" onClick={() => setCount(count + 1)} />
        <Button disabled title="Press me" onClick={() => setCount(count + 1)} />
      </HStack>

      <VStack
        gap={4}
        height="auto"
        bg="pink"
        borderWidth={4}
        borderColor="black"
      >
        <Button title="Press me" onClick={() => setCount(count + 1)} />
        <Button disabled title="Press me" onClick={() => setCount(count + 1)} />
      </VStack>
    </View>
  );
}
