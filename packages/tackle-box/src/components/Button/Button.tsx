import React from "react";
import { Text, View, Pressable, PressableProps } from "react-native";
import { MergeProps } from "@/utils/types";
import { usePressableState } from "../../utils/usePressableState";
import { Icon, IconNames } from "../Icon/Icon";
import { useColorScheme } from "../ColorScheme/ColorScheme";
import { buttonStyles, iconStyles, textStyles } from "./Button.styles";

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

  const { colorScheme } = useColorScheme();

  return (
    <Pressable
      style={[
        buttonStyles.base,
        buttonStyles.variant[variant][colorScheme],
        variant === "outline" && buttonStyles.variant[variant].size[size],
        buttonStyles.size[size],
        buttonStyles.width[width],
        (isHovered || isPressed) &&
          buttonStyles.variant[variant].active[colorScheme],
        disabled && buttonStyles.disabled[colorScheme],
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
                ? iconStyles.disabled[colorScheme].color
                : iconStyles.variant[variant][colorScheme].color
            }
          />
        </View>
      )}
      <Text
        style={[
          textStyles.variant[variant][colorScheme],
          textStyles.size[size],
          disabled && textStyles.disabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
