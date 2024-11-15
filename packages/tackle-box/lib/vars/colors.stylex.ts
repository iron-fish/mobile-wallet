import { css } from "react-strict-dom";
import { VarKeys } from "../utils/types";

export const palette = css.defineVars({
  black: "#000000",
  white: "#FFFFFF",
  gray: "#7F7F7F",
  pink: "#FFC0CB",
});

export type PaletteColors = VarKeys<typeof palette>;
