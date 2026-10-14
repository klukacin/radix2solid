import { merge, omit, type Element } from 'solid-js';
import * as Native from '@wsagency/radix2solid-primitives/tooltip';
import type { SlotRender } from '@wsagency/radix2solid-primitives/slot';
import { Theme } from './theme.js';
import { Text } from './text.js';
import { extractProps } from '../helpers/extract-props.js';
import type { RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { tooltipPropDefs } from './tooltip.props.js';

export type TooltipProps = Omit<Native.TooltipProps, 'children'> & Omit<Native.TooltipContentProps, RemovedProps | 'children' | 'content'> & GetPropDefTypes<typeof tooltipPropDefs> & {
  children: SlotRender; content: Element; container?: Native.TooltipPortalProps['container'];
};
export function Tooltip(props: TooltipProps): Element {
  const parsed = extractProps(props, tooltipPropDefs);
  const forwarded = merge({ sideOffset: 4, collisionPadding: 10 }, omit(parsed, 'children', 'class', 'open', 'defaultOpen', 'onOpenChange', 'delayDuration', 'disableHoverableContent', 'content', 'container', 'forceMount'), {
    asChild: false as const,
    get class() { return ['rt-TooltipContent', parsed.class]; },
    get children() { return <><Text as="p" class="rt-TooltipText" size="1">{props.content}</Text><Native.Arrow class="rt-TooltipArrow" /></>; }
  });
  return <Native.Root open={props.open} defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange} delayDuration={props.delayDuration} disableHoverableContent={props.disableHoverableContent} __scopeTooltip={props.__scopeTooltip}>
    <Native.Trigger asChild __scopeTooltip={props.__scopeTooltip}>{props.children}</Native.Trigger>
    <Native.Portal container={props.container} forceMount={props.forceMount} __scopeTooltip={props.__scopeTooltip}>
      <Theme asChild>{target => target(Native.Content, forwarded)}</Theme>
    </Native.Portal>
  </Native.Root>;
}
