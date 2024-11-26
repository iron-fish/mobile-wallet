import { Link } from "expo-router";
import { GestureResponderEvent, Pressable, StyleSheet } from "react-native";
import { Button } from "@ironfish/tackle-box";

/**
 * A button that navigates to `href` when pressed. May be removed or replaced when
 * ui-kit has a pattern for this.
 */
export function LinkButton({
  title,
  href,
  onPress,
  styleVariant = "solid",
}: {
  title: string;
  href: string;
  onPress?: (event: GestureResponderEvent) => void;
  styleVariant?: "solid" | "outline" | "ghost";
}) {
  return (
    <Link href={href} asChild>
      <Pressable onPress={onPress}>
        <Button styleVariant={styleVariant} title={title} />
      </Pressable>
    </Link>
  );
}
