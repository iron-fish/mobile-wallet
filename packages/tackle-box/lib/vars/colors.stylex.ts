import { css } from "react-strict-dom";
import { VarKeys } from "@/utils/types";

// Based off of:
//  https://www.figma.com/design/ejI1OJnIyNbqiPw94FwzDp/Mobile-App?node-id=1672-3924&t=MMrHs0Y0V34oxa3X-4
// Base color palette (not sold on name `neutral`)
export const palette = css.defineVars({
  gray900: "#111111", // Black
  gray800: "#252525",
  gray700: "#3B3B3B",
  gray600: "#989898",
  gray500: "#ADAEB4",
  gray300: "#DEDFE2",
  gray100: "#F3F3F4",

  // Explicit colors
  black: "#101010",
  white: "#FFFFFF",
  pink: "#FFC0CB",
  transparent: "transparent",
});

// Theme tokens
export const colors = css.defineVars({
  // Background colors
  background: {
    default: palette.white,
    "@media (prefers-color-scheme: dark)": palette.gray900,
  },
  backgroundInverse: {
    default: palette.gray900,
    "@media (prefers-color-scheme: dark)": palette.white,
  },
  backgroundHover: {
    default: palette.gray100,
    "@media (prefers-color-scheme: dark)": palette.gray800,
  },
  backgroundHoverInverse: {
    default: palette.gray800,
    "@media (prefers-color-scheme: dark)": palette.gray100,
  },
  backgroundActive: {
    default: palette.gray100,
    "@media (prefers-color-scheme: dark)": palette.gray800,
  },
  backgroundActiveInverse: {
    default: palette.gray800,
    "@media (prefers-color-scheme: dark)": palette.gray100,
  },
  backgroundDisabled: {
    default: palette.gray100,
    "@media (prefers-color-scheme: dark)": palette.gray800,
  },
  backgroundDisabledInverse: {
    default: palette.gray800,
    "@media (prefers-color-scheme: dark)": palette.gray100,
  },

  // Colored background colors
  backgroundPink: {
    default: palette.pink,
  },

  // Text colors
  textPrimary: {
    default: palette.gray900,
    "@media (prefers-color-scheme: dark)": palette.white,
  },
  textPrimaryInverse: {
    default: palette.white,
    "@media (prefers-color-scheme: dark)": palette.gray900,
  },
  textSecondary: {
    default: palette.gray600,
    "@media (prefers-color-scheme: dark)": palette.gray500,
  },
  textSecondaryInverse: {
    default: palette.gray500,
    "@media (prefers-color-scheme: dark)": palette.gray600,
  },
  textDisabled: {
    default: palette.gray300,
    "@media (prefers-color-scheme: dark)": palette.gray700,
  },
  textDisabledInverse: {
    default: palette.gray700,
    "@media (prefers-color-scheme: dark)": palette.gray300,
  },

  // Border and outline colors
  border: {
    default: palette.gray900,
    "@media (prefers-color-scheme: dark)": palette.gray700,
  },
  divider: {
    default: palette.gray300,
    "@media (prefers-color-scheme: dark)": palette.gray700,
  },
});

export type PaletteColors = VarKeys<typeof palette>;

export type VarColors = VarKeys<typeof colors>;

export type Colors = PaletteColors | VarColors;

export function getColorValue(color: PaletteColors | VarColors): string {
  if (color in palette) {
    return palette[color as PaletteColors];
  }

  return colors[color as VarColors];
}
