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
      <Stack.Screen
        name="create-pin"
        options={{
          title: "Create Your PIN",
        }}
      />
      <Stack.Screen
        name="confirm-pin"
        options={{
          title: "Confirm Your PIN",
        }}
      />
    </Stack>
  );
}
