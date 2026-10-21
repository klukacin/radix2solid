import type { ComponentProps } from "@solidjs/web";
import * as ProgressPrimitive from "@wsagency/radix2solid-primitives/progress";
import { merge, omit, type Element } from "solid-js";

import type { RemovedProps } from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import { mergeStyles } from "../helpers/merge-styles.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { progressPropDefs } from "./progress.props.js";

export type ProgressProps = Omit<
  ComponentProps<typeof ProgressPrimitive.Root>,
  RemovedProps | "children"
> &
  MarginProps &
  Omit<GetPropDefTypes<typeof progressPropDefs>, "duration"> & {
    duration?: `${number}s` | `${number}ms`;
    children?: never;
  };
export function Progress(props: ProgressProps): Element {
  const parsed = extractProps(props, progressPropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, "color", "radius", "duration"), {
    get ["data-accent-color"]() {
      return parsed.color;
    },
    get ["data-radius"]() {
      return parsed.radius;
    },
    get class() {
      return ["rt-ProgressRoot", parsed.class];
    },
    get style() {
      return mergeStyles(
        {
          "--progress-duration": "value" in props ? undefined : props.duration,
          "--progress-value":
            "value" in props ? (props.value ?? undefined) : undefined,
          "--progress-max": "max" in props ? props.max : undefined,
        },
        parsed.style,
      );
    },
  });
  return (
    <ProgressPrimitive.Root
      {...forwarded}
      asChild={false}
    >
      <ProgressPrimitive.Indicator class="rt-ProgressIndicator" />
    </ProgressPrimitive.Root>
  );
}
