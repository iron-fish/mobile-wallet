import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useFacade } from "@/data/facades";
import { useState } from "react";

export default function AccountName() {
  const router = useRouter();
  const facade = useFacade();

  const [newName, setNewName] = useState("");

  const activeAccount = facade.getAccount.useQuery({});

  const renameAccount = facade.renameAccount.useMutation();

  return (
    <View style={styles.container}>
      <Button title="Back" onPress={() => router.dismiss()} />

      <View>
        <Text>Account Name</Text>
        <Text>Current name: {activeAccount.data?.name}</Text>
        <TextInput
          placeholder="New Name"
          value={newName}
          onChangeText={setNewName}
        />
      </View>
      <Button
        title="Save"
        onPress={async () => {
          if (!activeAccount.data) {
            return;
          }
          await renameAccount.mutateAsync({
            name: activeAccount.data?.name,
            newName: newName,
          });
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
