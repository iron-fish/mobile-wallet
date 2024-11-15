import { BASE_SPACING_UNIT } from "../vars/constants";

import { UnitValue } from "./types";

export function applyBaseSpacing<TValue extends UnitValue>(
  value: TValue,
): TValue {
  return (
    typeof value === "number" ? value * BASE_SPACING_UNIT : value
  ) as TValue;
}
