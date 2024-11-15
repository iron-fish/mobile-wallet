import { css } from "react-strict-dom";
import { Box, type BoxProps } from "@/components/Box/Box";
import { applyBaseSpacing } from "@/utils/applyBaseSpacing";

const styles = css.create({
  horizontal: {
    flexDirection: "row",
  },
  vertical: {
    flexDirection: "column",
  },
  gap: (gap: number) => ({
    gap,
  }),
});

type StackProps = BoxProps & {
  gap?: number;
};

export function HStack({ gap = 0, children, ...rest }: StackProps) {
  return (
    <Box
      style={[styles.horizontal, styles.gap(applyBaseSpacing(gap))]}
      {...rest}
    >
      {children}
    </Box>
  );
}

export function VStack({ gap = 0, children, ...rest }: StackProps) {
  return (
    <Box style={[styles.vertical, styles.gap(applyBaseSpacing(gap))]} {...rest}>
      {children}
    </Box>
  );
}
