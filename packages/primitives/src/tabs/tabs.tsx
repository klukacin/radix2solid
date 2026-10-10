// Native port of Radix Tabs; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createMemo, createSignal, createUniqueId, merge, omit, onCleanup, Show, untrack, type Accessor, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { createControllableState } from '../internal/state.js';
import { composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { createPresence } from '../internal/presence.js';
import { createRovingFocusGroupScope, RovingFocusGroup, RovingFocusGroupItem } from '../internal/roving-focus.js';
import { useDirection, type Direction } from '../direction/direction.js';
import { mergeStyles } from '../slot/slot.js';

const [createTabsContext, createTabsScope] = createContextScope('Tabs', [createRovingFocusGroupScope]);
const useRovingScope = createRovingFocusGroupScope();
const [Provider, useTabs] = createTabsContext<{
  baseId: string; value: Accessor<string>; change: (value: string) => void; orientation: Accessor<'horizontal' | 'vertical'>;
  dir: Accessor<Direction>; automatic: Accessor<boolean>;
}>('Tabs');
export { createTabsScope };
export type TabsProps = PrimitiveProps<'div'> & { __scopeTabs?: Scope; value?: string; defaultValue?: string;
  onValueChange?: (value: string) => void; orientation?: 'horizontal' | 'vertical'; dir?: Direction; activationMode?: 'automatic' | 'manual' };
export type TabsListProps = PrimitiveProps<'div'> & { __scopeTabs?: Scope; loop?: boolean };
export type TabsTriggerProps = PrimitiveProps<'button'> & { __scopeTabs?: Scope; value: string };
export type TabsContentProps = PrimitiveProps<'div'> & { __scopeTabs?: Scope; value: string; forceMount?: true };

export function Tabs(props: TabsProps): Element {
  const [value, change] = createControllableState<string>({ value: () => props.value,
    get defaultValue() { return props.defaultValue ?? ''; }, get onChange() { return props.onValueChange; } });
  const dir = useDirection(() => props.dir);
  const context = { baseId: createUniqueId(), value, change, dir, orientation: () => props.orientation ?? 'horizontal' as const,
    automatic: () => props.activationMode !== 'manual' };
  const forwarded = merge({ get dir() { return dir(); }, get ['data-orientation']() { return context.orientation(); } },
    omit(props, '__scopeTabs', 'value', 'defaultValue', 'onValueChange', 'orientation', 'dir', 'activationMode'));
  return <Provider scope={props.__scopeTabs} value={context}><Primitive as="div" {...forwarded} /></Provider>;
}

export function TabsList(props: TabsListProps): Element {
  const scope = untrack(() => props.__scopeTabs);
  const context = useTabs('TabsList', scope);
  const forwarded = merge({ role: 'tablist' as const, get ['aria-orientation']() { return context.orientation(); } }, omit(props, '__scopeTabs', 'loop'));
  return <RovingFocusGroup {...useRovingScope(scope)} orientation={context.orientation()} dir={context.dir()} loop={props.loop ?? true} asChild>
    {target => target(Primitive, merge({ as: 'div' as const }, forwarded))}
  </RovingFocusGroup>;
}

export function TabsTrigger(props: TabsTriggerProps): Element {
  const scope = untrack(() => props.__scopeTabs);
  const context = useTabs('TabsTrigger', scope);
  const selected = () => context.value() === props.value;
  const forwarded = merge({ type: 'button' as const, role: 'tab' as const,
    get id() { return `${context.baseId}-trigger-${props.value}`; }, get ['aria-controls']() { return `${context.baseId}-content-${props.value}`; },
    get ['aria-selected']() { return selected() ? 'true' as const : 'false' as const; },
    get ['data-state']() { return selected() ? 'active' : 'inactive'; }, get ['data-disabled']() { return props.disabled ? '' : undefined; }
  }, omit(props, '__scopeTabs', 'value'), {
    onMouseDown: composeEventHandlers<MouseEvent>(() => props.onMouseDown, event => {
      if (!props.disabled && event.button === 0 && !event.ctrlKey) {
        const node = event.currentTarget as HTMLElement;
        node.focus();
        context.change(props.value);
      } else event.preventDefault();
    }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (!props.disabled && event.target === event.currentTarget && [' ', 'Enter'].includes(event.key)) context.change(props.value);
    }),
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, () => {
      if (!selected() && !props.disabled && context.automatic()) context.change(props.value);
    })
  });
  return <RovingFocusGroupItem {...useRovingScope(scope)} focusable={!props.disabled} active={selected()} asChild>
    {target => target(Primitive, forwarded)}
  </RovingFocusGroupItem>;
}

export function TabsContent(props: TabsContentProps): Element {
  const context = useTabs('TabsContent', untrack(() => props.__scopeTabs));
  const selected = () => context.value() === props.value;
  const presence = createPresence(selected, () => !!props.forceMount);
  const [preventAnimation, setPreventAnimation] = createSignal(untrack(selected));
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer) createEffect(node, element => {
    if (!element) return;
    const view = element.ownerDocument.defaultView!;
    const frame = view.requestAnimationFrame(() => setPreventAnimation(false));
    return () => view.cancelAnimationFrame(frame);
  }, { transparent: true });
  const style = createMemo(() => {
    const duration = { 'animation-duration': preventAnimation() ? '0s' : undefined };
    return typeof props.style === 'string' ? mergeStyles(props.style, duration) : Object.assign({}, props.style, duration);
  });
  const forwarded = merge({ role: 'tabpanel' as const, tabIndex: 0,
    get id() { return `${context.baseId}-content-${props.value}`; }, get ['aria-labelledby']() { return `${context.baseId}-trigger-${props.value}`; },
    get ['data-state']() { return selected() ? 'active' : 'inactive'; }, get ['data-orientation']() { return context.orientation(); },
    get hidden() { return !presence.mounted(); }
  }, omit(props, '__scopeTabs', 'value', 'forceMount'), {
    get ref() { return composeRefs(props.ref, ref, presence.ref); }, get style() { return style(); }
  });
  if (untrack(() => props.asChild)) {
    function Mounted(): Element {
      if (!isServer) onCleanup(() => { ref(undefined); presence.ref(undefined); });
      return <Primitive as="div" {...forwarded} />;
    }
    return <Show when={presence.mounted()}><Mounted /></Show>;
  }
  const native = merge(omit(forwarded, 'children'), { get children() { return <Show when={presence.mounted()}>{props.children as Element}</Show>; } }) as PrimitiveProps<'div'>;
  return <Primitive as="div" {...native} />;
}
