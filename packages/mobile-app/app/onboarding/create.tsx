import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { Text, Button, VStack } from "@ironfish/tackle-box";
import { LinkButton } from "@/components/LinkButton";
import SecureOctopus from "@/assets/images/secure-octopus.svg";
// import { useState } from "react";
// import { useFacade } from "../../data/facades";
// import { useRouter } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function OnboardingCreate() {
  // const router = useRouter();
  // const facade = useFacade();
  // const createAccount = facade.createAccount.useMutation();
  // const [accountName, setAccountName] = useState("Account Name");

  return (
    <View style={styles.container}>
      <View style={{ display: "flex", alignItems: "center", padding: 24 }}>
        <SecureOctopus style={{ marginBottom: 64 }} />
        <VStack gap={8}>
          <Text textAlign="center" size="xl">
            Protect your account
          </Text>
          <Text textAlign="center" muted>
            Enabling biometric security or a PIN, your wallet becomes
            exclusively accessible to you, providing a unique layer of
            protection.
          </Text>
        </VStack>
      </View>

      <Button
        borderRadius={1}
        variant="outline"
        title="Continue"
        onClick={async () => {
          // await createAccount.mutateAsync({ name: accountName });
          // router.dismissAll();
        }}
      />
      {/* <StatusBar style="auto" /> */}
    </View>
  );
}
