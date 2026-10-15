import { Slot, type SlotProps } from "@wsagency/radix2solid-primitives/slot";
import { merge, type Element } from "solid-js";

export type ResetProps = SlotProps;
export function Reset(props: ResetProps): Element {
  const forwarded = merge(props, {
    get class() {
      return ["rt-reset", props.class];
    },
  });
  return <Slot {...forwarded} />;
}
