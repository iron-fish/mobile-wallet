import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { Network } from "@/data/constants";
import { wallet } from "@/data/wallet/wallet";
import { reverseScan } from "@/data/debug/reverseScan";
import { useRouter } from "expo-router";
import {
  Layout,
  Button,
  Icon,
  IconProps,
  Divider,
} from "@ui-kitten/components";

const TransactionIcon = (props: IconProps) => (
  <Icon {...props} name="credit-card-outline" />
);
const NotesIcon = (props: IconProps) => <Icon {...props} name="file-outline" />;
const OreoIcon = (props: IconProps) => (
  <Icon {...props} name="archive-outline" />
);
const DeleteIcon = (props: IconProps) => (
  <Icon {...props} name="trash-2-outline" />
);

export default function MenuDebug() {
  const router = useRouter();

  return (
    <Layout style={styles.container}>
      <Layout style={styles.content}>
        <Button
          appearance="ghost"
          accessoryLeft={TransactionIcon}
          style={styles.button}
          onPress={() => router.push("/(drawer)/app-settings/debug/pending")}
        >
          Pending Transactions
        </Button>

        <Button
          appearance="ghost"
          accessoryLeft={NotesIcon}
          style={styles.button}
          onPress={() => router.push("/(drawer)/app-settings/debug/unspent")}
        >
          Unspent Notes
        </Button>

        <Button
          appearance="ghost"
          accessoryLeft={OreoIcon}
          style={styles.button}
          onPress={() => router.push("/(drawer)/app-settings/debug/oreowallet")}
        >
          Oreowallet
        </Button>

        <Divider style={styles.divider} />

        <Button
          status="danger"
          appearance="outline"
          accessoryLeft={DeleteIcon}
          onPress={async () => {
            await reverseScan(wallet, Network.TESTNET);
          }}
        >
          Remove Blocks
        </Button>
      </Layout>
      <StatusBar style="auto" />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    justifyContent: "flex-start",
  },
  divider: {
    marginVertical: 16,
  },
});
