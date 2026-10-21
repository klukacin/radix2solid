import type { ComponentProps } from "@solidjs/web";
import {
  Primitive,
  type PrimitiveProps,
} from "@wsagency/radix2solid-primitives/internal";
import { merge, type Element } from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { emPropDefs } from "./em.props.js";

export type EmProps = ComposedProps<
  Omit<ComponentProps<"em">, RemovedProps> & GetPropDefTypes<typeof emPropDefs>
>;
export function Em(props: EmProps): Element {
  const parsed = extractProps(props, emPropDefs);
  const forwarded = merge(parsed, {
    as: "em" as const,
    get class() {
      return ["rt-Em", parsed.class];
    },
  });
  return <Primitive {...(forwarded as PrimitiveProps<"em">)} />;
}
