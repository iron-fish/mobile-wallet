import { useAccount } from "@/providers/AccountProvider";
import { Redirect } from "expo-router";

export default function Index() {
  const account = useAccount();

  if (account.account) {
    return <Redirect href="/(drawer)/account" />;
  }

  return null;
}
