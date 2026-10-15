import * as SwitchPrimitive from "@wsagency/radix2solid-primitives/switch";
import { omit, type Element } from "solid-js";

import { extractProps } from "../helpers/extract-props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { switchPropDefs } from "./switch.props.js";

export type SwitchProps = Omit<
  SwitchPrimitive.SwitchProps,
  "asChild" | "color" | "defaultValue" | "children"
> &
  MarginProps &
  GetPropDefTypes<typeof switchPropDefs>;
export function Switch(props: SwitchProps): Element {
  const parsed = extractProps(props, switchPropDefs, marginPropDefs);
  const rootProps = omit(parsed, "class", "color", "radius");
  return (
    <SwitchPrimitive.Root
      {...rootProps}
      asChild={false}
      data-accent-color={parsed.color}
      data-radius={parsed.radius}
      class={["rt-reset", "rt-SwitchRoot", parsed.class]}
    >
      <SwitchPrimitive.Thumb
        __scopeSwitch={props.__scopeSwitch}
        class={["rt-SwitchThumb", { "rt-high-contrast": props.highContrast }]}
      />
    </SwitchPrimitive.Root>
  );
}
