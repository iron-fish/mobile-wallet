import { useColorScheme, View, Text } from "react-native";
import { Button } from "@ironfish/tackle-box";

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
      <Text>Hello world</Text>
      <Button message="hello world" />
    </View>
  );
}
