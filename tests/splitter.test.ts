import assert from 'node:assert/strict';
import { test } from 'node:test';
import { constrainPanels, validateNumber, validateParts } from '../packages/primitives/src/splitter/math.ts';

test('two-pane constraints preserve both bounds, infeasible space and fractional requests', () => {
  const primary = { min: 100, max: 800 }, secondary = { min: 300, max: 700 };
  assert.deepEqual(constrainPanels(1000, 900, primary, secondary), { primary: 700, secondary: 300, min: 300, max: 700, state: 'satisfied' });
  assert.deepEqual(constrainPanels(1000, 400, { min: 600, max: 800 }, { min: 500, max: 700 }), { primary: 600, secondary: 500, min: 600, max: 800, state: 'overflow' });
  assert.deepEqual(constrainPanels(1000, 400, { min: 100, max: 200 }, { min: 0, max: 300 }), { primary: 200, secondary: 300, min: 100, max: 200, state: 'underflow' });
  assert.equal(constrainPanels(1000, 400.5 + 10, primary, secondary).primary, 410.5);
  assert.deepEqual(constrainPanels(0, 0, { min: 0, max: Infinity }, { min: 0, max: Infinity }), { primary: 0, secondary: 0, min: 0, max: 0, state: 'satisfied' });
  const zero = constrainPanels(0, 400, primary, secondary);
  assert.equal(zero.primary, 400); assert.equal(zero.secondary, 300); assert.equal(zero.state, 'overflow');
  assert.ok([zero.primary, zero.secondary, zero.min, zero.max].every(value => Number.isFinite(value) && value >= 0));
  assert.deepEqual(constrainPanels(1000, 20, { min: 20, max: 20 }, secondary), { primary: 20, secondary: 700, min: 20, max: 20, state: 'underflow' });
});

test('configuration rejects invalid public numbers and duplicate, absent or misordered parts', () => {
  for (const value of [-1, NaN, Infinity, -Infinity]) assert.throws(() => validateNumber(value, 'px', 'size'), /Splitter/);
  assert.throws(() => validateNumber(101, '%', 'size'), /Splitter/);
  assert.throws(() => validateNumber(0, 'px', 'step', true), /Splitter/);
  assert.equal(validateNumber(0.5, '%', 'step', true), 0.5);
  assert.equal(validateNumber(10000, 'px', 'size'), 10000);
  validateParts(['primary', 'handle', 'secondary']);
  for (const parts of [[], ['primary', 'handle'], ['primary', 'primary', 'handle', 'secondary'], ['secondary', 'handle', 'primary']]) assert.throws(() => validateParts(parts), /primary.*Handle.*secondary/);
});
