// Native port of Radix Separator; upstream MIT, Copyright (c) 2022 WorkOS.
import { merge, omit, type Element } from "solid-js";

import { Primitive, type PrimitiveProps } from "../internal/primitive.js";

export type SeparatorProps = PrimitiveProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
};
export function Separator(props: SeparatorProps): Element {
  const orientation = () =>
    props.orientation === "vertical" ? "vertical" : "horizontal";
  const forwarded = merge(
    {
      get role() {
        return props.decorative ? "none" : "separator";
      },
      get ["aria-orientation"]() {
        return !props.decorative && orientation() === "vertical"
          ? "vertical"
          : undefined;
      },
      get ["data-orientation"]() {
        return orientation();
      },
    },
    omit(props, "orientation", "decorative"),
  );
  return (
    <Primitive
      as="div"
      {...forwarded}
    />
  );
}
