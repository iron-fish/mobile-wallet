import { Link } from "expo-router";
import { GestureResponderEvent } from "react-native";
import { Button } from "tamagui";

type LinkButtonProps = {
  href: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: "solid" | "outlined" | "ghost";
  borderRadius?: number;
  title?: string;
  children?: React.ReactNode;
};

export function LinkButton({
  href,
  onPress,
  disabled,
  variant = "solid",
  borderRadius = 8,
  title,
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} asChild>
      <Button
        size="$4"
        disabled={disabled}
        onPress={onPress}
        borderRadius={borderRadius}
        opacity={disabled ? 0.5 : 1}
        variant={variant === "outlined" ? "outlined" : undefined}
        backgroundColor={variant === "ghost" ? "transparent" : undefined}
      >
        {title || children}
      </Button>
    </Link>
  );
}
