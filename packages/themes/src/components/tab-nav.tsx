import { merge, omit, untrack, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import * as NavigationMenu from '@wsagency/radix2solid-primitives/navigation-menu';
import { Slottable, type SlotRender } from '@wsagency/radix2solid-primitives/slot';
import { tabNavRootPropDefs, tabNavLinkPropDefs } from './tab-nav.props.js';
import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

type TabNavRootProps = Omit<ComponentProps<'nav'>, RemovedProps | 'defaultValue' | 'dir' | 'color'> & MarginProps & GetPropDefTypes<typeof tabNavRootPropDefs>;
type TabNavLinkProps = ComposedProps<Omit<NavigationMenu.NavigationMenuLinkProps, RemovedProps | 'onSelect'> & GetPropDefTypes<typeof tabNavLinkPropDefs>>;
function TabNavRoot(props: TabNavRootProps): Element {
  const parsed = extractProps(props, tabNavRootPropDefs, marginPropDefs);
  const rootProps = omit(parsed, 'class', 'color', 'children');
  return <NavigationMenu.Root {...rootProps} asChild={false} class="rt-TabNavRoot" data-accent-color={parsed.color}>
    <NavigationMenu.List class={['rt-reset', 'rt-BaseTabList', 'rt-TabNavList', parsed.class]}>{props.children}</NavigationMenu.List>
  </NavigationMenu.Root>;
}
function TabNavLink(props: TabNavLinkProps): Element {
  const wrap = (children: Element): Element => <><span class="rt-BaseTabListTriggerInner rt-TabNavLinkInner">{children}</span>
    <span class="rt-BaseTabListTriggerInnerHidden rt-TabNavLinkInnerHidden">{children}</span></>;
  const child = untrack(() => props.asChild) ? Slottable({ child: untrack(() => props.children) as SlotRender, children: wrap }) : undefined;
  const forwarded = merge(omit(props, 'class', 'children'), { get class() { return ['rt-reset', 'rt-BaseTabListTrigger', 'rt-TabNavLink', props.class]; },
    onSelect: undefined, get children() { return child ?? wrap(props.children as Element); } });
  return <NavigationMenu.Item class="rt-TabNavItem"><NavigationMenu.Link {...forwarded as NavigationMenu.NavigationMenuLinkProps} /></NavigationMenu.Item>;
}
export { TabNavRoot as Root, TabNavLink as Link };
export type { TabNavRootProps as RootProps, TabNavLinkProps as LinkProps };
