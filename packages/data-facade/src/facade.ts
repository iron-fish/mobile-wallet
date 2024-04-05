import { ZodTypeAny, z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { buildQueryKey } from "./utils";
import type {
  Expect,
  Equal,
  ResolverFunc,
  UseQueryType,
  HandlerQueryFn,
  FacadeFn,
} from "./types";

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
      resolver: (args: Parameters<TResolver>[0]) => ReturnType<TResolver>,
    ) => {
      return handlerQuery(resolver);
    },
  };
}

type assertions = [
  Expect<Equal<typeof handlerQuery, HandlerQueryFn>>,
  Expect<Equal<typeof facade, FacadeFn>>,
];

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
