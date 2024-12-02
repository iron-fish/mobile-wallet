import { ReactNode } from "react";
import { css, html } from "react-strict-dom";
import { type Colors, getColorValue } from "@/vars/colors.stylex";
import { StyleObj, UnitValue } from "@/utils/types";
import {
  useMarginPaddingValues,
  type MarginPadding,
} from "@/utils/useMarginPaddingValues";

const styles = css.create({
  base: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  backgroundColor: (color?: string) => ({
    backgroundColor: color,
  }),
  dimensions: (height: UnitValue, width: UnitValue) => ({
    height,
    width,
  }),
  margin: (
    top: UnitValue,
    right: UnitValue,
    bottom: UnitValue,
    left: UnitValue,
  ) => ({
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left,
  }),
  padding: (
    top: UnitValue,
    right: UnitValue,
    bottom: UnitValue,
    left: UnitValue,
  ) => ({
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left,
  }),
  borderRadius: (radius: number) => ({
    borderRadius: radius,
  }),
  borderColor: (color?: string) => ({
    borderColor: color,
  }),
  borderWidth: (width: number) => ({
    borderWidth: width,
  }),
  flexGrow: (grow?: number) => ({
    flexGrow: grow,
  }),
});

export type BoxProps = {
  children?: ReactNode;
  height?: UnitValue;
  width?: UnitValue;
  borderRadius?: "full" | number;
  bg?: Colors;
  borderColor?: Colors;
  borderWidth?: number;
  flexGrow?: number;
  style?: StyleObj;
} & MarginPadding;

export function Box({
  children,
  height = "auto",
  width = "100%",
  bg,
  borderColor,
  borderRadius = 0,
  borderWidth = 0,
  flexGrow,
  style,
  ...marginPadding
}: BoxProps) {
  const { margin, padding } = useMarginPaddingValues(marginPadding);

  return (
    <html.div
      style={[
        styles.base,
        styles.dimensions(height, width),
        styles.margin(...margin),
        styles.padding(...padding),
        styles.borderRadius(borderRadius === "full" ? 9999 : borderRadius),
        styles.backgroundColor(bg ? getColorValue(bg) : undefined),
        styles.borderColor(
          borderColor ? getColorValue(borderColor) : undefined,
        ),
        styles.borderWidth(borderWidth),
        styles.flexGrow(flexGrow),
        style,
      ]}
    >
      {children}
    </html.div>
  );
}
