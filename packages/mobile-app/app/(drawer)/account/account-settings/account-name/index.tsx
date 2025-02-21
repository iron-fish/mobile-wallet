import { StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useFacade } from "@/data/facades";
import { useState, useEffect } from "react";
import { Layout, Button, Input, Text } from "@ui-kitten/components";

export default function AccountName() {
  const router = useRouter();
  const facade = useFacade();
  const activeAccount = facade.getAccount.useQuery({});
  const renameAccount = facade.renameAccount.useMutation({
    onSuccess: () => {
      router.dismissAll();
    },
  });

  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (activeAccount.data?.name) {
      setNewName(activeAccount.data.name);
    }
  }, [activeAccount.data?.name]);

  return (
    <Layout style={styles.container}>
      <Layout style={styles.contentContainer}>
        <Stack.Screen
          options={{
            headerTitle: "Account Name",
          }}
        />

        <Text category="s1" appearance="hint" style={styles.explanationText}>
          Change the name of your account. This name is only visible to you.
        </Text>
        <Input
          style={styles.input}
          label="Account Name"
          placeholder="Enter account name"
          value={newName}
          onChangeText={setNewName}
        />
        <Button
          onPress={async () => {
            if (!activeAccount.data) return;
            renameAccount.mutate({
              name: activeAccount.data?.name,
              newName: newName,
            });
          }}
          disabled={renameAccount.isPending}
        >
          {renameAccount.isPending ? "Saving..." : "Save"}
        </Button>
      </Layout>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  input: {
    marginBottom: 16,
  },
  explanationText: {
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
});
