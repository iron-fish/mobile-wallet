import { useState } from "react";
import {
  GestureResponderEvent,
  MouseEvent,
  PressableProps,
} from "react-native";

type Args = {
  onHoverIn: PressableProps["onHoverIn"];
  onHoverOut: PressableProps["onHoverOut"];
  onPressIn: PressableProps["onPressIn"];
  onPressOut: PressableProps["onPressOut"];
};

export function usePressableState({
  onHoverIn,
  onHoverOut,
  onPressIn,
  onPressOut,
}: Args) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  return {
    isHovered,
    isPressed,
    onHoverIn: (event: MouseEvent) => {
      setIsHovered(true);
      onHoverIn?.(event);
    },
    onHoverOut: (event: MouseEvent) => {
      setIsHovered(false);
      onHoverOut?.(event);
    },
    onPressIn: (event: GestureResponderEvent) => {
      setIsPressed(true);
      onPressIn?.(event);
    },
    onPressOut: (event: GestureResponderEvent) => {
      setIsPressed(false);
      onPressOut?.(event);
    },
  };
}
