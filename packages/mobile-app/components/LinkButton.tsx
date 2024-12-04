import { Link } from "expo-router";
import { GestureResponderEvent, Pressable } from "react-native";
import { Button } from "@ironfish/tackle-box";

/**
 * A button that navigates to `href` when pressed.
 */
export function LinkButton({
  title,
  href,
  onPress,
  variant = "solid",
  borderRadius,
  children,
}: {
  title?: string;
  href?: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: "solid" | "outline" | "ghost";
  borderRadius?: number;
  children?: React.ReactNode;
}) {
  const titleProp = title && !children ? { title } : {};
  return (
    <Link href={href ?? undefined} asChild>
      <Pressable onPress={onPress}>
        <Button variant={variant} {...titleProp} borderRadius={borderRadius}>
          {children}
        </Button>
      </Pressable>
    </Link>
  );
}
