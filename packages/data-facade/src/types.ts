import {
  UndefinedInitialDataOptions,
  UseQueryResult,
  UseMutationResult,
  UseMutateFunction,
  UseMutationOptions,
} from "@tanstack/react-query";

export type Expect<T extends true> = T;

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

export type UseQueryOptions = UndefinedInitialDataOptions<
  any,
  Error,
  any,
  unknown[]
>;

export type ResolverFunc<T = any> = (opts: T) => any;

export type UseQueryType<TResolver extends ResolverFunc> =
  Parameters<TResolver>["length"] extends 0
    ? (
        args?: null,
        opts?: UseQueryOptions,
      ) => UseQueryResult<ReturnType<TResolver>>
    : (
        args: Parameters<TResolver>[0],
        opts?: UseQueryOptions,
      ) => UseQueryResult<ReturnType<TResolver>>;

export type UseMutationType<TResolver extends ResolverFunc> = (
  opts?: UseMutationOptions,
) => UseMutationResult<ReturnType<TResolver>>;

export type HandlerQueryBuilder = <TResolver extends ResolverFunc>(
  func: TResolver,
) => (baseQueryKey: string) => {
  useQuery: UseQueryType<TResolver>;
};

export type HandlerMutationBuilder = <TResolver extends ResolverFunc>(
  func: TResolver,
) => () => {
  useMutation: UseMutationType<TResolver>;
};

export type FacadeFn = <
  THandlers extends Record<
    string,
    ReturnType<HandlerQueryBuilder> | ReturnType<HandlerMutationBuilder>
  >,
>(
  handlers: THandlers,
) => { [K in keyof THandlers]: ReturnType<THandlers[K]> };

export type Query<T extends any = any> = {
  useQuery: UseQueryType<ResolverFunc<T>>;
};

export type Mutation<T extends any = any> = {
  useMutation: UseMutationType<ResolverFunc<T>>;
};

export type FacadeDefinition<
  TDefinition extends Record<string, Query | Mutation>,
> = {
  // @todo: Type this correctly
  [K in keyof TDefinition]: any;
};
