import { ZodTypeAny, z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { buildQueryKey } from "./utils";
import type {
  ResolverFunc,
  HandlerMutationBuilderReturn,
  HandlerQueryBuilderReturn,
} from "./types";

// QUERY HANDLERS

function buildUseQuery(baseQueryKey: string) {
  return <TResolver extends ResolverFunc>(resolver: TResolver) => {
    return {
      useQuery: (args?: unknown) => {
        return useQuery({
          queryKey: [baseQueryKey, ...buildQueryKey(args)],
          queryFn: () => resolver(args),
        });
      },
    };
  };
}

function handlerQueryBuilder<TResolver extends ResolverFunc>(
  resolver: TResolver,
): HandlerQueryBuilderReturn<TResolver> {
  return (baseQueryKey: string) => buildUseQuery(baseQueryKey)(resolver);
}

// MUTATION HANDLERS

function buildUseMutation() {
  return <TResolver extends ResolverFunc>(resolver: TResolver) => ({
    useMutation: () => {
      return useMutation<
        Awaited<ReturnType<TResolver>>,
        Error,
        unknown,
        unknown
      >({
        mutationFn: resolver,
      });
    },
  });
}

function handlerMutationBuilder<TResolver extends ResolverFunc>(
  resolver: TResolver,
): HandlerMutationBuilderReturn<TResolver> {
  return () => buildUseMutation()(resolver);
}

// INPUT UTIL

function handlerInputBuilder<TSchema extends ZodTypeAny>(_schema: TSchema) {
  return {
    query: <TResolver extends ResolverFunc<z.infer<TSchema>>>(
      resolver: (args: Parameters<TResolver>[0]) => ReturnType<TResolver>,
    ) => {
      return handlerQueryBuilder(resolver);
    },
    mutation: <TResolver extends ResolverFunc<z.infer<TSchema>>>(
      resolver: (args: Parameters<TResolver>[0]) => ReturnType<TResolver>,
    ) => {
      return handlerMutationBuilder(resolver);
    },
  };
}

// FACADE FUNCTION

function facade<
  THandlers extends Record<
    string,
    ReturnType<typeof handlerQueryBuilder | typeof handlerMutationBuilder>
  >,
>(handlers: THandlers) {
  const result: Record<string, any> = {};

  for (const [key, handler] of Object.entries(handlers)) {
    result[key] = handler(key);
  }

  return result as { [K in keyof THandlers]: ReturnType<THandlers[K]> };
}

// EXPORTS

export const f = {
  facade,
  handler: {
    input: handlerInputBuilder,
    query: handlerQueryBuilder,
    mutation: handlerMutationBuilder,
  },
};
