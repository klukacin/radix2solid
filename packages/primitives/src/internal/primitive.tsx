import {
  dynamic,
  type ComponentProps,
  type ValidComponent,
} from "@solidjs/web";
import { createMemo, merge, omit, untrack, type Element } from "solid-js";

import { Slot, type SlotProps, type SlotRender } from "../slot/slot.js";
import { equalRefs } from "./refs.js";

export type PrimitiveProps<T extends ValidComponent = "button"> = Omit<
  ComponentProps<T>,
  "children"
> & {
  as?: T;
} & (
    | { asChild: true; children: SlotRender }
    | { asChild?: false; children?: Element }
  );

export function Primitive<T extends ValidComponent = "button">(
  props: PrimitiveProps<T>,
): Element {
  const forwarded = omit(props, "as", "asChild");
  function renderSlot(): Element {
    const slotProps = merge(forwarded) as unknown as SlotProps;
    return Slot(slotProps);
  }
  function renderHost(): Element {
    const ref = createMemo(() => forwarded.ref, { equals: equalRefs });
    const native = merge(forwarded, {
      get ref() {
        return ref();
      },
    });
    const Target = dynamic(() => props.as ?? "button");
    const hostProps = native as ComponentProps<T | "button">;
    return <Target {...hostProps} />;
  }
  return untrack(() => props.asChild) ? renderSlot() : renderHost();
}
