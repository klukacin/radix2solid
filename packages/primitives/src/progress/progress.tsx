// Native port of Radix Progress; upstream MIT, Copyright (c) 2022 WorkOS.
import { createMemo, merge, omit, untrack, type Accessor, type Element } from 'solid-js';
import { createContextScope, type Scope } from '../internal/context.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';

const [createProgressContext, createProgressScope] = createContextScope('Progress');
const [ProgressProvider, useProgressContext] = createProgressContext<{ value: Accessor<number | null>; max: Accessor<number> }>('Progress');
export { createProgressScope };
export type ProgressProps = PrimitiveProps<'div'> & {
  __scopeProgress?: Scope;
  value?: number | null;
  max?: number;
  getValueLabel?: (value: number, max: number) => string;
};
export type ProgressIndicatorProps = PrimitiveProps<'div'> & { __scopeProgress?: Scope; };
const state = (value: number | null, max: number) => value === null ? 'indeterminate' : value === max ? 'complete' : 'loading';

const defaultGetValueLabel = (value: number, max: number) => `${Math.round(value / max * 100)}%`;
export function Progress(props: ProgressProps): Element {
  const max = createMemo(() => {
    const maximum = props.max;
    if (typeof maximum === 'number' && !Number.isNaN(maximum) && maximum > 0) return maximum;
    if (maximum !== undefined) console.error('Progress: max must be a number greater than 0. Defaulting to 100.');
    return 100;
  });
  const value = createMemo<number | null>(() => {
    const current = props.value;
    const maximum = max();
    if (typeof current === 'number' && !Number.isNaN(current) && current >= 0 && current <= maximum) return current;
    if (current != null) console.error('Progress: value must be between 0 and max, or null for indeterminate progress.');
    return null;
  });
  const forwarded = merge({
    role: 'progressbar' as const, 'aria-valuemin': 0,
    get ['aria-valuemax']() { return max(); },
    get ['aria-valuenow']() { return value() ?? undefined; },
    get ['aria-valuetext']() { const current = value(); return current === null ? undefined : (props.getValueLabel ?? defaultGetValueLabel)(current, max()); },
    get ['data-state']() { return state(value(), max()); },
    get ['data-value']() { return value() ?? undefined; },
    get ['data-max']() { return max(); }
  }, omit(props, '__scopeProgress', 'value', 'max', 'getValueLabel'));
  return <ProgressProvider scope={props.__scopeProgress} value={{ value, max }}><Primitive as="div" {...forwarded} /></ProgressProvider>;
}

export function ProgressIndicator(props: ProgressIndicatorProps): Element {
  const context = useProgressContext('ProgressIndicator', untrack(() => props.__scopeProgress));
  const forwarded = merge({
    get ['data-state']() { return state(context.value(), context.max()); },
    get ['data-value']() { return context.value() ?? undefined; },
    get ['data-max']() { return context.max(); }
  }, omit(props, '__scopeProgress'));
  return <Primitive as="div" {...forwarded} />;
}
