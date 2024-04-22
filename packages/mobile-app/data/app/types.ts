import { Query, Mutation } from "data-facade";

export type AppMethods = {
  loadDatabases: Mutation<() => string>;
};
