import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRoot, createSignal, flush } from 'solid-js';
import { createControllableState } from '@radix-solid/primitives/internal';

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
    setValue(true); flush();
    assert.equal(value(), false);
    assert.deepEqual(calls, ['old:true']);
    replace(() => (next: boolean) => { calls.push(`new:${next}`); accept(next); }); flush();
    setValue(previous => !previous); flush();
    assert.equal(value(), true);
    assert.deepEqual(calls, ['old:true', 'new:true']);
    setValue(true); flush();
    assert.deepEqual(calls, ['old:true', 'new:true']);
  } finally { dispose(); }
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
  const { value, setValue, dispose } = createRoot(dispose => {
    const [value, setValue] = createControllableState<string | null>({
      value: () => null, defaultValue: 'default'
    });
    return { value, setValue, dispose };
  });
  try {
    assert.equal(value(), null);
    setValue('requested'); flush();
    assert.equal(value(), null);
  } finally { dispose(); }
});
