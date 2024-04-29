import { View, Text, ScrollView, TextInput } from "react-native";
import { useFacade } from "../../data/facades";
import { Button } from "@ironfish/ui";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { AccountFormat } from "@ironfish/sdk";

export default function Transact() {
  const facade = useFacade();
  const qc = useQueryClient();

  const getAccountsResult = facade.getAccounts.useQuery();
  const createAccount = facade.createAccount.useMutation({
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["getAccounts"],
      });
    },
  });
  const importAccount = facade.importAccount.useMutation({
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["getAccounts"],
      });
    },
  });
  const removeAccount = facade.removeAccount.useMutation({
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["getAccounts"],
      });
    },
  });
  const exportAccount = facade.exportAccount.useMutation();

  const [importAccountText, setImportAccountText] = React.useState("");

  return (
    <ScrollView>
      <Text>Accounts</Text>
      {(getAccountsResult.data ?? []).map((account, i) => (
        <View key={i}>
          <Text>{account.name}</Text>
          <Button
            onPress={async () => {
              await removeAccount.mutateAsync({ name: account.name });
              console.log("Removed Account", account.name);
            }}
          >
            Remove Account
          </Button>
          <Button
            onPress={async () => {
              const otherResult = await exportAccount.mutateAsync({
                name: account.name,
                format: AccountFormat.Base64Json,
              });
              console.log("Exported Account:", otherResult);
            }}
          >
            Export Account
          </Button>
        </View>
      ))}
      <Button
        onPress={async () => {
          const otherResult = await createAccount.mutateAsync({ name: "dave" });
          console.log("Created Account:", otherResult);
        }}
      >
        Create Account
      </Button>
      <TextInput
        value={importAccountText}
        onChangeText={setImportAccountText}
        placeholder="Import account"
      />
      <Button
        onPress={async () => {
          const otherResult = await importAccount.mutateAsync({
            account: importAccountText,
          });
          console.log("Imported Account:", otherResult);
        }}
      >
        Import Account
      </Button>
    </ScrollView>
  );
}
