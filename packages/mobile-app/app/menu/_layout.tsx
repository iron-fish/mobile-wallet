import { Stack } from "expo-router";

export default function MenuLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="security/index"
        options={{
          title: "Security",
        }}
      />
      <Stack.Screen
        name="notifications/index"
        options={{
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="language/index"
        options={{
          title: "Language",
        }}
      />
      <Stack.Screen
        name="theme/index"
        options={{
          title: "Theme",
        }}
      />
      <Stack.Screen
        name="network/index"
        options={{
          title: "Network",
        }}
      />
      <Stack.Screen
        name="debug/index"
        options={{
          title: "Debug",
        }}
      />
      <Stack.Screen
        name="about/index"
        options={{
          title: "About",
        }}
      />
    </Stack>
  );
}
