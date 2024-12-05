import { ReactNode, useMemo } from "react";
import { css } from "react-strict-dom";
import { type Colors, getColorValue } from "@/vars/colors.stylex";
import { StyleObj, UnitValue } from "@/utils/types";
import {
  useMarginPaddingValues,
  type MarginPadding,
} from "@/utils/useMarginPaddingValues";
import {
  computeBorderRadius,
  computeBorderWidth,
  type DirectionalValue,
  type BorderRadiusArgs,
  type BorderWidthArgs,
} from "./utils";
import {
  Polymorphic,
  PolymorphicComponentProps,
  RSDElementTypes,
} from "../Polymorphic/Polymorphic";

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
  borderRadius: (radius: DirectionalValue) => ({
    borderTopLeftRadius: radius[0],
    borderTopRightRadius: radius[1],
    borderBottomLeftRadius: radius[2],
    borderBottomRightRadius: radius[3],
  }),
  borderColor: (color?: string) => ({
    borderColor: color,
  }),
  borderWidth: (width: DirectionalValue) => ({
    borderTopWidth: width[0],
    borderRightWidth: width[1],
    borderBottomWidth: width[2],
    borderLeftWidth: width[3],
  }),
  flexGrow: (grow?: number) => ({
    flexGrow: grow,
  }),
});

export type BoxProps = BorderRadiusArgs &
  BorderWidthArgs & {
    children?: ReactNode;
    height?: UnitValue;
    width?: UnitValue;
    bg?: Colors;
    borderColor?: Colors;
    borderWidth?: number;
    flexGrow?: number;
    style?: StyleObj;
  } & MarginPadding;

export function Box<TAsProp extends RSDElementTypes = "div">({
  children,
  height = "auto",
  width = "100%",
  bg,
  borderColor,
  borderRadius = 0,
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  borderWidth = 0,
  borderTopWidth,
  borderRightWidth,
  borderBottomWidth,
  borderLeftWidth,
  flexGrow,
  style,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  ...rest
}: PolymorphicComponentProps<TAsProp, BoxProps>) {
  const { margin, padding } = useMarginPaddingValues({
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
  });

  const borderRadiusValues = useMemo(() => {
    return computeBorderRadius({
      borderRadius,
      borderTopLeftRadius,
      borderTopRightRadius,
      borderBottomLeftRadius,
      borderBottomRightRadius,
    });
  }, [
    borderRadius,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
  ]);

  const borderWidthValues = useMemo(() => {
    return computeBorderWidth({
      borderWidth,
      borderTopWidth,
      borderRightWidth,
      borderBottomWidth,
      borderLeftWidth,
    });
  }, [
    borderWidth,
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
  ]);

  return (
    <Polymorphic
      style={[
        styles.base,
        styles.dimensions(height, width),
        styles.margin(...margin),
        styles.padding(...padding),
        styles.borderRadius(borderRadiusValues),
        styles.backgroundColor(bg ? getColorValue(bg) : undefined),
        styles.borderColor(
          borderColor ? getColorValue(borderColor) : undefined,
        ),
        styles.borderWidth(borderWidthValues),
        styles.flexGrow(flexGrow),
        style,
      ]}
      {...rest}
    >
      {children}
    </Polymorphic>
  );
}
