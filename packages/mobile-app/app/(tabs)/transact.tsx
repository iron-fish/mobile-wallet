import { View, Text, ScrollView, TextInput, Button } from "react-native";
import { useFacade } from "../../data/facades";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { AccountFormat } from "@ironfish/sdk";

export default function Transact() {
  const facade = useFacade();
  const qc = useQueryClient();

  const getAccountsResult = facade.getAccounts.useQuery(undefined, {
    refetchInterval: 1000,
  });
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
          <Text>{JSON.stringify(account)}</Text>
          <Button
            onPress={async () => {
              await removeAccount.mutateAsync({ name: account.name });
              console.log("Removed Account", account.name);
            }}
            title="Remove Account"
          />
          <Button
            onPress={async () => {
              const otherResult = await exportAccount.mutateAsync({
                name: account.name,
                format: AccountFormat.Base64Json,
              });
              console.log("Exported Account:", otherResult);
            }}
            title="Export Account"
          />
        </View>
      ))}
      <Button
        onPress={async () => {
          const otherResult = await createAccount.mutateAsync({ name: "dave" });
          console.log("Created Account:", otherResult);
        }}
        title="Create Account"
      />
      <TextInput
        value={importAccountText}
        onChangeText={setImportAccountText}
        placeholder="Import account"
      />
      <Button
        onPress={async () => {
          const otherResult = await importAccount.mutateAsync({
            account: importAccountText,
            name: "asdf",
          });
          console.log("Imported Account:", otherResult);
        }}
        title="Import Account"
      />
    </ScrollView>
  );
}
