import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitleVisible: false,
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
        name="name-account"
        options={{
          title: "Name your account",
        }}
      />
    </Stack>
  );
}
