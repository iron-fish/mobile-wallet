export type DirectionalValue = [number, number, number, number];

export type BorderRadiusArgs = {
  borderRadius?: "full" | number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
};

export function computeBorderRadius({
  borderRadius = 0,
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
}: BorderRadiusArgs) {
  const initialRadius = borderRadius === "full" ? 9999 : borderRadius;

  const value: DirectionalValue = [
    initialRadius,
    initialRadius,
    initialRadius,
    initialRadius,
  ];

  [
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
  ].forEach((radius, index) => {
    if (radius !== undefined) {
      value[index] = radius;
    }
  });

  return value;
}

export type BorderWidthArgs = {
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
};

export function computeBorderWidth({
  borderWidth,
  borderTopWidth,
  borderRightWidth,
  borderBottomWidth,
  borderLeftWidth,
}: BorderWidthArgs): DirectionalValue {
  const initialWidth = borderWidth ?? 0;

  const value: DirectionalValue = [
    initialWidth,
    initialWidth,
    initialWidth,
    initialWidth,
  ];

  [
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
  ].forEach((width, index) => {
    if (width !== undefined) {
      value[index] = width;
    }
  });

  return value;
}
