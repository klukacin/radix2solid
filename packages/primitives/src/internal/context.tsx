// Native port of Radix context scoping; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createContext,
  untrack,
  useContext,
  type Context,
  type Element,
} from "solid-js";

export type Scope = Record<string, Context<any>[]> | undefined;
export type CreateScope = (() => (
  override?: Scope,
) => Record<string, Scope>) & { scopeName: string };

export function createContextScope(
  name: string,
  dependencies: CreateScope[] = [],
) {
  const defaults: unknown[] = [];
  function createScopedContext<T>(rootName: string, fallback?: T) {
    const Base = createContext<T | null>(fallback ?? null);
    const index = defaults.push(fallback ?? null) - 1;
    function Provider(props: {
      scope?: Scope;
      value: T;
      children?: Element;
    }): Element {
      const Selected = untrack(() => props.scope?.[name]?.[index] ?? Base);
      return <Selected value={props.value}>{props.children}</Selected>;
    }
    function useScopedContext(
      consumer: string,
      scope?: Scope,
      optional = false,
    ): T {
      const value = useContext<T | null>(scope?.[name]?.[index] ?? Base);
      if (value === null && !optional && fallback === undefined) {
        throw new Error(`${consumer} must be used within ${rootName}.`);
      }
      return value as T;
    }
    return [Provider, useScopedContext] as const;
  }
  const createScope: CreateScope = Object.assign(
    () => {
      const contexts = defaults.map((value) => createContext(value));
      const dependencyScopes = dependencies.map((create) => ({
        name: create.scopeName,
        use: create(),
      }));
      return (override?: Scope) => {
        const scope = { ...override, [name]: override?.[name] ?? contexts };
        for (const dependency of dependencyScopes)
          Object.assign(
            scope,
            dependency.use(override)[`__scope${dependency.name}`],
          );
        return { [`__scope${name}`]: scope };
      };
    },
    { scopeName: name },
  );
  return [createScopedContext, createScope] as const;
}
