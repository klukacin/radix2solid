// Native port of Radix Menubar; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, createUniqueId, merge, omit, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { createCollection } from '../internal/collection.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeEventHandlers, callEventHandler } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { composedContains, focus } from '../internal/focus-scope.js';
import { RovingFocusGroup, RovingFocusGroupItem, createRovingFocusGroupScope } from '../internal/roving-focus.js';
import { useDirection, type Direction } from '../direction/direction.js';
import { mergeStyles, type SlotRender } from '../slot/slot.js';
import * as MenuPrimitive from '../menu/menu.js';

type Scoped = { __scopeMenubar?: Scope };
export type MenubarProps = Scoped & PrimitiveProps<'div'> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; dir?: Direction; loop?: boolean };
export type MenubarMenuProps = Scoped & { children?: Element; value?: string };
export type MenubarTriggerProps = Scoped & PrimitiveProps<'button'> & { disabled?: boolean };
export type MenubarPortalProps = Scoped & MenuPrimitive.MenuPortalProps;
export type MenubarContentProps = Scoped & MenuPrimitive.MenuContentProps;
export type MenubarGroupProps = Scoped & MenuPrimitive.MenuGroupProps;
export type MenubarLabelProps = Scoped & MenuPrimitive.MenuLabelProps;
export type MenubarItemProps = Scoped & MenuPrimitive.MenuItemProps;
export type MenubarCheckboxItemProps = Scoped & MenuPrimitive.MenuCheckboxItemProps;
export type MenubarRadioGroupProps = Scoped & MenuPrimitive.MenuRadioGroupProps;
export type MenubarRadioItemProps = Scoped & MenuPrimitive.MenuRadioItemProps;
export type MenubarItemIndicatorProps = Scoped & MenuPrimitive.MenuItemIndicatorProps;
export type MenubarSeparatorProps = Scoped & MenuPrimitive.MenuSeparatorProps;
export type MenubarArrowProps = Scoped & MenuPrimitive.MenuArrowProps;
export type MenubarSubProps = Scoped & MenuPrimitive.MenuSubProps;
export type MenubarSubTriggerProps = Scoped & MenuPrimitive.MenuSubTriggerProps;
export type MenubarSubContentProps = Scoped & MenuPrimitive.MenuSubContentProps;
interface BarValue {
  value: () => string; change: (value: string | ((previous: string) => string)) => void; open: (value: string) => void;
  dir: () => Direction; loop: () => boolean; collection: ReturnType<typeof createCollection<{ value: () => string; disabled: () => boolean }>>;
}
interface MenuValue { value: () => string; trigger: () => HTMLElement | undefined; setTrigger: (node: HTMLElement | undefined) => void; triggerId: string; contentId: string; keyboard: boolean }
const [createMenubarContext, createMenubarScope] = createContextScope('Menubar', [MenuPrimitive.createMenuScope, createRovingFocusGroupScope]);
const useMenuScope = MenuPrimitive.createMenuScope(), useRovingScope = createRovingFocusGroupScope();
const [BarProvider, useBar] = createMenubarContext<BarValue>('Menubar');
const [MenuProvider, useMenu] = createMenubarContext<MenuValue>('MenubarMenu');
function menuProps<P extends Scoped>(props: P): P & { __scopeMenu?: Scope } {
  return merge(omit(props, '__scopeMenubar'), { __scopeMenu: useMenuScope(untrack(() => props.__scopeMenubar)).__scopeMenu }) as P & { __scopeMenu?: Scope };
}
function contentStyle(style: MenubarContentProps['style']) { return mergeStyles({
  '--radix-menubar-content-transform-origin': 'var(--radix-popper-transform-origin)', '--radix-menubar-content-available-width': 'var(--radix-popper-available-width)',
  '--radix-menubar-content-available-height': 'var(--radix-popper-available-height)', '--radix-menubar-trigger-width': 'var(--radix-popper-anchor-width)', '--radix-menubar-trigger-height': 'var(--radix-popper-anchor-height)'
}, style); }
export function Menubar(props: MenubarProps): Element {
  const scope = untrack(() => props.__scopeMenubar);
  const [value, change] = createControllableState({ value: () => props.value, get defaultValue() { return props.defaultValue ?? ''; }, get onChange() { return props.onValueChange; } });
  const [current, setCurrent] = createSignal<string | null>(null);
  const dir = useDirection(() => props.dir);
  const collection = createCollection<{ value: () => string; disabled: () => boolean }>();
  const bar: BarValue = { value, change, dir, loop: () => props.loop ?? true, collection, open(value) { change(value); setCurrent(value); } };
  return <BarProvider scope={scope} value={bar}><RovingFocusGroup {...useRovingScope(scope)} orientation="horizontal" dir={dir()} loop={props.loop ?? true} currentTabStopId={current()} onCurrentTabStopIdChange={setCurrent} asChild>
    {target => target(Primitive, merge({ as: 'div' as const, role: 'menubar' as const }, omit(props, '__scopeMenubar', 'value', 'defaultValue', 'onValueChange', 'loop'), { get dir() { return dir(); } }))}
  </RovingFocusGroup></BarProvider>;
}
export function MenubarMenu(props: MenubarMenuProps): Element {
  const scope = untrack(() => props.__scopeMenubar), bar = useBar('MenubarMenu', scope);
  const generated = createUniqueId(), value = () => props.value || generated;
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>();
  const menu: MenuValue = { value, trigger, setTrigger, triggerId: createUniqueId(), contentId: createUniqueId(), keyboard: false };
  if (!isServer) createEffect(() => bar.value() === value(), open => { if (!open) menu.keyboard = false; }, { transparent: true });
  return <MenuProvider scope={scope} value={menu}><MenuPrimitive.Root {...useMenuScope(scope)} open={bar.value() === value()} onOpenChange={open => { if (!open && bar.value() === value()) bar.change(''); }} dir={bar.dir()} modal={false}>{props.children}</MenuPrimitive.Root></MenuProvider>;
}
export function MenubarTrigger(props: MenubarTriggerProps): Element {
  const scope = untrack(() => props.__scopeMenubar), bar = useBar('MenubarTrigger', scope), menu = useMenu('MenubarTrigger', scope);
  const root = MenuPrimitive.useMenuRoot('MenubarTrigger', useMenuScope(scope).__scopeMenu);
  const [highlighted, setHighlighted] = createSignal(false);
  const open = () => bar.value() === menu.value();
  if (!isServer) createEffect(menu.trigger, node => node ? bar.collection.register(node, { value: menu.value, disabled: () => props.disabled ?? false }) : undefined, { transparent: true });
  const forwarded = merge({ as: 'button' as const, type: 'button' as const, role: 'menuitem' as const, id: menu.triggerId, 'aria-haspopup': 'menu' as const }, omit(props, '__scopeMenubar'), {
    get ref() { return composeRefs(props.ref, menu.setTrigger); }, get ['aria-expanded']() { return open() ? 'true' as const : 'false' as const; },
    get ['aria-controls']() { return open() ? menu.contentId : undefined; }, get ['data-state']() { return open() ? 'open' : 'closed'; },
    get ['data-disabled']() { return props.disabled ? '' : undefined; }, get ['data-highlighted']() { return highlighted() ? '' : undefined; },
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, () => setHighlighted(true)),
    onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, () => setHighlighted(false)),
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => {
      if (!props.disabled && event.button === 0 && !event.ctrlKey) { root.keyboard = false; const wasOpen = open(); bar.open(menu.value()); if (!wasOpen) event.preventDefault(); }
    }),
    onPointerEnter: composeEventHandlers<PointerEvent>(() => props.onPointerEnter, () => { if (!props.disabled && bar.value() && !open()) { root.keyboard = false; bar.open(menu.value()); focus(menu.trigger()); } }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (props.disabled) return;
      if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
        menu.keyboard = true; root.keyboard = true;
        if (event.key === 'ArrowDown') bar.open(menu.value()); else { bar.change(previous => previous === menu.value() ? '' : menu.value()); }
        event.preventDefault();
      }
    })
  });
  return <RovingFocusGroupItem {...useRovingScope(scope)} tabStopId={menu.value()} focusable={!props.disabled} asChild>{target => target(MenuPrimitive.Anchor, merge(useMenuScope(scope), { asChild: true as const, children: (anchor: Parameters<SlotRender>[0]) => anchor(Primitive, forwarded) }))}</RovingFocusGroupItem>;
}
function switchMenu(bar: BarValue, menu: MenuValue, event: KeyboardEvent, sub: boolean) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const target = event.target as HTMLElement;
  const previous = event.key === (bar.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
  if (!previous && target.hasAttribute('data-radix-menubar-subtrigger') || previous && (sub || target.closest('[data-radix-menubar-content]') !== event.currentTarget)) return;
  const items = bar.collection.items().filter(item => !item.value.disabled());
  const index = items.findIndex(item => item.value.value() === menu.value());
  let next = index + (previous ? -1 : 1);
  if (bar.loop() && items.length) next = (next + items.length) % items.length;
  if (items[next]) bar.open(items[next]!.value.value());
}
export function MenubarContent(props: MenubarContentProps): Element {
  const scope = untrack(() => props.__scopeMenubar), bar = useBar('MenubarContent', scope), menu = useMenu('MenubarContent', scope);
  let interacted = false;
  return <MenuPrimitive.Content {...merge({ id: menu.contentId, 'aria-labelledby': menu.triggerId, 'data-radix-menubar-content': '', align: 'start' as const }, menuProps(props), {
    onCloseAutoFocus(event: Event) { props.onCloseAutoFocus?.(event); if (!event.defaultPrevented) { if (!bar.value() && !interacted) focus(menu.trigger()); event.preventDefault(); } interacted = false; },
    onFocusOutside(event: Parameters<NonNullable<MenuPrimitive.MenuContentProps['onFocusOutside']>>[0]) {
      props.onFocusOutside?.(event); if (!event.defaultPrevented && bar.collection.items().some(item => composedContains(item.node, event.target as Node))) event.preventDefault();
    },
    onInteractOutside(event: Parameters<NonNullable<MenuPrimitive.MenuContentProps['onInteractOutside']>>[0]) { props.onInteractOutside?.(event); if (!event.defaultPrevented) interacted = true; },
    onEntryFocus(event: Event) { props.onEntryFocus?.(event); if (!menu.keyboard) event.preventDefault(); },
    onKeyDown(event: KeyboardEvent) { callEventHandler(props.onKeyDown, event); switchMenu(bar, menu, event, false); },
    get style() { return contentStyle(props.style); }
  })} />;
}
export function MenubarPortal(props: MenubarPortalProps): Element { return <MenuPrimitive.Portal {...menuProps(props)} />; }
export function MenubarGroup(props: MenubarGroupProps): Element { return <MenuPrimitive.Group {...menuProps(props)} />; }
export function MenubarLabel(props: MenubarLabelProps): Element { return <MenuPrimitive.Label {...menuProps(props)} />; }
export function MenubarItem(props: MenubarItemProps): Element { return <MenuPrimitive.Item {...menuProps(props)} />; }
export function MenubarCheckboxItem(props: MenubarCheckboxItemProps): Element { return <MenuPrimitive.CheckboxItem {...menuProps(props)} />; }
export function MenubarRadioGroup(props: MenubarRadioGroupProps): Element { return <MenuPrimitive.RadioGroup {...menuProps(props)} />; }
export function MenubarRadioItem(props: MenubarRadioItemProps): Element { return <MenuPrimitive.RadioItem {...menuProps(props)} />; }
export function MenubarItemIndicator(props: MenubarItemIndicatorProps): Element { return <MenuPrimitive.ItemIndicator {...menuProps(props)} />; }
export function MenubarSeparator(props: MenubarSeparatorProps): Element { return <MenuPrimitive.Separator {...menuProps(props)} />; }
export function MenubarArrow(props: MenubarArrowProps): Element { return <MenuPrimitive.Arrow {...menuProps(props)} />; }
export function MenubarSub(props: MenubarSubProps): Element { return <MenuPrimitive.Sub {...menuProps(props)} />; }
export function MenubarSubTrigger(props: MenubarSubTriggerProps): Element { return <MenuPrimitive.SubTrigger {...merge({ 'data-radix-menubar-subtrigger': '' }, menuProps(props))} />; }
export function MenubarSubContent(props: MenubarSubContentProps): Element {
  const scope = untrack(() => props.__scopeMenubar), bar = useBar('MenubarSubContent', scope), menu = useMenu('MenubarSubContent', scope);
  return <MenuPrimitive.SubContent {...merge({ 'data-radix-menubar-content': '' }, menuProps(props), {
    onKeyDown(event: KeyboardEvent) { callEventHandler(props.onKeyDown, event); switchMenu(bar, menu, event, true); },
    get style() { return contentStyle(props.style); }
  })} />;
}
export { createMenubarScope, Menubar as Root, MenubarMenu as Menu, MenubarTrigger as Trigger, MenubarPortal as Portal, MenubarContent as Content, MenubarGroup as Group, MenubarLabel as Label, MenubarItem as Item, MenubarCheckboxItem as CheckboxItem, MenubarRadioGroup as RadioGroup, MenubarRadioItem as RadioItem, MenubarItemIndicator as ItemIndicator, MenubarSeparator as Separator, MenubarArrow as Arrow, MenubarSub as Sub, MenubarSubTrigger as SubTrigger, MenubarSubContent as SubContent };
