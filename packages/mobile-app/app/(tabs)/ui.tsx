import { useColorScheme, View, Text } from "react-native";
import { Button } from "@ironfish/tackle-box";
import { useState } from "react";

function onPointerOver(event) {
  console.log(
    "Over blue box offset: ",
    event.nativeEvent.offsetX,
    event.nativeEvent.offsetY,
  );
}

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
      <View
        onPointerDown={onPointerOver}
        style={{ height: 100, width: 100, backgroundColor: "blue" }}
      />
      <Button title="hello" />
    </View>
  );
}
