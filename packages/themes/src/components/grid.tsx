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
import { layoutPropDefs, type LayoutProps } from "../props/layout.props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { gridPropDefs } from "./grid.props.js";

export type GridProps = ComposedProps<
  (
    | ({ as?: "div" } & Omit<ComponentProps<"div">, RemovedProps>)
    | ({ as: "span" } & Omit<ComponentProps<"span">, RemovedProps>)
  ) &
    GetPropDefTypes<typeof gridPropDefs> &
    LayoutProps &
    MarginProps
>;
export function Grid(props: GridProps): Element {
  const parsed = extractProps(
    props,
    gridPropDefs,
    layoutPropDefs,
    marginPropDefs,
  );
  const forwarded = merge(omit(parsed, "as"), {
    get as() {
      return parsed.as ?? "div";
    },
    get class() {
      return ["rt-Grid", parsed.class];
    },
  });
  return <Primitive {...(forwarded as PrimitiveProps<"div" | "span">)} />;
}
