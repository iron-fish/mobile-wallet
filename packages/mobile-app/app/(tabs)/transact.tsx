import { View, Text } from "react-native";
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

  return (
    <View>
      <Text>Accounts</Text>
      {(getAccountsResult.data ?? []).map((account) => (
        <Text key={account.id}>{account.name}</Text>
      ))}
      <Button
        onClick={async () => {
          const otherResult = await createAccount.mutateAsync({ name: "dave" });
          console.log('Created Account:', otherResult)
        }}
      >
        Create Account
      </Button>
    </View>
  );
}
