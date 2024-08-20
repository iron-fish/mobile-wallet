import { useQueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useFacade } from "../../data/facades";

export default function OnboardingCreate() {
  const router = useRouter();
  const facade = useFacade();
  const qc = useQueryClient();

  const createAccount = facade.createAccount.useMutation({
    onSuccess: async () => {
      await qc.invalidateQueries();
    },
  });

  const [accountName, setAccountName] = useState("Account Name");

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Account Name"
        value={accountName}
        onChangeText={setAccountName}
      />
      <Button
        title="Continue"
        onPress={async () => {
          await createAccount.mutateAsync({ name: accountName });
          router.dismissAll();
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
