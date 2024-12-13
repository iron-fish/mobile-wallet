import { View, Text, StyleSheet } from "react-native";

export default function NameAccountScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Name Account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    fontSize: 24,
  },
});
