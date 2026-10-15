import { createEffect, createMemo, createSignal, createUniqueId, merge, omit, onCleanup, Show, untrack, type Accessor, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createCollection } from '../internal/collection.js';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeEventHandlers, dispatchCancelableEvent } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { activeElement, focus } from '../internal/focus-scope.js';
import { createPresence } from '../internal/presence.js';
import { useDirection, type Direction } from '../direction/direction.js';

export type TreeProps = PrimitiveProps<'div'> & {
  __scopeTree?: Scope;
  selectionMode?: 'single' | 'none';
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  expandedValues?: readonly string[];
  defaultExpandedValues?: readonly string[];
  onExpandedValuesChange?: (values: readonly string[]) => void;
  dir?: Direction;
};
export type TreeItemProps = PrimitiveProps<'div'> & {
  __scopeTree?: Scope;
  value: string;
  textValue: string;
  disabled?: boolean;
  hasChildren?: boolean;
  onActivate?: (event: Event) => void;
};
export type TreeItemTextProps = PrimitiveProps<'span'> & { __scopeTree?: Scope };
export type TreeItemIndicatorProps = PrimitiveProps<'span'> & { __scopeTree?: Scope };
export type TreeItemGroupProps = PrimitiveProps<'div'> & { __scopeTree?: Scope; forceMount?: true };
export type TreeExpandTriggerProps = PrimitiveProps<'button'> & { __scopeTree?: Scope };

type Item = {
  key: Accessor<string>;
  text: Accessor<string>;
  disabled: Accessor<boolean>;
  visible: Accessor<boolean>;
  branch: Accessor<boolean>;
  expanded: Accessor<boolean>;
  parent: Item | null;
  textId: string;
};
type Entry = { node: HTMLElement; item: Item; visible: boolean; enabled: boolean };
type TreeContext = {
  register: (node: HTMLElement, item: Item, key: string) => () => void;
  value: Accessor<string | null>;
  mode: Accessor<'single' | 'none'>;
  expanded: Accessor<readonly string[]>;
  dir: Accessor<Direction>;
  tabStop: Accessor<Item | undefined>;
  remember: (item: Item) => void;
  select: (item: Item) => void;
  expand: (item: Item, expanded: boolean) => void;
  navigate: (item: Item, event: KeyboardEvent) => void;
  composing: boolean;
};
const [createTreeContext, createTreeScope] = createContextScope('Tree');
const [Provider, useTree] = createTreeContext<TreeContext>('Tree');
const [ItemProvider, useItem] = createTreeContext<Item | null>('TreeItem');
const [ParentProvider, useParent] = createTreeContext<{ item: Item | null; visible: Accessor<boolean> }>('TreeItemGroup', { item: null, visible: () => true });
export { createTreeScope };

export function Tree(props: TreeProps): Element {
  const collection = createCollection<Item>();
  const keys = new Map<string, HTMLElement>();
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const [revision, changed] = createSignal(0);
  const [current, setCurrent] = createSignal<Item | undefined>();
  const [value, changeValue] = createControllableState<string | null>({ value: () => props.value,
    get defaultValue() { return props.defaultValue ?? null; }, get onChange() { return props.onValueChange; } });
  const [expanded, changeExpanded] = createControllableState<readonly string[]>({ value: () => props.expandedValues,
    get defaultValue() { return props.defaultExpandedValues ?? []; }, get onChange() { return props.onExpandedValuesChange; } });
  const dir = useDirection(() => props.dir);
  const entries = createMemo(() => {
    revision();
    return collection.items(node()).map(({ node, value: item }): Entry => ({ node, item, visible: item.visible(), enabled: !item.disabled() }));
  });
  const available = createMemo(() => entries().filter(entry => entry.visible && entry.enabled));
  const tabStop = createMemo(() => {
    const items = available();
    return (items.find(entry => entry.item === current()) ??
      (props.selectionMode !== 'none' ? items.find(entry => entry.item.key() === value()) : undefined) ?? items[0])?.item;
  });
  let search = '', timer: number | undefined;
  let focusWithin = false;
  let previous: Entry[] = [];
  const resetSearch = () => { clearTimeout(timer); search = ''; context.composing = false; };
  onCleanup(resetSearch);

  const context: TreeContext = {
    value, expanded, dir, tabStop, composing: false,
    register(element, item, key) {
      if (typeof key !== 'string' || !key.length) throw new Error('Tree Item value must be nonempty.');
      if (keys.has(key)) throw new Error(`Duplicate Tree Item value: ${key}`);
      keys.set(key, element);
      const unregister = collection.register(element, item);
      return () => { keys.delete(key); unregister(); };
    },
    mode: () => props.selectionMode ?? 'single',
    remember(item) { if (!item.disabled() && item.visible()) setCurrent(item); },
    select(item) { if (context.mode() === 'single' && !item.disabled() && item.visible()) changeValue(item.key()); },
    expand(item, open) {
      if (!item.branch() || item.disabled() || !item.visible() || expanded().includes(item.key()) === open) return;
      changeExpanded(previous => {
        const unique = [...new Set(previous)];
        return open ? [...unique, item.key()] : unique.filter(key => key !== item.key());
      });
    },
    navigate(item, event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const items = available(), index = items.findIndex(entry => entry.item === item);
      const openKey = dir() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const closeKey = dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      let target: Entry | undefined;
      if (event.key === openKey) {
        event.preventDefault();
        if (!item.branch()) return;
        if (!item.expanded()) { context.expand(item, true); return; }
        for (let next = index + 1; next < items.length; next++) {
          let parent = items[next]!.item.parent;
          while (parent && parent !== item) parent = parent.parent;
          if (parent === item) { target = items[next]; break; }
        }
      } else if (event.key === closeKey) {
        event.preventDefault();
        if (item.branch() && item.expanded()) { context.expand(item, false); return; }
        for (let parent = item.parent; parent; parent = parent.parent) {
          target = items.find(entry => entry.item === parent);
          if (target) break;
        }
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        target = items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index + (event.key === 'ArrowDown' ? 1 : -1)];
      } else if (event.key.length === 1) {
        search += event.key.toLowerCase();
        clearTimeout(timer);
        timer = node()!.ownerDocument.defaultView!.setTimeout(() => { search = ''; }, 1000);
        const prefix = [...search].every(character => character === search[0]) ? search[0]! : search;
        for (let offset = 1; offset <= items.length; offset++) {
          const candidate = items[(index + offset) % items.length]!;
          if (candidate.item.text().toLowerCase().startsWith(prefix)) { target = candidate; break; }
        }
      }
      focus(target?.node, false, false);
    }
  };

  if (!isServer) {
    createEffect(node, element => {
      if (!element) return;
      const document = element.ownerDocument, view = document.defaultView!;
      const observer = new view.MutationObserver(() => changed(value => value + 1));
      observer.observe(element, { childList: true, subtree: true });
      const trackFocus = (event: FocusEvent) => { focusWithin = element.contains(event.target as Node); if (!focusWithin) resetSearch(); };
      const trackPointer = (event: PointerEvent) => { if (!element.contains(event.target as Node)) { focusWithin = false; resetSearch(); } };
      const blur = () => { focusWithin = false; resetSearch(); };
      document.addEventListener('focusin', trackFocus);
      document.addEventListener('pointerdown', trackPointer, true);
      view.addEventListener('blur', blur);
      return () => {
        observer.disconnect();
        document.removeEventListener('focusin', trackFocus);
        document.removeEventListener('pointerdown', trackPointer, true);
        view.removeEventListener('blur', blur);
        focusWithin = false;
      };
    }, { transparent: true });
    createEffect(() => [entries(), current(), node(), tabStop()] as const, ([next, focused, root, preferred]) => {
      if (!root?.isConnected) { previous = next; return; }
      const live = next.filter(entry => entry.visible && entry.enabled);
      if (focused && !live.some(entry => entry.item === focused)) {
        const oldIndex = previous.findIndex(entry => entry.item === focused);
        const old = previous[oldIndex];
        const surviving = new Map(live.map(entry => [entry.item, entry]));
        let target: Entry | undefined;
        // The explicit parent chain survives unregistration; never infer it from a removed DOM node.
        for (let parent = focused.parent; parent; parent = parent.parent) {
          target = surviving.get(parent);
          if (target) break;
        }
        // Search the old DOM order, excluding every now-hidden descendant of a collapsed branch.
        for (let index = oldIndex + 1; !target && index < previous.length; index++) {
          target = surviving.get(previous[index]!.item);
        }
        for (let index = oldIndex - 1; !target && index >= 0; index--) {
          target = surviving.get(previous[index]!.item);
        }
        target ??= live[0];
        const active = activeElement(root.ownerDocument);
        const affected = focusWithin && (active === root.ownerDocument.body || !!old?.node.contains(active));
        setCurrent(target?.item);
        if (affected) focus(target?.node ?? root, false, false);
      }
      if (focusWithin && live.length && !previous.some(entry => entry.visible && entry.enabled) && activeElement(root.ownerDocument) === root) {
        focus(live.find(entry => entry.item === preferred)?.node);
      }
      previous = next;
    }, { transparent: true });
  }
  const forwarded = merge(omit(props, '__scopeTree', 'selectionMode', 'value', 'defaultValue', 'onValueChange', 'expandedValues', 'defaultExpandedValues', 'onExpandedValuesChange'), {
    role: 'tree' as const,
    get ref() { return composeRefs(props.ref, ref); },
    get dir() { return dir(); },
    get tabIndex() { return tabStop() ? -1 : 0; },
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, event => {
      focusWithin = true;
      if (event.target === event.currentTarget) focus(available().find(entry => entry.item === tabStop())?.node);
    }),
    // Native blur does not bubble; subtree focus ownership follows focusout.
    onFocusOut: composeEventHandlers<FocusEvent>(() => props.onFocusOut, event => {
      if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
        resetSearch();
        const departing = current(), registered = departing ? keys.get(departing.key()) : undefined;
        // A live row's explicit blur ends ownership; invalidation may blur before focus repair.
        if (event.relatedTarget || event.target === event.currentTarget ||
          departing && registered?.isConnected && registered.contains(event.target as Node) && departing.visible() && !departing.disabled()) focusWithin = false;
      }
    }),
    onCompositionStart: composeEventHandlers<CompositionEvent>(() => props.onCompositionStart, () => { context.composing = true; }),
    onCompositionEnd: composeEventHandlers<CompositionEvent>(() => props.onCompositionEnd, () => { context.composing = false; })
  });
  return <Provider scope={props.__scopeTree} value={context}><ParentProvider scope={props.__scopeTree} value={{ item: null, visible: () => true }}><ItemProvider scope={props.__scopeTree} value={null}><Primitive as="div" {...forwarded} /></ItemProvider></ParentProvider></Provider>;
}

export function TreeItem(props: TreeItemProps): Element {
  const scope = untrack(() => props.__scopeTree);
  const root = useTree('TreeItem', scope), parent = useParent('TreeItem', scope);
  const id = createUniqueId(), textId = createUniqueId();
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const [highlighted, setHighlighted] = createSignal(false);
  const item: Item = {
    key: () => props.value, text: () => props.textValue, disabled: () => props.disabled ?? false,
    visible: () => parent.visible() && !props.hidden, branch: () => props.hasChildren ?? false,
    expanded: () => !!props.hasChildren && root.expanded().includes(props.value), parent: parent.item, textId
  };
  if (!isServer) createEffect(() => [node(), props.value] as const, ([element, key]) =>
    element ? root.register(element, item, key) : undefined, { transparent: true });
  // Text/indicator descendants belong to this row; descendant items and disclosure buttons do not.
  const ownRow = (event: Event) => {
    const target = event.target as HTMLElement | null;
    return target?.closest('[data-radix-tree-item]') === event.currentTarget && !target.closest('[data-radix-tree-expand-trigger]');
  };
  const forwarded = merge(omit(props, '__scopeTree', 'value', 'textValue', 'disabled', 'hasChildren', 'onActivate'), {
    role: 'treeitem' as const, 'data-radix-tree-item': '',
    get id() { return props.id ?? id; },
    get ref() { return composeRefs(props.ref, ref); },
    get tabIndex() { return root.tabStop() === item ? 0 : -1; },
    get ['aria-labelledby']() { return props['aria-labelledby'] ?? (props['aria-label'] ? undefined : textId); },
    get ['aria-expanded'](): 'true' | 'false' | undefined { return item.branch() ? item.expanded() ? 'true' : 'false' : undefined; },
    get ['aria-selected'](): 'true' | 'false' | undefined { return root.mode() === 'single' ? root.value() === item.key() ? 'true' : 'false' : undefined; },
    get ['aria-disabled'](): 'true' | undefined { return item.disabled() ? 'true' : undefined; },
    get ['data-disabled']() { return item.disabled() ? '' : undefined; },
    get ['data-selected']() { return root.mode() === 'single' && root.value() === item.key() ? '' : undefined; },
    get ['data-highlighted']() { return highlighted() ? '' : undefined; },
    get ['data-state']() { return item.branch() ? item.expanded() ? 'open' : 'closed' : undefined; },
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, event => {
      if ((event.target as HTMLElement).closest('[data-radix-tree-item]') !== event.currentTarget) return;
      root.remember(item);
      setHighlighted(event.target === event.currentTarget);
    }),
    onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, () => setHighlighted(false)),
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => { if (ownRow(event) && item.disabled()) event.preventDefault(); }),
    onMouseDown: composeEventHandlers<MouseEvent>(() => props.onMouseDown, event => {
      if (!ownRow(event) || event.button !== 0) return;
      if (item.disabled() || !item.visible()) event.preventDefault(); else focus(node(), false, false);
    }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, event => {
      if (!ownRow(event) || event.button !== 0) return;
      if (item.disabled() || !item.visible() || root.composing) { event.preventDefault(); return; }
      const element = event.currentTarget as HTMLElement;
      const activation = new element.ownerDocument.defaultView!.CustomEvent('tree.itemActivate', { bubbles: true, cancelable: true });
      dispatchCancelableEvent(element, activation, props.onActivate);
      if (activation.defaultPrevented) event.preventDefault(); else root.select(item);
    }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (event.target !== event.currentTarget) return;
      if (event.isComposing || root.composing || item.disabled() || !item.visible()) {
        if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
        return;
      }
      if (event.key === 'Enter') {
        // One click path for div, button and anchor targets; suppress the browser's second Enter click.
        event.preventDefault();
        (event.currentTarget as HTMLElement).click();
      } else if (event.key === ' ') {
        event.preventDefault();
        root.select(item);
      } else root.navigate(item, event);
    }),
    onKeyUp: composeEventHandlers<KeyboardEvent>(() => props.onKeyUp, event => {
      if (event.target === event.currentTarget && event.key === ' ') event.preventDefault();
    })
  });
  return <ItemProvider scope={scope} value={item}><Primitive as="div" {...forwarded} /></ItemProvider>;
}

export function TreeItemText(props: TreeItemTextProps): Element {
  const item = useItem('TreeItemText', untrack(() => props.__scopeTree))!;
  return <Primitive as="span" {...merge(omit(props, '__scopeTree'), { id: item.textId })} />;
}

export function TreeItemIndicator(props: TreeItemIndicatorProps): Element {
  const scope = untrack(() => props.__scopeTree), item = useItem('TreeItemIndicator', scope)!, root = useTree('TreeItemIndicator', scope);
  return <Primitive as="span" {...merge(omit(props, '__scopeTree'), {
    'aria-hidden': 'true' as const,
    get ['data-state']() { return item.branch() ? item.expanded() ? 'open' : 'closed' : undefined; },
    get ['data-selected']() { return root.mode() === 'single' && root.value() === item.key() ? '' : undefined; }
  })} />;
}

export function TreeItemGroup(props: TreeItemGroupProps): Element {
  const scope = untrack(() => props.__scopeTree), item = useItem('TreeItemGroup', scope)!;
  const visible = () => item.visible() && item.expanded() && !props.hidden;
  const presence = createPresence(visible, () => props.forceMount ?? false);
  const forwarded = merge(omit(props, '__scopeTree', 'forceMount'), {
    role: 'group' as const,
    get ref() { return composeRefs(props.ref, presence.ref); },
    get ['data-state']() { return visible() ? 'open' : 'closed'; },
    get ['aria-hidden'](): 'true' | undefined { return !visible() ? 'true' : undefined; },
    get inert() { return !visible(); },
    get hidden() { return !!props.hidden || !presence.mounted() || !!props.forceMount && !visible(); }
  });
  if (!isServer) onCleanup(() => presence.ref(undefined));
  function Mounted(): Element {
    if (!isServer) onCleanup(() => presence.ref(undefined));
    return <Primitive as="div" {...forwarded} />;
  }
  const asChild = untrack(() => props.asChild);
  return <ParentProvider scope={scope} value={{ item, visible }}>{asChild
    ? <Show when={presence.mounted()}><Mounted /></Show>
    : <Primitive as="div" {...omit(forwarded, 'children', 'asChild')} asChild={false}><Show when={presence.mounted()}>{props.asChild ? undefined : props.children}</Show></Primitive>
  }</ParentProvider>;
}

export function TreeExpandTrigger(props: TreeExpandTriggerProps): Element {
  const scope = untrack(() => props.__scopeTree), item = useItem('TreeExpandTrigger', scope)!, root = useTree('TreeExpandTrigger', scope);
  return <Primitive {...merge(omit(props, '__scopeTree'), {
    type: 'button' as const, tabIndex: -1, 'data-radix-tree-expand-trigger': '',
    get disabled() { return props.disabled || item.disabled() || !item.branch(); },
    get ['aria-expanded'](): 'true' | 'false' | undefined { return item.branch() ? item.expanded() ? 'true' : 'false' : undefined; },
    get ['data-state']() { return item.expanded() ? 'open' : 'closed'; },
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if ((event.isComposing || root.composing) && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
    }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, event => {
      event.stopPropagation();
      event.preventDefault();
      if (!props.disabled && !root.composing) root.expand(item, !item.expanded());
    })
  })} />;
}
