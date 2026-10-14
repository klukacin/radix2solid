// Native Radix Slider port; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createMemo, createSignal, flush, merge, omit, onCleanup, Show, untrack, type Accessor, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createCollection } from '../internal/collection.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { focus } from '../internal/focus-scope.js';
import { useDirection, type Direction } from '../direction/direction.js';
import { mergeStyles } from '../slot/slot.js';
import { clamp, convertValueToPercentage, getClosestValueIndex, getDecimalCount, getLabel, getNextSortedValues, getNextStepValue, getThumbInBoundsOffset, hasMinStepsBetweenValues, linearScale, roundValue } from './math.js';

type Scoped = { __scopeSlider?: Scope };
export type SliderProps = PrimitiveProps<'span'> & Scoped & {
  name?: string; form?: string; disabled?: boolean; orientation?: 'horizontal' | 'vertical'; dir?: Direction;
  min?: number; max?: number; step?: number; minStepsBetweenThumbs?: number; preserveThumbOrder?: boolean;
  value?: number[]; defaultValue?: number[]; onValueChange?: (value: number[]) => void; onValueCommit?: (value: number[]) => void; inverted?: boolean;
};
export type SliderTrackProps = PrimitiveProps<'span'> & Scoped;
export type SliderRangeProps = PrimitiveProps<'span'> & Scoped;
export type SliderThumbProviderProps = Scoped & { name?: string; children?: Element };
export type SliderThumbTriggerProps = PrimitiveProps<'span'> & Scoped;
export type SliderThumbProps = SliderThumbTriggerProps & { name?: string };
export type SliderBubbleInputProps = PrimitiveProps<'input'> & Scoped & { value?: never };

const [createSliderContext, createSliderScope] = createContextScope('Slider');
export { createSliderScope };
const [Provider, useSlider] = createSliderContext<{
  values: Accessor<number[]>; node: Accessor<HTMLElement | undefined>; collection: ReturnType<typeof createCollection<undefined>>;
  min: Accessor<number>; max: Accessor<number>; step: Accessor<number>; disabled: Accessor<boolean>; orientation: Accessor<'horizontal' | 'vertical'>;
  name: Accessor<string | undefined>; form: Accessor<string | undefined>; direction: Accessor<Direction>; increasing: Accessor<boolean>;
  startEdge: Accessor<'left' | 'right' | 'top' | 'bottom'>; endEdge: Accessor<'left' | 'right' | 'top' | 'bottom'>;
  reserve: () => number; activate: (index: number) => void;
}>('Slider');
const [ThumbProvider, useThumb] = createSliderContext<{
  node: Accessor<HTMLElement | undefined>; ref: (node: HTMLElement | undefined) => void; index: Accessor<number>; value: Accessor<number | undefined>;
  name: Accessor<string | undefined>; hasForm: Accessor<boolean>; size: Accessor<number>;
}>('SliderThumb');

export function Slider(props: SliderProps): Element {
  const scope = untrack(() => props.__scopeSlider), direction = useDirection(() => props.dir);
  const [values, setValues] = createControllableState<number[]>({ value: () => props.value, get defaultValue() { return props.defaultValue ?? [props.min ?? 0]; }, get onChange() { return props.onValueChange; } });
  const initial = untrack(() => [...values()]);
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const collection = createCollection<undefined>();
  const min = () => props.min ?? 0, max = () => props.max ?? 100, step = () => props.step ?? 1;
  const orientation = () => props.orientation ?? 'horizontal';
  const increasing = () => orientation() === 'horizontal' ? (direction() === 'ltr') !== !!props.inverted : !props.inverted;
  let nextIndex = 0, activeIndex = 0;
  let drag: { target: HTMLElement; id: number; rect: DOMRect; before: number[] } | undefined;
  const context = { values, node, collection, min, max, step, orientation, direction, increasing,
    disabled: () => props.disabled ?? false, name: () => props.name, form: () => props.form,
    startEdge: () => orientation() === 'horizontal' ? increasing() ? 'left' as const : 'right' as const : increasing() ? 'bottom' as const : 'top' as const,
    endEdge: () => orientation() === 'horizontal' ? increasing() ? 'right' as const : 'left' as const : increasing() ? 'top' as const : 'bottom' as const,
    reserve: () => nextIndex++, activate: (index: number) => { activeIndex = index; }
  };
  const changed = (before: number[], after: number[]) => before.length !== after.length || before.some((value, index) => value !== after[index]);
  function update(nextValue: number, index: number, commit = false) {
    const previous = values();
    if (context.disabled() || index < 0 || index >= previous.length) return;
    const snapped = roundValue(Math.round((nextValue - min()) / step()) * step() + min(), getDecimalCount(step()));
    const distance = (props.minStepsBetweenThumbs ?? 0) * step();
    const bounds: [number, number] = props.preserveThumbOrder ? [Math.max(min(), (previous[index - 1] ?? min() - distance) + distance), Math.min(max(), (previous[index + 1] ?? max() + distance) - distance)] : [min(), max()];
    const next = clamp(snapped, bounds);
    const proposed = props.preserveThumbOrder ? previous.map((value, at) => at === index ? next : value) : getNextSortedValues(previous, next, index);
    if (!hasMinStepsBetweenValues(proposed, distance)) return;
    activeIndex = props.preserveThumbOrder ? index : proposed.indexOf(next);
    if (changed(previous, proposed)) { setValues(proposed); flush(); }
    const accepted = values();
    focus(collection.items(node())[activeIndex]?.node);
    if (commit && changed(previous, accepted)) props.onValueCommit?.([...accepted]);
  }
  function pointerValue(event: PointerEvent, rect: DOMRect) {
    const horizontal = orientation() === 'horizontal';
    const position = horizontal ? event.clientX - rect.left : rect.bottom - event.clientY;
    const size = horizontal ? rect.width : rect.height;
    return linearScale([0, size], increasing() ? [min(), max()] : [max(), min()])(position);
  }
  function release() {
    const captured = drag; drag = undefined;
    if (captured?.target.hasPointerCapture(captured.id)) captured.target.releasePointerCapture(captured.id);
  }
  if (!isServer) {
    onCleanup(release);
    createEffect(node, element => {
      if (!element) return;
      const document = element.ownerDocument, view = document.defaultView!;
      let alive = true;
      const timers = new Set<number>();
      const reset = (event: Event) => {
        const input = element.querySelector<HTMLInputElement>('input');
        const form = input?.form ?? (props.form ? document.getElementById(props.form) : element.closest('form'));
        if (!form || event.target !== form) return;
        const timer = view.setTimeout(() => {
          timers.delete(timer); if (!alive || event.defaultPrevented) return;
          setValues([...initial]); flush();
          for (const [index, input] of [...element.querySelectorAll<HTMLInputElement>('input')].entries()) input.value = String(untrack(values)[index] ?? '');
        }, 0);
        timers.add(timer);
      };
      document.addEventListener('reset', reset, true);
      return () => { alive = false; document.removeEventListener('reset', reset, true); for (const timer of timers) view.clearTimeout(timer); release(); };
    }, { transparent: true });
    createEffect(context.disabled, disabled => { if (disabled) release(); }, { transparent: true });
  }
  const forwarded = merge({ get dir() { return direction(); }, get ['data-orientation']() { return orientation(); }, get ['data-disabled']() { return context.disabled() ? '' : undefined; } },
    omit(props, '__scopeSlider', 'name', 'form', 'disabled', 'orientation', 'dir', 'min', 'max', 'step', 'minStepsBetweenThumbs', 'preserveThumbOrder', 'value', 'defaultValue', 'onValueChange', 'onValueCommit', 'inverted'), {
      get ref() { return composeRefs(props.ref, ref); },
      get style() { return mergeStyles({ '--radix-slider-thumb-transform': orientation() === 'horizontal' ? 'translateX(-50%)' : 'translateY(50%)' }, props.style); },
      onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => {
        if (context.disabled() || event.button !== 0 || event.isPrimary === false || drag) return;
        const element = node(); if (!element) return;
        event.preventDefault();
        const target = event.target as HTMLElement, rect = element.getBoundingClientRect();
        drag = { target, id: event.pointerId, rect, before: [...values()] }; target.setPointerCapture(event.pointerId);
        const index = collection.items(element).findIndex(item => item.node === target || item.node.contains(target));
        if (index >= 0) { activeIndex = index; focus(collection.items(element)[index]?.node); }
        else update(pointerValue(event, rect), getClosestValueIndex(values(), pointerValue(event, rect)));
      }),
      onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, event => { if (drag?.id === event.pointerId) update(pointerValue(event, drag.rect), activeIndex); }),
      onPointerUp: composeEventHandlers<PointerEvent>(() => props.onPointerUp, event => {
        if (drag?.id !== event.pointerId) return;
        const before = drag.before; release(); if (changed(before, values())) props.onValueCommit?.([...values()]);
      }),
      onPointerCancel: composeEventHandlers<PointerEvent>(() => props.onPointerCancel, event => { if (drag?.id === event.pointerId) release(); }),
      onLostPointerCapture: composeEventHandlers<PointerEvent>(() => props.onLostPointerCapture, event => { if (drag?.id === event.pointerId) drag = undefined; }),
      onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
        if (context.disabled() || event.isComposing || !collection.items(node()).some(item => item.node === event.target)) return;
        if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); update(event.key === 'Home' ? min() : max(), event.key === 'Home' ? 0 : values().length - 1, true); return; }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(event.key)) return;
        event.preventDefault();
        const horizontal = orientation() === 'horizontal';
        const back = ['PageDown', horizontal ? 'ArrowDown' : 'ArrowLeft', horizontal ? increasing() ? 'ArrowLeft' : 'ArrowRight' : increasing() ? 'ArrowDown' : 'ArrowUp'];
        const keyDirection = back.includes(event.key) ? -1 : 1;
        update(getNextStepValue(values()[activeIndex]!, { min: min(), step: step(), direction: keyDirection, multiplier: event.shiftKey || event.key.startsWith('Page') ? 10 : 1 }), activeIndex, true);
      })
    });
  return <Provider scope={scope} value={context}><Primitive as="span" {...forwarded} /></Provider>;
}

export function SliderTrack(props: SliderTrackProps): Element {
  const root = useSlider('SliderTrack', untrack(() => props.__scopeSlider));
  const forwarded = merge({ get ['data-orientation']() { return root.orientation(); }, get ['data-disabled']() { return root.disabled() ? '' : undefined; } }, omit(props, '__scopeSlider'));
  return <Primitive as="span" {...forwarded} />;
}

export function SliderRange(props: SliderRangeProps): Element {
  const root = useSlider('SliderRange', untrack(() => props.__scopeSlider));
  const style = createMemo(() => {
    const percentages = root.values().map(value => convertValueToPercentage(value, root.min(), root.max()));
    const start = percentages.length > 1 ? Math.min(...percentages) : 0, end = percentages.length ? Math.max(...percentages) : 0;
    return mergeStyles({ [root.startEdge()]: `${start}%`, [root.endEdge()]: `${100 - end}%` }, props.style);
  });
  const forwarded = merge({ get ['data-orientation']() { return root.orientation(); }, get ['data-disabled']() { return root.disabled() ? '' : undefined; } }, omit(props, '__scopeSlider'), { get style() { return style(); } });
  return <Primitive as="span" {...forwarded} />;
}

export function SliderThumbProvider(props: SliderThumbProviderProps): Element {
  const scope = untrack(() => props.__scopeSlider), root = useSlider('SliderThumbProvider', scope);
  const initialIndex = untrack(root.reserve), [node, ref] = createSignal<HTMLElement | undefined>(), [size, setSize] = createSignal(0);
  const index = () => { const position = root.collection.items(root.node()).findIndex(item => item.node === node()); return position < 0 ? initialIndex : position; };
  if (!isServer) createEffect(() => [node(), root.orientation()] as const, ([element, orientation]) => {
    if (!element) return;
    const unregister = root.collection.register(element, undefined), view = element.ownerDocument.defaultView!;
    const measure = () => { const rect = element.getBoundingClientRect(); setSize(orientation === 'horizontal' ? rect.width : rect.height); };
    const observer = new view.ResizeObserver(measure); observer.observe(element); measure();
    return () => { observer.disconnect(); unregister(); };
  }, { transparent: true });
  const context = { node, ref, index, value: () => root.values()[index()], size,
    name: () => props.name ?? (root.name() ? root.name()! + (root.values().length > 1 ? '[]' : '') : undefined),
    hasForm: () => !node() || !!root.form() || !!node()!.closest('form') };
  return <ThumbProvider scope={scope} value={context}>{props.children}</ThumbProvider>;
}

export function SliderThumbTrigger(props: SliderThumbTriggerProps): Element {
  const scope = untrack(() => props.__scopeSlider), root = useSlider('SliderThumbTrigger', scope), thumb = useThumb('SliderThumbTrigger', scope);
  const percentage = () => thumb.value() === undefined ? 0 : convertValueToPercentage(thumb.value()!, root.min(), root.max());
  const wrapperStyle = () => {
    const offset = getThumbInBoundsOffset(thumb.size(), percentage(), root.increasing() ? 1 : -1);
    return { position: 'absolute' as const, [root.startEdge()]: `calc(${percentage()}% + ${offset}px)`, transform: 'var(--radix-slider-thumb-transform)' };
  };
  const style = () => mergeStyles(thumb.value() === undefined ? { display: 'none' } : {}, props.style);
  const forwarded = merge({ role: 'slider' as const,
    get ['aria-valuemin']() { return root.min(); }, get ['aria-valuemax']() { return root.max(); },
    get ['aria-valuenow']() { return thumb.value(); }, get ['aria-orientation']() { return root.orientation(); }, get ['aria-disabled']() { return root.disabled() ? 'true' as const : 'false' as const; },
    get ['data-orientation']() { return root.orientation(); }, get ['data-disabled']() { return root.disabled() ? '' : undefined; }, get tabIndex() { return root.disabled() ? undefined : 0; }
  }, omit(props, '__scopeSlider'), { get ['aria-label']() { return props['aria-label'] ?? getLabel(thumb.index(), root.values().length); }, get ref() { return composeRefs(props.ref, thumb.ref); }, get style() { return style(); }, onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, () => root.activate(thumb.index())) });
  return <span style={wrapperStyle()}><Primitive as="span" {...forwarded} /></span>;
}

export function SliderThumb(props: SliderThumbProps): Element {
  function Input(): Element { const thumb = useThumb('SliderThumb', untrack(() => props.__scopeSlider)); return <Show when={thumb.hasForm()}><SliderBubbleInput __scopeSlider={props.__scopeSlider} /></Show>; }
  const triggerProps = omit(props, 'name');
  return <SliderThumbProvider __scopeSlider={props.__scopeSlider} name={props.name}><SliderThumbTrigger {...triggerProps} /><Input /></SliderThumbProvider>;
}

export function SliderBubbleInput(props: SliderBubbleInputProps): Element {
  const scope = untrack(() => props.__scopeSlider), root = useSlider('SliderBubbleInput', scope), thumb = useThumb('SliderBubbleInput', scope);
  const [node, ref] = createSignal<HTMLInputElement | undefined>();
  if (!isServer) createEffect(() => [node(), thumb.value()] as const, ([input, value], previous) => {
    if (!input) return;
    const text = value === undefined ? '' : String(value), first = previous?.[0] !== input;
    if (first) input.defaultValue = text;
    input.value = text;
    if (!first && previous?.[1] !== value) { const view = input.ownerDocument.defaultView!; input.dispatchEvent(new view.Event('input', { bubbles: true })); input.dispatchEvent(new view.Event('change', { bubbles: true })); }
  }, { transparent: true });
  const forwarded = merge({ type: 'hidden' as const, get name() { return thumb.name(); }, get form() { return root.form(); }, get disabled() { return root.disabled(); }, get value() { return thumb.value() ?? ''; } }, omit(props, '__scopeSlider'), { get ref() { return composeRefs(props.ref, ref); } });
  return <Primitive as="input" {...forwarded} />;
}
