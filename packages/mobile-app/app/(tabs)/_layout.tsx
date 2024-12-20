import { FontAwesome6, Ionicons, FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="balances"
        options={{
          title: "Balances",
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transact"
        options={{
          title: "Transact",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6
              name="arrow-right-arrow-left"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user-circle-o" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ui"
        options={{
          title: "UI Kit",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="paint-brush" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
