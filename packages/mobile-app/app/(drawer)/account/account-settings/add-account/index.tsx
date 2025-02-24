import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { Stack, Link } from "expo-router";
import { Layout, Text, Card, Button, Divider } from "@ui-kitten/components";

export default function AddAccount() {
  return (
    <Layout style={styles.container} level="1">
      <Stack.Screen
        options={{
          headerTitle: "Add Account",
          headerStyle: { backgroundColor: "transparent" },
        }}
      />

      <Card style={styles.card}>
        <Text category="h6" style={styles.sectionTitle}>
          Add a new account
        </Text>
        <Link
          href="/(drawer)/account/account-settings/add-account/create"
          asChild
        >
          <Button style={styles.button} size="large">
            Create new account
          </Button>
        </Link>

        <Divider style={styles.divider} />

        <Text category="h6" style={styles.sectionTitle}>
          Import an existing account
        </Text>

        <Link
          href="/(drawer)/account/account-settings/add-account/import-mnemonic"
          asChild
        >
          <Button style={styles.button} appearance="outline" size="large">
            Mnemonic Phrase
          </Button>
        </Link>

        <Link
          href="/(drawer)/account/account-settings/add-account/import-encoded"
          asChild
        >
          <Button style={styles.button} appearance="outline" size="large">
            Encoded Key
          </Button>
        </Link>

        <Link
          href="/(drawer)/account/account-settings/add-account/import-file"
          asChild
        >
          <Button style={styles.button} appearance="outline" size="large">
            Import from File
          </Button>
        </Link>
      </Card>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 24,
  },
});
