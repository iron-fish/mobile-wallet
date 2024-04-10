import { ZodTypeAny, z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { buildQueryKey } from "./utils";
import type {
  Expect,
  Equal,
  ResolverFunc,
  UseQueryType,
  HandlerQueryBuilder,
  FacadeFn,
  UseMutationType,
} from "./types";

// Query handlers

function buildUseQuery(baseQueryKey: string) {
  return <TResolver extends ResolverFunc>(resolver: TResolver) => ({
    useQuery: (args?: unknown) => {
      return useQuery({
        queryKey: [baseQueryKey, ...buildQueryKey(args)],
        queryFn: () => resolver(args),
      });
    },
  });
}

function handlerQueryBuilder<TResolver extends ResolverFunc>(
  resolver: TResolver,
): (baseQueryKey: string) => {
  useQuery: UseQueryType<TResolver>;
} {
  return (baseQueryKey: string) => buildUseQuery(baseQueryKey)(resolver);
}

// Mutation handlers

function buildUseMutation() {
  return <TResolver extends ResolverFunc>(resolver: TResolver) => ({
    useMutation: () => {
      return useMutation<ReturnType<TResolver>, Error, unknown, unknown>({
        mutationFn: resolver,
      });
    },
  });
}

function handlerMutationBuilder<TResolver extends ResolverFunc>(
  resolver: TResolver,
): () => {
  useMutation: UseMutationType<TResolver>;
} {
  return () => buildUseMutation()(resolver);
}

// Input util

function handlerInputBuilder<TSchema extends ZodTypeAny>(_schema: TSchema) {
  return {
    query: <TResolver extends ResolverFunc<z.infer<TSchema>>>(
      resolver: (args: Parameters<TResolver>[0]) => ReturnType<TResolver>,
    ) => {
      return handlerQueryBuilder(resolver);
    },
  };
}

// Facade

function facade<
  THandlers extends Record<
    string,
    | ReturnType<typeof handlerQueryBuilder>
    | ReturnType<typeof handlerMutationBuilder>
  >,
>(handlers: THandlers) {
  const result: Record<string, any> = {};

  for (const [key, handler] of Object.entries(handlers)) {
    result[key] = handler(key);
  }

  return result as { [K in keyof THandlers]: ReturnType<THandlers[K]> };
}

type assertions = [
  Expect<Equal<typeof handlerQueryBuilder, HandlerQueryBuilder>>,
  Expect<Equal<typeof facade, FacadeFn>>,
];

export const f = {
  facade,
  handler: {
    input: handlerInputBuilder,
    query: handlerQueryBuilder,
    mutation: handlerMutationBuilder,
  },
};
