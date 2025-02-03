import { Link } from "expo-router";
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type LinkButtonProps = {
  href: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: "solid" | "outline" | "ghost";
  borderRadius?: number;
  title?: string;
  children?: React.ReactNode;
};

const styles = StyleSheet.create({
  button: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: "#007AFF",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textOutline: {
    color: "#007AFF",
  },
  textGhost: {
    color: "#000",
  },
});

export function LinkButton({
  href,
  onPress,
  disabled,
  variant = "solid",
  borderRadius = 8,
  title,
  children,
}: LinkButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[variant],
    { borderRadius },
    disabled && styles.disabled,
  ];

  const textStyles = [
    styles.text,
    variant === "outline" && styles.textOutline,
    variant === "ghost" && styles.textGhost,
  ];

  return (
    <View style={buttonStyles}>
      <Link href={href} asChild>
        <Pressable onPress={onPress} disabled={disabled}>
          {title ? <Text style={textStyles}>{title}</Text> : children}
        </Pressable>
      </Link>
    </View>
  );
}
