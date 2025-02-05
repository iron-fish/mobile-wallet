import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackVisible: false,
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
    </Stack>
  );
}
