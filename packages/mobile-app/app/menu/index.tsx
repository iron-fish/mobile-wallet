import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { LinkButton } from "../../components/LinkButton";

export default function Menu() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button title="Close" onPress={() => router.dismiss()} />
      <LinkButton title="Security" href="/menu/security/" />
      <LinkButton title="Notifications" href="/menu/notifications/" />
      <LinkButton title="Language" href="/menu/language/" />
      <LinkButton title="Theme" href="/menu/theme/" />
      <LinkButton title="Network" href="/menu/network" />
      <LinkButton title="Learn" href="/menu/learn/" />
      <LinkButton title="Debug" href="/menu/debug/" />
      <LinkButton title="About the app" href="/menu/about/" />

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
