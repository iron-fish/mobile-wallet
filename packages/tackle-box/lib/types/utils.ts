export type MergeProps<BaseProps, OverrideProps> = Omit<
  BaseProps,
  keyof OverrideProps
> &
  OverrideProps;
