import { ZodTypeAny, z } from "zod";
import {
  UndefinedInitialDataOptions,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

type UseQueryOptions = UndefinedInitialDataOptions<any, Error, any, unknown[]>;
type ResolverFunc<T = any> = (opts: T) => any;
type UseQueryType<TResolver extends ResolverFunc> =
  Parameters<TResolver>["length"] extends 0
    ? (
        args?: null,
        opts?: UseQueryOptions,
      ) => UseQueryResult<ReturnType<TResolver>>
    : (
        args: Parameters<TResolver>[0],
        opts?: UseQueryOptions,
      ) => UseQueryResult<ReturnType<TResolver>>;

function buildUseQuery(baseQueryKey: string) {
  return <TResolver extends ResolverFunc>(resolver: TResolver) => ({
    useQuery: (args?: unknown) => {
      return useQuery({
        queryKey: [baseQueryKey],
        queryFn: () => resolver(args),
      });
    },
  });
}

function handlerQuery<TResolver extends ResolverFunc>(
  func: TResolver,
): (baseQueryKey: string) => {
  useQuery: UseQueryType<TResolver>;
} {
  return (baseQueryKey: string) => buildUseQuery(baseQueryKey)(func);
}

function facade<
  THandlers extends Record<string, ReturnType<typeof handlerQuery>>,
>(handlers: THandlers) {
  const result: Record<string, any> = {};

  for (const [key, handler] of Object.entries(handlers)) {
    result[key] = handler(key);
  }

  return result as { [K in keyof THandlers]: ReturnType<THandlers[K]> };
}

function input<TSchema extends ZodTypeAny>(_schema: TSchema) {
  return {
    query: <TResolver extends ResolverFunc<z.infer<TSchema>>>(
      resolver: TResolver,
    ) => {
      return handlerQuery(resolver);
    },
  };
}

export const f = {
  facade,
  handler: {
    input,
    query: handlerQuery,
    mutation: (options: any) => {
      // @todo
    },
  },
};
