// Native port of Radix AspectRatio; upstream MIT, Copyright (c) 2022 WorkOS.
import { merge, omit, type Element } from "solid-js";

import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { mergeStyles } from "../slot/slot.js";

const positioned = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
export type AspectRatioProps = PrimitiveProps<"div"> & { ratio?: number };
export function AspectRatio(props: AspectRatioProps): Element {
  const forwarded = merge(omit(props, "ratio"), {
    get style() {
      return mergeStyles(props.style, positioned);
    },
  });
  return (
    <div
      data-radix-aspect-ratio-wrapper=""
      style={{
        position: "relative",
        width: "100%",
        "padding-bottom": `${100 / (props.ratio ?? 1)}%`,
      }}
    >
      <Primitive
        as="div"
        {...forwarded}
      />
    </div>
  );
}
