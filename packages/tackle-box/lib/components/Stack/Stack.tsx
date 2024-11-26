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
  align: (align: string) => ({
    alignItems: align,
  }),
  justify: (justify: string) => ({
    justifyContent: justify,
  }),
});

type StackProps = BoxProps & {
  gap?: number;
  spacing?: number;
  align?: string;
  justify?: string;
};

export function HStack({
  gap = 0,
  spacing,
  align = "stretch",
  justify = "flex-start",
  children,
  ...rest
}: StackProps) {
  return (
    <Box
      style={[
        styles.horizontal,
        styles.gap(applyBaseSpacing(spacing ?? gap)),
        styles.align(align),
        styles.justify(justify),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}

export function VStack({
  gap = 0,
  spacing,
  align = "stretch",
  justify = "flex-start",
  children,
  ...rest
}: StackProps) {
  return (
    <Box
      style={[
        styles.vertical,
        styles.gap(applyBaseSpacing(spacing ?? gap)),
        styles.align(align),
        styles.justify(justify),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}
