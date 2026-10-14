import { merge, omit, type Element } from 'solid-js';
import * as Native from '@wsagency/radix2solid-primitives/hover-card';
import type { SlotRender } from '@wsagency/radix2solid-primitives/slot';
import { Theme } from './theme.js';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import { hoverCardContentPropDefs, type HoverCardContentOwnProps } from './hover-card.props.js';

type HoverCardRootProps = Native.HoverCardProps;
type HoverCardTriggerProps = Omit<Native.HoverCardTriggerProps, RemovedProps | 'children'> & { children: SlotRender };
type HoverCardContentProps = ComposedProps<Omit<Native.HoverCardContentProps, RemovedProps> & HoverCardContentOwnProps & { container?: Native.HoverCardPortalProps['container'] }>;
function HoverCardRoot(props: HoverCardRootProps): Element {
  const rootProps = merge({ openDelay: 200, closeDelay: 150 }, props);
  return <Native.Root {...rootProps} />;
}
function HoverCardTrigger(props: HoverCardTriggerProps): Element {
  const triggerProps = merge(omit(props, 'class'), { get class() { return ['rt-HoverCardTrigger', props.class]; } });
  return <Native.Trigger {...triggerProps} asChild />;
}
function HoverCardContent(props: HoverCardContentProps): Element {
  const parsed = extractProps(props, hoverCardContentPropDefs);
  const forwarded = merge({ align: 'start' as const, sideOffset: 8, collisionPadding: 10 }, omit(parsed, 'container', 'forceMount', 'class'), {
    get class() { return ['rt-PopperContent', 'rt-HoverCardContent', parsed.class]; }
  }) as Native.HoverCardContentProps;
  return <Native.Portal container={props.container} forceMount={props.forceMount}><Theme asChild>{target => target(Native.Content, forwarded)}</Theme></Native.Portal>;
}
export { HoverCardRoot as Root, HoverCardTrigger as Trigger, HoverCardContent as Content };
export type { HoverCardRootProps as RootProps, HoverCardTriggerProps as TriggerProps, HoverCardContentProps as ContentProps };
