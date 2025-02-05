import { useRouter } from "expo-router";
import { GestureResponderEvent, StyleProp, ViewStyle } from "react-native";
import { Button } from "@ui-kitten/components";

type LinkButtonProps = {
  href: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: "solid" | "outlined" | "ghost";
  borderRadius?: number;
  title?: string;
  children?: string;
  style?: StyleProp<ViewStyle>;
};

export function LinkButton({
  href,
  onPress,
  disabled,
  variant = "solid",
  borderRadius = 8,
  title,
  children,
  style,
}: LinkButtonProps) {
  const router = useRouter();

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;

    if (onPress) {
      onPress(e);
    }
    if (href) {
      router.push(href);
    }
  };

  // Map our variant prop to UI Kitten's appearance prop
  const getAppearance = () => {
    switch (variant) {
      case "outlined":
        return "outline";
      case "ghost":
        return "ghost";
      default:
        return "filled";
    }
  };

  return (
    <Button
      appearance={getAppearance()}
      disabled={disabled}
      onPress={handlePress}
      style={[{ borderRadius }, style]}
    >
      {title || children || ""}
    </Button>
  );
}
