import type { ComponentProps } from "@solidjs/web";
import * as AvatarPrimitive from "@wsagency/radix2solid-primitives/avatar";
import {
  Slottable,
  type SlotRender,
} from "@wsagency/radix2solid-primitives/slot";
import { createSignal, omit, Show, untrack, type Element } from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { avatarPropDefs } from "./avatar.props.js";

type AvatarOwnProps = GetPropDefTypes<typeof avatarPropDefs>;
export type AvatarProps = ComposedProps<
  Omit<ComponentProps<typeof AvatarPrimitive.Image>, RemovedProps> &
    MarginProps &
    AvatarOwnProps & { fallback: Element }
>;
export function Avatar(props: AvatarProps): Element {
  const parsed = extractProps(props, avatarPropDefs, marginPropDefs);
  const imageProps = omit(
    parsed,
    "asChild",
    "children",
    "class",
    "style",
    "color",
    "radius",
    "fallback",
  );
  const content = (): Element => (
    <AvatarImpl
      {...imageProps}
      fallback={props.fallback}
    />
  );
  const child = untrack(() => props.asChild)
    ? Slottable({
        child: untrack(() => props.children) as SlotRender,
        children: content,
      })
    : undefined;
  const rootProps = {
    get asChild() {
      return props.asChild;
    },
    get ["data-accent-color"]() {
      return parsed.color;
    },
    get ["data-radius"]() {
      return parsed.radius;
    },
    get class() {
      return ["rt-reset", "rt-AvatarRoot", parsed.class];
    },
    get style() {
      return parsed.style;
    },
    get children() {
      return child ?? content();
    },
  };
  return (
    <AvatarPrimitive.Root {...(rootProps as AvatarPrimitive.AvatarProps)} />
  );
}
function AvatarImpl(props: Omit<AvatarProps, "asChild" | "children">): Element {
  const [status, setStatus] = createSignal<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const imageProps = omit(props, "fallback", "onLoadingStatusChange");
  return (
    <>
      <Show when={status() === "idle" || status() === "loading"}>
        <span class="rt-AvatarFallback" />
      </Show>
      <Show when={status() === "error"}>
        <AvatarPrimitive.Fallback
          delayMs={0}
          class={[
            "rt-AvatarFallback",
            {
              "rt-one-letter":
                typeof props.fallback === "string" &&
                props.fallback.length === 1,
              "rt-two-letters":
                typeof props.fallback === "string" &&
                props.fallback.length === 2,
            },
          ]}
        >
          {props.fallback}
        </AvatarPrimitive.Fallback>
      </Show>
      <AvatarPrimitive.Image
        {...imageProps}
        class="rt-AvatarImage"
        onLoadingStatusChange={(value) => {
          props.onLoadingStatusChange?.(value);
          setStatus(value);
        }}
      />
    </>
  );
}
