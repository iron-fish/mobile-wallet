import React from "react";
import { Platform } from "react-native";
import * as ArrowLeftBottom from "./svg/arrow-left-bottom.svg";

const ICONS_MAP = {
  "arrow-left-bottom": ArrowLeftBottom,
} as const;

export type IconNames = keyof typeof ICONS_MAP;

type Props = {
  name: IconNames;
  color?: string;
};

export function Icon({ name, color }: Props) {
  const IconComponent = Platform.select({
    native: () => ICONS_MAP[name].default,
    default: () => ICONS_MAP[name].ReactComponent,
  })();

  return <IconComponent color={color} />;
}
