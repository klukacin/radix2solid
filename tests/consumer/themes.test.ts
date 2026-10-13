import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRoot, createSignal, flush } from 'solid-js';
import { extractProps } from '@wsagency/radix2solid-themes/helpers';
import { buttonPropDefs, marginPropDefs, breakpoints } from '@wsagency/radix2solid-themes/props';

test('public breakpoints retain the upstream ordered array consumer contract', () => {
  assert.deepEqual(breakpoints.map(value => value), ['initial', 'xs', 'sm', 'md', 'lg', 'xl']);
  assert.equal(breakpoints.includes('md'), true);
  assert.equal(breakpoints.indexOf('md'), 3);
  assert.equal(breakpoints.length, 6);
  assert.equal(breakpoints[0], 'initial');
});

test('responsive extraction preserves frozen input, live defaults and consumer style precedence', () => {
  const frozen = Object.freeze({ md: '3' });
  const state = createRoot(dispose => {
    const [size, setSize] = createSignal<string | typeof frozen>(frozen);
    const [margin, setMargin] = createSignal<string | { initial: string; xs: string; alien: string }>('-2');
    const [color, setColor] = createSignal('blue');
    const result = extractProps({
      get size() { return size(); }, get m() { return margin(); }, get color() { return color(); },
      style: { '--m-xs': '33px' }, 'data-consumer': 'retained'
    }, buttonPropDefs, marginPropDefs);
    return { result, setSize, setMargin, setColor, dispose, classes: () => String(result.class) };
  });
  try {
    assert.match(state.classes(), /\brt-r-size-2\b/);
    assert.match(state.classes(), /\bmd:rt-r-size-3\b/);
    assert.equal(Reflect.get(frozen, 'initial'), undefined);
    assert.match(state.classes(), /-rt-r-m-2\b/);
    assert.equal(state.result.color, 'blue');
    state.setSize('invalid'); state.setColor('red');
    state.setMargin({ initial: '-3', xs: '17px', alien: '11px' }); flush();
    const classes = state.classes();
    assert.match(classes, /\brt-r-size-2\b/);
    assert.doesNotMatch(classes, /md:rt-r-size-3/);
    assert.match(classes, /-rt-r-m-3\b/);
    assert.match(classes, /xs:rt-r-m\b/);
    assert.equal(state.result.color, 'red');
    assert.equal((state.result.style as Record<string, string>)['--m-xs'], '33px');
    assert.doesNotMatch(classes, /alien:rt-r-m/);
    assert.equal((state.result.style as Record<string, string>)['--m-alien'], undefined);
    assert.equal(state.result['data-consumer'], 'retained');
  } finally { state.dispose(); }
});
