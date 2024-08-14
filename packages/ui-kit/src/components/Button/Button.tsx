import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
} from "react-native";
import { MergeProps } from "@/utils/types";

const buttonStyles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    backgroundColor: "#000",
  },
  md: {
    height: 55,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  sm: {
    height: 40,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
});

const textStyles = StyleSheet.create({
  base: {
    color: "#fff",
  },
  md: {
    fontSize: 20,
  },
  sm: {
    fontSize: 16,
  },
});

export type Props = MergeProps<
  TouchableOpacityProps,
  {
    label: string;
    size?: "md" | "sm";
  }
>;

export function Button({ label, size = "md", ...props }: Props) {
  return (
    <TouchableOpacity
      style={[buttonStyles.base, buttonStyles[size]]}
      {...props}
    >
      <Text style={[textStyles.base, textStyles[size]]}>{label}</Text>
    </TouchableOpacity>
  );
}
