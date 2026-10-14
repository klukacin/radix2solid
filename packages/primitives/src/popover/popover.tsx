import { createEffect, createSignal, merge, omit, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createOverlay, type OverlayRootProps, type OverlayButtonProps, type OverlayPortalProps, type OverlayContentProps, type OverlayPartProps } from '../internal/overlay.js';
import { Primitive } from '../internal/primitive.js';
import { composeRefs } from '../internal/refs.js';
import { PopperArrow, usePopper, type PopperAnchorProps, type PopperArrowProps } from '../internal/popper.js';
import type { Scope } from '../internal/context.js';

const popover = createOverlay('Popover', false);
export const { Root: Popover, Trigger: PopoverTrigger, Portal: PopoverPortal, Content: PopoverContent, Title: PopoverTitle, Description: PopoverDescription, Close: PopoverClose, createScope: createPopoverScope } = popover;
export type PopoverProps = OverlayRootProps;
export type PopoverTriggerProps = OverlayButtonProps;
export type PopoverPortalProps = OverlayPortalProps;
export type PopoverContentProps = OverlayContentProps;
export type PopoverTitleProps = OverlayPartProps<'h2'>;
export type PopoverDescriptionProps = OverlayPartProps<'p'>;
export type PopoverCloseProps = OverlayButtonProps;
export type PopoverAnchorProps = PopperAnchorProps & { __scopePopover?: Scope };
export type PopoverArrowProps = PopperArrowProps & { __scopePopover?: Scope };

export function PopoverAnchor(props: PopoverAnchorProps): Element {
  const root = popover.context(props, 'Anchor');
  const position = usePopper(popover.scope(props));
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer) createEffect(() => props.virtualRef?.current ?? node(), anchor => {
    root.setCustomAnchor(anchor);
    position.setAnchor(anchor);
    return () => { if (root.customAnchor() === anchor) root.setCustomAnchor(undefined); };
  }, { transparent: true });
  const anchorProps = merge(omit(props, '__scopePopover', '__scopePopper', 'virtualRef'), {
    get ref() { return composeRefs(props.ref, ref); },
    get ['data-radix-popper-side']() { return position.placement()?.split('-')[0]; },
    get ['data-radix-popper-align']() { return position.placement()?.split('-')[1] ?? (position.placement() ? 'center' : undefined); }
  });
  const anchor = untrack(() => props.virtualRef) ? null : <Primitive as="div" {...anchorProps} />;
  return anchor;
}
export function PopoverArrow(props: PopoverArrowProps): Element {
  const arrowProps = omit(props, '__scopePopover');
  return <PopperArrow {...arrowProps} __scopePopper={popover.scope(props)} />;
}
