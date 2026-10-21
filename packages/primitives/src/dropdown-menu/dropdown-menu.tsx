// Native port of Radix DropdownMenu; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createSignal,
  createUniqueId,
  merge,
  omit,
  untrack,
  type Element,
} from "solid-js";

import type { Direction } from "../direction/direction.js";
import { createContextScope, type Scope } from "../internal/context.js";
import { composeEventHandlers } from "../internal/events.js";
import { focus } from "../internal/focus-scope.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import { createControllableState } from "../internal/state.js";
import * as Menu from "../menu/menu.js";
import { mergeStyles } from "../slot/slot.js";

type Scoped = { __scopeDropdownMenu?: Scope };
export type DropdownMenuProps = Scoped & {
  children?: Element;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dir?: Direction;
  modal?: boolean;
};
export type DropdownMenuTriggerProps = Scoped &
  PrimitiveProps<"button"> & { disabled?: boolean };
export type DropdownMenuPortalProps = Scoped & Menu.MenuPortalProps;
export type DropdownMenuContentProps = Scoped & Menu.MenuContentProps;
export type DropdownMenuGroupProps = Scoped & Menu.MenuGroupProps;
export type DropdownMenuLabelProps = Scoped & Menu.MenuLabelProps;
export type DropdownMenuItemProps = Scoped & Menu.MenuItemProps;
export type DropdownMenuCheckboxItemProps = Scoped & Menu.MenuCheckboxItemProps;
export type DropdownMenuRadioGroupProps = Scoped & Menu.MenuRadioGroupProps;
export type DropdownMenuRadioItemProps = Scoped & Menu.MenuRadioItemProps;
export type DropdownMenuItemIndicatorProps = Scoped &
  Menu.MenuItemIndicatorProps;
export type DropdownMenuSeparatorProps = Scoped & Menu.MenuSeparatorProps;
export type DropdownMenuArrowProps = Scoped & Menu.MenuArrowProps;
export type DropdownMenuSubProps = Scoped & Menu.MenuSubProps;
export type DropdownMenuSubTriggerProps = Scoped & Menu.MenuSubTriggerProps;
export type DropdownMenuSubContentProps = Scoped & Menu.MenuSubContentProps;
const [createDropdownContext, createDropdownMenuScope] = createContextScope(
  "DropdownMenu",
  [Menu.createMenuScope],
);
const useMenuScope = Menu.createMenuScope();
const [Provider, useDropdown] = createDropdownContext<{
  open: () => boolean;
  change: (next: boolean | ((previous: boolean) => boolean)) => void;
  modal: () => boolean;
  trigger: () => HTMLElement | undefined;
  setTrigger: (node: HTMLElement | undefined) => void;
  triggerId: string;
  contentId: string;
}>("DropdownMenu");
function menuProps<P extends Scoped>(props: P): P & { __scopeMenu?: Scope } {
  return merge(omit(props, "__scopeDropdownMenu"), {
    __scopeMenu: useMenuScope(untrack(() => props.__scopeDropdownMenu))
      .__scopeMenu,
  }) as P & { __scopeMenu?: Scope };
}
export function DropdownMenu(props: DropdownMenuProps): Element {
  const [open, change] = createControllableState({
    value: () => props.open,
    get defaultValue() {
      return props.defaultOpen ?? false;
    },
    get onChange() {
      return props.onOpenChange;
    },
  });
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>();
  return (
    <Provider
      scope={props.__scopeDropdownMenu}
      value={{
        open,
        change,
        trigger,
        setTrigger,
        modal: () => props.modal ?? true,
        triggerId: createUniqueId(),
        contentId: createUniqueId(),
      }}
    >
      <Menu.Root
        {...useMenuScope(props.__scopeDropdownMenu)}
        open={open()}
        onOpenChange={change}
        dir={props.dir}
        modal={props.modal}
      >
        {props.children}
      </Menu.Root>
    </Provider>
  );
}
export function DropdownMenuTrigger(props: DropdownMenuTriggerProps): Element {
  const scope = untrack(() => props.__scopeDropdownMenu),
    dropdown = useDropdown("DropdownMenuTrigger", scope);
  const root = Menu.useMenuRoot(
    "DropdownMenuTrigger",
    useMenuScope(scope).__scopeMenu,
  );
  const forwarded = merge(
    {
      type: "button" as const,
      id: dropdown.triggerId,
      "aria-haspopup": "menu" as const,
    },
    omit(props, "__scopeDropdownMenu"),
    {
      get ref() {
        return composeRefs(props.ref, dropdown.setTrigger);
      },
      get ["aria-expanded"]() {
        return dropdown.open() ? ("true" as const) : ("false" as const);
      },
      get ["aria-controls"]() {
        return dropdown.open() ? dropdown.contentId : undefined;
      },
      get ["data-state"]() {
        return dropdown.open() ? "open" : "closed";
      },
      get ["data-disabled"]() {
        return props.disabled ? "" : undefined;
      },
      onPointerDown: composeEventHandlers<PointerEvent>(
        () => props.onPointerDown,
        (event) => {
          if (!props.disabled && event.button === 0 && !event.ctrlKey) {
            root.keyboard = false;
            const wasOpen = dropdown.open();
            dropdown.change((previous) => !previous);
            if (!wasOpen) event.preventDefault();
          }
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        () => props.onKeyDown,
        (event) => {
          if (props.disabled) return;
          if (["Enter", " ", "ArrowDown"].includes(event.key)) {
            root.keyboard = true;
            if (event.key === "ArrowDown") dropdown.change(true);
            else dropdown.change((previous) => !previous);
            event.preventDefault();
          }
        },
      ),
    },
  );
  return (
    <Menu.Anchor
      {...useMenuScope(props.__scopeDropdownMenu)}
      asChild
    >
      {(target) => target(Primitive, forwarded)}
    </Menu.Anchor>
  );
}
export function DropdownMenuContent(props: DropdownMenuContentProps): Element {
  const dropdown = useDropdown(
    "DropdownMenuContent",
    untrack(() => props.__scopeDropdownMenu),
  );
  let interacted = false;
  const forwarded = merge(
    { id: dropdown.contentId, "aria-labelledby": dropdown.triggerId },
    menuProps(props),
    {
      onCloseAutoFocus(event: Event) {
        props.onCloseAutoFocus?.(event);
        if (!event.defaultPrevented) {
          if (!interacted) focus(dropdown.trigger());
          event.preventDefault();
        }
        interacted = false;
      },
      onInteractOutside(
        event: Parameters<
          NonNullable<Menu.MenuContentProps["onInteractOutside"]>
        >[0],
      ) {
        props.onInteractOutside?.(event);
        const original = event.detail.originalEvent;
        if (
          !event.defaultPrevented &&
          (!dropdown.modal() ||
            ("button" in original &&
              (original.button === 2 ||
                (original.button === 0 && original.ctrlKey))))
        )
          interacted = true;
      },
      get style() {
        return mergeStyles(
          {
            "--radix-dropdown-menu-content-transform-origin":
              "var(--radix-popper-transform-origin)",
            "--radix-dropdown-menu-content-available-width":
              "var(--radix-popper-available-width)",
            "--radix-dropdown-menu-content-available-height":
              "var(--radix-popper-available-height)",
            "--radix-dropdown-menu-trigger-width":
              "var(--radix-popper-anchor-width)",
            "--radix-dropdown-menu-trigger-height":
              "var(--radix-popper-anchor-height)",
          },
          props.style,
        );
      },
    },
  );
  return <Menu.Content {...forwarded} />;
}
export function DropdownMenuPortal(props: DropdownMenuPortalProps): Element {
  return <Menu.Portal {...menuProps(props)} />;
}
export function DropdownMenuGroup(props: DropdownMenuGroupProps): Element {
  return <Menu.Group {...menuProps(props)} />;
}
export function DropdownMenuLabel(props: DropdownMenuLabelProps): Element {
  return <Menu.Label {...menuProps(props)} />;
}
export function DropdownMenuItem(props: DropdownMenuItemProps): Element {
  return <Menu.Item {...menuProps(props)} />;
}
export function DropdownMenuCheckboxItem(
  props: DropdownMenuCheckboxItemProps,
): Element {
  return <Menu.CheckboxItem {...menuProps(props)} />;
}
export function DropdownMenuRadioGroup(
  props: DropdownMenuRadioGroupProps,
): Element {
  return <Menu.RadioGroup {...menuProps(props)} />;
}
export function DropdownMenuRadioItem(
  props: DropdownMenuRadioItemProps,
): Element {
  return <Menu.RadioItem {...menuProps(props)} />;
}
export function DropdownMenuItemIndicator(
  props: DropdownMenuItemIndicatorProps,
): Element {
  return <Menu.ItemIndicator {...menuProps(props)} />;
}
export function DropdownMenuSeparator(
  props: DropdownMenuSeparatorProps,
): Element {
  return <Menu.Separator {...menuProps(props)} />;
}
export function DropdownMenuArrow(props: DropdownMenuArrowProps): Element {
  return <Menu.Arrow {...menuProps(props)} />;
}
export function DropdownMenuSub(props: DropdownMenuSubProps): Element {
  return <Menu.Sub {...menuProps(props)} />;
}
export function DropdownMenuSubTrigger(
  props: DropdownMenuSubTriggerProps,
): Element {
  return <Menu.SubTrigger {...menuProps(props)} />;
}
export function DropdownMenuSubContent(
  props: DropdownMenuSubContentProps,
): Element {
  const forwarded = merge(menuProps(props), {
    get style() {
      return mergeStyles(
        {
          "--radix-dropdown-menu-content-transform-origin":
            "var(--radix-popper-transform-origin)",
          "--radix-dropdown-menu-content-available-width":
            "var(--radix-popper-available-width)",
          "--radix-dropdown-menu-content-available-height":
            "var(--radix-popper-available-height)",
          "--radix-dropdown-menu-trigger-width":
            "var(--radix-popper-anchor-width)",
          "--radix-dropdown-menu-trigger-height":
            "var(--radix-popper-anchor-height)",
        },
        props.style,
      );
    },
  });
  return <Menu.SubContent {...forwarded} />;
}
export {
  createDropdownMenuScope,
  DropdownMenu as Root,
  DropdownMenuTrigger as Trigger,
  DropdownMenuPortal as Portal,
  DropdownMenuContent as Content,
  DropdownMenuGroup as Group,
  DropdownMenuLabel as Label,
  DropdownMenuItem as Item,
  DropdownMenuCheckboxItem as CheckboxItem,
  DropdownMenuRadioGroup as RadioGroup,
  DropdownMenuRadioItem as RadioItem,
  DropdownMenuItemIndicator as ItemIndicator,
  DropdownMenuSeparator as Separator,
  DropdownMenuArrow as Arrow,
  DropdownMenuSub as Sub,
  DropdownMenuSubTrigger as SubTrigger,
  DropdownMenuSubContent as SubContent,
};
