import { children, createEffect, createMemo, createSignal, createUniqueId, flush, merge, omit, onCleanup, untrack, type Accessor, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { useDirection, type Direction } from '../direction/direction.js';
import { mergeStyles } from '../slot/slot.js';
import { constrainPanels, validateNumber, validateParts } from './math.js';

type Scoped = { __scopeSplitter?: Scope };
export type SplitterProps = PrimitiveProps<'div'> & Scoped & {
  orientation?: 'horizontal' | 'vertical'; dir?: Direction; unit?: '%' | 'px';
  size?: number; defaultSize?: number; onSizeChange?: (proposal: number) => void; onSizeCommit?: (acceptedSize: number) => void;
  step?: number; disabled?: boolean; collapsed?: boolean; defaultCollapsed?: boolean; onCollapsedChange?: (proposal: boolean) => void;
};
export type SplitterPanelProps = PrimitiveProps<'div'> & Scoped & {
  side: 'primary' | 'secondary'; minSize?: number; maxSize?: number; collapsible?: boolean; collapsedSize?: number;
};
export type SplitterHandleProps = PrimitiveProps<'div'> & Scoped;
type Part = { kind: 'primary' | 'handle' | 'secondary'; node: Accessor<HTMLElement | undefined>; props?: SplitterPanelProps };
type Layout = { primary: number; secondary: number; min: number; max: number; state: 'satisfied' | 'overflow' | 'underflow' };

const [createSplitterContext, createSplitterScope] = createContextScope('Splitter');
export { createSplitterScope };
const [Provider, useSplitter] = createSplitterContext<{
  register: (part: Part) => void; primaryId: Accessor<string>; orientation: Accessor<'horizontal' | 'vertical'>;
  unit: Accessor<'%' | 'px'>; disabled: Accessor<boolean>; collapsed: Accessor<boolean>;
  layout: Accessor<Layout>; actionable: Accessor<boolean>;
  available: Accessor<number | undefined>; evacuate: () => void;
  down: (event: PointerEvent) => void; move: (event: PointerEvent) => void; up: (event: PointerEvent) => void;
  cancel: (event: PointerEvent) => void; key: (event: KeyboardEvent) => void;
}>('Splitter');

export function Splitter(props: SplitterProps): Element {
  const scope = untrack(() => props.__scopeSplitter), direction = useDirection(() => props.dir), generatedId = createUniqueId();
  const unit = () => props.unit ?? '%', orientation = () => props.orientation ?? 'horizontal';
  const [size, setSize] = createControllableState({ value: () => props.size, get defaultValue() { return props.defaultSize ?? (unit() === '%' ? 50 : NaN); }, get onChange() { return props.onSizeChange; } });
  const [collapsed, setCollapsed] = createControllableState({ value: () => props.collapsed, get defaultValue() { return props.defaultCollapsed ?? false; }, get onChange() { return props.onCollapsedChange; } });
  const [node, ref] = createSignal<HTMLElement | undefined>(), [available, setAvailable] = createSignal<number | undefined>();
  const [version, setVersion] = createSignal(0), parts: Part[] = [];
  const panel = (side: 'primary' | 'secondary') => { version(); return parts.find(part => part.kind === side)?.props; };
  const step = () => props.step ?? (unit() === '%' ? 1 : 10);
  function configuration() {
    if (!['%', 'px'].includes(unit()) || !['horizontal', 'vertical'].includes(orientation())) throw new Error('Splitter has an invalid unit or orientation.');
    validateNumber(size(), unit(), 'size'); validateNumber(step(), unit(), 'step', true);
    if (props.defaultSize !== undefined) validateNumber(props.defaultSize, unit(), 'defaultSize');
    for (const side of ['primary', 'secondary'] as const) {
      const p = panel(side); if (!p) continue;
      const min = validateNumber(p.minSize ?? 0, unit(), 'minSize');
      if (p.maxSize !== undefined && validateNumber(p.maxSize, unit(), 'maxSize') < min) throw new RangeError('Splitter maxSize must be at least minSize.');
      if (side === 'secondary' && (p.collapsible !== undefined || p.collapsedSize !== undefined)) throw new Error('Splitter secondary Panel cannot have collapse props.');
      if (side === 'primary') {
        if (validateNumber(p.collapsedSize ?? 0, unit(), 'collapsedSize') > min) throw new RangeError('Splitter collapsedSize must not exceed primary minSize.');
        if (!p.collapsible && (collapsed() || props.defaultCollapsed === true)) throw new Error('Splitter collapsed state requires a collapsible primary Panel.');
      }
    }
  }
  const layout = createMemo<Layout>(() => {
    configuration();
    const first = panel('primary'), second = panel('secondary');
    const bounds = (p: SplitterPanelProps | undefined) => ({ min: p?.minSize ?? 0, max: p?.maxSize ?? (unit() === '%' ? 100 : Infinity) });
    const p = bounds(first), s = bounds(second), request = collapsed() ? first?.collapsedSize ?? 0 : size();
    const a = available();
    if (a === undefined) {
      const current = collapsed() ? request : Math.max(p.min, Math.min(p.max, request));
      // Before geometry, fractions describe the remaining native flex space, not outer-box percentages.
      // Infeasible percentage bounds are provisional here; only measurement establishes their pixel rails.
      return { primary: current, secondary: unit() === '%' ? Math.max(s.min, Math.min(s.max, 100 - current)) : 0, min: Math.min(current, p.min), max: Number.isFinite(p.max) ? Math.max(current, p.max) : Math.max(current, p.min), state: 'satisfied' };
    }
    const scale = unit() === '%' ? a / 100 : 1;
    const rail = request * scale;
    const result = constrainPanels(a, rail, collapsed() ? { min: rail, max: rail } : { min: p.min * scale, max: p.max === Infinity ? Infinity : p.max * scale }, { min: s.min * scale, max: s.max === Infinity ? Infinity : s.max * scale });
    if (scale === 0) return { primary: request, secondary: 0, min: Math.min(request, p.min), max: Number.isFinite(p.max) ? Math.max(request, p.max) : Math.max(request, p.min), state: result.state };
    const expandedMax = Math.min(p.max, unit() === '%' ? 100 - s.min : Math.max(0, a - s.min));
    return { primary: result.primary / scale, secondary: result.secondary / scale, min: collapsed() ? Math.min(request, p.min) : result.min / scale, max: collapsed() ? Math.max(request, expandedMax) : result.max / scale, state: result.state };
  });
  const actionable = () => !props.disabled && (available() ?? 0) > 0 && layout().state === 'satisfied';
  let drag: { id: number; target: HTMLElement; start: number; before: number; proposal?: number; accepted: number; unit: '%' | 'px'; available: number; sign: number } | undefined;
  let requesting = false;
  function release() {
    const previous = drag; drag = undefined;
    if (previous?.target.hasPointerCapture(previous.id)) previous.target.releasePointerCapture(previous.id);
  }
  function request(next: number, commit: boolean) {
    if (!actionable() || collapsed()) return;
    const before = layout().primary, proposal = Math.max(layout().min, Math.min(layout().max, next));
    if (proposal === before || (drag && drag.proposal === proposal)) return;
    if (drag) drag.proposal = proposal;
    requesting = true;
    try { setSize(proposal); flush(); } finally { requesting = false; }
    const accepted = layout().primary;
    if (drag) {
      if (size() !== drag.accepted && size() !== proposal) release();
      else drag.accepted = size();
    }
    if (commit && before !== accepted) props.onSizeCommit?.(accepted);
  }
  function toggle() {
    if (!actionable() || !panel('primary')?.collapsible) return;
    setCollapsed(!collapsed()); flush();
  }
  const context = {
    register(part: Part) {
      if (parts.some(other => other.kind === part.kind)) throw new Error(`Splitter has duplicate ${part.kind} parts.`);
      parts.push(part); setVersion(value => value + 1);
      onCleanup(() => { const index = parts.indexOf(part); if (index !== -1) parts.splice(index, 1); setVersion(value => value + 1); release(); });
    },
    primaryId: () => {
      const id = panel('primary')?.id;
      return typeof id === 'string' && id.length > 0 ? id : generatedId;
    }, orientation, unit, disabled: () => props.disabled ?? false,
    collapsed, layout, actionable, available,
    evacuate() {
      const primary = parts.find(part => part.kind === 'primary')?.node(), handle = parts.find(part => part.kind === 'handle')?.node();
      if (primary?.contains(primary.ownerDocument.activeElement)) handle?.focus({ preventScroll: true });
    },
    down(event: PointerEvent) {
      if (event.defaultPrevented || !actionable() || collapsed() || event.button !== 0 || !event.isPrimary || drag) return;
      event.preventDefault(); event.stopPropagation();
      const target = event.currentTarget as HTMLElement;
      drag = { id: event.pointerId, target, start: orientation() === 'horizontal' ? event.clientX : event.clientY, before: layout().primary, accepted: size(), unit: unit(), available: available()!, sign: orientation() === 'horizontal' && direction() === 'rtl' ? -1 : 1 };
      target.setPointerCapture(event.pointerId); target.focus({ preventScroll: true });
    },
    move(event: PointerEvent) {
      if (drag?.id !== event.pointerId) return;
      event.stopPropagation();
      const delta = ((orientation() === 'horizontal' ? event.clientX : event.clientY) - drag.start) * drag.sign;
      request(drag.before + delta * (drag.unit === '%' ? 100 / drag.available : 1), false);
    },
    up(event: PointerEvent) {
      if (drag?.id !== event.pointerId) return;
      event.stopPropagation(); const before = drag.before; release(); flush();
      if (layout().primary !== before) props.onSizeCommit?.(layout().primary);
    },
    cancel(event: PointerEvent) { if (drag?.id === event.pointerId) { event.stopPropagation(); release(); } },
    key(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || !actionable()) return;
      if (event.key === 'Enter') { if (panel('primary')?.collapsible) { event.preventDefault(); event.stopPropagation(); toggle(); } return; }
      if (collapsed()) return;
      let next: number;
      if (event.key === 'Home' || event.key === 'End') next = event.key === 'Home' ? layout().min : layout().max;
      else {
        const keys = orientation() === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
        if (!keys.includes(event.key)) return;
        const sign = (event.key === keys[0] ? -1 : 1) * (orientation() === 'horizontal' && direction() === 'rtl' ? -1 : 1);
        next = layout().primary + sign * step() * (event.shiftKey ? 10 : 1);
      }
      event.preventDefault(); event.stopPropagation(); request(next, true);
    }
  };
  if (!isServer) {
    onCleanup(release);
    createEffect(() => [node(), version()] as const, ([element]) => {
      if (!element) return;
      validateParts(parts.map(part => part.kind));
      const handle = parts.find(part => part.kind === 'handle')?.node();
      if (!handle) return;
      for (const part of parts) if (part.node()?.parentElement !== element) throw new Error('Splitter parts must be direct children of their Root.');
      const direct = [...element.children].filter(child => parts.some(part => part.node() === child));
      validateParts(direct.map(child => parts.find(part => part.node() === child)!.kind));
      let last = '';
      const measure = () => {
        const style = getComputedStyle(element), horizontal = orientation() === 'horizontal';
        const rect = element.getBoundingClientRect(), h = handle.getBoundingClientRect();
        const inset = horizontal ? ['borderLeftWidth', 'borderRightWidth', 'paddingLeft', 'paddingRight'] : ['borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom'];
        const gap = parseFloat(horizontal ? style.columnGap : style.rowGap) || 0;
        const a = Math.max(0, (horizontal ? rect.width : rect.height) - inset.reduce((sum, key) => sum + (parseFloat(Reflect.get(style, key)) || 0), 0) - (horizontal ? h.width : h.height) - gap * 2);
        const signature = [rect.x, rect.y, rect.width, rect.height, h.width, h.height, gap, a].join(':');
        if (last && last !== signature) release();
        last = signature; setAvailable(Number.isFinite(a) ? a : 0);
      };
      const observer = new ResizeObserver(measure); observer.observe(element); observer.observe(handle);
      const mutations = new MutationObserver(measure); mutations.observe(element, { attributes: true, attributeFilter: ['style', 'class', 'dir'] }); mutations.observe(handle, { attributes: true, attributeFilter: ['style', 'class'] });
      measure();
      return () => { observer.disconnect(); mutations.disconnect(); release(); };
    }, { transparent: true });
    createEffect(() => [orientation(), direction(), unit(), props.disabled, panel('primary')?.minSize, panel('primary')?.maxSize, panel('secondary')?.minSize, panel('secondary')?.maxSize, collapsed()] as const, () => { release(); }, { transparent: true });
    createEffect(size, value => { if (drag && !requesting && drag.accepted !== value) release(); }, { transparent: true });
  }
  function Frame(): Element {
    const forwarded = merge(omit(props, '__scopeSplitter', 'unit', 'size', 'defaultSize', 'onSizeChange', 'onSizeCommit', 'step', 'disabled', 'collapsed', 'defaultCollapsed', 'onCollapsedChange', 'orientation'), {
      get ref() { return composeRefs(props.ref, ref); }, get dir() { return direction(); },
      get ['data-orientation']() { return orientation(); }, get ['data-constraint-state']() { return available() === undefined ? 'satisfied' : layout().state; },
      get style() { return mergeStyles({ display: 'flex', 'flex-direction': orientation() === 'horizontal' ? 'row' : 'column', 'min-width': '0', 'min-height': '0' }, props.style); }
    });
    const host = <Primitive as="div" {...forwarded} />;
    // Resolve the rendered host, not its child declarations: native dynamic/Provider hosts are lazy.
    // Keep the same resolution boundary on server/client, inside the custom target's normal owner.
    const rendered = children(() => host)();
    if (isServer) { validateParts(parts.map(part => part.kind)); configuration(); }
    return rendered;
  }
  return <Provider scope={scope} value={context}><Frame /></Provider>;
}

export function SplitterPanel(props: SplitterPanelProps): Element {
  const context = useSplitter('SplitterPanel', untrack(() => props.__scopeSplitter));
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (props.side !== 'primary' && props.side !== 'secondary') throw new Error('Splitter Panel side must be primary or secondary.');
  context.register({ kind: untrack(() => props.side), node, props });
  const hidden = () => {
    const value = props.side === 'primary' && context.collapsed();
    if (value && !isServer) context.evacuate();
    return value;
  };
  const forwarded = merge(omit(props, '__scopeSplitter', 'side', 'minSize', 'maxSize', 'collapsible', 'collapsedSize'), {
    get id() { return props.side === 'primary' ? context.primaryId() : props.id; }, get ref() { return composeRefs(props.ref, ref); },
    get inert() { return hidden() || props.inert; }, get ['aria-hidden']() { return hidden() ? 'true' : props['aria-hidden']; },
    get ['data-state']() { return hidden() ? 'collapsed' : 'expanded'; }, get ['data-side']() { return props.side; },
    get style() {
      const axis = context.orientation() === 'horizontal' ? 'width' : 'height';
      const value = hidden() ? props.collapsedSize ?? 0 : context.layout().primary;
      const available = context.available(), percent = context.unit() === '%', measured = available !== undefined;
      const effective = props.side === 'primary' ? value : context.layout().secondary;
      const pixels = effective * (percent ? (available ?? 0) / 100 : 1);
      return mergeStyles({ 'box-sizing': 'border-box', 'min-width': '0', 'min-height': '0', overflow: 'hidden',
        flex: measured ? `0 0 ${pixels}px` : percent ? `${effective / 100} 1 0px` : props.side === 'primary' ? `0 1 ${value}px` : '1 1 0px',
        [`min-${axis}`]: measured || percent ? '0px' : `${hidden() ? value : props.minSize ?? 0}px`,
        [`max-${axis}`]: measured || percent ? undefined : hidden() ? `${value}px` : props.maxSize === undefined ? undefined : `${props.maxSize}px`,
        'content-visibility': hidden() ? 'hidden' : undefined
      }, props.style);
    }
  });
  return <Primitive as="div" {...forwarded} />;
}

export function SplitterHandle(props: SplitterHandleProps): Element {
  const context = useSplitter('SplitterHandle', untrack(() => props.__scopeSplitter)), [node, ref] = createSignal<HTMLElement | undefined>();
  if (!props['aria-label'] && !props['aria-labelledby']) throw new Error('Splitter Handle requires an accessible name.');
  context.register({ kind: 'handle', node });
  const forwarded = merge(omit(props, '__scopeSplitter'), {
    get role(): 'separator' { return 'separator'; }, get ref() { return composeRefs(props.ref, ref); },
    get tabIndex() { return context.disabled() ? -1 : 0; }, get ['aria-disabled'](): 'true' | 'false' { return context.actionable() ? 'false' : 'true'; },
    get ['aria-controls']() { return context.primaryId(); }, get ['aria-orientation'](): 'vertical' | 'horizontal' { return context.orientation() === 'horizontal' ? 'vertical' : 'horizontal'; },
    get ['aria-valuenow']() { return context.layout().primary; }, get ['aria-valuemin']() { return context.layout().min; }, get ['aria-valuemax']() { return context.layout().max; },
    get ['aria-valuetext']() { return props['aria-valuetext'] ?? `${context.layout().primary} ${context.unit() === '%' ? 'percent' : 'pixels'}`; },
    get style() { return mergeStyles({ 'flex-shrink': '0', 'touch-action': 'none', 'user-select': 'none' }, props.style); },
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, context.down),
    onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, context.move),
    onPointerUp: composeEventHandlers<PointerEvent>(() => props.onPointerUp, context.up),
    onPointerCancel: composeEventHandlers<PointerEvent>(() => props.onPointerCancel, context.cancel),
    onLostPointerCapture: composeEventHandlers<PointerEvent>(() => props.onLostPointerCapture, context.cancel),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, context.key)
  });
  return <Primitive as="div" {...forwarded} />;
}
