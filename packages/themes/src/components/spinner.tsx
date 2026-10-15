import type { ComponentProps } from "@solidjs/web";
import { merge, omit, Show, type Element } from "solid-js";

import type { RemovedProps } from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { spinnerPropDefs } from "./spinner.props.js";

export type SpinnerProps = Omit<ComponentProps<"span">, RemovedProps> &
  MarginProps &
  GetPropDefTypes<typeof spinnerPropDefs>;
export function Spinner(props: SpinnerProps): Element {
  const parsed = extractProps(props, spinnerPropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, "children", "loading"), {
    get class() {
      return ["rt-Spinner", parsed.class];
    },
  });
  function Indicator(): Element {
    return (
      <span {...forwarded}>
        <span class="rt-SpinnerLeaf" />
        <span class="rt-SpinnerLeaf" />
        <span class="rt-SpinnerLeaf" />
        <span class="rt-SpinnerLeaf" />
        <span class="rt-SpinnerLeaf" />
        <span class="rt-SpinnerLeaf" />
        <span class="rt-SpinnerLeaf" />
        <span class="rt-SpinnerLeaf" />
      </span>
    );
  }
  return (
    <Show
      when={parsed.loading}
      fallback={props.children}
    >
      <Show
        when={props.children !== undefined}
        fallback={<Indicator />}
      >
        <span class="rt-Flex rt-r-ai-center rt-r-jc-center rt-r-position-relative">
          <span
            aria-hidden="true"
            style={{ display: "contents", visibility: "hidden" }}
          >
            {props.children}
          </span>
          <span class="rt-Flex rt-r-ai-center rt-r-jc-center rt-r-position-absolute rt-r-inset-0">
            <Indicator />
          </span>
        </span>
      </Show>
    </Show>
  );
}
