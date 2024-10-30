import { Appearance, useColorScheme, View, Button } from "react-native";
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
        title="Toggle color scheme"
        onPress={() => {
          Appearance.setColorScheme(scheme === "dark" ? "light" : "dark");
        }}
      />
    </View>
  );
}
