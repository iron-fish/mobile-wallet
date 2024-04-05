import {
  UndefinedInitialDataOptions,
  UseQueryResult,
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

export type AnyFunc = (...args: any[]) => any;

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

export type HandlerQueryFn = <TResolver extends ResolverFunc>(
  func: TResolver,
) => (baseQueryKey: string) => {
  useQuery: UseQueryType<TResolver>;
};

export type FacadeFn = <
  THandlers extends Record<string, ReturnType<HandlerQueryFn>>,
>(
  handlers: THandlers,
) => { [K in keyof THandlers]: ReturnType<THandlers[K]> };

export type Query<T extends any = any> = {
  useQuery: UseQueryType<ResolverFunc<T>>;
};

export type Mutation<T extends any = any> = {
  useMutation: T;
};

export type FacadeDefinition<
  TDefinition extends Record<
    string,
    Query | Mutation | Record<string, Query | Mutation>
  >,
> = TDefinition;
