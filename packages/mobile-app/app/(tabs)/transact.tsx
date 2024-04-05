import { View, Text } from "react-native";
import { useFacade } from "../../data";

export default function Transact() {
  const facade = useFacade();
  const getAccountsResult = facade.getAccounts.useQuery(123);
  const getAccountsWithZodResult = facade.getAccountsWithZod.useQuery({
    limit: 2,
  });
  const getAllAccountsResult = facade.getAllAccounts.useQuery();

  return (
    <View>
      <Text>Accounts</Text>
      <Text>{JSON.stringify(getAccountsResult.data)}</Text>
      <Text>{JSON.stringify(getAccountsWithZodResult.data)}</Text>
      <Text>{JSON.stringify(getAllAccountsResult.data)}</Text>
    </View>
  );
}
