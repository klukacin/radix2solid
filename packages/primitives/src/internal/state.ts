import {
  createMemo,
  createRoot,
  createSignal,
  getOwner,
  isDisposed,
  runWithOwner,
  untrack,
  type Accessor,
} from "solid-js";

export interface ControllableStateOptions<T> {
  value: Accessor<T | undefined>;
  defaultValue: T;
  onChange?: (value: T) => void;
}

export function createControllableState<T>(
  options: ControllableStateOptions<T>,
): [Accessor<T>, (next: T | ((previous: T) => T)) => void] {
  const initial = untrack(() => options.defaultValue),
    owner = getOwner();
  const [local, setLocal] = createSignal<T>(() => initial);
  // A tuple keeps arbitrary controlled values out of native async interpretation.
  const controlledValue = createMemo(() => [options.value()] as const, {
    equals: (previous, next) => Object.is(previous[0], next[0]),
  });
  let pending = initial;
  // Requests may run in an effect callback; compiled conditional props allocate a memo per read, so own and dispose it here.
  // Unmount cleanups request after that owner is disposed; they fall back to the ambient one.
  const read = <V>(source: () => V): V =>
    runWithOwner(owner && !isDisposed(owner) ? owner : getOwner(), () =>
      createRoot((dispose) => {
        try {
          return untrack(source);
        } finally {
          dispose();
        }
      }),
    );
  const value = () => {
    const controlled = controlledValue()[0];
    return controlled === undefined ? local() : controlled;
  };
  return [
    value,
    (next) => {
      const controlled = read(options.value);
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
      // Only the getter read is owned; the consumer callback runs outside that scope so it may write.
      const onChange = read(() => options.onChange);
      untrack(() => onChange?.(resolved));
    },
  ];
}
