import React, { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  Image,
  View,
  Pressable,
  PressableProps,
} from "react-native";
import { MergeProps } from "@/utils/types";
import { usePressableState } from "../../utils/usePressableState";
import { Icon, IconNames } from "../Icon/Icon";

const buttonStyles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "center",
  },
  variant_solid: {
    backgroundColor: "#000",
  },
  variant_solid_active: {
    backgroundColor: "#353535",
  },
  variant_outline: {
    backgroundColor: "#fff",
    borderColor: "#000",
  },
  variant_outline_active: {
    backgroundColor: "#F5F5F5",
  },
  variant_outline_size_md: {
    borderWidth: 2,
  },
  variant_outline_size_sm: {
    borderWidth: 1,
  },
  disabled: {
    backgroundColor: "#DEDFE2",
  },
  size_md: {
    gap: 8,
    height: 55,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  size_sm: {
    gap: 6,
    height: 45,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  width_full: {
    width: "100%",
  },
  width_auto: {
    width: "auto",
  },
});

const textStyles = StyleSheet.create({
  base: {
    color: "#fff",
  },
  variant_solid: {
    color: "#fff",
  },
  variant_outline: {
    color: "#000",
  },
  disabled: {
    color: "#989898",
  },
  size_md: {
    fontSize: 20,
  },
  size_sm: {
    fontSize: 16,
  },
});

const iconStyles = StyleSheet.create({
  view: {
    width: 16,
    alignItems: "center",
  },
});

export type Props = MergeProps<
  PressableProps,
  {
    label: string;
    variant?: "solid" | "outline";
    size?: "md" | "sm";
    width?: "full" | "auto";
    iconLeft?: IconNames;
  }
>;

export function Button({
  label,
  variant = "solid",
  size = "md",
  width = "auto",
  iconLeft,
  onHoverIn,
  onHoverOut,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: Props) {
  const { isHovered, isPressed, ...interactionProps } = usePressableState({
    onHoverIn,
    onHoverOut,
    onPressIn,
    onPressOut,
  });

  return (
    <Pressable
      style={[
        buttonStyles.base,
        buttonStyles[`variant_${variant}`],
        variant === "outline" &&
          buttonStyles[`variant_${variant}_size_${size}`],
        buttonStyles[`size_${size}`],
        buttonStyles[`width_${width}`],
        (isHovered || isPressed) && buttonStyles[`variant_${variant}_active`],
        disabled && buttonStyles.disabled,
      ]}
      disabled={disabled}
      {...props}
      {...interactionProps}
    >
      {iconLeft && (
        <View style={iconStyles.view}>
          <Icon
            name={iconLeft}
            color={
              disabled
                ? "#989898"
                : variant === "solid"
                  ? "#fff"
                  : variant === "outline"
                    ? "#000"
                    : undefined
            }
          />
        </View>
      )}
      <Text
        style={[
          textStyles.base,
          textStyles[`variant_${variant}`],
          textStyles[`size_${size}`],
          disabled && textStyles.disabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
