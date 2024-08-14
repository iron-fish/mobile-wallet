import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
} from "react-native";
import { MergeProps } from "@/utils/types";

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    height: 55,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#000",
  },
  text: {
    color: "#fff",
    fontSize: 20,
  },
});

export type Props = MergeProps<
  TouchableOpacityProps,
  {
    label: string;
  }
>;

export function Button({ label, ...props }: Props) {
  return (
    <TouchableOpacity style={styles.button} {...props}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}
