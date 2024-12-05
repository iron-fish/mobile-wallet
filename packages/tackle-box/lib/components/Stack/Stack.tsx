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
  align: (alignItems: string) => ({
    alignItems,
  }),
  justify: (justifyContent: string) => ({
    justifyContent,
  }),
});

type StackProps = BoxProps & {
  gap?: number;
  alignItems?: string;
  justifyContent?: string;
};

export function HStack({
  gap = 0,
  alignItems = "stretch",
  justifyContent = "flex-start",
  children,
  ...rest
}: StackProps) {
  return (
    <Box
      style={[
        styles.horizontal,
        styles.gap(applyBaseSpacing(gap)),
        styles.align(alignItems),
        styles.justify(justifyContent),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}

export function VStack({
  gap = 0,
  alignItems = "stretch",
  justifyContent = "flex-start",
  children,
  ...rest
}: StackProps) {
  return (
    <Box
      style={[
        styles.vertical,
        styles.gap(applyBaseSpacing(gap)),
        styles.align(alignItems),
        styles.justify(justifyContent),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}
