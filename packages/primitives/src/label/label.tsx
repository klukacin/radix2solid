// Native port of Radix Label; upstream MIT, Copyright (c) 2022 WorkOS.
import { merge, type Element } from "solid-js";

import { callEventHandler } from "../internal/events.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";

export type LabelProps = PrimitiveProps<"label">;
export function Label(props: LabelProps): Element {
  const forwarded = merge(props, {
    onMouseDown(event: MouseEvent) {
      if (
        (event.target as HTMLElement).closest("button, input, select, textarea")
      )
        return;
      callEventHandler(props.onMouseDown, event);
      if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
    },
  });
  return (
    <Primitive
      as="label"
      {...forwarded}
    />
  );
}
