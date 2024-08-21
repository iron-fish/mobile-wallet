export type MergeProps<
  BaseProps extends unknown,
  AdditionalProps extends Record<string, unknown>,
> = Omit<BaseProps, keyof AdditionalProps> & AdditionalProps;
