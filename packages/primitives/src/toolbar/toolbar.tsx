// Native port of Radix Toolbar; upstream MIT, Copyright (c) 2022 WorkOS.
import { merge, omit, untrack, type Accessor, type Element } from "solid-js";

import { useDirection, type Direction } from "../direction/direction.js";
import { createContextScope, type Scope } from "../internal/context.js";
import { composeEventHandlers } from "../internal/events.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import {
  createRovingFocusGroupScope,
  RovingFocusGroup,
  RovingFocusGroupItem,
} from "../internal/roving-focus.js";
import { Separator, type SeparatorProps } from "../separator/separator.js";
import {
  ToggleGroup,
  ToggleGroupItem,
  createToggleGroupScope,
  useToggleGroupContext,
  type ToggleGroupSingleProps,
  type ToggleGroupMultipleProps,
  type ToggleGroupItemProps,
} from "../toggle-group/toggle-group.js";

const [createToolbarContext, createToolbarScope] = createContextScope(
  "Toolbar",
  [createRovingFocusGroupScope, createToggleGroupScope],
);
const useRovingScope = createRovingFocusGroupScope();
const useToggleScope = createToggleGroupScope();
const [Provider, useToolbar] = createToolbarContext<{
  orientation: Accessor<"horizontal" | "vertical">;
  dir: Accessor<Direction>;
}>("Toolbar");
export { createToolbarScope };
export type ToolbarProps = PrimitiveProps<"div"> & {
  __scopeToolbar?: Scope;
  orientation?: "horizontal" | "vertical";
  dir?: Direction;
  loop?: boolean;
};
export type ToolbarSeparatorProps = SeparatorProps & { __scopeToolbar?: Scope };
export type ToolbarButtonProps = PrimitiveProps<"button"> & {
  __scopeToolbar?: Scope;
};
export type ToolbarLinkProps = PrimitiveProps<"a"> & { __scopeToolbar?: Scope };
export type ToolbarToggleGroupSingleProps = ToggleGroupSingleProps & {
  __scopeToolbar?: Scope;
};
export type ToolbarToggleGroupMultipleProps = ToggleGroupMultipleProps & {
  __scopeToolbar?: Scope;
};
export type ToolbarToggleItemProps = ToggleGroupItemProps & {
  __scopeToolbar?: Scope;
};

export function Toolbar(props: ToolbarProps): Element {
  const scope = untrack(() => props.__scopeToolbar);
  const context = {
    orientation: () => props.orientation ?? ("horizontal" as const),
    dir: useDirection(() => props.dir),
  };
  const forwarded = merge(
    {
      role: "toolbar" as const,
      get ["aria-orientation"]() {
        return context.orientation();
      },
      get dir() {
        return context.dir();
      },
    },
    omit(props, "__scopeToolbar", "orientation", "dir", "loop"),
  );
  return (
    <Provider
      scope={scope}
      value={context}
    >
      <RovingFocusGroup
        {...useRovingScope(scope)}
        orientation={context.orientation()}
        dir={context.dir()}
        loop={props.loop ?? true}
        asChild
      >
        {(target) =>
          target(Primitive, merge({ as: "div" as const }, forwarded))
        }
      </RovingFocusGroup>
    </Provider>
  );
}

export function ToolbarSeparator(props: ToolbarSeparatorProps): Element {
  const context = useToolbar(
    "ToolbarSeparator",
    untrack(() => props.__scopeToolbar),
  );
  const forwarded = merge(
    {
      get orientation() {
        return context.orientation() === "horizontal"
          ? ("vertical" as const)
          : ("horizontal" as const);
      },
    },
    omit(props, "__scopeToolbar"),
  );
  return <Separator {...forwarded} />;
}

export function ToolbarButton(props: ToolbarButtonProps): Element {
  const scope = untrack(() => props.__scopeToolbar);
  const forwarded = merge(
    { type: "button" as const },
    omit(props, "__scopeToolbar"),
  );
  return (
    <RovingFocusGroupItem
      {...useRovingScope(scope)}
      focusable={!props.disabled}
      asChild
    >
      {(target) => target(Primitive, forwarded)}
    </RovingFocusGroupItem>
  );
}

export function ToolbarLink(props: ToolbarLinkProps): Element {
  const scope = untrack(() => props.__scopeToolbar);
  const forwarded = merge({ as: "a" as const }, omit(props, "__scopeToolbar"), {
    onKeyDown: composeEventHandlers<KeyboardEvent>(
      () => props.onKeyDown,
      (event) => {
        if (event.key === " " && event.target === event.currentTarget) {
          const node = event.currentTarget as HTMLElement;
          node.click();
        }
      },
    ),
  });
  return (
    <RovingFocusGroupItem
      {...useRovingScope(scope)}
      asChild
    >
      {(target) => target(Primitive, forwarded)}
    </RovingFocusGroupItem>
  );
}

export function ToolbarToggleGroup(
  props: ToolbarToggleGroupSingleProps | ToolbarToggleGroupMultipleProps,
): Element {
  const scope = untrack(() => props.__scopeToolbar);
  const context = useToolbar("ToolbarToggleGroup", scope);
  const hostProps = props as ToolbarToggleGroupSingleProps;
  const forwarded = merge(
    {
      get ["data-orientation"]() {
        return context.orientation();
      },
      get dir() {
        return context.dir();
      },
    },
    { __scopeToggleGroup: useToggleScope(scope).__scopeToggleGroup },
    omit(hostProps, "__scopeToolbar"),
    { rovingFocus: false },
  );
  return <ToggleGroup {...forwarded} />;
}

export function ToolbarToggleItem(props: ToolbarToggleItemProps): Element {
  const scope = untrack(() => props.__scopeToolbar);
  const toggleScope = useToggleScope(scope);
  const group = useToggleGroupContext(
    "ToolbarToggleItem",
    toggleScope.__scopeToggleGroup,
  );
  const forwarded = merge(
    { __scopeToggleGroup: toggleScope.__scopeToggleGroup },
    omit(props, "__scopeToolbar"),
  );
  return (
    <RovingFocusGroupItem
      {...useRovingScope(scope)}
      focusable={!group.disabled() && !props.disabled}
      asChild
    >
      {(target) => target(ToggleGroupItem, forwarded)}
    </RovingFocusGroupItem>
  );
}
