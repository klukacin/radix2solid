// Native port of Radix NavigationMenu; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createMemo, createSignal, createUniqueId, merge, omit, onCleanup, Show, untrack, type Accessor, type Element } from 'solid-js';
import { isServer, Portal } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createCollection } from '../internal/collection.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeRefs } from '../internal/refs.js';
import { callEventHandler, composeEventHandlers, dispatchCancelableEvent } from '../internal/events.js';
import { createPresence } from '../internal/presence.js';
import { createLayer, LayerContext, type LayerCallbacks } from '../internal/dismissable-layer.js';
import { activeElement, focus, tabbables } from '../internal/focus-scope.js';
import { useDirection, type Direction } from '../direction/index.js';
import { VisuallyHidden } from '../visually-hidden/index.js';
import { mergeStyles } from '../slot/slot.js';

type Scoped = { __scopeNavigationMenu?: Scope };
type Orientation = 'horizontal' | 'vertical';
type ValueProps = { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; orientation?: Orientation; activationMode?: 'automatic' | 'manual' };
export type NavigationMenuProps = Scoped & PrimitiveProps<'nav'> & ValueProps & { dir?: Direction; delayDuration?: number; skipDelayDuration?: number };
export type NavigationMenuSubProps = Scoped & PrimitiveProps<'div'> & ValueProps & { disableToggle?: boolean };
export type NavigationMenuListProps = Scoped & PrimitiveProps<'ul'>;
export type NavigationMenuItemProps = Scoped & PrimitiveProps<'li'> & { value?: string };
export type NavigationMenuTriggerProps = Scoped & PrimitiveProps<'button'>;
type WithoutSelect<P> = P extends unknown ? Omit<P, 'onSelect'> : never;
export type NavigationMenuLinkProps = Scoped & WithoutSelect<PrimitiveProps<'a'>> & { active?: boolean; onSelect?: (event: Event) => void };
export type NavigationMenuContentProps = Scoped & PrimitiveProps<'div'> & Pick<LayerCallbacks, 'onEscapeKeyDown' | 'onPointerDownOutside' | 'onFocusOutside' | 'onInteractOutside'> & { forceMount?: true };
export type NavigationMenuIndicatorProps = Scoped & PrimitiveProps<'div'> & { forceMount?: true };
export type NavigationMenuViewportProps = Scoped & PrimitiveProps<'div'> & { forceMount?: true };
interface ItemValue {
  value: Accessor<string>; open: Accessor<boolean>; trigger: Accessor<HTMLElement | undefined>; setTrigger: (node: HTMLElement | undefined) => void;
  content: Accessor<HTMLElement | undefined>; setContent: (node: HTMLElement | undefined) => void;
  proxy: Accessor<HTMLElement | undefined>; setProxy: (node: HTMLElement | undefined) => void;
  escaped: boolean; restoreTabs: () => void; removeTabs: () => void; enter: (end?: boolean) => void;
}
interface MenuValue {
  value: Accessor<string>; previous: Accessor<string>; change: (value: string) => void; root: boolean;
  dir: Accessor<Direction>; orientation: Accessor<Orientation>; activation: Accessor<'automatic' | 'manual'>; disableToggle: Accessor<boolean>;
  nav: Accessor<HTMLElement | undefined>; setNav: (node: HTMLElement | undefined) => void;
  viewport: Accessor<HTMLElement | undefined>; setViewport: (node: HTMLElement | undefined) => void;
  content: Accessor<HTMLElement | undefined>; setContent: (node: HTMLElement | undefined) => void;
  track: Accessor<HTMLElement | undefined>; setTrack: (node: HTMLElement | undefined) => void;
  triggers: ReturnType<typeof createCollection<ItemValue>>; baseId: string;
  triggerEnter: (value: string) => void; triggerLeave: () => void; contentEnter: () => void; contentLeave: () => void;
  scheduleFocus: (nodes: HTMLElement[]) => void;
}
const [createContext, createNavigationMenuScope] = createContextScope('NavigationMenu');
const [Provider, useMenu] = createContext<MenuValue>('NavigationMenu');
const [ItemProvider, useItem] = createContext<ItemValue>('NavigationMenuItem');
const [FocusProvider, useFocusGroup] = createContext<ReturnType<typeof createCollection<null>> | null>('NavigationMenuFocusGroup', null);
export { createNavigationMenuScope };
const menu = (props: Scoped, name: string) => useMenu(`NavigationMenu${name}`, props.__scopeNavigationMenu);
const itemContext = (props: Scoped, name: string) => useItem(`NavigationMenu${name}`, props.__scopeNavigationMenu);
const triggerId = (nav: MenuValue, value: string) => `${nav.baseId}-trigger-${value}`;
const contentId = (nav: MenuValue, value: string) => `${nav.baseId}-content-${value}`;

function createMenu(props: ValueProps & { disableToggle?: boolean }, parent?: MenuValue, rootProps?: NavigationMenuProps): MenuValue {
  const [value, setValue] = createControllableState({ value: () => props.value, get defaultValue() { return props.defaultValue ?? ''; }, get onChange() { return props.onValueChange; } });
  const [previous, setPrevious] = createSignal('');
  const [nav, setNav] = createSignal<HTMLElement | undefined>();
  const [viewport, setViewport] = createSignal<HTMLElement | undefined>();
  const [content, setContent] = createSignal<HTMLElement | undefined>();
  const [track, setTrack] = createSignal<HTMLElement | undefined>();
  const dir = rootProps ? useDirection(() => rootProps.dir) : parent!.dir;
  let last = untrack(value), delayed = true;
  let openTimer: ReturnType<typeof setTimeout> | undefined, closeTimer: ReturnType<typeof setTimeout> | undefined, skipTimer: ReturnType<typeof setTimeout> | undefined;
  let focusTimer: ReturnType<typeof setTimeout> | undefined;
  const clearOpen = () => { clearTimeout(openTimer); openTimer = undefined; };
  const clearClose = () => { clearTimeout(closeTimer); closeTimer = undefined; };
  const change = (next: string) => {
    clearOpen(); clearClose();
    if (rootProps && (rootProps.skipDelayDuration ?? 300) > 0) {
      clearTimeout(skipTimer);
      if (next) delayed = false;
      else skipTimer = setTimeout(() => { delayed = true; }, rootProps.skipDelayDuration ?? 300);
    }
    setValue(next);
  };
  if (!isServer) {
    createEffect(value, next => { if (next !== last) { setPrevious(last); last = next; } }, { transparent: true });
    onCleanup(() => { clearOpen(); clearClose(); clearTimeout(skipTimer); clearTimeout(focusTimer); });
  }
  const result: MenuValue = { value, previous, change, root: !parent, dir, orientation: () => props.orientation ?? 'horizontal',
    activation: () => props.activationMode ?? parent?.activation() ?? 'automatic', disableToggle: () => props.disableToggle ?? !!parent, nav: parent?.nav ?? nav, setNav,
    viewport, setViewport, content, setContent, track, setTrack, triggers: createCollection<ItemValue>(), baseId: createUniqueId(),
    scheduleFocus(nodes) { clearTimeout(focusTimer); focusTimer = setTimeout(() => focusFirst(nodes), 0); },
    triggerEnter(next) {
      clearOpen(); clearClose();
      if (result.activation() === 'manual' || next === value()) return;
      if (rootProps && delayed && (rootProps.delayDuration ?? 200) > 0) openTimer = setTimeout(() => change(next), rootProps.delayDuration ?? 200);
      else change(next);
    },
    triggerLeave() { clearOpen(); if (result.activation() !== 'manual') { clearClose(); closeTimer = setTimeout(() => change(''), 150); } },
    contentEnter: clearClose,
    contentLeave() { if (result.activation() !== 'manual') { clearClose(); closeTimer = setTimeout(() => change(''), 150); } }
  };
  return result;
}
export function NavigationMenu(props: NavigationMenuProps): Element {
  const nav = createMenu(props, undefined, props);
  const navProps = merge({ 'aria-label': 'Main' }, omit(props, '__scopeNavigationMenu', 'value', 'defaultValue', 'onValueChange', 'orientation', 'dir', 'delayDuration', 'skipDelayDuration', 'activationMode'), {
    get dir() { return nav.dir(); }, get ['data-orientation']() { return nav.orientation(); }, get ref() { return composeRefs(props.ref, nav.setNav); }
  });
  return <Provider scope={props.__scopeNavigationMenu} value={nav}><Primitive as="nav" {...navProps} /></Provider>;
}
export function NavigationMenuSub(props: NavigationMenuSubProps): Element {
  const nav = createMenu(props, menu(props, 'Sub'));
  const subProps = merge(omit(props, '__scopeNavigationMenu', 'value', 'defaultValue', 'onValueChange', 'orientation', 'activationMode', 'disableToggle'), {
    get ['data-orientation']() { return nav.orientation(); }
  });
  return <Provider scope={props.__scopeNavigationMenu} value={nav}><Primitive as="div" {...subProps} /></Provider>;
}
export function NavigationMenuList(props: NavigationMenuListProps): Element {
  const nav = menu(props, 'List');
  const group = createCollection<null>();
  const listProps = merge(omit(props, '__scopeNavigationMenu'), { get ['data-orientation']() { return nav.orientation(); } });
  const list = () => <Primitive as="ul" {...listProps} />;
  return <div style={{ position: 'relative' }} ref={nav.setTrack}>{nav.root ? <FocusProvider scope={props.__scopeNavigationMenu} value={group}>{list()}</FocusProvider> : list()}</div>;
}
export function NavigationMenuItem(props: NavigationMenuItemProps): Element {
  const nav = menu(props, 'Item'), fallback = createUniqueId();
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>();
  const [content, setContent] = createSignal<HTMLElement | undefined>();
  const [proxy, setProxy] = createSignal<HTMLElement | undefined>();
  let removed: [HTMLElement, string | null][] = [];
  const item: ItemValue = { value: () => props.value || fallback, open: () => nav.value() === item.value(), trigger, setTrigger, content, setContent, proxy, setProxy, escaped: false,
    restoreTabs() { for (const [node, value] of removed) { if (value === null) node.removeAttribute('tabindex'); else node.setAttribute('tabindex', value); } removed = []; },
    removeTabs() { const element = content(); if (!element) return; item.restoreTabs(); removed = tabbables(element).map(node => [node, node.getAttribute('tabindex')]); for (const [node] of removed) node.tabIndex = -1; },
    enter(end = false) { item.restoreTabs(); const element = content(); if (!element) return; focusFirst(end ? tabbables(element).reverse() : tabbables(element)); }
  };
  if (!isServer) onCleanup(item.restoreTabs);
  const itemProps = omit(props, '__scopeNavigationMenu', 'value');
  return <ItemProvider scope={props.__scopeNavigationMenu} value={item}><Primitive as="li" {...itemProps} /></ItemProvider>;
}
function focusFirst(nodes: HTMLElement[]) {
  for (const node of nodes) { const previous = activeElement(node.ownerDocument); focus(node, false, false); if (activeElement(node.ownerDocument) !== previous || previous === node) return; }
}
function focusKeys(group: ReturnType<typeof createCollection<null>> | null, nav: MenuValue, event: KeyboardEvent) {
  if (!group || event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  let nodes = group.items().map(item => item.node).filter(node => !node.matches(':disabled'));
  const previous = event.key === (nav.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft') || event.key === 'ArrowUp' || event.key === 'End';
  if (previous) nodes.reverse();
  if (event.key !== 'Home' && event.key !== 'End') nodes = nodes.slice(nodes.indexOf(event.currentTarget as HTMLElement) + 1);
  nav.scheduleFocus(nodes);
  event.preventDefault();
}
function useFocusRegistration(props: Scoped, node: Accessor<HTMLElement | undefined>) {
  const group = useFocusGroup('NavigationMenuFocusGroup', props.__scopeNavigationMenu);
  if (!isServer && group) createEffect(node, element => element ? untrack(() => group.register(element, null)) : undefined, { transparent: true });
  return group;
}
export function NavigationMenuTrigger(props: NavigationMenuTriggerProps): Element {
  const nav = menu(props, 'Trigger'), item = itemContext(props, 'Trigger'), group = useFocusRegistration(props, item.trigger);
  let entered = false, clickedClosed = false;
  if (!isServer) createEffect(item.trigger, element => element ? untrack(() => nav.triggers.register(element, item)) : undefined, { transparent: true });
  const triggerProps = merge(omit(props, '__scopeNavigationMenu'), {
    get id() { return triggerId(nav, item.value()); }, get ['aria-expanded']() { return item.open() ? 'true' : 'false'; },
    get ['aria-controls']() { return item.open() ? contentId(nav, item.value()) : undefined; },
    get ['data-state']() { return item.open() ? 'open' : 'closed'; }, get ['data-disabled']() { return props.disabled ? '' : undefined; },
    get ref() { return composeRefs(props.ref, item.setTrigger); },
    onPointerEnter: composeEventHandlers<PointerEvent>(() => props.onPointerEnter, event => { if (event.pointerType === 'mouse') { entered = false; clickedClosed = false; item.escaped = false; } }),
    onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, event => {
      if (event.pointerType === 'mouse' && !props.disabled && !entered && !clickedClosed && !item.escaped) { nav.triggerEnter(item.value()); entered = true; }
    }),
    onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, event => { if (event.pointerType === 'mouse') { nav.triggerLeave(); entered = false; } }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, () => {
      if (props.disabled) return;
      clickedClosed = item.open();
      nav.change(clickedClosed && !nav.disableToggle() ? '' : item.value());
    }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (event.target !== event.currentTarget) return;
      const entry = nav.orientation() === 'horizontal' ? 'ArrowDown' : nav.dir() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      if (item.open() && event.key === entry) { item.enter(); event.preventDefault(); } else focusKeys(group, nav, event);
    })
  });
  return <><Primitive as="button" {...triggerProps} />
    <Show when={item.open()}><VisuallyHidden tabindex={0} ref={item.setProxy} onFocus={event => {
      const from = event.relatedTarget as Node | null;
      if (from === item.trigger()) item.enter();
      else if (!item.content()?.contains(from)) item.enter(true);
    }} />{nav.viewport() ? <span aria-owns={contentId(nav, item.value())} /> : null}</Show>
  </>;
}
export function NavigationMenuLink(props: NavigationMenuLinkProps): Element {
  const nav = menu(props, 'Link'), [node, ref] = createSignal<HTMLElement | undefined>(), group = useFocusRegistration(props, node);
  const linkProps = merge(omit(props, '__scopeNavigationMenu', 'active', 'onSelect'), {
    get ['data-active']() { return props.active ? '' : undefined; }, get ['aria-current']() { return props.active ? 'page' : props['aria-current']; }, get ref() { return composeRefs(props.ref, ref); },
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => focusKeys(group, nav, event)),
    onClick(event: MouseEvent) {
      callEventHandler(props.onClick, event);
      const target = event.currentTarget as HTMLElement;
      const selected = dispatchCancelableEvent(target, new target.ownerDocument.defaultView!.CustomEvent('navigationMenu.linkSelect', { bubbles: true, cancelable: true }), props.onSelect);
      if (!selected.defaultPrevented && !event.metaKey) dispatchDismiss(target);
    }
  });
  return <Primitive as="a" {...linkProps} />;
}
function dispatchDismiss(target: HTMLElement) {
  target.dispatchEvent(new target.ownerDocument.defaultView!.CustomEvent('navigationMenu.rootContentDismiss', { bubbles: true, cancelable: true }));
}
export function NavigationMenuContent(props: NavigationMenuContentProps): Element {
  const nav = menu(props, 'Content'), item = itemContext(props, 'Content');
  const presence = createPresence(() => item.open() || !!nav.viewport() && !nav.value() && nav.previous() === item.value(), () => !!props.forceMount);
  let lastMotion: string | undefined;
  const motion = createMemo(() => {
    const values = nav.triggers.items().map(entry => entry.value.value());
    if (nav.dir() === 'rtl') values.reverse();
    const current = values.indexOf(nav.value()), previous = values.indexOf(nav.previous());
    if (current < 0 || previous < 0 || current === previous) return lastMotion;
    if (item.value() === nav.value()) lastMotion = current > previous ? 'from-end' : 'from-start';
    else if (item.value() === nav.previous()) lastMotion = current > previous ? 'to-start' : 'to-end';
    return lastMotion;
  });
  function Mounted(): Element {
    if (!isServer) {
      onCleanup(() => presence.ref(undefined));
      createEffect(() => [item.content(), item.open()] as const, ([element, open]) => {
        if (element && open) nav.setContent(element);
        return () => { if (untrack(nav.content) === element) nav.setContent(undefined); };
      }, { transparent: true });
      createEffect(item.content, element => {
        if (!element || !nav.root) return;
        const dismiss = () => { const restore = element.contains(activeElement(element.ownerDocument)); nav.change(''); item.removeTabs(); if (restore) focus(item.trigger()); };
        element.addEventListener('navigationMenu.rootContentDismiss', dismiss);
        return () => element.removeEventListener('navigationMenu.rootContentDismiss', dismiss);
      }, { transparent: true });
    }
    const layer = createLayer(item.content, { active: item.open, modal: () => false, trigger: item.trigger, kind: 'layer', focusScope: false,
      dismiss: () => { const element = item.content(); if (element) dispatchDismiss(element); },
      onEscapeKeyDown(event) { props.onEscapeKeyDown?.(event); if (!event.defaultPrevented) item.escaped = true; },
      onPointerDownOutside(event) {
        props.onPointerDownOutside?.(event);
        const target = event.target as Node;
        if (!nav.root || nav.triggers.items().some(entry => entry.node.contains(target)) || nav.viewport()?.contains(target)) event.preventDefault();
      },
      onFocusOutside(event) {
        props.onFocusOutside?.(event); item.removeTabs();
        const original = event.detail.originalEvent;
        if (!nav.root || nav.nav()?.contains(original.target as Node) || !nav.nav()?.contains(original.relatedTarget as Node)) event.preventDefault();
      },
      get onInteractOutside() { return props.onInteractOutside; }
    });
    const contentProps = merge(omit(props, '__scopeNavigationMenu', 'forceMount', 'onEscapeKeyDown', 'onPointerDownOutside', 'onFocusOutside', 'onInteractOutside'), {
      get id() { return contentId(nav, item.value()); }, get ['aria-labelledby']() { return triggerId(nav, item.value()); },
      get ['data-state']() { return item.open() ? 'open' : 'closed'; }, get ['data-orientation']() { return nav.orientation(); }, get ['data-motion']() { return motion(); },
      get ref() { return composeRefs(props.ref, item.setContent, presence.ref); },
      get style() { return mergeStyles(nav.root && !item.open() ? { 'pointer-events': 'none' } : {}, props.style); },
      onPointerEnter: composeEventHandlers<PointerEvent>(() => props.onPointerEnter, event => { if (event.pointerType === 'mouse') nav.contentEnter(); }),
      onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, event => { if (event.pointerType === 'mouse') nav.contentLeave(); }),
      onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
        if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
        const element = item.content(); if (!element) return;
        const candidates = tabbables(element); if (event.shiftKey) candidates.reverse();
        const next = candidates.slice(candidates.indexOf(activeElement(element.ownerDocument)!) + 1);
        if (next.length) { focusFirst(next); event.preventDefault(); }
        else focus(item.proxy(), false, false);
      })
    });
    const render = () => <LayerContext value={layer}><Primitive as="div" data-radix-navigation-menu-content {...contentProps} /></LayerContext>;
    return <Show when={!isServer && nav.viewport()} fallback={render()}>{mount => <Portal mount={mount()}>{render()}</Portal>}</Show>;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}
export function NavigationMenuIndicator(props: NavigationMenuIndicatorProps): Element {
  const nav = menu(props, 'Indicator'), presence = createPresence(() => !!nav.value(), () => !!props.forceMount);
  const [position, setPosition] = createSignal({ size: 0, offset: 0 });
  const styles = createMemo(() => nav.orientation() === 'horizontal'
    ? { position: 'absolute', left: '0', top: '100%', width: `${position().size}px`, transform: `translateX(${position().offset}px)`, '--radix-navigation-menu-indicator-translate-x': `${position().offset}px` }
    : { position: 'absolute', left: '100%', top: '0', height: `${position().size}px`, transform: `translateY(${position().offset}px)`, '--radix-navigation-menu-indicator-translate-y': `${position().offset}px` });
  if (!isServer) {
    createEffect(() => [nav.track(), nav.triggers.items().find(entry => entry.value.value() === (nav.value() || nav.previous()))?.node, nav.orientation()] as const, ([track, trigger, orientation]) => {
      if (!track || !trigger) return;
      const view = trigger.ownerDocument.defaultView!;
      let frame = 0;
      const update = () => { setPosition({ size: orientation === 'horizontal' ? trigger.offsetWidth : trigger.offsetHeight, offset: orientation === 'horizontal' ? trigger.offsetLeft : trigger.offsetTop }); };
      const resized = () => { view.cancelAnimationFrame(frame); frame = view.requestAnimationFrame(update); };
      update();
      const observer = new view.ResizeObserver(resized); observer.observe(trigger); observer.observe(track);
      return () => { observer.disconnect(); view.cancelAnimationFrame(frame); };
    }, { transparent: true });
  }
  function Mounted(input: { track: HTMLElement }): Element {
    if (!isServer) onCleanup(() => presence.ref(undefined));
    const indicatorProps = merge(omit(props, '__scopeNavigationMenu', 'forceMount'), {
    get ['data-state']() { return nav.value() ? 'visible' : 'hidden'; }, get ['data-orientation']() { return nav.orientation(); },
    get ref() { return composeRefs(props.ref, presence.ref); }, get style() { return mergeStyles(styles(), props.style); }
    });
    return <Portal mount={input.track}><Primitive as="div" aria-hidden="true" {...indicatorProps} /></Portal>;
  }
  return <Show when={!isServer && nav.track()}>{track => <Show when={presence.mounted()}><Mounted track={track()} /></Show>}</Show>;
}
export function NavigationMenuViewport(props: NavigationMenuViewportProps): Element {
  const nav = menu(props, 'Viewport'), presence = createPresence(() => !!nav.value(), () => !!props.forceMount);
  const [size, setSize] = createSignal<{ width: number; height: number }>();
  const styles = createMemo(() => mergeStyles({ '--radix-navigation-menu-viewport-width': size() ? `${size()!.width}px` : undefined,
    '--radix-navigation-menu-viewport-height': size() ? `${size()!.height}px` : undefined, 'pointer-events': !nav.value() && nav.root ? 'none' : undefined }, props.style));
  if (!isServer) {
    createEffect(nav.content, element => {
      if (!element) return;
      const view = element.ownerDocument.defaultView!;
      let frame = 0;
      const update = () => setSize({ width: element.offsetWidth, height: element.offsetHeight });
      const resized = () => { view.cancelAnimationFrame(frame); frame = view.requestAnimationFrame(update); };
      update();
      const observer = new view.ResizeObserver(resized); observer.observe(element);
      return () => { observer.disconnect(); view.cancelAnimationFrame(frame); };
    }, { transparent: true });
  }
  function Mounted(): Element {
    if (!isServer) onCleanup(() => { nav.setViewport(undefined); presence.ref(undefined); });
    const viewportProps = merge(omit(props, '__scopeNavigationMenu', 'forceMount'), {
    get ['data-state']() { return nav.value() ? 'open' : 'closed'; }, get ['data-orientation']() { return nav.orientation(); },
    get ref() { return composeRefs(props.ref, nav.setViewport, presence.ref); }, get style() { return styles(); },
    onPointerEnter: composeEventHandlers<PointerEvent>(() => props.onPointerEnter, event => { if (event.pointerType === 'mouse') nav.contentEnter(); }),
    onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, event => { if (event.pointerType === 'mouse') nav.contentLeave(); })
    });
    return <Primitive as="div" {...viewportProps} />;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}
