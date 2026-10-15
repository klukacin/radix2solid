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
import { strongPropDefs } from "./strong.props.js";

export type StrongProps = ComposedProps<
  Omit<ComponentProps<"strong">, RemovedProps> &
    GetPropDefTypes<typeof strongPropDefs>
>;
export function Strong(props: StrongProps): Element {
  const parsed = extractProps(props, strongPropDefs);
  const forwarded = merge(parsed, {
    as: "strong" as const,
    get class() {
      return ["rt-Strong", parsed.class];
    },
  });
  return <Primitive {...(forwarded as PrimitiveProps<"strong">)} />;
}
