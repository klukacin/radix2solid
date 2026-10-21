import type { JSX } from "@solidjs/web";
// Native port of Radix Toggle; upstream MIT, Copyright (c) 2022 WorkOS.
import { merge, omit, type Element } from "solid-js";

import { composeEventHandlers } from "../internal/events.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { createControllableState } from "../internal/state.js";
import type { SlotRender } from "../slot/slot.js";

export type ToggleProps<T extends HTMLElement = HTMLButtonElement> = {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
} & (
  | (Omit<JSX.ButtonHTMLAttributes<T>, "children"> & {
      asChild: true;
      children: SlotRender;
    })
  | (Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
      asChild?: false;
      children?: Element;
    })
);

export function Toggle<T extends HTMLElement = HTMLButtonElement>(
  props: ToggleProps<T>,
): Element {
  const [pressed, setPressed] = createControllableState({
    value: () => props.pressed,
    get defaultValue() {
      return props.defaultPressed ?? false;
    },
    get onChange() {
      return props.onPressedChange;
    },
  });
  const hostProps = merge(
    {
      get ["aria-pressed"]() {
        return pressed() ? "true" : "false";
      },
      get ["data-state"]() {
        return pressed() ? "on" : "off";
      },
      get ["data-disabled"]() {
        return props.disabled ? "" : undefined;
      },
    },
    omit(props, "pressed", "defaultPressed", "onPressedChange"),
    {
      get type() {
        return props.type ?? "button";
      },
      onClick: composeEventHandlers<MouseEvent>(
        () => props.onClick,
        () => {
          if (!props.disabled) setPressed((previous) => !previous);
        },
      ),
    },
  );
  // A custom Slot target owns its specific native props; Toggle adds only button behavior.
  const forwarded = hostProps as PrimitiveProps;
  return <Primitive {...forwarded} />;
}
