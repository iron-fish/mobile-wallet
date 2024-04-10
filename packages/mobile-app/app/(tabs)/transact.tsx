import { View, Text } from "react-native";
import { useFacade } from "../../data";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ironfish/ui";
import { useState } from "react";

export default function Transact() {
  const [vanillaResult, setVanillaResult] = useState(0);
  const [facadeResult, setFacadeResult] = useState([""]);

  const facade = useFacade();
  const getAccountsResult = facade.getAccounts.useQuery(123);
  const getAccountsWithZodResult = facade.getAccountsWithZod.useQuery({
    limit: 2,
  });
  const getAllAccountsResult = facade.getAllAccounts.useQuery();

  const createAccount = facade.createAccount.useMutation();

  const vanillaMutation = useMutation({
    mutationFn: async () => {
      return 777;
    },
  });

  return (
    <View>
      <Text>Accounts</Text>
      <Text>{JSON.stringify(getAccountsResult.data)}</Text>
      <Text>{JSON.stringify(getAccountsWithZodResult.data)}</Text>
      <Text>{JSON.stringify(getAllAccountsResult.data)}</Text>
      <Text>{vanillaResult}</Text>
      <Text>{facadeResult}</Text>
      <Button
        onClick={async () => {
          const vanillaResult = await vanillaMutation.mutateAsync();
          setVanillaResult(vanillaResult);
          const otherResult = await createAccount.mutateAsync("dave");
          setFacadeResult(otherResult);
        }}
      >
        Click me
      </Button>
    </View>
  );
}
