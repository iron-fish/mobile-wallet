import { html, css } from "react-strict-dom";
import { Icon, type IconName } from "@/components/Icon/Icon";
import { type OnClick, styles as sharedStyles } from "./shared";
import { VStack } from "../Stack/Stack";
import { Text } from "../Text/Text";

const styles = css.create({
  button: {
    height: 55,
    width: 55,
  },
});

type Props = {
  label: string;
  onClick?: OnClick;
  icon: IconName;
};

export function IconButton({ label, onClick, icon }: Props) {
  const computedStyles = [sharedStyles.base, sharedStyles.solid];
  const Component = onClick ? html.button : html.div;

  return (
    <VStack alignItems="center" gap={2}>
      <Component
        aria-label={label}
        style={[computedStyles, styles.button]}
        onClick={(e) => {
          onClick?.(e);
        }}
      >
        <Icon name={icon} color="white" />
      </Component>
      <Text size="md">{label}</Text>
    </VStack>
  );
}
