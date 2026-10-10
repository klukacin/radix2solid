// Native Radix slider algorithms; upstream MIT, Copyright (c) 2022 WorkOS.
export const clamp = (value: number, bounds: readonly [number, number]) => Math.min(bounds[1], Math.max(bounds[0], value));

export function getNextSortedValues(previous: number[] = [], nextValue: number, atIndex: number) {
  const next = [...previous];
  next[atIndex] = nextValue;
  return next.sort((a, b) => a - b);
}

export function convertValueToPercentage(value: number, min: number, max: number) {
  return clamp((100 / (max - min)) * (value - min), [0, 100]);
}

export function getLabel(index: number, count: number) {
  return count > 2 ? `Value ${index + 1} of ${count}` : count === 2 ? ['Minimum', 'Maximum'][index] : undefined;
}

export function getClosestValueIndex(values: number[], next: number) {
  let closest = 0;
  for (let index = 1; index < values.length; index++) {
    if (Math.abs(values[index]! - next) < Math.abs(values[closest]! - next)) closest = index;
  }
  return closest;
}

export function getThumbInBoundsOffset(width: number, percent: number, direction: number) {
  const half = width / 2;
  return (half - linearScale([0, 50], [0, half])(percent) * direction) * direction;
}

export function hasMinStepsBetweenValues(values: number[], distance: number) {
  if (distance > 0) {
    for (let index = 1; index < values.length; index++) if (values[index]! - values[index - 1]! < distance) return false;
  }
  return true;
}

// https://github.com/tmcw-up-for-adoption/simple-linear-scale/blob/master/index.js
export function linearScale(input: readonly [number, number], output: readonly [number, number]) {
  return (value: number) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    return output[0] + ((output[1] - output[0]) / (input[1] - input[0])) * (value - input[0]);
  };
}

export function getDecimalCount(value: number) {
  if (!Number.isFinite(value)) return 0;
  const text = value.toString();
  if (text.includes('e')) {
    const [coefficient, exponent] = text.split('e');
    return Math.max(0, (coefficient!.split('.')[1] || '').length - Number(exponent));
  }
  return (text.split('.')[1] || '').length;
}

export function roundValue(value: number, decimals: number) {
  const rounder = 10 ** decimals;
  return Math.round(value * rounder) / rounder;
}

export function getNextStepValue(value: number, { min, step, direction, multiplier }: { min: number; step: number; direction: number; multiplier: number }) {
  const decimals = getDecimalCount(step);
  const steps = (value - min) / step;
  const nearest = Math.round(steps);
  const aligned = roundValue(nearest * step + min, decimals) === roundValue(value, decimals);
  const next = aligned ? nearest + multiplier * direction : direction > 0 ? Math.ceil(steps) : Math.floor(steps);
  return roundValue(next * step + min, decimals);
}
