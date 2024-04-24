import { View, Text, ScrollView, TextInput } from "react-native";
import { useFacade } from "../../data/facades";
import { Button } from "@ironfish/ui";
import { useQueryClient } from "@tanstack/react-query";

export default function Transact() {
  const facade = useFacade();
  const qc = useQueryClient()

  const getAccountsResult = facade.getAccounts.useQuery();
  const createAccount = facade.createAccount.useMutation({
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['getAccounts']
      })
    }
  });
  const exportAccount = facade.exportAccount.useMutation();

  return (
    <ScrollView>
      <Text>Accounts</Text>
      {(getAccountsResult.data ?? []).map((account) => (
        <View key={account.id}>
          <Text>{account.name}</Text>
          <Button
            onClick={async () => {
              const otherResult = await exportAccount.mutateAsync({ name: account.name });
              console.log('Exported Account:', otherResult)
            }}
          >
          Export Account
          </Button>
        </View>
      ))}
      <Button
        onClick={async () => {
          const otherResult = await createAccount.mutateAsync({ name: "dave" });
          console.log('Created Account:', otherResult)
        }}
      >
        Create Account
      </Button>
    </ScrollView>
  );
}
