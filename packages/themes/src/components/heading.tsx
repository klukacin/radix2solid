import type { ComponentProps } from "@solidjs/web";
import {
  Primitive,
  type PrimitiveProps,
} from "@wsagency/radix2solid-primitives/internal";
import { merge, omit, type Element } from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { headingPropDefs } from "./heading.props.js";

export type HeadingProps = ComposedProps<
  Omit<ComponentProps<"h1">, RemovedProps> &
    GetPropDefTypes<typeof headingPropDefs> &
    MarginProps
>;
export function Heading(props: HeadingProps): Element {
  const parsed = extractProps(props, headingPropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, "as", "color"), {
    get as() {
      return parsed.as ?? "h1";
    },
    get ["data-accent-color"]() {
      return parsed.color;
    },
    get class() {
      return ["rt-Heading", parsed.class];
    },
  });
  return (
    <Primitive
      {...(forwarded as PrimitiveProps<
        "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
      >)}
    />
  );
}
