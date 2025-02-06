import { StyleSheet, View, Text } from "react-native";
import { LinkButton } from "@/components/LinkButton";
import { useLocalSearchParams } from "expo-router";
import { SecureOctopus } from "@/svgs/SecureOctopus";

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
  textStack: {
    alignItems: "center",
    gap: 24,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    color: "#666",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 32,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  buttonText: {
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: "#666",
  },
});

export default function OnboardingCreate() {
  const { next } = useLocalSearchParams();

  const pinHref = next
    ? `/onboarding/create-pin?next=${next}`
    : "/onboarding/create-pin";

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SecureOctopus />
        <View style={styles.textStack}>
          <Text style={styles.title}>Protect your account</Text>
          <Text style={styles.description}>
            By enabling a PIN, your wallet becomes exclusively accessible to
            you, providing a unique layer of protection.
          </Text>
        </View>
      </View>
      <LinkButton borderRadius={1} variant="ghost" href={pinHref}>
        Create a custom PIN
      </LinkButton>
    </View>
  );
}
