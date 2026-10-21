import { isServer } from "@solidjs/web";
import {
  createEffect,
  createRenderEffect,
  createSignal,
  createStore,
  onCleanup,
  type Accessor,
} from "solid-js";

import { useAppStore } from "./hooks";

type StateUpdate<T> = (update: (state: T) => void) => void;
export type ChartStateInitializer = <T extends object>(
  initial: T extends Function ? never : T,
) => [Accessor<T>, StateUpdate<T>];

/** Initial declarations use chart-local data, identically on the server and during hydration. */
export function createChartInitializer() {
  let initializing = true;
  const [ready, setReady] = createSignal(false);
  // Browser-only bookkeeping must not consume a server hydration ID.
  if (!isServer) {
    createEffect(
      () => undefined,
      () => {
        initializing = false;
        setReady(true);
      },
      { transparent: true },
    );
  }
  function createState<T extends object>(
    initial: T extends Function ? never : T,
  ): [Accessor<T>, StateUpdate<T>] {
    // Do not read a native proxy until collection ends: its property nodes cache
    // values, so mutating the raw seed after such a read would leave stale nodes.
    let reactive: [T, StateUpdate<T>] | undefined;
    const live = (): [T, StateUpdate<T>] => {
      if (reactive === undefined) {
        const [state, setState] = createStore<T>(initial);
        reactive = [state, setState];
      }
      return reactive;
    };
    const read = () => (ready() ? live()[0] : initial);
    return [
      read,
      (update) => {
        if (initializing) update(initial);
        else live()[1](update);
      },
    ];
  }
  return { createState, isInitializing: () => initializing };
}

/** Seed the first render without reactive writes; subsequent changes use Solid's apply phase. */
export function createChartEffect<T>(
  compute: () => T,
  apply: (value: T) => void | (() => void),
): void {
  if (isServer) {
    createRenderEffect(compute, apply);
    return;
  }
  const store = useAppStore();
  let first = true;
  let seeded = false;
  let seed: T;
  let initialCleanup: void | (() => void);
  onCleanup(() => initialCleanup?.());
  createEffect(
    () => {
      const value = compute();
      if (first && store?.isInitializing()) {
        seed = value;
        seeded = true;
        initialCleanup = apply(value);
      }
      first = false;
      return value;
    },
    (value) => {
      if (seeded) {
        seeded = false;
        const cleanup = initialCleanup;
        initialCleanup = undefined;
        if (Object.is(seed, value)) return cleanup;
        cleanup?.();
      }
      return apply(value);
    },
  );
}
