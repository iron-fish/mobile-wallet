import { ReactNode } from "react";
import { css, html } from "react-strict-dom";

type Sizes = "4xl" | "3xl" | "2xl" | "xl" | "lg" | "md" | "sm" | "xs";

const styles = css.create({
  base: {
    fontFamily: "Favorit",
  },
  "4xl": {
    fontFamily: "FavoritExtended",
    fontSize: 70,
    lineHeight: 0.885,
  },
  "3xl": {
    fontFamily: "FavoritExtended",
    fontSize: 44,
    lineHeight: 1.136,
  },
  "2xl": {
    fontSize: 40,
    lineHeight: 1.35,
  },
  xl: {
    fontSize: 32,
    lineHeight: 1.125,
  },
  lg: {
    fontSize: 24,
    lineHeight: 1.083,
  },
  md: {
    fontSize: 20,
    lineHeight: 1.35,
  },
  sm: {
    fontSize: 16,
    lineHeight: 1.312,
  },
  xs: {
    fontSize: 12,
    lineHeight: 1.583,
  },
});

type Props = {
  children?: ReactNode;
  size?: Sizes;
};

export function Text({ children, size = "md" }: Props) {
  return <html.span style={[styles.base, styles[size]]}>{children}</html.span>;
}
