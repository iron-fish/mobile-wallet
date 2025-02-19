import { Icon, useTheme } from "@ui-kitten/components";
import { useNavigation } from "expo-router";
import { Stack } from "expo-router/stack";
import { TouchableOpacity } from "react-native";
import { DrawerActions } from "@react-navigation/native";

function MenuIconButton({
  name,
  onPress,
}: {
  name: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress}>
      <Icon
        name={name}
        fill={theme["color-primary-default"]}
        style={{
          height: 26,
          width: 26,
        }}
      />
    </TouchableOpacity>
  );
}

export default function Layout() {
  const navigation = useNavigation();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Settings",
          headerLeft: () => (
            <MenuIconButton
              name="menu-outline"
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
              }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="security/index"
        options={{ headerTitle: "Security" }}
      />
      <Stack.Screen name="network/index" options={{ headerTitle: "Network" }} />
      <Stack.Screen name="about/index" options={{ headerTitle: "About" }} />
      <Stack.Screen name="debug/index" options={{ headerTitle: "Debug" }} />
      <Stack.Screen
        name="debug/oreowallet"
        options={{ headerTitle: "OreoWallet" }}
      />
      <Stack.Screen name="debug/pending" options={{ headerTitle: "Pending" }} />
      <Stack.Screen name="debug/unspent" options={{ headerTitle: "Unspent" }} />
    </Stack>
  );
}
