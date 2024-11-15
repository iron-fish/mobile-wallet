import * as Font from "expo-font";
import { useColorScheme, View, Text, StyleSheet } from "react-native";
import { Button, Box, HStack, VStack } from "@ironfish/tackle-box";
import { useState } from "react";

const styles = StyleSheet.create({
  base: {
    fontFamily: "Favorit",
  },
});

export default function UiKit() {
  const scheme = useColorScheme();
  const [count, setCount] = useState(0);

  const blah = Font.isLoaded("ABCFavorit-Regular");
  console.log({ blah });

  return (
    <View
      style={{
        gap: 10,
        padding: 10,
        backgroundColor: scheme === "dark" ? "#333" : "#fff",
      }}
    >
      <Text style={styles.base}>Count: {count}</Text>
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
