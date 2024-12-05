import { Link } from "expo-router";
import { GestureResponderEvent, Pressable } from "react-native";
import { Button } from "@ironfish/tackle-box";

type LinkButtonProps = {
  href: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: "solid" | "outline" | "ghost";
  borderRadius?: number;
  title?: string;
  children?: React.ReactNode;
};

export function LinkButton({ href, onPress, ...buttonProps }: LinkButtonProps) {
  return (
    <Link href={href} asChild>
      <Pressable onPress={onPress}>
        <Button {...buttonProps} />
      </Pressable>
    </Link>
  );
}
