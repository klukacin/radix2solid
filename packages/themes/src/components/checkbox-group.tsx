import { createContextScope } from "@wsagency/radix2solid-primitives/internal";
import { merge, omit, Show, untrack, type Element } from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import * as CheckboxGroupPrimitive from "./checkbox-group.primitive.js";
import { checkboxGroupRootPropDefs } from "./checkbox-group.props.js";
import { ThickCheckIcon } from "./icons.js";
import { Text } from "./text.js";

const [createContext] = createContextScope("CheckboxGroup", [
  CheckboxGroupPrimitive.createCheckboxGroupScope,
]);
const useScope = CheckboxGroupPrimitive.createCheckboxGroupScope();
type Settings = GetPropDefTypes<typeof checkboxGroupRootPropDefs>;
const [Provider, useGroup] = createContext<Settings>("CheckboxGroup");
type CheckboxGroupRootProps = ComposedProps<
  Omit<CheckboxGroupPrimitive.CheckboxGroupProps, "color" | "defaultChecked"> &
    MarginProps &
    Settings
>;
type CheckboxGroupItemProps = Omit<
  CheckboxGroupPrimitive.CheckboxGroupItemProps,
  RemovedProps | "children"
> &
  MarginProps & { children?: Element };
function CheckboxGroupRoot(props: CheckboxGroupRootProps): Element {
  const scope = untrack(() => props.__scopeCheckboxGroup),
    primitiveScope = useScope(scope);
  const context = {
    get color() {
      return props.color ?? checkboxGroupRootPropDefs.color.default;
    },
    get size() {
      return props.size ?? checkboxGroupRootPropDefs.size.default;
    },
    get highContrast() {
      return (
        props.highContrast ?? checkboxGroupRootPropDefs.highContrast.default
      );
    },
    get variant() {
      return props.variant ?? checkboxGroupRootPropDefs.variant.default;
    },
  };
  const parsed = extractProps(
    omit(props, "color", "size", "highContrast", "variant"),
    marginPropDefs,
  );
  const rootProps = omit(
    parsed,
    "__scopeCheckboxGroup",
    "class",
  ) as CheckboxGroupPrimitive.CheckboxGroupProps;
  return (
    <Provider
      scope={scope}
      value={context}
    >
      <CheckboxGroupPrimitive.Root
        {...rootProps}
        {...primitiveScope}
        class={["rt-CheckboxGroupRoot", parsed.class]}
      />
    </Provider>
  );
}
function ItemCheckbox(props: CheckboxGroupItemProps): Element {
  const scope = untrack(() => props.__scopeCheckboxGroup),
    context = useGroup("CheckboxGroupItem", scope),
    primitiveScope = useScope(scope);
  const parsed = extractProps(
    merge(props, context),
    checkboxGroupRootPropDefs,
    marginPropDefs,
  );
  const checkboxProps = omit(
    parsed,
    "__scopeCheckboxGroup",
    "children",
    "class",
    "color",
  );
  return (
    <CheckboxGroupPrimitive.Item
      {...checkboxProps}
      {...primitiveScope}
      asChild={false}
      data-accent-color={parsed.color}
      class={[
        "rt-reset",
        "rt-BaseCheckboxRoot",
        "rt-CheckboxGroupItemCheckbox",
        parsed.class,
      ]}
    >
      <CheckboxGroupPrimitive.Indicator
        {...primitiveScope}
        asChild
        class="rt-BaseCheckboxIndicator"
      >
        {(target) => target(ThickCheckIcon, {})}
      </CheckboxGroupPrimitive.Indicator>
    </CheckboxGroupPrimitive.Item>
  );
}
function CheckboxGroupItem(props: CheckboxGroupItemProps): Element {
  const context = useGroup(
    "CheckboxGroupItem",
    untrack(() => props.__scopeCheckboxGroup),
  );
  const itemProps = omit(props, "class", "style", "children");
  return (
    <Show
      when={!!props.children}
      fallback={<ItemCheckbox {...props} />}
    >
      <Text
        as="label"
        size={context.size}
        class={["rt-CheckboxGroupItem", props.class]}
        style={props.style}
      >
        <ItemCheckbox {...itemProps} />
        <span class="rt-CheckboxGroupItemInner">{props.children}</span>
      </Text>
    </Show>
  );
}
export { CheckboxGroupRoot as Root, CheckboxGroupItem as Item };
export type {
  CheckboxGroupRootProps as RootProps,
  CheckboxGroupItemProps as ItemProps,
};
