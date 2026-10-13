import { createContext, merge, omit, useContext, type Element } from 'solid-js';
import * as Native from '@wsagency/radix2solid-primitives/select';
import * as ScrollArea from '@wsagency/radix2solid-primitives/scroll-area';
import { Theme, useThemeContext } from './theme.js';
import { ChevronDownIcon, ThickCheckIcon } from './icons.js';
import { extractProps } from '../helpers/extract-props.js';
import type { RemovedProps } from '../helpers/component-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { selectRootPropDefs, selectTriggerPropDefs, selectContentPropDefs } from './select.props.js';

type RootOwnProps = GetPropDefTypes<typeof selectRootPropDefs>;
const SelectContext = createContext<RootOwnProps>({});
type SelectRootProps = Native.SelectProps & RootOwnProps;
type SelectTriggerProps = Omit<Extract<Native.SelectTriggerProps, { asChild?: false }>, RemovedProps> & MarginProps & GetPropDefTypes<typeof selectTriggerPropDefs>;
type SelectContentProps = Omit<Extract<Native.SelectContentProps, { asChild?: false }>, RemovedProps> & GetPropDefTypes<typeof selectContentPropDefs> & { container?: Native.SelectPortalProps['container'] };
type SelectItemProps = Omit<Extract<Native.SelectItemProps, { asChild?: false }>, RemovedProps>;
type SelectGroupProps = Omit<Extract<Native.SelectGroupProps, { asChild?: false }>, RemovedProps>;
type SelectLabelProps = Omit<Extract<Native.SelectLabelProps, { asChild?: false }>, RemovedProps>;
type SelectSeparatorProps = Omit<Extract<Native.SelectSeparatorProps, { asChild?: false }>, RemovedProps>;

function SelectRoot(props: SelectRootProps): Element {
  const context: RootOwnProps = { get size() { return props.size ?? selectRootPropDefs.size.default; } };
  return <Native.Root {...omit(props, 'size', 'children')}><SelectContext value={context}>{props.children}</SelectContext></Native.Root>;
}
function SelectTrigger(props: SelectTriggerProps): Element {
  const context = useContext(SelectContext);
  const parsed = extractProps(merge(context, props), selectRootPropDefs, selectTriggerPropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, 'children', 'class', 'color', 'radius', 'placeholder'), {
    get ['data-accent-color']() { return parsed.color; }, get ['data-radius']() { return parsed.radius; },
    get class() { return ['rt-reset', 'rt-SelectTrigger', parsed.class]; },
    get children() { return <><span class="rt-SelectTriggerInner"><Native.Value placeholder={parsed.placeholder}>{props.children}</Native.Value></span>
      <Native.Icon asChild>{target => target(ChevronDownIcon, { class: 'rt-SelectIcon' })}</Native.Icon></>; }
  });
  return <Native.Trigger asChild>{target => target('button', forwarded)}</Native.Trigger>;
}
function SelectContent(props: SelectContentProps): Element {
  const context = useContext(SelectContext), theme = useThemeContext();
  const parsed = extractProps(merge(context, props), selectRootPropDefs, selectContentPropDefs);
  const forwarded = merge({ sideOffset: 4 }, omit(parsed, 'children', 'class', 'color', 'container'), {
    asChild: false as const,
    get ['data-accent-color']() { return parsed.color || theme.accentColor; },
    get class() { return [{ 'rt-PopperContent': props.position === 'popper' }, 'rt-SelectContent', parsed.class]; },
    get children() { return <ScrollArea.Root type="auto" class="rt-ScrollAreaRoot">
      <Native.Viewport asChild class="rt-SelectViewport">{target => target(ScrollArea.Viewport, { class: 'rt-ScrollAreaViewport', style: { 'overflow-y': undefined }, get children() { return props.children; } })}</Native.Viewport>
      <ScrollArea.Scrollbar class="rt-ScrollAreaScrollbar rt-r-size-1" orientation="vertical"><ScrollArea.Thumb class="rt-ScrollAreaThumb" /></ScrollArea.Scrollbar>
    </ScrollArea.Root>; }
  });
  return <Native.Portal container={props.container}><Theme asChild>{target => target(Native.Content, forwarded)}</Theme></Native.Portal>;
}
function SelectItem(props: SelectItemProps): Element {
  return <Native.Item {...merge(omit(props, 'class', 'children'), { get class() { return ['rt-SelectItem', props.class]; } })} asChild={false}>
    <Native.ItemIndicator class="rt-SelectItemIndicator"><ThickCheckIcon class="rt-SelectItemIndicatorIcon" /></Native.ItemIndicator>
    <Native.ItemText>{props.children}</Native.ItemText>
  </Native.Item>;
}
function SelectGroup(props: SelectGroupProps): Element { return <Native.Group {...merge(props, { get class() { return ['rt-SelectGroup', props.class]; } })} asChild={false} />; }
function SelectLabel(props: SelectLabelProps): Element { return <Native.Label {...merge(props, { get class() { return ['rt-SelectLabel', props.class]; } })} asChild={false} />; }
function SelectSeparator(props: SelectSeparatorProps): Element { return <Native.Separator {...merge(props, { get class() { return ['rt-SelectSeparator', props.class]; } })} asChild={false} />; }
export { SelectRoot as Root, SelectTrigger as Trigger, SelectContent as Content, SelectItem as Item, SelectGroup as Group, SelectLabel as Label, SelectSeparator as Separator };
export type { SelectRootProps as RootProps, SelectTriggerProps as TriggerProps, SelectContentProps as ContentProps, SelectItemProps as ItemProps, SelectGroupProps as GroupProps, SelectLabelProps as LabelProps, SelectSeparatorProps as SeparatorProps };
