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
  ...rest
}: {
  title: string;
  href: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: "solid" | "outline" | "ghost";
}) {
  return (
    <Link href={href} asChild>
      <Pressable onPress={onPress}>
        <Button variant={variant} title={title} {...rest} />
      </Pressable>
    </Link>
  );
}
