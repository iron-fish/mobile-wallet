import { StyleSheet, View } from "react-native";
import { Text, VStack, HStack, Icon } from "@ironfish/tackle-box";
import { LinkButton } from "@/components/LinkButton";
import SecureOctopus from "@/assets/images/secure-octopus.svg";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#fff",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 48,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
});

export default function OnboardingCreate() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SecureOctopus />
        <VStack gap={6}>
          <Text textAlign="center" size="xl">
            Protect your account
          </Text>
          <Text textAlign="center" color="textSecondary">
            Enabling biometric security or a PIN, your wallet becomes
            exclusively accessible to you, providing a unique layer of
            protection.
          </Text>
        </VStack>
      </View>
      <LinkButton
        borderRadius={1}
        variant="ghost"
        href="/onboarding/biometrics"
      >
        <HStack justifyContent="space-between" alignItems="center" gap={8}>
          <HStack alignItems="center" gap={4}>
            <Icon name="face-id" />
            <Text>
              Face ID <Text color="textSecondary">(Recommended)</Text>
            </Text>
          </HStack>
          <Icon name="chevron-right" />
        </HStack>
      </LinkButton>
      <LinkButton borderRadius={1} variant="ghost" href="/onboarding/pin">
        <HStack justifyContent="space-between" alignItems="center" gap={8}>
          <HStack alignItems="center" gap={4}>
            <Icon name="number-pad-orchid" />
            <Text>Create a custom PIN</Text>
          </HStack>
          <Icon name="chevron-right" />
        </HStack>
      </LinkButton>
    </View>
  );
}
