import { colors } from "@/vars/colors.stylex";
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
  },
  "3xl": {
    fontFamily: "FavoritExtended",
    fontSize: 44,
  },
  "2xl": {
    fontSize: 40,
  },
  xl: {
    fontSize: 32,
  },
  lg: {
    fontSize: 24,
  },
  md: {
    fontSize: 20,
  },
  sm: {
    fontSize: 16,
  },
  xs: {
    fontSize: 12,
  },
  textAlign: (textAlign: "left" | "center" | "right") => ({
    textAlign,
  }),
  muted: {
    color: colors.textSecondary,
  },
});

type Props = {
  children?: ReactNode;
  size?: Sizes;
  textAlign?: "left" | "center" | "right";
  muted?: boolean;
};

export function Text({
  children,
  size = "md",
  textAlign = "left",
  muted,
}: Props) {
  return (
    <html.span
      style={[
        styles.base,
        styles[size],
        styles.textAlign(textAlign),
        muted && styles.muted,
      ]}
    >
      {children}
    </html.span>
  );
}
