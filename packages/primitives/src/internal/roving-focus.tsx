// Native port of Radix roving focus; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, createUniqueId, merge, omit, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createCollection } from './collection.js';
import { createContextScope, type Scope } from './context.js';
import { createControllableState } from './state.js';
import { Primitive, type PrimitiveProps } from './primitive.js';
import { composeRefs } from './refs.js';
import { composeEventHandlers, dispatchCancelableEvent } from './events.js';
import { focus } from './focus-scope.js';
import { useDirection, type Direction } from '../direction/direction.js';
import type { SlotRender } from '../slot/slot.js';

type Item = { id: () => string; focusable: () => boolean; active: () => boolean };
interface RovingValue {
  collection: ReturnType<typeof createCollection<Item>>; current: () => string | null;
  change: (id: string | null) => void; exit: (back: boolean) => void;
  orientation: () => 'horizontal' | 'vertical' | undefined; dir: () => Direction; loop: () => boolean;
}
const [createRovingContext, createRovingFocusGroupScope] = createContextScope('RovingFocusGroup');
const [Provider, useRoving] = createRovingContext<RovingValue>('RovingFocusGroup');
export { createRovingFocusGroupScope };
export type RovingFocusGroupProps = PrimitiveProps<'div'> & {
  __scopeRovingFocusGroup?: Scope; orientation?: 'horizontal' | 'vertical'; dir?: Direction; loop?: boolean;
  currentTabStopId?: string | null; defaultCurrentTabStopId?: string; onCurrentTabStopIdChange?: (id: string | null) => void;
  onEntryFocus?: (event: Event) => void; preventScrollOnEntryFocus?: boolean;
};
export function RovingFocusGroup(props: RovingFocusGroupProps): Element {
  const collection = createCollection<Item>();
  const [current, change] = createControllableState<string | null>({ value: () => props.currentTabStopId,
    get defaultValue() { return props.defaultCurrentTabStopId ?? null; }, get onChange() { return props.onCurrentTabStopIdChange; } });
  const [back, exit] = createSignal(false);
  const dir = useDirection(() => props.dir);
  let clickFocus = false;
  const value: RovingValue = { collection, current, change, exit, dir, orientation: () => props.orientation, loop: () => props.loop ?? false };
  const forwarded = merge(omit(props, '__scopeRovingFocusGroup', 'orientation', 'loop', 'currentTabStopId', 'defaultCurrentTabStopId', 'onCurrentTabStopIdChange', 'onEntryFocus', 'preventScrollOnEntryFocus'), {
    get tabIndex() { return back() || !collection.items().some(item => item.value.focusable()) ? -1 : 0; },
    get dir() { return dir(); }, get ['data-orientation']() { return props.orientation; },
    onMouseDown: composeEventHandlers<MouseEvent>(() => props.onMouseDown, () => { clickFocus = true; }),
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, original => {
      if (original.target === original.currentTarget && !clickFocus && !back()) {
        const node = original.currentTarget as HTMLElement;
        const event = new node.ownerDocument.defaultView!.CustomEvent('rovingFocusGroup.onEntryFocus', { cancelable: true });
        dispatchCancelableEvent(node, event, props.onEntryFocus);
        if (!event.defaultPrevented) {
          const items = collection.items().filter(item => item.value.focusable());
          const target = items.find(item => item.value.active()) ?? items.find(item => item.value.id() === current()) ?? items[0];
          target?.node.focus({ preventScroll: props.preventScrollOnEntryFocus ?? false });
        }
      }
      clickFocus = false;
    }),
    onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, () => exit(false))
  });
  return <Provider scope={props.__scopeRovingFocusGroup} value={value}><Primitive as="div" {...forwarded} /></Provider>;
}
export interface RovingFocusItemState { readonly isCurrentTabStop: boolean; readonly hasTabStop: boolean }
export type RovingFocusItemProps = Omit<PrimitiveProps<'span'>, 'children' | 'asChild'> & {
  __scopeRovingFocusGroup?: Scope; tabStopId?: string; focusable?: boolean; active?: boolean;
} & ({ asChild: true; children: SlotRender } | { asChild?: false; children?: Element | ((state: RovingFocusItemState) => Element) });
export function RovingFocusGroupItem(props: RovingFocusItemProps): Element {
  const root = useRoving('RovingFocusGroupItem', untrack(() => props.__scopeRovingFocusGroup));
  const id = createUniqueId();
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const item: Item = { id: () => props.tabStopId ?? id, focusable: () => props.focusable ?? true, active: () => props.active ?? false };
  if (!isServer) createEffect(node, element => element ? root.collection.register(element, item) : undefined, { transparent: true });
  const state = { get isCurrentTabStop() { return root.current() === item.id(); }, get hasTabStop() { return root.current() !== null; } };
  const forwarded = merge(omit(props, '__scopeRovingFocusGroup', 'tabStopId', 'focusable', 'active', 'children'), {
    get ref() { return composeRefs(props.ref, ref); }, get tabIndex() { return state.isCurrentTabStop ? 0 : -1; },
    get ['data-orientation']() { return root.orientation(); },
    get children() { return !props.asChild && typeof props.children === 'function' ? (props.children as (snapshot: RovingFocusItemState) => Element)(state) : props.children as PrimitiveProps<'span'>['children']; },
    onMouseDown: composeEventHandlers<MouseEvent>(() => props.onMouseDown, event => { if (!item.focusable()) event.preventDefault(); else root.change(item.id()); }),
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, () => root.change(item.id())),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (event.isComposing) return;
      if (event.key === 'Tab' && event.shiftKey) { root.exit(true); return; }
      if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const key = root.dir() === 'rtl' ? event.key === 'ArrowLeft' ? 'ArrowRight' : event.key === 'ArrowRight' ? 'ArrowLeft' : event.key : event.key;
      if (root.orientation() === 'vertical' && ['ArrowLeft', 'ArrowRight'].includes(key) || root.orientation() === 'horizontal' && ['ArrowUp', 'ArrowDown'].includes(key)) return;
      const intent = ({ Home: 'first', PageUp: 'first', End: 'last', PageDown: 'last', ArrowLeft: 'prev', ArrowUp: 'prev', ArrowRight: 'next', ArrowDown: 'next' } as Record<string, string>)[key];
      if (!intent) return;
      event.preventDefault();
      const items = root.collection.items().filter(item => item.value.focusable());
      const index = items.findIndex(item => item.node === event.currentTarget);
      let next = intent === 'first' ? 0 : intent === 'last' ? items.length - 1 : index + (intent === 'prev' ? -1 : 1);
      if (root.loop() && items.length) next = (next + items.length) % items.length;
      focus(items[next]?.node, false, false);
    })
  }) as PrimitiveProps<'span'>;
  return <Primitive as="span" {...forwarded} />;
}
