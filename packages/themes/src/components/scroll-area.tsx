import type { ComponentProps } from "@solidjs/web";
import * as ScrollAreaPrimitive from "@wsagency/radix2solid-primitives/scroll-area";
import {
  Slottable,
  type SlotRender,
} from "@wsagency/radix2solid-primitives/slot";
import { createMemo, omit, Show, untrack, type Element } from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractMarginProps } from "../helpers/extract-margin-props.js";
import { extractProps } from "../helpers/extract-props.js";
import { getMarginStyles } from "../helpers/get-margin-styles.js";
import { mergeStyles } from "../helpers/merge-styles.js";
import type { MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { scrollAreaPropDefs } from "./scroll-area.props.js";

export type ScrollAreaProps = ComposedProps<
  Omit<ComponentProps<typeof ScrollAreaPrimitive.Root>, RemovedProps | "ref"> &
    Omit<
      ComponentProps<typeof ScrollAreaPrimitive.Viewport>,
      RemovedProps | "dir"
    > &
    MarginProps &
    GetPropDefTypes<typeof scrollAreaPropDefs>
>;
export function ScrollArea(props: ScrollAreaProps): Element {
  const margins = extractMarginProps(props);
  const marginStyles = createMemo(() => getMarginStyles(margins));
  const bars = extractProps(
    {
      get size() {
        return props.size;
      },
      get radius() {
        return props.radius;
      },
      get scrollbars() {
        return props.scrollbars;
      },
    },
    scrollAreaPropDefs,
  );
  const viewportProps = omit(
    margins.rest,
    "asChild",
    "children",
    "class",
    "style",
    "type",
    "scrollHideDelay",
    "dir",
    "size",
    "radius",
    "scrollbars",
  );
  const wrap = (content: Element): Element => (
    <>
      <ScrollAreaPrimitive.Viewport
        {...viewportProps}
        asChild={false}
        class="rt-ScrollAreaViewport"
      >
        {content}
      </ScrollAreaPrimitive.Viewport>
      <div class="rt-ScrollAreaViewportFocusRing" />
      <Show when={bars.scrollbars !== "vertical"}>
        <ScrollAreaPrimitive.Scrollbar
          __scopeScrollArea={props.__scopeScrollArea}
          orientation="horizontal"
          data-radius={bars.radius}
          class={["rt-ScrollAreaScrollbar", bars.class]}
        >
          <ScrollAreaPrimitive.Thumb
            __scopeScrollArea={props.__scopeScrollArea}
            class="rt-ScrollAreaThumb"
          />
        </ScrollAreaPrimitive.Scrollbar>
      </Show>
      <Show when={bars.scrollbars !== "horizontal"}>
        <ScrollAreaPrimitive.Scrollbar
          __scopeScrollArea={props.__scopeScrollArea}
          orientation="vertical"
          data-radius={bars.radius}
          class={["rt-ScrollAreaScrollbar", bars.class]}
        >
          <ScrollAreaPrimitive.Thumb
            __scopeScrollArea={props.__scopeScrollArea}
            class="rt-ScrollAreaThumb"
          />
        </ScrollAreaPrimitive.Scrollbar>
      </Show>
      <Show when={bars.scrollbars === "both"}>
        <ScrollAreaPrimitive.Corner
          __scopeScrollArea={props.__scopeScrollArea}
          class="rt-ScrollAreaCorner"
        />
      </Show>
    </>
  );
  const child = untrack(() => props.asChild)
    ? Slottable({
        child: untrack(() => props.children) as SlotRender,
        children: wrap,
      })
    : undefined;
  const rootProps = {
    get asChild() {
      return props.asChild;
    },
    get type() {
      return props.type;
    },
    get dir() {
      return props.dir;
    },
    get __scopeScrollArea() {
      return props.__scopeScrollArea;
    },
    get scrollHideDelay() {
      return props.scrollHideDelay ?? (props.type !== "scroll" ? 0 : undefined);
    },
    get class() {
      return ["rt-ScrollAreaRoot", marginStyles()[0], props.class];
    },
    get style() {
      return mergeStyles(marginStyles()[1], props.style);
    },
    get children() {
      return child ?? wrap(props.children as Element);
    },
  };
  return (
    <ScrollAreaPrimitive.Root
      {...(rootProps as ScrollAreaPrimitive.ScrollAreaProps)}
    />
  );
}
