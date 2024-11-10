import { useState } from "react";
import { Text } from "react-native";
import { Button } from "@ironfish/tackle-box";
import { Appearance, useColorScheme, View } from "react-native";

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
        onPointerDown={() => {
          setCount(count + 1);
        }}
        style={{ height: 100, width: 100, backgroundColor: "blue" }}
      />

      <Button
        label="Toggle color scheme"
        onPress={() => {
          Appearance.setColorScheme(scheme === "dark" ? "light" : "dark");
        }}
      />

      {/* Solid */}
      <Button label="Click me" />

      {/* Solid with icon */}
      <Button iconLeft="arrow-left-bottom" label="Click me" />

      {/* Solid small */}
      <Button label="Click me" size="sm" />

      {/* Solid disabled */}
      <Button iconLeft="arrow-left-bottom" label="Click me" disabled />

      {/* Outline */}
      <Button label="Click me" variant="outline" />

      {/* Outline with icon */}
      <Button iconLeft="arrow-left-bottom" label="Click me" variant="outline" />

      {/* Outline small */}
      <Button label="Click me" size="sm" variant="outline" />
    </View>
  );
}
