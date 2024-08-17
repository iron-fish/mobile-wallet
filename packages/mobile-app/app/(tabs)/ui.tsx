import { Button } from "@ironfish/ui";
import { View } from "react-native";

export default function UiKit() {
  return (
    <View
      style={{
        gap: 10,
        padding: 10,
      }}
    >
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
