import { Button } from "@ironfish/tackle-box";
import { Appearance, useColorScheme, View } from "react-native";

export default function UiKit() {
  const scheme = useColorScheme();
  return (
    <View
      style={{
        gap: 10,
        padding: 10,
        backgroundColor: scheme === "dark" ? "#333" : "#fff",
      }}
    >
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
