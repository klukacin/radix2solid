import assert from 'node:assert/strict';
import { test } from 'node:test';
import { children, createMemo, createRenderEffect, createRoot, createSignal, flush, merge, onCleanup, untrack } from 'solid-js';
import { createControllableState } from '@wsagency/radix2solid-primitives/internal';
import { Slot } from '@wsagency/radix2solid-primitives';

test('controlled requests never outrun the parent and use the latest callback', () => {
  const calls: string[] = [];
  const { value, setValue, replace, accept, dispose } = createRoot(dispose => {
    const [parent, accept] = createSignal(false);
    const [callback, replace] = createSignal<(value: boolean) => void>(() => value => calls.push(`old:${value}`));
    const [value, setValue] = createControllableState({
      value: parent, defaultValue: true,
      get onChange() { return callback(); }
    });
    return { value, setValue, replace, accept, dispose };
  });
  try {
    setValue(previous => !previous);
    setValue(previous => !previous);
    assert.equal(value(), false);
    assert.deepEqual(calls, ['old:true', 'old:true']);
    flush();
    assert.equal(value(), false);
    replace(() => (next: boolean) => { calls.push(`new:${next}`); accept(next); }); flush();
    setValue(previous => !previous);
    assert.equal(value(), false);
    setValue(previous => !previous);
    assert.equal(value(), false);
    assert.deepEqual(calls, ['old:true', 'old:true', 'new:true', 'new:true']);
    flush();
    assert.equal(value(), true);
    setValue(true); flush();
    assert.deepEqual(calls, ['old:true', 'old:true', 'new:true', 'new:true']);
  } finally { dispose(); }
});

test('controlled cleanup compares with the current parent in either unmount write order', () => {
  for (const order of ['value-first', 'mount-first', 'unmount-only'] as const) {
    const calls: { next: boolean; accepted: boolean }[] = [];
    const { accept, unmount, dispose } = createRoot(dispose => {
      const [parent, accept] = createSignal(true);
      const [mounted, setMounted] = createSignal(true);
      createMemo(() => {
        if (!mounted()) return;
        const [, request] = createControllableState({
          value: parent, defaultValue: false,
          onChange: next => calls.push({ next, accepted: parent() })
        });
        onCleanup(() => request(false));
      });
      return { accept, unmount: () => setMounted(false), dispose };
    });
    try {
      if (order === 'value-first') accept(false);
      unmount();
      if (order === 'mount-first') accept(false);
      flush();
      assert.deepEqual(calls, order === 'unmount-only' ? [{ next: false, accepted: true }] : [], order);
    } finally { dispose(); }
  }
});

test('uncontrolled defaults initialize once and queued functional updates preserve each request', () => {
  const calls: number[] = [];
  const { value, setValue, replaceInitial, dispose } = createRoot(dispose => {
    const [initial, replaceInitial] = createSignal(2);
    const [value, setValue] = createControllableState({
      value: () => undefined,
      get defaultValue() { return initial(); },
      onChange: next => calls.push(next)
    });
    return { value, setValue, replaceInitial, dispose };
  });
  try {
    replaceInitial(50); flush();
    assert.equal(value(), 2);
    setValue(previous => previous + 1);
    setValue(previous => previous + 1);
    flush();
    assert.equal(value(), 4);
    assert.deepEqual(calls, [3, 4]);
    setValue(4); flush();
    assert.deepEqual(calls, [3, 4]);
  } finally { dispose(); }
});

test('null is a controlled value, not an uncontrolled fallback', () => {
  const promise = Promise.resolve(1);
  const iterable: AsyncIterable<number> = { async *[Symbol.asyncIterator]() { yield 1; } };
  let rawRuns = 0;
  const { value, setValue, rawPromise, rawIterable, provide, dispose } = createRoot(dispose => {
    const [provided, provide] = createSignal({ promise, iterable });
    const [value, setValue] = createControllableState<string | null>({
      value: () => null, defaultValue: 'default'
    });
    const [rawPromise] = createControllableState<Promise<number> | undefined>({ value: () => provided().promise, defaultValue: undefined });
    const [rawIterable] = createControllableState<AsyncIterable<number> | undefined>({ value: () => provided().iterable, defaultValue: undefined });
    createRenderEffect(() => [rawPromise(), rawIterable()], () => { rawRuns++; });
    return { value, setValue, rawPromise, rawIterable, provide, dispose };
  });
  try {
    assert.equal(value(), null);
    assert.equal(rawPromise(), promise);
    assert.equal(rawIterable(), iterable);
    setValue('requested'); flush();
    assert.equal(value(), null);
    assert.equal(rawPromise(), promise);
    assert.equal(rawIterable(), iterable);
    assert.equal(rawRuns, 1);
    provide({ promise, iterable }); flush();
    assert.equal(rawRuns, 1, 'equal raw values do not notify through a new wrapper');
    const nextPromise = Promise.resolve(2);
    const nextIterable: AsyncIterable<number> = { async *[Symbol.asyncIterator]() { yield 2; } };
    provide({ promise: nextPromise, iterable: nextIterable });
    assert.equal(rawPromise(), promise);
    assert.equal(rawIterable(), iterable);
    flush();
    assert.equal(rawPromise(), nextPromise);
    assert.equal(rawIterable(), nextIterable);
    assert.equal(rawRuns, 2);
  } finally { dispose(); }
});

test('Slot preserves live absent, undefined and explicit ARIA relationships for component targets', () => {
  const { output, setMode, dispose } = createRoot(dispose => {
    const [mode, setMode] = createSignal<'absent' | 'undefined' | 'value'>('absent');
    let inspect!: () => string;
    const Target = (props: { 'aria-labelledby'?: string; 'aria-describedby'?: string }) => {
      inspect = () => JSON.stringify({
        hasLabel: 'aria-labelledby' in props,
        hasDescription: 'aria-describedby' in props,
        label: props['aria-labelledby'],
        description: props['aria-describedby']
      });
      return 'Slot target';
    };
    const source = merge(() => mode() === 'absent' ? {} : {
      'aria-labelledby': mode() === 'value' ? 'heading' : undefined,
      'aria-describedby': mode() === 'value' ? 'description' : undefined
    });
    const rendered = children(() => Slot.Root(merge(source, {
      children: (target: Slot.SlotTarget) => target(Target, {})
    })));
    assert.equal(rendered(), 'Slot target');
    createRenderEffect(rendered, value => { assert.equal(value, 'Slot target'); });
    return { output: () => untrack(inspect), setMode, dispose };
  });
  try {
    assert.deepEqual(JSON.parse(String(output())), { hasLabel: false, hasDescription: false });
    setMode('undefined'); flush();
    assert.deepEqual(JSON.parse(String(output())), { hasLabel: true, hasDescription: true });
    setMode('value'); flush();
    assert.deepEqual(JSON.parse(String(output())), { hasLabel: true, hasDescription: true, label: 'heading', description: 'description' });
    setMode('absent'); flush();
    assert.deepEqual(JSON.parse(String(output())), { hasLabel: false, hasDescription: false });
  } finally { dispose(); }
});
