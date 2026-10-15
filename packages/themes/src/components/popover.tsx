import * as Native from "@wsagency/radix2solid-primitives/popover";
import type { SlotRender } from "@wsagency/radix2solid-primitives/slot";
import { merge, omit, type Element } from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import {
  popoverContentPropDefs,
  type PopoverContentOwnProps,
} from "./popover.props.js";
import { Theme } from "./theme.js";

type PopoverRootProps = Native.PopoverProps;
type PopoverTriggerProps = Omit<
  Native.PopoverTriggerProps,
  RemovedProps | "children"
> & { children: SlotRender };
type PopoverCloseProps = Omit<
  Native.PopoverCloseProps,
  RemovedProps | "children"
> & { children: SlotRender };
type PopoverAnchorProps = Native.PopoverAnchorProps;
type PopoverContentProps = ComposedProps<
  Omit<Native.PopoverContentProps, RemovedProps> &
    PopoverContentOwnProps & {
      container?: Native.PopoverPortalProps["container"];
    }
>;
function PopoverRoot(props: PopoverRootProps): Element {
  return <Native.Root {...props} />;
}
function PopoverTrigger(props: PopoverTriggerProps): Element {
  return (
    <Native.Trigger
      {...props}
      asChild
    />
  );
}
function PopoverClose(props: PopoverCloseProps): Element {
  return (
    <Native.Close
      {...props}
      asChild
    />
  );
}
function PopoverAnchor(props: PopoverAnchorProps): Element {
  return <Native.Anchor {...props} />;
}
function PopoverContent(props: PopoverContentProps): Element {
  const parsed = extractProps(props, popoverContentPropDefs);
  const forwarded = merge(
    {
      align: "start" as const,
      sideOffset: 8,
      collisionPadding: 10,
      "aria-labelledby": undefined,
      "aria-describedby": undefined,
    },
    omit(parsed, "container", "forceMount", "class"),
    {
      get class() {
        return ["rt-PopperContent", "rt-PopoverContent", parsed.class];
      },
    },
  ) as Native.PopoverContentProps;
  return (
    <Native.Portal
      container={props.container}
      forceMount={props.forceMount}
    >
      <Theme asChild>{(target) => target(Native.Content, forwarded)}</Theme>
    </Native.Portal>
  );
}
export {
  PopoverRoot as Root,
  PopoverTrigger as Trigger,
  PopoverContent as Content,
  PopoverClose as Close,
  PopoverAnchor as Anchor,
};
export type {
  PopoverRootProps as RootProps,
  PopoverTriggerProps as TriggerProps,
  PopoverContentProps as ContentProps,
  PopoverCloseProps as CloseProps,
  PopoverAnchorProps as AnchorProps,
};
