import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen
          name="account"
          options={{
            headerShown: false,
            drawerLabel: "Account",
          }}
        />
        <Drawer.Screen
          name="app-settings"
          options={{
            headerShown: false,
            drawerLabel: "App Settings",
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
