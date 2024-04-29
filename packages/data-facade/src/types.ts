import {
  UndefinedInitialDataOptions,
  UseQueryResult,
  UseMutationResult,
  UseMutationOptions,
} from "@tanstack/react-query";

export type ResolverFunc<T = any> = (args: T) => any;

// Query type utils

type UseQueryOptions = UndefinedInitialDataOptions<any, Error, any, unknown[]>;

type UseQueryType<
  TResolver extends ResolverFunc,
  TReturn = Awaited<ReturnType<TResolver>>,
> = Parameters<TResolver>["length"] extends 0
  ? (
      args?: null | undefined,
      opts?: UseQueryOptions | undefined,
    ) => UseQueryResult<TReturn>
  : (
      args: Parameters<TResolver>[0],
      opts?: UseQueryOptions | undefined,
    ) => UseQueryResult<TReturn>;

export type HandlerQueryBuilderReturn<TResolver extends ResolverFunc> = (
  baseQueryKey: string,
) => {
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
