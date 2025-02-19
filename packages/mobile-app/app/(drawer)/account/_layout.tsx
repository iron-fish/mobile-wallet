import { Icon, useTheme, Text } from "@ui-kitten/components";
import { useNavigation, useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { TouchableOpacity, View } from "react-native";
import { DrawerActions } from "@react-navigation/native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

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
  const router = useRouter();
  const theme = useTheme();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Loading...",
          headerTitle: (props) => (
            <TouchableWithoutFeedback
              onPress={() => {
                router.push(
                  "/(drawer)/account/account-settings/account-select",
                );
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Text category="h6">{props.children}</Text>
                <Icon
                  name="chevron-down-outline"
                  fill={theme["text-basic-color"]}
                  style={{
                    height: 20,
                    width: 20,
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          ),
          headerLeft: () => (
            <MenuIconButton
              name="menu-outline"
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
              }}
            />
          ),
          headerRight: () => (
            <MenuIconButton
              name="settings-outline"
              onPress={() => {
                router.push("/(drawer)/account/account-settings");
              }}
            />
          ),
        }}
      />
    </Stack>
  );
}
