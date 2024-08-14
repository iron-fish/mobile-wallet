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
      <Button label="Medium button" />
      <Button label="Small button" size="sm" />
    </View>
  );
}
