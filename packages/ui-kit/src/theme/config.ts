import {
  media,
  shorthands,
  themes,
  tokens as baseTokens,
} from "@tamagui/config/v3";
import { createTamagui } from "tamagui";
import { createTokens } from "@tamagui/core";
import { animations } from "./animations";
import { fonts } from "./fonts";

const tokens = createTokens({
  ...baseTokens,
  color: {
    ...baseTokens.color,
    ifForegroundLight: "#000000",
    ifBackgroundLight: "#ffffff",
    ifGray1Light: "#7f7f7f",
    ifGray2Light: "#dedfe2",
    ifGray3Light: "#f3f3f4",
    ifForegroundDark: "#ffffff",
    ifBackgroundDark: "#101010",
    ifGray1Dark: "#adaeb4",
    ifGray2Dark: "#3b3b3b",
    ifGray3Dark: "#252525",
  },
  radius: {
    sm: 4,
    full: 9999,
  },
});

export const config = createTamagui({
  animations,
  shorthands,
  tokens,
  themes: {
    light_Button: {
      background: tokens.color.ifForegroundLight,
      color: tokens.color.ifBackgroundLight,
      backgroundHover: "#353535",
      backgroundPress: "#353535",
    },
  },
  fonts,
  media,
});

type Conf = typeof config;

declare module "tamagui" {
  interface TamaguiCustomCOnfig extends Conf {}
}

export default config;
