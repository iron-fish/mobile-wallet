import { html, css } from "react-strict-dom";
import { ComponentProps } from "react";
import { HStack, Text } from "@/index";
import { Icon, type IconName } from "@/components/Icon/Icon";
import { colors } from "@/vars/index.stylex";

const styles = css.create({
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

type ButtonProps = ComponentProps<typeof html.button>;

type Props = {
  disabled?: boolean;
  title: string;
  variant?: "solid" | "outline" | "ghost";
  onClick?: ButtonProps["onClick"];
  rightIcon?: IconName;
  borderRadius?: number;
};

export function Button({
  title,
  disabled,
  onClick,
  rightIcon,
  variant = "solid",
  borderRadius,
}: Props) {
  const borderRadiusStyle = borderRadius
    ? styles.borderRadius(borderRadius)
    : {};
  const computedStyles = [
    styles.base,
    variant === "solid" && styles.solid,
    variant === "outline" && styles.outline,
    variant === "ghost" && styles.ghost,
    disabled && styles.disabled,
    borderRadiusStyle,
  ];

  return onClick ? (
    <html.button
      style={computedStyles}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
      }}
    >
      <ButtonContent title={title} rightIcon={rightIcon} />
    </html.button>
  ) : (
    <html.div style={computedStyles}>
      <ButtonContent title={title} rightIcon={rightIcon} />
    </html.div>
  );
}
function ButtonContent({
  title,
  rightIcon,
}: {
  title: string;
  rightIcon?: IconName;
}) {
  return (
    <HStack gap={8} justifyContent="center">
      <Text>{title}</Text>
      {rightIcon && <Icon name={rightIcon} />}
    </HStack>
  );
}
