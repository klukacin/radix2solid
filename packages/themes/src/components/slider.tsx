import * as SliderPrimitive from "@wsagency/radix2solid-primitives/slider";
import { omit, Repeat, type Element } from "solid-js";

import { extractProps } from "../helpers/extract-props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { sliderPropDefs } from "./slider.props.js";

export type SliderProps = Omit<
  SliderPrimitive.SliderProps,
  "asChild" | "color" | "children" | "defaultChecked"
> &
  MarginProps &
  GetPropDefTypes<typeof sliderPropDefs>;
export function Slider(props: SliderProps): Element {
  const parsed = extractProps(props, sliderPropDefs, marginPropDefs);
  const rootProps = omit(
    parsed,
    "class",
    "color",
    "radius",
    "tabindex",
    "aria-label",
    "aria-labelledby",
  );
  return (
    <SliderPrimitive.Root
      {...rootProps}
      asChild={false}
      data-accent-color={parsed.color}
      data-radius={parsed.radius}
      class={["rt-SliderRoot", parsed.class]}
    >
      <SliderPrimitive.Track
        __scopeSlider={props.__scopeSlider}
        class="rt-SliderTrack"
      >
        <SliderPrimitive.Range
          __scopeSlider={props.__scopeSlider}
          class={["rt-SliderRange", { "rt-high-contrast": props.highContrast }]}
          data-inverted={props.inverted ? "" : undefined}
        />
      </SliderPrimitive.Track>
      <Repeat count={props.value?.length ?? props.defaultValue?.length ?? 0}>
        {() => (
          <SliderPrimitive.Thumb
            __scopeSlider={props.__scopeSlider}
            class="rt-SliderThumb"
            tabindex={props.tabindex}
            aria-label={props["aria-label"]}
            aria-labelledby={props["aria-labelledby"]}
          />
        )}
      </Repeat>
    </SliderPrimitive.Root>
  );
}
