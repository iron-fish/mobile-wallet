import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@ironfish/ui";
import * as IronfishNativeModule from "ironfish-native-module";

export default function App() {
  const [value, setValue] = useState<null | number>(null);
  useEffect(() => {
    async function doFetch() {
      const result = await IronfishNativeModule.rustAdd(40, 12);
      setValue(result);
    }
    doFetch();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text>{value === null ? "Loading..." : `The value is: ${value}`}</Text>
      <Text>{IronfishNativeModule.hello()}</Text>
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
