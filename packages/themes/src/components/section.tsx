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
import { layoutPropDefs, type LayoutProps } from "../props/layout.props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { sectionPropDefs } from "./section.props.js";

export type SectionProps = ComposedProps<
  Omit<ComponentProps<"section">, RemovedProps> &
    GetPropDefTypes<typeof sectionPropDefs> &
    LayoutProps &
    MarginProps
>;
export function Section(props: SectionProps): Element {
  const parsed = extractProps(
    props,
    sectionPropDefs,
    layoutPropDefs,
    marginPropDefs,
  );
  const forwarded = merge(parsed, {
    as: "section" as const,
    get class() {
      return ["rt-Section", parsed.class];
    },
  });
  return <Primitive {...(forwarded as PrimitiveProps<"section">)} />;
}
