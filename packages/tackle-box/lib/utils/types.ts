import type { css, Styles } from "react-strict-dom";

export type UnitValue = number | string;

export type StyleObj = Styles<{ [key: string]: unknown }>;

export type VarKeys<T> = T extends css.VarGroup<infer U> ? keyof U : never;
