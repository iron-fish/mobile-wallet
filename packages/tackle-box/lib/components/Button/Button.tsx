import { html } from "react-strict-dom";
import { HStack, Text } from "@/index";
import { Icon, type IconName } from "@/components/Icon/Icon";
import { type OnClick, styles } from "./shared";

type Props = {
  disabled?: boolean;
  title: string;
  variant?: "solid" | "outline" | "ghost";
  onClick?: OnClick;
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
        onClick(e);
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
