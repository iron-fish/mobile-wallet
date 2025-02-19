import { StyleSheet, Linking } from "react-native";
import { Layout, Text, Button, Icon, IconProps } from "@ui-kitten/components";

const DiscordIcon = (props: IconProps) => (
  <Icon {...props} name="message-square-outline" />
);

const openDiscord = () => {
  Linking.openURL("https://discord.ironfish.network/");
};

export default function MenuAbout() {
  return (
    <Layout style={styles.container}>
      <Text category="h6" style={styles.version}>
        Version 0.0.1
      </Text>

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

      <Button
        appearance="ghost"
        status="primary"
        accessoryLeft={DiscordIcon}
        onPress={openDiscord}
      >
        Join our Discord
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    gap: 16,
  },
  version: {
    textAlign: "center",
    marginBottom: 8,
  },
});
