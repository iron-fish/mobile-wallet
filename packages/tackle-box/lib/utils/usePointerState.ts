import { ComponentProps, useState } from "react";
import { MouseEvent } from "react-native";
import { html } from "react-strict-dom";

type ButtonProps = ComponentProps<typeof html.button>;

export type PointerStateEvents = {
  onMouseDown?: ButtonProps["onMouseDown"];
  onMouseUp?: ButtonProps["onMouseUp"];
  onMouseEnter?: ButtonProps["onMouseEnter"];
  onMouseLeave?: ButtonProps["onMouseLeave"];
};

export function usePointerState({
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
}: PointerStateEvents) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  return {
    isHovered,
    isPressed,
    onMouseEnter: (event: MouseEvent) => {
      setIsHovered(true);
      console.log("onMouseEnter");
      onMouseEnter?.(event);
    },
    onMouseLeave: (event: MouseEvent) => {
      setIsHovered(false);
      console.log("onMouseLeave");
      onMouseLeave?.(event);
    },
    onMouseDown: (event: MouseEvent) => {
      setIsPressed(true);
      console.log("onMouseDown");
      onMouseDown?.(event);
    },
    onMouseUp: (event: MouseEvent) => {
      setIsPressed(false);
      console.log("onMouseUp");
      onMouseUp?.(event);
    },
  };
}
