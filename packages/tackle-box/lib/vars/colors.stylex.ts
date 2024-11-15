import { css } from "react-strict-dom";
import { VarKeys } from "@/utils/types";

// Based off of:
//  https://www.figma.com/design/ejI1OJnIyNbqiPw94FwzDp/Mobile-App?node-id=1672-3924&t=MMrHs0Y0V34oxa3X-4
// Base color palette (not sold on name `neutral`)
export const palette = css.defineVars({
  neutral0: "#000000", // Pure black
  neutral5: "#0D0D0D",
  neutral10: "#101010", // Dark background
  neutral15: "#1A1A1A",
  neutral20: "#1F1F1F",
  neutral25: "#252525", // Dark grey 3
  neutral30: "#2A2A2A",
  neutral35: "#353535",
  neutral40: "#3B3B3B", // Dark grey 2
  neutral45: "#404040",
  neutral50: "#4D4D4D",
  neutral55: "#595959",
  neutral60: "#666666",
  neutral65: "#737373",
  neutral70: "#7F7F7F", // Grey 1
  neutral75: "#8C8C8C",
  neutral80: "#ADAEB4", // Dark grey 1
  neutral85: "#CCCCCC",
  neutral90: "#DEDFE2", // Grey 2
  neutral95: "#F3F3F4", // Lighter grey
  neutral100: "#FFFFFF", // Pure white

  // Extra colors for getting up and running
  black: "#000000",
  white: "#FFFFFF",
  gray: "#7F7F7F",
  pink: "#FFC0CB",
});

// Theme tokens
export const colors = css.defineVars({
  // background colors
  background: {
    default: palette.neutral100,
    "@media (prefers-color-scheme: dark)": palette.neutral10,
  },
  backgroundHover: {
    default: palette.neutral95,
    "@media (prefers-color-scheme: dark)": palette.neutral25,
  },
  backgroundDisabled: {
    default: palette.neutral95,
    "@media (prefers-color-scheme: dark)": palette.neutral25,
  },

  // Colored background colors
  backgroundPink: {
    default: palette.pink,
  },

  // Text colors
  textPrimary: {
    default: palette.neutral0,
    "@media (prefers-color-scheme: dark)": palette.neutral100,
  },
  textSecondary: {
    default: palette.neutral70,
    "@media (prefers-color-scheme: dark)": palette.neutral80,
  },
  textDisabled: {
    default: palette.neutral90,
    "@media (prefers-color-scheme: dark)": palette.neutral40,
  },

  // Border and outline colors
  border: {
    default: palette.neutral0,
    "@media (prefers-color-scheme: dark)": palette.neutral40,
  },
  divider: {
    default: palette.neutral90,
    "@media (prefers-color-scheme: dark)": palette.neutral40,
  },
});

export type PaletteColors = VarKeys<typeof palette>;
