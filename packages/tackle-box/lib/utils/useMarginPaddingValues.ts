import { useMemo } from "react";
import { UnitValue } from "./types";
import { applyBaseSpacing } from "./applyBaseSpacing";

export type MarginPadding = {
  m?: UnitValue;
  mx?: UnitValue;
  my?: UnitValue;
  mt?: UnitValue;
  mr?: UnitValue;
  mb?: UnitValue;
  ml?: UnitValue;
  p?: UnitValue;
  px?: UnitValue;
  py?: UnitValue;
  pt?: UnitValue;
  pr?: UnitValue;
  pb?: UnitValue;
  pl?: UnitValue;
};

type TopRightBottomLeft = [UnitValue, UnitValue, UnitValue, UnitValue];

export function useMarginPaddingValues({
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
}: MarginPadding) {
  const margin: TopRightBottomLeft = useMemo(() => {
    let top: UnitValue = 0;
    let right: UnitValue = 0;
    let bottom: UnitValue = 0;
    let left: UnitValue = 0;

    if (m) {
      top = bottom = left = right = m;
    }

    if (mx) {
      left = right = mx;
    }

    if (my) {
      top = bottom = my;
    }

    if (mt) {
      top = mt;
    }

    if (mr) {
      right = mr;
    }

    if (mb) {
      bottom = mb;
    }

    if (ml) {
      left = ml;
    }

    return [top, right, bottom, left].map(
      applyBaseSpacing,
    ) as TopRightBottomLeft;
  }, [m, mb, ml, mr, mt, mx, my]);

  const padding: TopRightBottomLeft = useMemo(() => {
    let top: UnitValue = 0;
    let right: UnitValue = 0;
    let bottom: UnitValue = 0;
    let left: UnitValue = 0;

    if (p) {
      top = bottom = left = right = p;
    }

    if (px) {
      left = right = px;
    }

    if (py) {
      top = bottom = py;
    }

    if (pt) {
      top = pt;
    }

    if (pr) {
      right = pr;
    }

    if (pb) {
      bottom = pb;
    }

    if (pl) {
      left = pl;
    }

    return [top, right, bottom, left].map(
      applyBaseSpacing,
    ) as TopRightBottomLeft;
  }, [p, pb, pl, pr, pt, px, py]);

  return { margin, padding };
}
