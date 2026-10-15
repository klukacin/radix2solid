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
import { blockquotePropDefs } from "./blockquote.props.js";
import { textPropDefs } from "./text.props.js";

export type BlockquoteProps = ComposedProps<
  Omit<ComponentProps<"blockquote">, RemovedProps> &
    GetPropDefTypes<typeof blockquotePropDefs> &
    MarginProps
>;
export function Blockquote(props: BlockquoteProps): Element {
  const parsed = extractProps(
    props,
    textPropDefs,
    blockquotePropDefs,
    marginPropDefs,
  );
  const forwarded = merge(omit(parsed, "color"), {
    as: "blockquote" as const,
    get ["data-accent-color"]() {
      return parsed.color;
    },
    get class() {
      return ["rt-Text", "rt-Blockquote", parsed.class];
    },
  });
  return <Primitive {...(forwarded as PrimitiveProps<"blockquote">)} />;
}
