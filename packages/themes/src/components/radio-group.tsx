import { createContextScope } from "@wsagency/radix2solid-primitives/internal";
import * as RadioGroupPrimitive from "@wsagency/radix2solid-primitives/radio-group";
import { merge, omit, Show, untrack, type Element } from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { radioGroupRootPropDefs } from "./radio-group.props.js";
import { Text } from "./text.js";

const [createContext] = createContextScope("RadioGroup", [
  RadioGroupPrimitive.createRadioGroupScope,
]);
const useScope = RadioGroupPrimitive.createRadioGroupScope();
type Settings = GetPropDefTypes<typeof radioGroupRootPropDefs>;
const [Provider, useGroup] = createContext<Settings>("RadioGroup");
type RadioGroupRootProps = ComposedProps<
  Omit<RadioGroupPrimitive.RadioGroupProps, "color" | "defaultChecked"> &
    MarginProps &
    Settings
>;
type RadioGroupItemProps = Omit<
  RadioGroupPrimitive.RadioGroupItemProps,
  RemovedProps | "children"
> &
  MarginProps & { children?: Element };
function RadioGroupRoot(props: RadioGroupRootProps): Element {
  const scope = untrack(() => props.__scopeRadioGroup),
    primitiveScope = useScope(scope);
  const context = {
    get color() {
      return props.color ?? radioGroupRootPropDefs.color.default;
    },
    get size() {
      return props.size ?? radioGroupRootPropDefs.size.default;
    },
    get highContrast() {
      return props.highContrast ?? radioGroupRootPropDefs.highContrast.default;
    },
    get variant() {
      return props.variant ?? radioGroupRootPropDefs.variant.default;
    },
  };
  const parsed = extractProps(
    omit(props, "color", "size", "highContrast", "variant"),
    marginPropDefs,
  );
  const rootProps = omit(
    parsed,
    "__scopeRadioGroup",
    "class",
  ) as RadioGroupPrimitive.RadioGroupProps;
  return (
    <Provider
      scope={scope}
      value={context}
    >
      <RadioGroupPrimitive.Root
        {...rootProps}
        {...primitiveScope}
        class={["rt-RadioGroupRoot", parsed.class]}
      />
    </Provider>
  );
}
function ItemRadio(props: RadioGroupItemProps): Element {
  const scope = untrack(() => props.__scopeRadioGroup),
    context = useGroup("RadioGroupItem", scope),
    primitiveScope = useScope(scope);
  const parsed = extractProps(
    merge(props, context),
    radioGroupRootPropDefs,
    marginPropDefs,
  );
  const radioProps = omit(
    parsed,
    "__scopeRadioGroup",
    "children",
    "class",
    "color",
  );
  return (
    <RadioGroupPrimitive.Item
      {...radioProps}
      {...primitiveScope}
      asChild={false}
      data-accent-color={parsed.color}
      class={["rt-reset", "rt-BaseRadioRoot", parsed.class]}
    />
  );
}
function RadioGroupItem(props: RadioGroupItemProps): Element {
  const context = useGroup(
    "RadioGroupItem",
    untrack(() => props.__scopeRadioGroup),
  );
  const itemProps = omit(props, "class", "style", "children");
  return (
    <Show
      when={!!props.children}
      fallback={<ItemRadio {...props} />}
    >
      <Text
        as="label"
        size={context.size}
        class={["rt-RadioGroupItem", props.class]}
        style={props.style}
      >
        <ItemRadio {...itemProps} />
        <span class="rt-RadioGroupItemInner">{props.children}</span>
      </Text>
    </Show>
  );
}
export { RadioGroupRoot as Root, RadioGroupItem as Item };
export type {
  RadioGroupRootProps as RootProps,
  RadioGroupItemProps as ItemProps,
};
