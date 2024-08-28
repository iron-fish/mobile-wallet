import {
  UseQueryResult,
  UseMutationResult,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";

export type ResolverFunc<T = any> = (args: T) => any;

// Query type utils

export type UseQueryOptionsWithoutKey<T> = Omit<UseQueryOptions<T>, 'queryKey'>

type UseQueryType<
  TResolver extends ResolverFunc,
  TReturn = Awaited<ReturnType<TResolver>>,
> = Parameters<TResolver>["length"] extends 0
  ? (
      args?: null | undefined,
      opts?: UseQueryOptionsWithoutKey<TReturn>,
    ) => UseQueryResult<TReturn>
  : (
      args: Parameters<TResolver>[0],
      opts?: UseQueryOptionsWithoutKey<TReturn>,
    ) => UseQueryResult<TReturn>;

export type HandlerQueryBuilderReturn<TResolver extends ResolverFunc> = (
  baseQueryKey: string,
) => {
  buildQueryKey: (args: Parameters<TResolver>["length"] extends 0 ? null | undefined : Parameters<TResolver>[0]) => any[];
  resolver: (args: Parameters<TResolver>["length"] extends 0 ? null | undefined : Parameters<TResolver>[0]) => Awaited<ReturnType<TResolver>>;
  useQuery: UseQueryType<TResolver>;
};

// Mutation type utils

type UseMutationType<
  TResolver extends ResolverFunc,
  TReturn = Awaited<ReturnType<TResolver>>,
> = Parameters<TResolver>["length"] extends 0
  ? (opts?: UseMutationOptions<TReturn, Error, null | undefined, unknown>) => UseMutationResult<TReturn>
  : (opts?: UseMutationOptions<TReturn, Error, Parameters<TResolver>[0], unknown>) => UseMutationResult<TReturn>

export type HandlerMutationBuilderReturn<TResolver extends ResolverFunc> =
  () => {
    useMutation: UseMutationType<TResolver>;
  };

// Facade function type

export type FacadeFn = <
  THandlers extends Record<
    string,
    | HandlerQueryBuilderReturn<ResolverFunc>
    | HandlerMutationBuilderReturn<ResolverFunc>
  >,
>(
  handlers: THandlers,
) => { [K in keyof THandlers]: ReturnType<THandlers[K]> };

// Externally consumed types

export type Query<TResolver extends ResolverFunc> =
  HandlerQueryBuilderReturn<TResolver>;

export type Mutation<TResolver extends ResolverFunc> =
  HandlerMutationBuilderReturn<TResolver>;
