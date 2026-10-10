import { createContext, merge, omit, Show, untrack, useContext, type Element } from 'solid-js';
import * as Native from '@radix-solid/primitives/context-menu';
import { Slottable, type SlotRender } from '@radix-solid/primitives/slot';
import { Theme, useThemeContext } from './theme.js';
import { ScrollArea } from './scroll-area.js';
import { ThickCheckIcon, ThickChevronRightIcon } from './icons.js';
import { extractProps } from '../helpers/extract-props.js';
import { createMenuAlignOffset } from './_internal/menu-align-offset.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { contextMenuContentPropDefs, contextMenuItemPropDefs, contextMenuCheckboxItemPropDefs, contextMenuRadioItemPropDefs } from './context-menu.props.js';

type ContentSettings = GetPropDefTypes<typeof contextMenuContentPropDefs>;
const ContentContext = createContext<ContentSettings>({});
type ContextMenuRootProps = Native.ContextMenuProps;
type ContextMenuTriggerProps = Omit<Native.ContextMenuTriggerProps, RemovedProps | 'children'> & { children: SlotRender };
type ContextMenuContentProps = Omit<Extract<Native.ContextMenuContentProps, { asChild?: false }>, RemovedProps> & ContentSettings & { container?: Native.ContextMenuPortalProps['container'] };
type ContextMenuItemProps = ComposedProps<Omit<Native.ContextMenuItemProps, RemovedProps> & GetPropDefTypes<typeof contextMenuItemPropDefs>>;
type ContextMenuLabelProps = Omit<Extract<Native.ContextMenuLabelProps, { asChild?: false }>, RemovedProps>;
type ContextMenuGroupProps = Omit<Extract<Native.ContextMenuGroupProps, { asChild?: false }>, RemovedProps>;
type ContextMenuRadioGroupProps = Omit<Extract<Native.ContextMenuRadioGroupProps, { asChild?: false }>, RemovedProps>;
type ContextMenuRadioItemProps = Omit<Extract<Native.ContextMenuRadioItemProps, { asChild?: false }>, RemovedProps> & GetPropDefTypes<typeof contextMenuRadioItemPropDefs>;
type ContextMenuCheckboxItemProps = Omit<Extract<Native.ContextMenuCheckboxItemProps, { asChild?: false }>, RemovedProps> & GetPropDefTypes<typeof contextMenuCheckboxItemPropDefs>;
type ContextMenuSubProps = Native.ContextMenuSubProps;
type ContextMenuSubTriggerProps = Omit<Extract<Native.ContextMenuSubTriggerProps, { asChild?: false }>, RemovedProps>;
type ContextMenuSubContentProps = Omit<Extract<Native.ContextMenuSubContentProps, { asChild?: false }>, RemovedProps> & { container?: Native.ContextMenuPortalProps['container'] };
type ContextMenuSeparatorProps = Omit<Extract<Native.ContextMenuSeparatorProps, { asChild?: false }>, RemovedProps>;
function ContextMenuRoot(props: ContextMenuRootProps): Element { return <Native.Root {...props} />; }
function ContextMenuTrigger(props: ContextMenuTriggerProps): Element { return <Native.Trigger {...props} asChild />; }
function ContextMenuSub(props: ContextMenuSubProps): Element { return <Native.Sub {...props} />; }
function ContextMenuContent(props: ContextMenuContentProps): Element {
  const theme = useThemeContext(), parsed = extractProps(props, contextMenuContentPropDefs);
  const settings: ContentSettings = {
    get size() { return props.size ?? contextMenuContentPropDefs.size.default; },
    get variant() { return props.variant ?? contextMenuContentPropDefs.variant.default; },
    get highContrast() { return props.highContrast ?? contextMenuContentPropDefs.highContrast.default; },
    get color() { return parsed.color || theme.accentColor; }
  };
  const alignment = createMenuAlignOffset(() => parsed.class);
  const forwarded = merge({ get alignOffset() { return alignment.offset(); }, collisionPadding: 10 }, omit(parsed, 'children', 'class', 'color', 'container', 'forceMount'), {
    asChild: false as const, get ['data-accent-color']() { return settings.color; },
    get class() { return ['rt-PopperContent', 'rt-BaseMenuContent', 'rt-ContextMenuContent', parsed.class]; },
    get children() { return <ScrollArea type="auto"><alignment.Viewport class="rt-BaseMenuViewport rt-ContextMenuViewport"><ContentContext value={settings}>{props.children}</ContentContext></alignment.Viewport></ScrollArea>; }
  });
  return <Native.Portal container={props.container} forceMount={props.forceMount}><Theme asChild>{target => target(Native.Content, forwarded)}</Theme></Native.Portal>;
}
function ContextMenuSubContent(props: ContextMenuSubContentProps): Element {
  const settings = useContext(ContentContext), parsed = extractProps(merge(settings, props), contextMenuContentPropDefs);
  const alignment = createMenuAlignOffset(() => parsed.class);
  const forwarded = merge({ get alignOffset() { return alignment.offset(); }, sideOffset: 1, collisionPadding: 10 }, omit(parsed, 'children', 'class', 'color', 'container', 'forceMount'), {
    asChild: false as const, get ['data-accent-color']() { return settings.color; },
    get class() { return ['rt-PopperContent', 'rt-BaseMenuContent', 'rt-BaseMenuSubContent', 'rt-ContextMenuContent', 'rt-ContextMenuSubContent', parsed.class]; },
    get children() { return <ScrollArea type="auto"><alignment.Viewport class="rt-BaseMenuViewport rt-ContextMenuViewport">{props.children}</alignment.Viewport></ScrollArea>; }
  });
  return <Native.Portal container={props.container} forceMount={props.forceMount}><Theme asChild>{target => target(Native.SubContent, forwarded)}</Theme></Native.Portal>;
}
function ContextMenuItem(props: ContextMenuItemProps): Element {
  const shortcut = <Show when={props.shortcut}><div class="rt-BaseMenuShortcut rt-ContextMenuShortcut">{props.shortcut}</div></Show>;
  const child = untrack(() => props.asChild) ? Slottable({ child: untrack(() => props.children) as SlotRender, trailing: shortcut }) : undefined;
  const forwarded = merge(omit(props, 'class', 'children', 'color', 'shortcut'), {
    get ['data-accent-color']() { return props.color; }, get class() { return ['rt-reset', 'rt-BaseMenuItem', 'rt-ContextMenuItem', props.class]; },
    get children() { return child ?? <>{props.children as Element}{shortcut}</>; }
  }) as Native.ContextMenuItemProps;
  return <Native.Item {...forwarded} />;
}
function ContextMenuCheckboxItem(props: ContextMenuCheckboxItemProps): Element {
  return <Native.CheckboxItem {...merge(omit(props, 'class', 'children', 'color', 'shortcut'), { get ['data-accent-color']() { return props.color; }, get class() { return ['rt-BaseMenuItem', 'rt-BaseMenuCheckboxItem', 'rt-ContextMenuItem', 'rt-ContextMenuCheckboxItem', props.class]; } })} asChild={false}>
    {props.children}<Native.ItemIndicator class="rt-BaseMenuItemIndicator rt-ContextMenuItemIndicator"><ThickCheckIcon class="rt-BaseMenuItemIndicatorIcon rt-ContextMenuItemIndicatorIcon" /></Native.ItemIndicator>
    <Show when={props.shortcut}><div class="rt-BaseMenuShortcut rt-ContextMenuShortcut">{props.shortcut}</div></Show>
  </Native.CheckboxItem>;
}
function ContextMenuRadioItem(props: ContextMenuRadioItemProps): Element {
  return <Native.RadioItem {...merge(omit(props, 'class', 'children', 'color'), { get ['data-accent-color']() { return props.color; }, get class() { return ['rt-BaseMenuItem', 'rt-BaseMenuRadioItem', 'rt-ContextMenuItem', 'rt-ContextMenuRadioItem', props.class]; } })} asChild={false}>
    {props.children}<Native.ItemIndicator class="rt-BaseMenuItemIndicator rt-ContextMenuItemIndicator"><ThickCheckIcon class="rt-BaseMenuItemIndicatorIcon rt-ContextMenuItemIndicatorIcon" /></Native.ItemIndicator>
  </Native.RadioItem>;
}
function ContextMenuSubTrigger(props: ContextMenuSubTriggerProps): Element {
  return <Native.SubTrigger {...merge(omit(props, 'class', 'children'), { get class() { return ['rt-BaseMenuItem', 'rt-BaseMenuSubTrigger', 'rt-ContextMenuItem', 'rt-ContextMenuSubTrigger', props.class]; } })} asChild={false}>
    {props.children}<div class="rt-BaseMenuShortcut rt-ContextMenuShortcut"><ThickChevronRightIcon class="rt-BaseMenuSubTriggerIcon rt-ContextMenuSubtriggerIcon" /></div>
  </Native.SubTrigger>;
}
function ContextMenuLabel(props: ContextMenuLabelProps): Element { return <Native.Label {...merge(props, { get class() { return ['rt-BaseMenuLabel', 'rt-ContextMenuLabel', props.class]; } })} asChild={false} />; }
function ContextMenuGroup(props: ContextMenuGroupProps): Element { return <Native.Group {...merge(props, { get class() { return ['rt-BaseMenuGroup', 'rt-ContextMenuGroup', props.class]; } })} asChild={false} />; }
function ContextMenuRadioGroup(props: ContextMenuRadioGroupProps): Element { return <Native.RadioGroup {...merge(props, { get class() { return ['rt-BaseMenuRadioGroup', 'rt-ContextMenuRadioGroup', props.class]; } })} asChild={false} />; }
function ContextMenuSeparator(props: ContextMenuSeparatorProps): Element { return <Native.Separator {...merge(props, { get class() { return ['rt-BaseMenuSeparator', 'rt-ContextMenuSeparator', props.class]; } })} asChild={false} />; }
export { ContextMenuRoot as Root, ContextMenuTrigger as Trigger, ContextMenuContent as Content, ContextMenuItem as Item, ContextMenuLabel as Label, ContextMenuGroup as Group, ContextMenuRadioGroup as RadioGroup, ContextMenuRadioItem as RadioItem, ContextMenuCheckboxItem as CheckboxItem, ContextMenuSub as Sub, ContextMenuSubTrigger as SubTrigger, ContextMenuSubContent as SubContent, ContextMenuSeparator as Separator };
export type { ContextMenuRootProps as RootProps, ContextMenuTriggerProps as TriggerProps, ContextMenuContentProps as ContentProps, ContextMenuItemProps as ItemProps, ContextMenuLabelProps as LabelProps, ContextMenuGroupProps as GroupProps, ContextMenuRadioGroupProps as RadioGroupProps, ContextMenuRadioItemProps as RadioItemProps, ContextMenuCheckboxItemProps as CheckboxItemProps, ContextMenuSubProps as SubProps, ContextMenuSubTriggerProps as SubTriggerProps, ContextMenuSubContentProps as SubContentProps, ContextMenuSeparatorProps as SeparatorProps };
