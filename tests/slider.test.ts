import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getNextStepValue,
  getNextSortedValues,
  hasMinStepsBetweenValues,
  linearScale,
  convertValueToPercentage,
} from "../packages/primitives/src/slider/math.ts";

test("slider stepping preserves the offset grid, scientific precision, range distance and degenerate geometry", () => {
  assert.equal(
    getNextStepValue(49000, {
      min: 1000,
      step: 5000,
      direction: 1,
      multiplier: 1,
    }),
    51000,
  );
  assert.equal(
    getNextStepValue(49000, {
      min: 1000,
      step: 5000,
      direction: -1,
      multiplier: 1,
    }),
    46000,
  );
  assert.equal(
    getNextStepValue(51000, {
      min: 1000,
      step: 5000,
      direction: 1,
      multiplier: 10,
    }),
    101000,
  );
  assert.equal(
    getNextStepValue(0, { min: 0, step: 1.5e-7, direction: 1, multiplier: 1 }),
    1.5e-7,
  );
  assert.equal(
    getNextStepValue(1.5e-7, {
      min: 0,
      step: 1.5e-7,
      direction: 1,
      multiplier: 1,
    }),
    3e-7,
  );
  const previous = [10, 30];
  assert.deepEqual(getNextSortedValues(previous, 40, 0), [30, 40]);
  assert.deepEqual(previous, [10, 30]);
  assert.equal(hasMinStepsBetweenValues([20, 24], 5), false);
  assert.equal(hasMinStepsBetweenValues([20, 25], 5), true);
  assert.equal(linearScale([0, 0], [12, 24])(100), 12);
  assert.equal(linearScale([0, 100], [10, 20])(50), 15);
  assert.equal(convertValueToPercentage(-1, 0, 100), 0);
  assert.equal(convertValueToPercentage(101, 0, 100), 100);
});
