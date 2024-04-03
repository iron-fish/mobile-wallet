import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@ironfish/ui";
import * as IronfishNativeModule from "ironfish-native-module";

export default function Balances() {
  const [value, setValue] = useState<null | string>(null);
  useEffect(() => {
    async function doFetch() {
      const result = await IronfishNativeModule.generateKey();
      setValue(result.publicAddress);
    }
    doFetch();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text>{value === null ? "Loading..." : `The value is: ${value}`}</Text>
      <Button>Click me</Button>
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
