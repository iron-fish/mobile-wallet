import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
} from "react-native";

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    height: 55,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#000000",
  },
  text: {
    color: "#fff",
    fontSize: 20,
  },
});

export type Props = TouchableOpacityProps & {
  label: string;
};

export function Button({ label, ...props }: Props) {
  return (
    <TouchableOpacity style={styles.button} {...props}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}
