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
};

export function Button({
  title,
  disabled,
  onClick,
  rightIcon,
  variant = "solid",
}: Props) {
  const computedStyles = [
    styles.base,
    variant === "solid" && styles.solid,
    variant === "outline" && styles.outline,
    variant === "ghost" && styles.ghost,
    disabled && styles.disabled,
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
      <Text color="inherit">{title}</Text>
      {rightIcon && <Icon name={rightIcon} />}
    </HStack>
  );
}
