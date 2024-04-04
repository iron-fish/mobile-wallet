import { View, Text } from "react-native";
import { z } from "zod";
import { f } from "data-facade";

const accounts = ["alice", "bob", "carol"];

async function getAccounts(limit: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return accounts.slice(0, limit);
}

const accountsFacade = f.facade({
  getAccounts: f.handler.query(async (count: number) => {
    const accounts = await getAccounts(count ?? 1);
    console.log("getAccounts", accounts);
    return accounts;
  }),
  getAllAccounts: f.handler.query(async () => {
    const accounts = await getAccounts(1);
    console.log("getAllAccounts", accounts);
    return accounts;
  }),
  getAccountsWithZod: f.handler
    .input(
      z.object({
        limit: z.number(),
      }),
    )
    .query(async ({ limit }) => {
      const accounts = await getAccounts(limit);
      console.log("getAccountsWithZod", accounts);
      return accounts;
    }),
});

export default function Transact() {
  // @ts-expect-error
  const getAccountsResult = accountsFacade.getAccounts.useQuery();
  const getAccountsWithZodResult = accountsFacade.getAccountsWithZod.useQuery({
    limit: 2,
  });
  const getAllAccountsResult = accountsFacade.getAllAccounts.useQuery();

  return (
    <View>
      <Text>Balances</Text>
    </View>
  );
}
