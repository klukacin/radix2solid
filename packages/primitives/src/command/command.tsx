import { createEffect, createRenderEffect, createSignal, createUniqueId, merge, omit, runWithOwner, Show, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import type { ComponentProps } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { createCollection } from '../internal/collection.js';
import { createActiveDescendant, type ActiveDescendantCursor } from '../internal/active-descendant.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeRefs } from '../internal/refs.js';
import { callEventHandler, composeEventHandlers, dispatchCancelableEvent } from '../internal/events.js';

import type { SlotRender } from '../slot/slot.js';
type Scoped = { __scopeCommand?: Scope };
type Without<P, K extends PropertyKey> = P extends unknown ? Omit<P, K> : never;
export type CommandProps = Scoped & { children?: Element; search?: string; defaultSearch?: string; onSearchChange?: (search: string) => void; loop?: boolean };
export type CommandInputProps = Scoped & Without<PrimitiveProps<'input'>, 'value' | 'defaultValue' | 'name'>;
export type CommandListProps = Scoped & PrimitiveProps<'div'>;
export type CommandGroupProps = Scoped & PrimitiveProps<'div'>;
export type CommandLabelProps = Scoped & PrimitiveProps<'div'>;
export type CommandItemProps = Scoped & Without<PrimitiveProps<'div'>, 'onSelect'> & { value: string; textValue: string; disabled?: boolean; onSelect?: (event: Event) => void };
export type CommandEmptyProps = Scoped & PrimitiveProps<'div'>;
interface Item { key: () => string; id: string; disabled: () => boolean; select: () => void }
interface RootValue {
  search: () => string; setSearch: (value: string) => void;
  input: () => HTMLInputElement | undefined; setInput: (node: HTMLInputElement | undefined) => void;
  list: () => HTMLElement | undefined; setList: (node: HTMLElement | undefined) => void;
  collection: { register(node: HTMLElement, item: Item): () => void; items(container?: Node): { node: HTMLElement; value: Item }[] };
  rows: () => { node: HTMLElement; value: Item }[];
  cursor: ActiveDescendantCursor; changed: () => void; listId: string;
}
const [createCommandContext, createCommandScope] = createContextScope('Command');
const [Provider, useRoot] = createCommandContext<RootValue>('Command');
const [GroupProvider, useGroup] = createCommandContext<string>('CommandGroup');
export { createCommandScope };

export function Command(props: CommandProps): Element {
  const [search, setSearch] = createControllableState({ value: () => props.search, get defaultValue() { return props.defaultSearch ?? ''; }, get onChange() { return props.onSearchChange; } });
  const [input, setInput] = createSignal<HTMLInputElement | undefined>(), [list, setList] = createSignal<HTMLElement | undefined>();
  const [version, changed] = createSignal(0);
  const collection = createCollection<Item>();
  const rows = () => { version(); return collection.items(list()).filter(item => item.node.getClientRects().length && !item.node.hidden && item.node.ownerDocument.defaultView!.getComputedStyle(item.node).visibility !== 'hidden'); };
  const cursor = createActiveDescendant({ items: () => rows().map(({ node, value }) => ({ node, key: value.key(), id: value.id, disabled: value.disabled() })), loop: () => props.loop ?? true });
  let previous = untrack(search), pendingSearch = false;
  if (!isServer) createEffect(() => ({ search: search(), rows: rows().map(item => [item.value.key(), item.value.disabled()]) }), state => untrack(() => {
    if (previous !== state.search) { previous = state.search; pendingSearch = true; }
    // Registration runs in the render queue; inspect final connected rows afterward.
    const reset = pendingSearch && rows().some(item => !item.value.disabled());
    cursor.reconcile(reset);
    if (reset) pendingSearch = false;
  }), { transparent: true });
  return <Provider scope={props.__scopeCommand} value={{ search, setSearch, input, setInput, list, setList, collection, rows, cursor, changed: () => changed(n => n + 1), listId: createUniqueId() }}>{props.children}</Provider>;
}
export function CommandInput(props: CommandInputProps): Element {
  const root = useRoot('CommandInput', untrack(() => props.__scopeCommand));
  const [revision, invalidate] = createSignal(0);
  let composing = false;
  if (!isServer) createEffect(() => [root.input(), root.search(), revision()] as const, ([node, value]) => { if (node && node.value !== value) node.value = value; }, { transparent: true });
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { name: undefined, get value() { return root.search(); } }) as ComponentProps<typeof component>));
  return <Primitive as="input" {...(merge(omit(props, '__scopeCommand'), {
    id: props.id || createUniqueId(), role: 'combobox' as const, 'aria-autocomplete': 'list' as const, 'aria-expanded': 'true' as const, 'aria-controls': root.listId,
    name: undefined, get value() { return root.search(); }, get ['aria-activedescendant']() { return root.cursor.activeId(); },
    get ref() { return composeRefs(props.ref, root.setInput); },
    get children() { return props.asChild ? render : props.children; },
    onInput(event: InputEvent) { callEventHandler(props.onInput, event); if (!event.defaultPrevented) root.setSearch((event.currentTarget as HTMLInputElement).value); invalidate(n => n + 1); },
    onCompositionStart: composeEventHandlers<CompositionEvent>(() => props.onCompositionStart, () => { composing = true; }),
    onCompositionEnd: composeEventHandlers<CompositionEvent>(() => props.onCompositionEnd, () => { composing = false; }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (composing || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!event.shiftKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) { event.preventDefault(); root.cursor.move(event.key === 'ArrowDown' ? 'next' : 'previous'); }
      if (event.key === 'Enter') { event.preventDefault(); root.rows().find(item => item.value.key() === root.cursor.active())?.value.select(); }
    })
  }) as PrimitiveProps<'input'>)} />;
}
export function CommandList(props: CommandListProps): Element {
  const root = useRoot('CommandList', untrack(() => props.__scopeCommand));
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer) createRenderEffect(node, element => {
    if (!element) return;
    root.setList(element);
    const observer = new MutationObserver(() => { root.changed(); root.cursor.reconcile(); });
    observer.observe(element, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'style', 'class', 'aria-disabled'] });
    return () => runWithOwner(null, () => untrack(() => { observer.disconnect(); root.cursor.setActive(null); root.setList(undefined); }));
  }, { transparent: true });
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { id: root.listId }) as ComponentProps<typeof component>));
  return <Primitive as="div" {...(merge(omit(props, '__scopeCommand'), { role: 'listbox' as const, id: root.listId, get ref() { return composeRefs(props.ref, ref); }, get children() { return props.asChild ? render : props.children; } }) as PrimitiveProps<'div'>)} />;
}
export function CommandItem(props: CommandItemProps): Element {
  const root = useRoot('CommandItem', untrack(() => props.__scopeCommand));
  const id = untrack(() => props.id) || createUniqueId(), [node, ref] = createSignal<HTMLElement | undefined>();
  const select = () => {
    const target = node();
    if (!target || props.disabled || !root.rows().some(item => item.node === target)) return;
    dispatchCancelableEvent(target, new Event('command.select', { bubbles: true, cancelable: true }), props.onSelect);
  };
  if (!isServer) createRenderEffect(node, element => {
    if (!element) return;
    const unregister = root.collection.register(element, { key: () => props.value, id, disabled: () => !!props.disabled, select });
    return () => untrack(() => { if (element.id === root.cursor.activeId()) root.input()?.removeAttribute('aria-activedescendant'); unregister(); });
  }, { transparent: true });
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { id }) as ComponentProps<typeof component>));
  return <Primitive as="div" {...(merge(omit(props, '__scopeCommand', 'value', 'textValue', 'disabled', 'onSelect'), {
    role: 'option' as const, id, tabIndex: -1, get ['aria-label']() { return props['aria-label'] ?? props.textValue; },
    get ['aria-disabled']() { return props.disabled ? 'true' as const : undefined; }, get ['data-disabled']() { return props.disabled ? '' : undefined; },
    get ['aria-selected']() { return root.cursor.active() === props.value ? 'true' as const : 'false' as const; },
    get ref() { return composeRefs(props.ref, ref); },
    get children() { return props.asChild ? render : props.children; },
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => { if (event.pointerType === 'mouse' && event.button === 0) event.preventDefault(); }),
    onClick(event: MouseEvent) {
      callEventHandler(props.onClick, event);
      const cancelled = event.defaultPrevented;
      event.preventDefault();
      if (!cancelled && event.button === 0 && !props.disabled) { root.cursor.setActive(props.value); root.input()?.focus({ preventScroll: true }); select(); }
    }
  }) as PrimitiveProps<'div'>)} />;
}
export function CommandGroup(props: CommandGroupProps): Element {
  const id = createUniqueId();
  return <GroupProvider scope={props.__scopeCommand} value={id}><Primitive as="div" {...merge({ role: 'group' as const, 'aria-labelledby': id }, omit(props, '__scopeCommand'))} /></GroupProvider>;
}
export function CommandLabel(props: CommandLabelProps): Element {
  const id = useGroup('CommandLabel', untrack(() => props.__scopeCommand));
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { id }) as ComponentProps<typeof component>));
  return <Primitive as="div" {...(merge(omit(props, '__scopeCommand'), { id, get children() { return props.asChild ? render : props.children; } }) as PrimitiveProps<'div'>)} />;
}
export function CommandEmpty(props: CommandEmptyProps): Element {
  const root = useRoot('CommandEmpty', untrack(() => props.__scopeCommand));
  return <Show when={!!root.list() && !root.rows().length}><Primitive as="div" {...merge({ role: 'status' as const }, omit(props, '__scopeCommand'))} /></Show>;
}
