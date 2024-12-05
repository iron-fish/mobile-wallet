import { useColorScheme, ScrollView } from "react-native";
import {
  Button,
  Box,
  HStack,
  VStack,
  TextInput,
  Text,
  Icon,
} from "@ironfish/tackle-box";
import { useState } from "react";
import { LinkButton } from "../../components/LinkButton";

export default function UiKit() {
  const scheme = useColorScheme();
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState("");

  return (
    <ScrollView
      style={{
        gap: 10,
        padding: 10,
        backgroundColor: scheme === "dark" ? "#101010" : "#fff",
      }}
    >
      <LinkButton title="Debug" href="/menu/debug/" />
      <Text size="lg">Count: {count}</Text>
      <Button title="Press me - filled" onClick={() => setCount(count + 1)} />
      <Box height="auto" bg="pink" borderWidth={2} borderColor="gray900">
        <Button
          variant="outline"
          title="Press me - outlined"
          onClick={() => setCount(count + 1)}
        />
        <Button
          variant="ghost"
          title="Press me - ghost"
          onClick={() => setCount(count + 1)}
        />
        <Button disabled title="Press me" onClick={() => setCount(count + 1)} />
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

      <Button title="button" rightIcon="arrow-send" />

      <Icon name="arrows-bridge" width="100px" height="100px" color="red" />
      <Icon name="arrow-receive" width="50px" height="50px" color="blue" />

      <HStack
        gap={4}
        height="auto"
        bg="pink"
        borderWidth={8}
        borderColor="gray900"
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
    </ScrollView>
  );
}
