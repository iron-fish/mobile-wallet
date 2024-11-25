import { useColorScheme, View } from "react-native";
import {
  Button,
  Box,
  HStack,
  VStack,
  TextInput,
  Text,
} from "@ironfish/tackle-box";
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
      <Text size="lg">Count: {count}</Text>
      <Button onClick={() => setCount(count + 1)}>
        <Text>Press me</Text>
      </Button>
      <Box height="auto" bg="pink" borderWidth={2} borderColor="gray">
        <Button onClick={() => setCount(count + 1)}>
          <Text>Press me</Text>
        </Button>
        <Button disabled onClick={() => setCount(count + 1)}>
          <Text>You can't press me</Text>
        </Button>
      </Box>
      <Text>Input value: {inputValue}</Text>
      <TextInput
        value={inputValue}
        onChange={(value: string) => setInputValue(value)}
        label="Enter your name"
      />
      <TextInput
        disabled
        value={inputValue}
        onChange={(value: string) => setInputValue(value)}
        label="Enter your name"
      />

      <HStack
        gap={4}
        height="auto"
        bg="pink"
        borderWidth={8}
        borderColor="gray"
      >
        <Button onClick={() => setCount(count + 1)}>
          <Text>Press me</Text>
        </Button>
        <Button disabled onClick={() => setCount(count + 1)}>
          <Text>You can't press me</Text>
        </Button>
      </HStack>

      <VStack
        gap={4}
        height="auto"
        bg="pink"
        borderWidth={4}
        borderColor="black"
      >
        <Button onClick={() => setCount(count + 1)}>
          <Text>Press me</Text>
        </Button>
        <Button disabled onClick={() => setCount(count + 1)}>
          <Text>You can't press me</Text>
        </Button>
      </VStack>
    </View>
  );
}
