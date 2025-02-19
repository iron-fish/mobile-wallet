import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "Security",
        }}
      />
      <Stack.Screen
        name="create-pin"
        options={{
          title: "Create Your PIN",
        }}
      />
      <Stack.Screen
        name="import-account"
        options={{
          title: "Import Account",
        }}
      />
      <Stack.Screen
        name="import-file"
        options={{
          title: "Import File",
        }}
      />
      <Stack.Screen
        name="import-mnemonic"
        options={{
          title: "Import Mnemonic",
        }}
      />
    </Stack>
  );
}
