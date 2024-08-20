import { Link } from "expo-router";
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

/**
 * A button that navigates to `href` when pressed. May be removed or replaced when
 * ui-kit has a pattern for this.
 */
export function LinkButton({
  title,
  href,
  onPress,
}: {
  title: string;
  href: string;
  onPress?: (event: GestureResponderEvent) => void;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.text}>{title}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "blue",
  },
  text: {
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
});
