import { createEffect, createMemo, createRenderEffect, createSignal, createUniqueId, merge, omit, onCleanup, Show, untrack, type Element } from 'solid-js';
import { isServer, Portal as NativePortal } from '@solidjs/web';
import type { ComponentProps } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { createCollection } from '../internal/collection.js';
import { createActiveDescendant, type ActiveDescendantCursor } from '../internal/active-descendant.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeRefs } from '../internal/refs.js';
import { callEventHandler, composeEventHandlers } from '../internal/events.js';
import { createPresence } from '../internal/presence.js';
import { createLayer, LayerContext, type LayerCallbacks } from '../internal/dismissable-layer.js';
import { Popper, PopperContent, usePopper, createPopperScope, type PopperContentProps } from '../internal/popper.js';
import { useDirection, type Direction } from '../direction/direction.js';
import type { SlotRender } from '../slot/slot.js';

type Scoped = { __scopeCombobox?: Scope };
type Without<P, K extends PropertyKey> = P extends unknown ? Omit<P, K> : never;
export type ComboboxItem = { value: string; label: string; disabled?: boolean };
export type ComboboxProps = Scoped & {
  children?: Element; items: readonly ComboboxItem[];
  value?: string | null; defaultValue?: string | null; onValueChange?: (value: string | null) => void;
  query?: string; defaultQuery?: string; onQueryChange?: (query: string) => void;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  filter?: false | ((item: ComboboxItem, query: string) => boolean);
  disabled?: boolean; readOnly?: boolean; required?: boolean; name?: string; form?: string; dir?: Direction;
};
export type ComboboxInputProps = Scoped & Without<PrimitiveProps<'input'>, 'value' | 'defaultValue' | 'name' | 'form'>;
export type ComboboxTriggerProps = Scoped & PrimitiveProps<'button'>;
export type ComboboxClearProps = Scoped & PrimitiveProps<'button'>;
export type ComboboxPortalProps = Scoped & { children?: Element; container?: globalThis.Element | DocumentFragment | null; forceMount?: true };
export type ComboboxContentProps = Scoped & PopperContentProps & LayerCallbacks & { forceMount?: true };
export type ComboboxListProps = Scoped & PrimitiveProps<'div'>;
export type ComboboxItemProps = Scoped & PrimitiveProps<'div'> & { value: string };
export type ComboboxItemTextProps = Scoped & PrimitiveProps<'span'>;
export type ComboboxItemIndicatorProps = Scoped & PrimitiveProps<'span'>;
export type ComboboxGroupProps = Scoped & PrimitiveProps<'div'>;
export type ComboboxLabelProps = Scoped & PrimitiveProps<'div'>;
export type ComboboxEmptyProps = Scoped & PrimitiveProps<'div'>;
interface Row { key: () => string; id: string }
interface RootValue {
  props: ComboboxProps; value: () => string | null; query: () => string; setQuery: (query: string) => void;
  open: () => boolean; setOpen: (open: boolean) => void; dir: () => Direction;
  input: () => HTMLInputElement | undefined; setInput: (node: HTMLInputElement | undefined) => void;
  list: () => HTMLElement | undefined; setList: (node: HTMLElement | undefined) => void;
  collection: { register(node: HTMLElement, row: Row): () => void; items(container?: Node): { node: HTMLElement; value: Row }[] };
  rows: () => { node: HTMLElement; value: Row }[]; changed: () => void; cursor: ActiveDescendantCursor;
  records: () => Map<string, ComboboxItem>; matches: (key: string) => boolean;
  invalid: () => boolean; locked: () => boolean; commit: (key: string, event: Event) => void;
  clear: (event: Event) => void; resolve: () => void; navigate: (direction: 'first' | 'last') => void;
  listId: string; surfaces: Set<HTMLElement>;
}
const [createComboboxContext, createComboboxScope] = createContextScope('Combobox', [createPopperScope]);
const [Provider, useRoot] = createComboboxContext<RootValue>('Combobox');
const [ItemProvider, useItem] = createComboboxContext<() => string>('ComboboxItem');
const [GroupProvider, useGroup] = createComboboxContext<string>('ComboboxGroup');
const [PortalProvider, usePortal] = createComboboxContext<{ forceMount: () => boolean }>('ComboboxPortal', { forceMount: () => false });
export { createComboboxScope };

export function Combobox(props: ComboboxProps): Element {
  const records = createMemo(() => {
    const data = new Map<string, ComboboxItem>();
    for (const item of props.items) {
      if (!item.value || data.has(item.value)) throw new Error('Combobox items require unique, nonempty value keys.');
      data.set(item.value, item);
    }
    return data;
  });
  const initialKey = untrack(() => props.value !== undefined ? props.value : props.defaultValue ?? null);
  const initialQuery = untrack(() => props.query ?? props.defaultQuery ?? (initialKey === null ? '' : records().get(initialKey)?.label ?? ''));
  // Force data validation even when no selected record or Item is mounted (including SSR).
  records();
  const [value, setValue] = createControllableState<string | null>({ value: () => props.value, defaultValue: initialKey, get onChange() { return props.onValueChange; } });
  const [query, setQuery] = createControllableState({ value: () => props.query, defaultValue: initialQuery, get onChange() { return props.onQueryChange; } });
  const [open, changeOpen] = createControllableState({ value: () => props.open, get defaultValue() { return props.defaultOpen ?? false; }, get onChange() { return props.onOpenChange; } });
  const [input, setInput] = createSignal<HTMLInputElement | undefined>(), [list, setList] = createSignal<HTMLElement | undefined>(), [field, setField] = createSignal<HTMLInputElement | undefined>();
  const [version, changed] = createSignal(0);
  const collection = createCollection<Row>(), surfaces = new Set<HTMLElement>();
  const filter = createMemo(() => props.filter);
  const matches = (key: string) => {
    const item = records().get(key);
    const predicate = filter();
    return !!item && (predicate === false || (predicate ? predicate(item, query()) : item.label.toLowerCase().includes(query().trim().toLowerCase())));
  };
  const rows = () => { version(); return collection.items(list()).filter(item => matches(item.value.key()) && !item.node.hidden && item.node.getClientRects().length > 0 && item.node.ownerDocument.defaultView!.getComputedStyle(item.node).visibility !== 'hidden'); };
  const cursor = createActiveDescendant({ items: () => rows().map(({ node, value: row }) => ({ node, key: row.key(), id: row.id, disabled: !!records().get(row.key())?.disabled })), loop: () => false });
  const resolved = () => value() === null ? query() === '' : !!records().get(value()!) && !records().get(value()!)!.disabled && records().get(value()!)!.label === query();
  const invalid = createMemo(() => !resolved() || (!!props.required && value() === null));
  const locked = createMemo(() => !!props.disabled || !!props.readOnly);
  let pendingNavigation: 'first' | 'last' | undefined;
  let immediateCommit: string | null | undefined, userKey: string | null | undefined, userBubbles = false;
  let commitTimer: ReturnType<typeof setTimeout> | undefined;
  const setOpen = (next: boolean) => { if (!next) { pendingNavigation = undefined; cursor.setActive(null); } changeOpen(next); };
  const resolve = () => { setOpen(false); const key = value(); setQuery(key === null ? '' : records().get(key)?.label ?? query()); };
  const commit = (key: string, event: Event) => {
    const item = records().get(key);
    if (locked() || !item || item.disabled || !matches(key)) return;
    immediateCommit = key; userKey = key; userBubbles = !event.cancelBubble;
    clearTimeout(commitTimer); commitTimer = setTimeout(() => { immediateCommit = undefined; }, 0);
    setValue(key); setQuery(item.label); setOpen(false); input()?.focus({ preventScroll: true });
  };
  const root: RootValue = { props, value, query, setQuery, open, setOpen, dir: useDirection(() => props.dir), input, setInput, list, setList, collection, rows, cursor, records, matches, invalid, locked, commit, resolve, surfaces, listId: createUniqueId(), changed: () => changed(n => n + 1),
    clear(event) { if (locked()) return; userKey = null; userBubbles = !event.cancelBubble; setValue(null); setQuery(''); setOpen(false); input()?.focus({ preventScroll: true }); },
    navigate(direction) { if (locked()) return; if (!open()) { pendingNavigation = direction; changeOpen(true); } else cursor.move(direction === 'first' ? 'next' : 'previous'); }
  };
  if (!isServer) {
    let lastKey = initialKey;
    let wasAvailable = initialKey !== null && !!records().get(initialKey) && !records().get(initialKey)!.disabled;
    let lastNative = initialKey;
    createEffect(() => ({ key: value(), record: value() === null ? undefined : records().get(value()!) }), ({ key, record }) => {
      const available = !!record && !record.disabled;
      const keyChanged = key !== lastKey;
      if (!keyChanged && wasAvailable && !available && key !== null) setValue(null);
      wasAvailable = available;
      if (keyChanged && immediateCommit !== key && (key === null || record)) setQuery(record?.label ?? '');
      lastKey = key;
    }, { transparent: true });
    createEffect(() => ({ open: open(), rows: rows().map(item => [item.value.key(), records().get(item.value.key())?.disabled]) }), state => {
      if (!state.open) { cursor.setActive(null); return; }
      if (pendingNavigation && rows().length) { const direction = pendingNavigation; pendingNavigation = undefined; cursor.move(direction); }
      else cursor.reconcile();
    }, { transparent: true });
    createEffect(() => [field(), value()] as const, ([node, key]) => {
      if (!node || key === lastNative) return;
      lastNative = key;
      node.dispatchEvent(new Event('change', { bubbles: userKey === key && userBubbles }));
      userKey = undefined;
    }, { transparent: true });
    createEffect(input, node => {
      if (!node) return;
      const document = node.ownerDocument, timers = new Set<number>(); let alive = true;
      const reset = (event: Event) => {
        if (event.target !== node.form) return;
        const timer = document.defaultView!.setTimeout(() => {
          timers.delete(timer); if (!alive || event.defaultPrevented) return;
          immediateCommit = initialKey;
          clearTimeout(commitTimer); commitTimer = setTimeout(() => { immediateCommit = undefined; }, 0);
          setValue(initialKey); setQuery(initialQuery); setOpen(false);
          queueMicrotask(() => { if (alive) node.value = query(); });
        }, 0);
        timers.add(timer);
      };
      document.addEventListener('reset', reset);
      return () => { alive = false; document.removeEventListener('reset', reset); for (const timer of timers) document.defaultView!.clearTimeout(timer); };
    }, { transparent: true });
    onCleanup(() => clearTimeout(commitTimer));
  }
  return <Popper __scopePopper={props.__scopeCombobox}><Provider scope={props.__scopeCombobox} value={root}>{props.children}
    <input ref={setField} type="hidden" name={props.name} form={props.form} value={value() ?? ''} disabled={!!props.disabled || !resolved() || value() === null} />
  </Provider></Popper>;
}
export function ComboboxInput(props: ComboboxInputProps): Element {
  const root = useRoot('ComboboxInput', untrack(() => props.__scopeCombobox)), popper = usePopper(untrack(() => props.__scopeCombobox));
  const [revision, invalidate] = createSignal(0);
  let composing = false;
  if (!isServer) {
    createEffect(() => [root.input(), root.query(), root.invalid(), revision()] as const, ([node, query, invalid]) => {
      if (!node) return;
      if (node.value !== query) node.value = query;
      node.setCustomValidity(invalid ? 'Choose an available option.' : '');
    }, { transparent: true });
    createEffect(root.input, node => { popper.setAnchor(node); return () => popper.setAnchor(undefined); }, { transparent: true });
  }
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, {
    name: undefined, get form() { return root.props.form; }, get value() { return root.query(); },
    get disabled() { return root.props.disabled; }, get readOnly() { return root.props.readOnly; }, get required() { return root.props.required; }
  }) as ComponentProps<typeof component>));
  return <Primitive as="input" {...(merge(omit(props, '__scopeCombobox'), {
    id: props.id || createUniqueId(), role: 'combobox' as const, 'aria-autocomplete': 'list' as const,
    get autocomplete() { return props.autocomplete ?? 'off'; },
    name: undefined, get form() { return root.props.form; }, get value() { return root.query(); }, get dir() { return root.dir(); },
    get disabled() { return root.props.disabled; }, get readOnly() { return root.props.readOnly; }, get required() { return root.props.required; },
    get ['aria-invalid']() { return root.invalid() ? 'true' as const : undefined; },
    get ['aria-expanded']() { return root.open() ? 'true' as const : 'false' as const; },
    get ['aria-controls']() { return root.open() ? root.listId : undefined; }, get ['aria-activedescendant']() { return root.open() ? root.cursor.activeId() : undefined; },
    get ref() { return composeRefs(props.ref, root.setInput); },
    get children() { return props.asChild ? render : props.children; },
    onInput(event: InputEvent) {
      callEventHandler(props.onInput, event);
      if (!event.defaultPrevented && !root.locked()) { root.setQuery((event.currentTarget as HTMLInputElement).value); root.setOpen(true); }
      invalidate(n => n + 1);
    },
    onCompositionStart: composeEventHandlers<CompositionEvent>(() => props.onCompositionStart, () => { composing = true; }),
    onCompositionEnd: composeEventHandlers<CompositionEvent>(() => props.onCompositionEnd, () => { composing = false; }),
    onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, event => {
      const next = event.relatedTarget as Node | null;
      if (next && (root.list()?.contains(next) || [...root.surfaces].some(node => node.contains(next)))) return;
      // Let a native submit attempt validate the draft before any blur reconciliation.
      const form = root.input()?.form;
      if (form && next instanceof HTMLButtonElement && next.type === 'submit' && next.form === form) return;
      if (form && next instanceof HTMLInputElement && ['submit', 'image'].includes(next.type) && next.form === form) return;
      if (root.open() && root.list()) return; // The layer owns cancellable outside interactions while open.
      root.resolve();
    }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (root.locked() || composing || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!event.shiftKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) { event.preventDefault(); root.navigate(event.key === 'ArrowDown' ? 'first' : 'last'); }
      else if (event.key === 'Enter' && root.open() && root.cursor.activeId()) { event.preventDefault(); root.commit(root.cursor.active()!, event); }
      else if (event.key === 'Escape') { if (root.open()) event.preventDefault(); root.resolve(); }
    })
  }) as PrimitiveProps<'input'>)} />;
}
export function ComboboxTrigger(props: ComboboxTriggerProps): Element {
  const root = useRoot('ComboboxTrigger', untrack(() => props.__scopeCombobox));
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer) createEffect(node, element => { if (!element) return; root.surfaces.add(element); return () => { root.surfaces.delete(element); }; }, { transparent: true });
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { type: 'button', tabIndex: -1, get disabled() { return root.locked() || props.disabled; } }) as ComponentProps<typeof component>));
  return <Primitive as="button" {...(merge(omit(props, '__scopeCombobox'), {
    type: 'button' as const, tabIndex: -1, get disabled() { return root.locked() || props.disabled; }, get ref() { return composeRefs(props.ref, ref); },
    get children() { return props.asChild ? render : props.children; },
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => { if (event.button === 0 && event.pointerType === 'mouse') event.preventDefault(); }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, () => { if (!root.locked()) { root.setOpen(!root.open()); root.input()?.focus({ preventScroll: true }); } })
  }) as PrimitiveProps<'button'>)} />;
}
export function ComboboxClear(props: ComboboxClearProps): Element {
  const root = useRoot('ComboboxClear', untrack(() => props.__scopeCombobox));
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { type: 'button', tabIndex: -1, get disabled() { return root.locked() || props.disabled; } }) as ComponentProps<typeof component>));
  return <Primitive as="button" {...(merge(omit(props, '__scopeCombobox'), {
    type: 'button' as const, tabIndex: -1, get disabled() { return root.locked() || props.disabled; },
    get children() { return props.asChild ? render : props.children; },
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => { if (event.button === 0 && event.pointerType === 'mouse') event.preventDefault(); }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, root.clear)
  }) as PrimitiveProps<'button'>)} />;
}
export function ComboboxPortal(props: ComboboxPortalProps): Element {
  return <PortalProvider scope={props.__scopeCombobox} value={{ forceMount: () => props.forceMount ?? false }}><NativePortal {...({ get mount() { return props.container ?? undefined; }, get children() { return props.children; } } as Parameters<typeof NativePortal>[0])} /></PortalProvider>;
}
export function ComboboxContent(props: ComboboxContentProps): Element {
  const scope = untrack(() => props.__scopeCombobox), root = useRoot('ComboboxContent', scope), portal = usePortal('ComboboxContent', scope);
  const presence = createPresence(root.open, () => props.forceMount ?? portal.forceMount());
  function Mounted(): Element {
    const [node, ref] = createSignal<HTMLElement | undefined>();
    const layer = createLayer(node, {
      active: root.open, modal: () => false, trigger: root.input, dismiss: root.resolve, kind: 'popover', surfaces: root.surfaces, loopFocus: false,
      onOpenAutoFocus(event) { props.onOpenAutoFocus?.(event); event.preventDefault(); },
      onCloseAutoFocus(event) { props.onCloseAutoFocus?.(event); event.preventDefault(); },
      get onEscapeKeyDown() { return props.onEscapeKeyDown; }, get onPointerDownOutside() { return props.onPointerDownOutside; },
      get onFocusOutside() { return props.onFocusOutside; },
      onInteractOutside(event) {
        props.onInteractOutside?.(event);
        const target = (event.detail.originalEvent.target as HTMLElement | null)?.closest('button,input');
        const form = root.input()?.form;
        if (!event.defaultPrevented && form && (target instanceof HTMLButtonElement || target instanceof HTMLInputElement) && ['submit', 'image'].includes(target.type) && target.form === form) {
          event.preventDefault(); root.setOpen(false);
        }
      }
    });
    onCleanup(() => presence.ref(undefined));
    return <LayerContext value={layer}><PopperContent {...merge(omit(props, '__scopeCombobox', 'forceMount', 'onEscapeKeyDown', 'onPointerDownOutside', 'onFocusOutside', 'onInteractOutside', 'onOpenAutoFocus', 'onCloseAutoFocus'), {
      __scopePopper: scope, get ref() { return composeRefs(props.ref, ref, presence.ref); }, get ['data-state']() { return root.open() ? 'open' : 'closed'; },
      get dir() { return root.dir(); }
    })} /></LayerContext>;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}
export function ComboboxList(props: ComboboxListProps): Element {
  const root = useRoot('ComboboxList', untrack(() => props.__scopeCombobox)), [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer) createRenderEffect(node, element => {
    if (!element) return;
    root.setList(element);
    const observer = new MutationObserver(() => { root.changed(); root.cursor.reconcile(); });
    observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'style', 'class', 'aria-disabled'] });
    return () => { observer.disconnect(); root.input()?.removeAttribute('aria-activedescendant'); root.cursor.setActive(null); root.setList(undefined); };
  }, { transparent: true });
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { id: root.listId }) as ComponentProps<typeof component>));
  return <Primitive as="div" {...(merge(omit(props, '__scopeCombobox'), { role: 'listbox' as const, id: root.listId, get ref() { return composeRefs(props.ref, ref); }, get children() { return props.asChild ? render : props.children; } }) as PrimitiveProps<'div'>)} />;
}
export function ComboboxItem(props: ComboboxItemProps): Element {
  const root = useRoot('ComboboxItem', untrack(() => props.__scopeCombobox)), id = props.id || createUniqueId();
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer) createRenderEffect(node, element => {
    if (!element) return;
    const unregister = root.collection.register(element, { key: () => props.value, id });
    return () => { if (root.cursor.activeId() === id) root.input()?.removeAttribute('aria-activedescendant'); unregister(); };
  }, { transparent: true });
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { id }) as ComponentProps<typeof component>));
  return <Show when={root.matches(props.value)}><ItemProvider scope={props.__scopeCombobox} value={() => props.value}><Primitive as="div" {...(merge(omit(props, '__scopeCombobox', 'value'), {
    id, role: 'option' as const, tabIndex: -1,
    get ['aria-label']() { return props['aria-label'] ?? root.records().get(props.value)?.label; },
    get ['aria-disabled']() { return root.records().get(props.value)?.disabled ? 'true' as const : undefined; },
    get ['aria-selected']() { return root.cursor.active() === props.value ? 'true' as const : 'false' as const; },
    get ['data-state']() { return root.value() === props.value ? 'checked' : 'unchecked'; },
    get ref() { return composeRefs(props.ref, ref); },
    get children() { return props.asChild ? render : props.children; },
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => { if (event.pointerType === 'mouse' && event.button === 0) event.preventDefault(); }),
    onClick(event: MouseEvent) {
      callEventHandler(props.onClick, event); const cancelled = event.defaultPrevented; event.preventDefault();
      if (!cancelled && event.button === 0) root.commit(props.value, event);
    }
  }) as PrimitiveProps<'div'>)} /></ItemProvider></Show>;
}
export function ComboboxItemText(props: ComboboxItemTextProps): Element {
  const root = useRoot('ComboboxItemText', untrack(() => props.__scopeCombobox)), key = useItem('ComboboxItemText', untrack(() => props.__scopeCombobox));
  return <Primitive as="span" {...(merge(omit(props, '__scopeCombobox'), { get children() { return props.children ?? root.records().get(key())?.label; } }) as PrimitiveProps<'span'>)} />;
}
export function ComboboxItemIndicator(props: ComboboxItemIndicatorProps): Element {
  const root = useRoot('ComboboxItemIndicator', untrack(() => props.__scopeCombobox)), key = useItem('ComboboxItemIndicator', untrack(() => props.__scopeCombobox));
  return <Show when={root.value() === key()}><Primitive as="span" {...merge(omit(props, '__scopeCombobox'), { 'aria-hidden': 'true' as const })} /></Show>;
}
export function ComboboxGroup(props: ComboboxGroupProps): Element {
  const id = createUniqueId();
  return <GroupProvider scope={props.__scopeCombobox} value={id}><Primitive as="div" {...merge({ role: 'group' as const, 'aria-labelledby': id }, omit(props, '__scopeCombobox'))} /></GroupProvider>;
}
export function ComboboxLabel(props: ComboboxLabelProps): Element {
  const id = useGroup('ComboboxLabel', untrack(() => props.__scopeCombobox));
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { id }) as ComponentProps<typeof component>));
  return <Primitive as="div" {...(merge(omit(props, '__scopeCombobox'), { id, get children() { return props.asChild ? render : props.children; } }) as PrimitiveProps<'div'>)} />;
}
export function ComboboxEmpty(props: ComboboxEmptyProps): Element {
  const root = useRoot('ComboboxEmpty', untrack(() => props.__scopeCombobox));
  return <Show when={!!root.list() && !root.rows().length}><Primitive as="div" {...merge({ role: 'status' as const }, omit(props, '__scopeCombobox'))} /></Show>;
}
