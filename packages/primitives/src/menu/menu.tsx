// Native port of Radix Menu; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, createUniqueId, merge, omit, onCleanup, Show, untrack, type Element } from 'solid-js';
import { isServer, Portal as NativePortal } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { createCollection } from '../internal/collection.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeEventHandlers, dispatchCancelableEvent } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { createPresence } from '../internal/presence.js';
import { createLayer, LayerContext, type LayerCallbacks } from '../internal/dismissable-layer.js';
import { activeElement, composedContains, focus } from '../internal/focus-scope.js';
import { RovingFocusGroup, RovingFocusGroupItem, createRovingFocusGroupScope } from '../internal/roving-focus.js';
import { Popper, PopperAnchor, PopperContent, PopperArrow, usePopper, createPopperScope, type PopperAnchorProps, type PopperContentProps, type PopperArrowProps } from '../internal/popper.js';
import { pointerGrace, pointInPolygon, type Point } from '../internal/pointer-grace.js';
import { useDirection, type Direction } from '../direction/direction.js';
import { mergeStyles } from '../slot/slot.js';

type Scoped = { __scopeMenu?: Scope };
export type MenuProps = Scoped & { children?: Element; open?: boolean; onOpenChange?: (open: boolean) => void; dir?: Direction; modal?: boolean };
export type MenuAnchorProps = Scoped & PopperAnchorProps;
export type MenuPortalProps = Scoped & { children?: Element; container?: globalThis.Element | DocumentFragment | null; forceMount?: true };
export type MenuContentProps = Scoped & PopperContentProps & LayerCallbacks & { forceMount?: true; loop?: boolean; onEntryFocus?: (event: Event) => void };
export type MenuGroupProps = Scoped & PrimitiveProps<'div'>;
export type MenuLabelProps = Scoped & PrimitiveProps<'div'>;
type ItemHost<P> = P extends unknown ? Omit<P, 'onSelect'> : never;
export type MenuItemProps = Scoped & ItemHost<PrimitiveProps<'div'>> & { disabled?: boolean; textValue?: string; onSelect?: (event: Event) => void };
export type MenuCheckboxItemProps = MenuItemProps & { checked?: boolean | 'indeterminate'; onCheckedChange?: (checked: boolean) => void };
export type MenuRadioGroupProps = MenuGroupProps & { value?: string; onValueChange?: (value: string) => void };
export type MenuRadioItemProps = MenuItemProps & { value: string };
export type MenuItemIndicatorProps = Scoped & PrimitiveProps<'span'> & { forceMount?: true };
export type MenuSeparatorProps = MenuGroupProps;
export type MenuArrowProps = Scoped & PopperArrowProps;
export type MenuSubProps = Scoped & { children?: Element; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void };
export type MenuSubTriggerProps = MenuItemProps;
export type MenuSubContentProps = MenuContentProps;
interface MenuValue {
  open: () => boolean; change: (open: boolean) => void; trigger: () => HTMLElement | undefined; setTrigger: (node: HTMLElement | undefined) => void;
  content: () => HTMLElement | undefined; setContent: (node: HTMLElement | undefined) => void; triggerId: string; contentId: string;
}
interface RootValue { dir: () => Direction; modal: () => boolean; keyboard: boolean; pointerDown: HTMLElement | undefined; close: () => void }
interface ContentValue {
  collection: ReturnType<typeof createCollection<{ disabled: () => boolean; text: () => string }>>;
  search: string; enter: (event: PointerEvent) => boolean; leave: (event: PointerEvent) => void;
  grace: { polygon: Point[]; side: 'left' | 'right' } | undefined; graceTimer: ReturnType<typeof setTimeout> | undefined;
  direction: 'left' | 'right'; lastX: number;
}
const [createMenuContext, createMenuScope] = createContextScope('Menu', [createPopperScope, createRovingFocusGroupScope]);
const useRovingScope = createRovingFocusGroupScope();
const [MenuProvider, useMenu] = createMenuContext<MenuValue>('Menu');
const [RootProvider, useRoot] = createMenuContext<RootValue>('Menu');
const [ContentProvider, useContent] = createMenuContext<ContentValue>('MenuContent');
const [PortalProvider, usePortal] = createMenuContext<{ forceMount: () => boolean }>('MenuPortal', { forceMount: () => false });
const [SubProvider, useSub] = createMenuContext<{ parent: MenuValue; content: ContentValue }>('MenuSub');
const [RadioProvider, useRadio] = createMenuContext<{ value: () => string | undefined; change: (value: string) => void }>('MenuRadioGroup');
const [IndicatorProvider, useIndicator] = createMenuContext<{ checked: () => boolean | 'indeterminate' }>('MenuItemIndicator', { checked: () => false });
const layerKeys = ['onEscapeKeyDown', 'onPointerDownOutside', 'onFocusOutside', 'onInteractOutside', 'onOpenAutoFocus', 'onCloseAutoFocus'] as const;
function menuValue(open: () => boolean, change: (open: boolean) => void): MenuValue {
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>();
  const [content, setContent] = createSignal<HTMLElement | undefined>();
  return { open, change, trigger, setTrigger, content, setContent, triggerId: createUniqueId(), contentId: createUniqueId() };
}
export function Menu(props: MenuProps): Element {
  const value = menuValue(() => props.open ?? false, next => props.onOpenChange?.(next));
  const dir = useDirection(() => props.dir);
  const root: RootValue = { dir, modal: () => props.modal ?? true, keyboard: false, pointerDown: undefined, close: () => value.change(false) };
  if (!isServer) createEffect(value.content, node => {
    if (!node) return;
    const document = node.ownerDocument;
    const window = document.defaultView!;
    const key = () => { root.keyboard = true; };
    const pointer = () => { root.keyboard = false; };
    const pointerDown = () => { root.keyboard = false; root.pointerDown = undefined; };
    const cancelPointer = () => { root.pointerDown = undefined; };
    const blur = () => root.close();
    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerdown', pointerDown, true); document.addEventListener('pointermove', pointer, true); document.addEventListener('pointercancel', cancelPointer, true);
    window.addEventListener('blur', blur);
    return () => {
      document.removeEventListener('keydown', key, true); document.removeEventListener('pointerdown', pointerDown, true); document.removeEventListener('pointermove', pointer, true); document.removeEventListener('pointercancel', cancelPointer, true);
      window.removeEventListener('blur', blur);
    };
  }, { transparent: true });
  return <Popper __scopePopper={props.__scopeMenu}><RootProvider scope={props.__scopeMenu} value={root}><MenuProvider scope={props.__scopeMenu} value={value}>{props.children}</MenuProvider></RootProvider></Popper>;
}
export function MenuAnchor(props: MenuAnchorProps): Element {
  const menu = useMenu('MenuAnchor', untrack(() => props.__scopeMenu));
  return <PopperAnchor {...merge(omit(props, '__scopeMenu'), { get __scopePopper() { return props.__scopeMenu; }, get ref() { return composeRefs(props.ref, menu.setTrigger); } })} />;
}
export function MenuPortal(props: MenuPortalProps): Element {
  useMenu('MenuPortal', untrack(() => props.__scopeMenu));
  return <NativePortal {...{
    get mount() { return props.container ?? undefined; },
    get children() { return <PortalProvider scope={props.__scopeMenu} value={{ forceMount: () => props.forceMount ?? false }}>{props.children}</PortalProvider>; }
  } as Parameters<typeof NativePortal>[0]} />;
}
export function MenuContent(props: MenuContentProps): Element { return renderContent(props, false); }
export function MenuSubContent(props: MenuSubContentProps): Element { return renderContent(props, true); }
function renderContent(props: MenuContentProps, sub: boolean): Element {
  const scope = untrack(() => props.__scopeMenu);
  const menu = useMenu('MenuContent', scope), root = useRoot('MenuContent', scope);
  const parent = sub ? useSub('MenuSubContent', scope) : undefined;
  const portal = usePortal('MenuContent', scope);
  const presence = createPresence(menu.open, () => props.forceMount ?? portal.forceMount());
  function Mounted(): Element {
    const collection = createCollection<{ disabled: () => boolean; text: () => string }>();
    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    const content: ContentValue = { collection, search: '', grace: undefined, graceTimer: undefined, direction: 'right', lastX: 0,
      enter(event) {
        if (content.grace && content.direction === content.grace.side && pointInPolygon({ x: event.clientX, y: event.clientY }, content.grace.polygon)) { event.preventDefault(); return false; }
        return true;
      },
      leave(event) { if (content.enter(event)) focus(menu.content()); }
    };
    onCleanup(() => { clearTimeout(searchTimer); clearTimeout(content.graceTimer); });
    const layer = createLayer(menu.content, {
      active: menu.open, modal: () => !sub && root.modal(), trigger: menu.trigger, kind: 'layer', dismiss: () => menu.change(false),
      onOpenAutoFocus(event) {
        props.onOpenAutoFocus?.(event);
        if (!event.defaultPrevented) { event.preventDefault(); if (!sub || root.keyboard) focus(menu.content()); }
      },
      onCloseAutoFocus(event) { props.onCloseAutoFocus?.(event); if (sub) event.preventDefault(); },
      onEscapeKeyDown(event) { props.onEscapeKeyDown?.(event); if (sub && !event.defaultPrevented) { root.close(); event.preventDefault(); } },
      get onPointerDownOutside() { return props.onPointerDownOutside; },
      onFocusOutside(event) {
        props.onFocusOutside?.(event);
        if (sub && !event.defaultPrevented && composedContains(menu.trigger()!, event.target as Node)) event.preventDefault();
      },
      get onInteractOutside() { return props.onInteractOutside; }
    });
    if (!isServer) onCleanup(() => { presence.ref(undefined); menu.setContent(undefined); });
    const forwarded = merge({ role: 'menu' as const, tabIndex: -1, id: menu.contentId, 'aria-orientation': 'vertical' as const }, omit(props, '__scopeMenu', 'forceMount', 'loop', 'onEntryFocus', ...layerKeys), {
      get dir() { return root.dir(); }, get ['data-state']() { return menu.open() ? 'open' : 'closed'; },
      get ['aria-labelledby']() { return props['aria-labelledby'] ?? (sub ? menu.triggerId : undefined); },
      get ref() { return composeRefs(props.ref, menu.setContent, presence.ref); },
      get __scopePopper() { return scope; }, get side() { return sub ? root.dir() === 'rtl' ? 'left' : 'right' : props.side; },
      get align() { return sub ? 'start' as const : props.align; },
      get style() { return mergeStyles({ outline: 'none' }, props.style); },
      onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, event => {
        if (event.pointerType !== 'mouse' || (event.target as HTMLElement).closest('[role="menu"]') !== event.currentTarget) return;
        if (event.clientX !== content.lastX) content.direction = event.clientX > content.lastX ? 'right' : 'left';
        content.lastX = event.clientX;
      }),
      onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, event => {
        if (!composedContains(event.currentTarget as HTMLElement, event.relatedTarget as Node)) { clearTimeout(searchTimer); content.search = ''; }
      }),
      onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
        const target = event.target as HTMLElement;
        if (target.closest('[role="menu"]') !== event.currentTarget) return;
        if (event.key === 'Tab') event.preventDefault();
        if (sub && event.key === (root.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft')) { menu.change(false); focus(menu.trigger()); event.preventDefault(); return; }
        if (!event.ctrlKey && !event.altKey && !event.metaKey && event.key.length === 1) {
          content.search += event.key; clearTimeout(searchTimer); searchTimer = setTimeout(() => { content.search = ''; }, 1000);
          const items = collection.items().filter(item => !item.value.disabled());
          const current = items.findIndex(item => item.node === activeElement(target.ownerDocument));
          const search = [...content.search].every(character => character === content.search[0]) ? content.search[0]! : content.search;
          const ordered = [...items.slice(current + 1), ...items.slice(0, current + 1)];
          const match = ordered.find(item => item.value.text().toLowerCase().startsWith(search.toLowerCase()));
          focus(match?.node, false, false);
        }
        if (event.target === event.currentTarget && ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
          event.preventDefault();
          const items = collection.items().filter(item => !item.value.disabled());
          focus(['ArrowUp', 'End', 'PageDown'].includes(event.key) ? items.at(-1)?.node : items[0]?.node, false, false);
        }
      })
    }) as PopperContentProps;
    return <ContentProvider scope={scope} value={content}><LayerContext value={layer}>
      <RovingFocusGroup {...useRovingScope(scope)} orientation="vertical" dir={root.dir()} loop={props.loop ?? false} preventScrollOnEntryFocus onEntryFocus={event => {
        props.onEntryFocus?.(event); if (!root.keyboard) event.preventDefault();
      }} asChild>{target => target(PopperContent, forwarded)}</RovingFocusGroup>
    </LayerContext></ContentProvider>;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}
export function MenuGroup(props: MenuGroupProps): Element { return <Primitive as="div" {...merge({ role: 'group' as const }, omit(props, '__scopeMenu'))} />; }
export function MenuLabel(props: MenuLabelProps): Element { return <Primitive as="div" {...omit(props, '__scopeMenu')} />; }
function ItemImpl(props: MenuItemProps, sub = false): Element {
  const scope = untrack(() => props.__scopeMenu), content = useContent('MenuItem', scope), root = useRoot('MenuItem', scope);
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const [highlighted, setHighlighted] = createSignal(false);
  if (!isServer) createEffect(node, element => element ? content.collection.register(element, { disabled: () => props.disabled ?? false, text: () => props.textValue ?? element.textContent?.trim() ?? '' }) : undefined, { transparent: true });
  const forwarded = merge({ role: 'menuitem' as const }, omit(props, '__scopeMenu', 'disabled', 'textValue', 'onSelect'), {
    get ref() { return composeRefs(props.ref, ref); }, get ['aria-disabled']() { return props.disabled ? 'true' : undefined; },
    get ['data-disabled']() { return props.disabled ? '' : undefined; }, get ['data-highlighted']() { return highlighted() ? '' : undefined; },
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, () => setHighlighted(true)),
    onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, () => setHighlighted(false)),
    onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, event => {
      if (event.pointerType !== 'mouse') return;
      if (props.disabled) content.leave(event); else if (content.enter(event)) focus(event.currentTarget as HTMLElement);
    }),
    onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, event => { if (event.pointerType === 'mouse') content.leave(event); }),
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => { root.pointerDown = event.currentTarget as HTMLElement; }),
    onPointerUp: composeEventHandlers<PointerEvent>(() => props.onPointerUp, event => {
      const sameItem = root.pointerDown === event.currentTarget;
      root.pointerDown = undefined;
      if (!sameItem) (event.currentTarget as HTMLElement).click();
    }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, event => {
      if (props.disabled || sub) return;
      const element = event.currentTarget as HTMLElement;
      const selection = new element.ownerDocument.defaultView!.CustomEvent('menu.itemSelect', { bubbles: true, cancelable: true });
      dispatchCancelableEvent(element, selection, props.onSelect);
      if (!selection.defaultPrevented) root.close();
    }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (props.disabled || event.target !== event.currentTarget || event.key === ' ' && content.search) return;
      if (!sub && ['Enter', ' '].includes(event.key)) { (event.currentTarget as HTMLElement).click(); event.preventDefault(); }
    })
  }) as PrimitiveProps<'div'>;
  return <RovingFocusGroupItem {...useRovingScope(scope)} focusable={!props.disabled} asChild>{target => target(Primitive, merge({ as: 'div' as const }, forwarded))}</RovingFocusGroupItem>;
}
export function MenuItem(props: MenuItemProps): Element { return ItemImpl(props); }
const checkedState = (checked: boolean | 'indeterminate' | undefined) => checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked';
export function MenuCheckboxItem(props: MenuCheckboxItemProps): Element {
  return <IndicatorProvider scope={props.__scopeMenu} value={{ checked: () => props.checked ?? false }}><MenuItem {...merge(omit(props, 'checked', 'onCheckedChange'), {
    role: 'menuitemcheckbox' as const, get ['aria-checked']() { return props.checked === 'indeterminate' ? 'mixed' as const : props.checked ? 'true' as const : 'false' as const; },
    get ['data-state']() { return checkedState(props.checked); },
    onSelect(event: Event) { props.onSelect?.(event); props.onCheckedChange?.(props.checked === 'indeterminate' || !props.checked); }
  })} /></IndicatorProvider>;
}
export function MenuRadioGroup(props: MenuRadioGroupProps): Element {
  return <RadioProvider scope={props.__scopeMenu} value={{ value: () => props.value, change: value => props.onValueChange?.(value) }}><MenuGroup {...omit(props, 'value', 'onValueChange')} /></RadioProvider>;
}
export function MenuRadioItem(props: MenuRadioItemProps): Element {
  const radio = useRadio('MenuRadioItem', untrack(() => props.__scopeMenu));
  const checked = () => radio.value() === props.value;
  return <IndicatorProvider scope={props.__scopeMenu} value={{ checked }}><MenuItem {...merge(omit(props, 'value'), {
    role: 'menuitemradio' as const, get ['aria-checked']() { return checked() ? 'true' as const : 'false' as const; }, get ['data-state']() { return checkedState(checked()); },
    onSelect(event: Event) { props.onSelect?.(event); radio.change(props.value); }
  })} /></IndicatorProvider>;
}
export function MenuItemIndicator(props: MenuItemIndicatorProps): Element {
  const indicator = useIndicator('MenuItemIndicator', untrack(() => props.__scopeMenu));
  const presence = createPresence(() => indicator.checked() !== false, () => props.forceMount ?? false);
  function Mounted(): Element {
    if (!isServer) onCleanup(() => presence.ref(undefined));
    return <Primitive as="span" {...merge({ 'aria-hidden': 'true' as const }, omit(props, '__scopeMenu', 'forceMount'), {
    get ref() { return composeRefs(props.ref, presence.ref); }, get ['data-state']() { return checkedState(indicator.checked()); }
    })} />;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}
export function MenuSeparator(props: MenuSeparatorProps): Element { return <Primitive as="div" {...merge({ role: 'separator' as const, 'aria-orientation': 'horizontal' as const }, omit(props, '__scopeMenu'))} />; }
export function MenuArrow(props: MenuArrowProps): Element { return <PopperArrow {...merge(omit(props, '__scopeMenu'), { get __scopePopper() { return props.__scopeMenu; } })} />; }
export function MenuSub(props: MenuSubProps): Element {
  const scope = untrack(() => props.__scopeMenu), parent = useMenu('MenuSub', scope), content = useContent('MenuSub', scope);
  const [open, change] = createControllableState({ value: () => props.open, get defaultValue() { return props.defaultOpen ?? false; }, get onChange() { return props.onOpenChange; } });
  const value = menuValue(open, change);
  if (!isServer) createEffect(parent.open, active => { if (!active) change(false); }, { transparent: true });
  if (!isServer) onCleanup(() => change(false));
  return <Popper __scopePopper={props.__scopeMenu}><SubProvider scope={props.__scopeMenu} value={{ parent, content }}><MenuProvider scope={props.__scopeMenu} value={value}>{props.children}</MenuProvider></SubProvider></Popper>;
}
export function MenuSubTrigger(props: MenuSubTriggerProps): Element {
  const scope = untrack(() => props.__scopeMenu), menu = useMenu('MenuSubTrigger', scope), sub = useSub('MenuSubTrigger', scope), root = useRoot('MenuSubTrigger', scope);
  const popper = usePopper(scope);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => { clearTimeout(timer); clearTimeout(sub.content.graceTimer); sub.content.grace = undefined; });
  if (!isServer) createEffect(menu.trigger, element => {
    popper.setAnchor(element);
    return () => { if (untrack(popper.anchor) === element) popper.setAnchor(undefined); };
  }, { transparent: true });
  const forwarded = merge(omit(props, '__scopeMenu'), {
    __scopeMenu: scope, id: menu.triggerId, 'aria-haspopup': 'menu' as const,
    get ['aria-expanded']() { return menu.open() ? 'true' as const : 'false' as const; }, get ['aria-controls']() { return menu.contentId; },
    get ['data-state']() { return menu.open() ? 'open' : 'closed'; }, get ref() { return composeRefs(props.ref, menu.setTrigger); },
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, event => { if (!props.disabled) { focus(event.currentTarget as HTMLElement); menu.change(true); } }),
    onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, event => {
      if (event.pointerType !== 'mouse' || props.disabled || !sub.content.enter(event)) return;
      clearTimeout(sub.content.graceTimer); sub.content.grace = undefined;
      if (!menu.open() && timer === undefined) timer = setTimeout(() => { timer = undefined; if (!props.disabled) menu.change(true); }, 100);
    }),
    onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, event => {
      clearTimeout(timer); timer = undefined;
      const child = menu.content(), trigger = menu.trigger();
      if (event.pointerType !== 'mouse' || !child || !trigger) return;
      const side = child.dataset.side === 'left' ? 'left' : 'right';
      sub.content.grace = { polygon: pointerGrace(event, trigger, child), side };
      clearTimeout(sub.content.graceTimer); sub.content.graceTimer = setTimeout(() => { sub.content.grace = undefined; }, 300);
    }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (event.target !== event.currentTarget || props.disabled || event.key === ' ' && sub.content.search) return;
      if (['Enter', ' ', root.dir() === 'rtl' ? 'ArrowLeft' : 'ArrowRight'].includes(event.key)) { root.keyboard = true; menu.change(true); focus(menu.content()); event.preventDefault(); }
    })
  }) as MenuItemProps;
  return ItemImpl(forwarded, true);
}
export { createMenuScope, useMenu, useRoot as useMenuRoot, Menu as Root, MenuAnchor as Anchor, MenuPortal as Portal, MenuContent as Content, MenuGroup as Group, MenuLabel as Label, MenuItem as Item, MenuCheckboxItem as CheckboxItem, MenuRadioGroup as RadioGroup, MenuRadioItem as RadioItem, MenuItemIndicator as ItemIndicator, MenuSeparator as Separator, MenuArrow as Arrow, MenuSub as Sub, MenuSubTrigger as SubTrigger, MenuSubContent as SubContent };
