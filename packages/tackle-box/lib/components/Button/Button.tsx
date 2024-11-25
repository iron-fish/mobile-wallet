import { html, css } from "react-strict-dom";
import { ComponentProps } from "react";

const colors = css.defineVars({
  black: "#000",
  white: "#fff",
  grayLight: "#DEDFE2",
  grayMedium: "#989898",
  grayDark: "#353535",
});

const styles = css.create({
  base: {
    backgroundColor: {
      default: colors.black,
      ":active": colors.grayDark,
    },
    borderWidth: 0,
    boxSizing: "border-box",
    color: colors.white,
    textAlign: "center",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 24,
    paddingRight: 24,
    fontSize: 20,
    borderRadius: 9999,
  },
  disabled: {
    backgroundColor: colors.grayLight,
    color: colors.grayMedium,
  },
});

type ButtonProps = ComponentProps<typeof html.button>;

type Props = Pick<ButtonProps, "onClick"> & {
  children: React.ReactNode;
  disabled?: boolean;
};

export function Button({ disabled, onClick, children }: Props) {
  return (
    <html.button
      style={[styles.base, disabled && styles.disabled]}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
      }}
    >
      {children}
    </html.button>
  );
}
