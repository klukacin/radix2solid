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
import { textPropDefs } from "./text.props.js";

export type TextProps = ComposedProps<
  (
    | ({ as?: "span" } & Omit<ComponentProps<"span">, RemovedProps>)
    | ({ as: "div" } & Omit<ComponentProps<"div">, RemovedProps>)
    | ({ as: "label" } & Omit<ComponentProps<"label">, RemovedProps>)
    | ({ as: "p" } & Omit<ComponentProps<"p">, RemovedProps>)
  ) &
    GetPropDefTypes<typeof textPropDefs> &
    MarginProps
>;
export function Text(props: TextProps): Element {
  const parsed = extractProps(props, textPropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, "as", "color"), {
    get as() {
      return parsed.as ?? "span";
    },
    get ["data-accent-color"]() {
      return parsed.color;
    },
    get class() {
      return ["rt-Text", parsed.class];
    },
  });
  return (
    <Primitive
      {...(forwarded as PrimitiveProps<"span" | "div" | "label" | "p">)}
    />
  );
}
