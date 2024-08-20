import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function MenuAbout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button title="Back" onPress={() => router.dismissAll()} />
      <Text>Version 0.0.1</Text>

      <Text>What's new</Text>
      <Text>Join our Discord</Text>
      <Text>Check out our GitHub</Text>
      <Text>
        The Iron Fish mobile app is designed with privacy at its core, providing
        a secure platform for individuals who prioritize confidentiality in
        their crypto transactions.
      </Text>
      <Text>
        The Iron Fish wallet stands out for its commitment to privacy, utilizing
        advanced encryption to keep transactions protected and anonymous. This
        open-source application invites community verification, ensuring that
        the app operates with transparency and adheres to its privacy-focused
        claims.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
