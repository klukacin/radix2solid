import { isServer } from "@solidjs/web";
// Native port of Radix Collapsible; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  merge,
  omit,
  onCleanup,
  Show,
  untrack,
  type Accessor,
  type Element,
} from "solid-js";

import { createContextScope, type Scope } from "../internal/context.js";
import { composeEventHandlers } from "../internal/events.js";
import { createPresence } from "../internal/presence.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import { createControllableState } from "../internal/state.js";
import { mergeStyles } from "../slot/slot.js";

const [createCollapsibleContext, createCollapsibleScope] =
  createContextScope("Collapsible");
const [Provider, useCollapsible] = createCollapsibleContext<{
  open: Accessor<boolean>;
  disabled: Accessor<boolean>;
  contentId: string;
  toggle: () => void;
}>("Collapsible");
export { createCollapsibleScope };
export type CollapsibleProps = PrimitiveProps<"div"> & {
  __scopeCollapsible?: Scope;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
};
export type CollapsibleTriggerProps = PrimitiveProps<"button"> & {
  __scopeCollapsible?: Scope;
};
export type CollapsibleContentProps = PrimitiveProps<"div"> & {
  __scopeCollapsible?: Scope;
  forceMount?: true;
};

export function Collapsible(props: CollapsibleProps): Element {
  const [open, setOpen] = createControllableState({
    value: () => props.open,
    get defaultValue() {
      return props.defaultOpen ?? false;
    },
    get onChange() {
      return props.onOpenChange;
    },
  });
  const value = {
    open,
    disabled: () => props.disabled ?? false,
    contentId: createUniqueId(),
    toggle: () => setOpen((previous) => !previous),
  };
  const forwarded = merge(
    {
      get ["data-state"]() {
        return open() ? "open" : "closed";
      },
      get ["data-disabled"]() {
        return props.disabled ? "" : undefined;
      },
    },
    omit(
      props,
      "__scopeCollapsible",
      "open",
      "defaultOpen",
      "disabled",
      "onOpenChange",
    ),
  );
  return (
    <Provider
      scope={props.__scopeCollapsible}
      value={value}
    >
      <Primitive
        as="div"
        {...forwarded}
      />
    </Provider>
  );
}

export function CollapsibleTrigger(props: CollapsibleTriggerProps): Element {
  const context = useCollapsible(
    "CollapsibleTrigger",
    untrack(() => props.__scopeCollapsible),
  );
  const forwarded = merge(
    {
      type: "button" as const,
      get ["aria-controls"]() {
        return context.open() ? context.contentId : undefined;
      },
      get ["aria-expanded"]() {
        return context.open() ? "true" : "false";
      },
      get ["data-state"]() {
        return context.open() ? "open" : "closed";
      },
      get ["data-disabled"]() {
        return context.disabled() ? "" : undefined;
      },
      get disabled() {
        return context.disabled();
      },
    },
    omit(props, "__scopeCollapsible"),
    {
      onClick: composeEventHandlers<MouseEvent>(
        () => props.onClick,
        () => {
          if (!context.disabled()) context.toggle();
        },
      ),
    },
  );
  return <Primitive {...forwarded} />;
}

export function CollapsibleContent(props: CollapsibleContentProps): Element {
  const context = useCollapsible(
    "CollapsibleContent",
    untrack(() => props.__scopeCollapsible),
  );
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const [height, setHeight] = createSignal(0);
  const [width, setWidth] = createSignal(0);
  let preventMountAnimation = untrack(
    () => context.open() || !!props.forceMount,
  );
  if (!isServer)
    createEffect(
      () => [node(), context.open(), props.forceMount] as const,
      ([element]) => {
        if (!element) return;
        const view = element.ownerDocument.defaultView!;
        const original = {
          transitionDuration: element.style.transitionDuration,
          animationName: element.style.animationName,
        };
        const restore = () => {
          element.style.transitionDuration = original.transitionDuration;
          element.style.animationName = original.animationName;
        };
        element.style.transitionDuration = "0s";
        element.style.animationName = "none";
        const rect = element.getBoundingClientRect();
        setHeight(rect.height);
        setWidth(rect.width);
        if (!preventMountAnimation) restore();
        const frame = view.requestAnimationFrame(() => {
          preventMountAnimation = false;
        });
        return () => {
          view.cancelAnimationFrame(frame);
          restore();
        };
      },
      { transparent: true },
    );
  const presence = createPresence(context.open, () => !!props.forceMount);
  const style = createMemo(() => {
    const values = {
      "--radix-collapsible-content-height": height()
        ? `${height()}px`
        : undefined,
      "--radix-collapsible-content-width": width() ? `${width()}px` : undefined,
    };
    const consumer = props.style;
    return typeof consumer === "string"
      ? mergeStyles(values, consumer)
      : Object.assign(values, consumer);
  });
  const forwarded = merge(
    {
      id: context.contentId,
      get ["data-state"]() {
        return context.open() ? "open" : "closed";
      },
      get ["data-disabled"]() {
        return context.disabled() ? "" : undefined;
      },
      get hidden() {
        return !presence.mounted();
      },
    },
    omit(props, "__scopeCollapsible", "forceMount"),
    {
      get ref() {
        return composeRefs(props.ref, ref, presence.ref);
      },
      get style() {
        return style();
      },
    },
  );
  function Mounted(): Element {
    if (!isServer)
      onCleanup(() => {
        ref(undefined);
        presence.ref(undefined);
      });
    return (
      <Primitive
        as="div"
        {...forwarded}
      />
    );
  }
  // Native children are DOM, not cloneable descriptors; only ordinary content keeps an empty hidden shell.
  const native = merge(omit(forwarded, "children"), {
    get children() {
      return <Show when={presence.mounted()}>{props.children as Element}</Show>;
    },
  }) as PrimitiveProps<"div">;
  const rendered = untrack(() => props.asChild) ? (
    <Show when={presence.mounted()}>
      <Mounted />
    </Show>
  ) : (
    <Primitive
      as="div"
      {...native}
    />
  );
  return rendered;
}
