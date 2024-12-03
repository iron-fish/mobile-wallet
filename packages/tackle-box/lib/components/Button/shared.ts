import { html, css } from "react-strict-dom";
import { ComponentProps } from "react";
import { colors } from "@/vars/index.stylex";

export const styles = css.create({
  base: {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 24,
    paddingRight: 24,
    fontSize: 20,
    borderRadius: 9999,
  },
  solid: {
    backgroundColor: {
      default: colors.backgroundInverse,
      ":active": colors.backgroundHoverInverse,
    },
    borderWidth: 0,
    color: colors.textPrimaryInverse,
  },
  outline: {
    backgroundColor: {
      default: "rgba(0, 0, 0, 0.0)",
      ":active": "rgba(0, 0, 0, 0.05)",
    },
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  ghost: {
    backgroundColor: {
      default: "rgba(0, 0, 0, 0.0)",
      ":active": "rgba(0, 0, 0, 0.05)",
    },
    borderWidth: 0,
    borderColor: "transparent",
    color: colors.textPrimary,
  },
  disabled: {
    backgroundColor: colors.backgroundDisabled,
    borderColor: "transparent",
    color: colors.textDisabled,
  },
  borderRadius: (radius: number) => ({
    borderRadius: radius,
  }),
  icon: {
    width: 17,
    height: 18,
  },
});

export type OnClick = ComponentProps<typeof html.button>["onClick"];
