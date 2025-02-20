import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFacade } from "@/data/facades";
import { AccountFormat } from "@ironfish/sdk";

export default function ExportAccount() {
  const router = useRouter();

  const facade = useFacade();
  const { data, isLoading } = facade.getAccount.useQuery({});
  const exportAccount = facade.exportAccount.useMutation();

  if (isLoading) return <Text>Loading...</Text>;
  if (!data) return <Text>No Account</Text>;

  return (
    <View style={styles.container}>
      <Button title="Back" onPress={() => router.dismiss()} />

      <View>
        <Button
          onPress={async () => {
            const acc = await exportAccount.mutateAsync({
              name: data.name,
              format: AccountFormat.Mnemonic,
            });
            console.log(acc);
          }}
          title="Mnemonic Phrase"
        />
        <Button
          onPress={async () => {
            const acc = await exportAccount.mutateAsync({
              name: data.name,
              format: AccountFormat.Base64Json,
            });
            console.log(acc);
          }}
          title="Encoded Key"
        />
        <Button
          onPress={async () => {
            const acc = await exportAccount.mutateAsync({
              name: data.name,
              format: AccountFormat.SpendingKey,
            });
            console.log(acc);
          }}
          title="Spending Key"
        />
      </View>
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
