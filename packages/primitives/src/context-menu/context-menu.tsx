// Native port of Radix ContextMenu; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createMemo, createSignal, merge, omit, onCleanup, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeEventHandlers } from '../internal/events.js';
import { focus } from '../internal/focus-scope.js';
import { mergeStyles } from '../slot/slot.js';
import * as Menu from '../menu/menu.js';
import type { Direction } from '../direction/direction.js';

type Scoped = { __scopeContextMenu?: Scope };
export type ContextMenuProps = Scoped & { children?: Element; open?: boolean; onOpenChange?: (open: boolean) => void; dir?: Direction; modal?: boolean };
export type ContextMenuTriggerProps = Scoped & PrimitiveProps<'span'> & { disabled?: boolean };
export type ContextMenuPortalProps = Scoped & Menu.MenuPortalProps;
export type ContextMenuContentProps = Scoped & Menu.MenuContentProps;
export type ContextMenuGroupProps = Scoped & Menu.MenuGroupProps;
export type ContextMenuLabelProps = Scoped & Menu.MenuLabelProps;
export type ContextMenuItemProps = Scoped & Menu.MenuItemProps;
export type ContextMenuCheckboxItemProps = Scoped & Menu.MenuCheckboxItemProps;
export type ContextMenuRadioGroupProps = Scoped & Menu.MenuRadioGroupProps;
export type ContextMenuRadioItemProps = Scoped & Menu.MenuRadioItemProps;
export type ContextMenuItemIndicatorProps = Scoped & Menu.MenuItemIndicatorProps;
export type ContextMenuSeparatorProps = Scoped & Menu.MenuSeparatorProps;
export type ContextMenuArrowProps = Scoped & Menu.MenuArrowProps;
export type ContextMenuSubProps = Scoped & Menu.MenuSubProps;
export type ContextMenuSubTriggerProps = Scoped & Menu.MenuSubTriggerProps;
export type ContextMenuSubContentProps = Scoped & Menu.MenuSubContentProps;
const [createContextMenuContext, createContextMenuScope] = createContextScope('ContextMenu', [Menu.createMenuScope]);
const useMenuScope = Menu.createMenuScope();
const [Provider, useContextMenu] = createContextMenuContext<{ open: () => boolean; change: (open: boolean) => void; modal: () => boolean }>('ContextMenu');
function menuProps<P extends Scoped>(props: P): P & { __scopeMenu?: Scope } {
  return merge(omit(props, '__scopeContextMenu'), { __scopeMenu: useMenuScope(untrack(() => props.__scopeContextMenu)).__scopeMenu }) as P & { __scopeMenu?: Scope };
}
function contentStyle(style: ContextMenuContentProps['style']) { return mergeStyles({
  '--radix-context-menu-content-transform-origin': 'var(--radix-popper-transform-origin)', '--radix-context-menu-content-available-width': 'var(--radix-popper-available-width)',
  '--radix-context-menu-content-available-height': 'var(--radix-popper-available-height)', '--radix-context-menu-trigger-width': 'var(--radix-popper-anchor-width)', '--radix-context-menu-trigger-height': 'var(--radix-popper-anchor-height)'
}, style); }
export function ContextMenu(props: ContextMenuProps): Element {
  const [open, change] = createControllableState({ value: () => props.open, defaultValue: false, get onChange() { return props.onOpenChange; } });
  return <Provider scope={props.__scopeContextMenu} value={{ open, change, modal: () => props.modal ?? true }}>
    <Menu.Root {...useMenuScope(props.__scopeContextMenu)} open={open()} onOpenChange={change} dir={props.dir} modal={props.modal}>{props.children}</Menu.Root>
  </Provider>;
}
export function ContextMenuTrigger(props: ContextMenuTriggerProps): Element {
  const scope = untrack(() => props.__scopeContextMenu), context = useContextMenu('ContextMenuTrigger', scope), menuScope = useMenuScope(scope);
  const root = Menu.useMenuRoot('ContextMenuTrigger', menuScope.__scopeMenu);
  const menu = Menu.useMenu('ContextMenuTrigger', menuScope.__scopeMenu);
  const [point, setPoint] = createSignal({ x: 0, y: 0 });
  const [positioned, setPositioned] = createSignal(false);
  const virtual = createMemo(() => {
    const { x, y } = point();
    return { getBoundingClientRect: () => ({ x, y, left: x, right: x, top: y, bottom: y, width: 0, height: 0, toJSON: () => ({ x, y, width: 0, height: 0 }) }) };
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { clearTimeout(timer); timer = undefined; };
  onCleanup(clear);
  if (!isServer) {
    createEffect(() => props.disabled, disabled => { if (disabled) clear(); }, { transparent: true });
    if (import.meta.env.DEV) createEffect(() => context.open() && !positioned(), missingPoint => {
      if (missingPoint) console.warn('ContextMenu controlled open precedes a trigger position; content is anchored at (0, 0).');
    }, { transparent: true });
  }
  const open = (event: MouseEvent | PointerEvent) => {
    clear(); setPoint({ x: event.clientX, y: event.clientY }); setPositioned(true); root.keyboard = false; context.change(true);
    if (context.open()) focus(menu.content());
  };
  return <><Menu.Anchor {...menuScope} virtualRef={{ get current() { return virtual(); } }} /><Primitive as="span" {...merge(omit(props, '__scopeContextMenu', 'disabled'), {
    get ['data-state']() { return context.open() ? 'open' : 'closed'; }, get ['data-disabled']() { return props.disabled ? '' : undefined; },
    get style() { return mergeStyles({ '-webkit-touch-callout': 'none' }, props.style); },
    onContextMenu: composeEventHandlers<MouseEvent>(() => props.onContextMenu, event => { if (!props.disabled) { open(event); event.preventDefault(); } }),
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => {
      if (!props.disabled && (event.pointerType === 'touch' || event.pointerType === 'pen')) { clear(); timer = setTimeout(() => { timer = undefined; if (!props.disabled) open(event); }, 700); }
    }),
    onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, clear),
    onPointerCancel: composeEventHandlers<PointerEvent>(() => props.onPointerCancel, clear),
    onPointerUp: composeEventHandlers<PointerEvent>(() => props.onPointerUp, clear)
  })} /></>;
}
export function ContextMenuContent(props: ContextMenuContentProps): Element {
  const context = useContextMenu('ContextMenuContent', untrack(() => props.__scopeContextMenu));
  let interacted = false;
  return <Menu.Content {...merge({ side: 'right' as const, sideOffset: 2, align: 'start' as const }, menuProps(props), {
    onCloseAutoFocus(event: Event) { props.onCloseAutoFocus?.(event); if (!event.defaultPrevented && interacted) event.preventDefault(); interacted = false; },
    onInteractOutside(event: Parameters<NonNullable<Menu.MenuContentProps['onInteractOutside']>>[0]) {
      props.onInteractOutside?.(event); if (!event.defaultPrevented && !context.modal()) interacted = true;
    },
    get style() { return contentStyle(props.style); }
  })} />;
}
export function ContextMenuPortal(props: ContextMenuPortalProps): Element { return <Menu.Portal {...menuProps(props)} />; }
export function ContextMenuGroup(props: ContextMenuGroupProps): Element { return <Menu.Group {...menuProps(props)} />; }
export function ContextMenuLabel(props: ContextMenuLabelProps): Element { return <Menu.Label {...menuProps(props)} />; }
export function ContextMenuItem(props: ContextMenuItemProps): Element { return <Menu.Item {...menuProps(props)} />; }
export function ContextMenuCheckboxItem(props: ContextMenuCheckboxItemProps): Element { return <Menu.CheckboxItem {...menuProps(props)} />; }
export function ContextMenuRadioGroup(props: ContextMenuRadioGroupProps): Element { return <Menu.RadioGroup {...menuProps(props)} />; }
export function ContextMenuRadioItem(props: ContextMenuRadioItemProps): Element { return <Menu.RadioItem {...menuProps(props)} />; }
export function ContextMenuItemIndicator(props: ContextMenuItemIndicatorProps): Element { return <Menu.ItemIndicator {...menuProps(props)} />; }
export function ContextMenuSeparator(props: ContextMenuSeparatorProps): Element { return <Menu.Separator {...menuProps(props)} />; }
export function ContextMenuArrow(props: ContextMenuArrowProps): Element { return <Menu.Arrow {...menuProps(props)} />; }
export function ContextMenuSub(props: ContextMenuSubProps): Element { return <Menu.Sub {...menuProps(props)} />; }
export function ContextMenuSubTrigger(props: ContextMenuSubTriggerProps): Element { return <Menu.SubTrigger {...menuProps(props)} />; }
export function ContextMenuSubContent(props: ContextMenuSubContentProps): Element { return <Menu.SubContent {...merge(menuProps(props), { get style() { return contentStyle(props.style); } })} />; }
export { createContextMenuScope, ContextMenu as Root, ContextMenuTrigger as Trigger, ContextMenuPortal as Portal, ContextMenuContent as Content, ContextMenuGroup as Group, ContextMenuLabel as Label, ContextMenuItem as Item, ContextMenuCheckboxItem as CheckboxItem, ContextMenuRadioGroup as RadioGroup, ContextMenuRadioItem as RadioItem, ContextMenuItemIndicator as ItemIndicator, ContextMenuSeparator as Separator, ContextMenuArrow as Arrow, ContextMenuSub as Sub, ContextMenuSubTrigger as SubTrigger, ContextMenuSubContent as SubContent };
