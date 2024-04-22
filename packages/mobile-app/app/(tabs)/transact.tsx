import { View, Text } from "react-native";
import { useFacade } from "../../data";
import { Button } from "@ironfish/ui";
import { useState } from "react";

export default function Transact() {
  const [facadeResult, setFacadeResult] = useState([""]);
  const facade = useFacade();

  const getAccountsResult = facade.getAccounts.useQuery();
  const createAccount = facade.createAccount.useMutation();
  const loadDatabases = facade.loadDatabases.useMutation();

  return (
    <View>
      <Text>Accounts</Text>
      <Text>{JSON.stringify(getAccountsResult.data)}</Text>
      <Text>Mutation: {facadeResult}</Text>
      <Button
        onClick={async () => {
          console.log('loading')
          await loadDatabases.mutateAsync(undefined);
          console.log('loaded')
        }}
      >
        Start DB
      </Button>
      <Button
        onClick={async () => {
          const otherResult = await createAccount.mutateAsync("dave");
          console.log(otherResult)
        }}
      >
        Click me
      </Button>
    </View>
  );
}
