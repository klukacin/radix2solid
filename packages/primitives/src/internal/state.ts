import { createSignal, untrack, type Accessor } from "solid-js";

export interface ControllableStateOptions<T> {
  value: Accessor<T | undefined>;
  defaultValue: T;
  onChange?: (value: T) => void;
}

export function createControllableState<T>(
  options: ControllableStateOptions<T>,
): [Accessor<T>, (next: T | ((previous: T) => T)) => void] {
  const initial = untrack(() => options.defaultValue);
  const [local, setLocal] = createSignal<T>(() => initial);
  let pending = initial;
  const value = () => {
    const controlled = options.value();
    return controlled === undefined ? local() : controlled;
  };
  return [
    value,
    (next) => {
      const controlled = untrack(options.value);
      const previous = controlled === undefined ? pending : controlled;
      const resolved =
        typeof next === "function"
          ? (next as (previous: T) => T)(previous)
          : next;
      if (Object.is(previous, resolved)) return;
      if (controlled === undefined) {
        pending = resolved;
        setLocal(() => resolved);
      }
      untrack(() => options.onChange?.(resolved));
    },
  ];
}
