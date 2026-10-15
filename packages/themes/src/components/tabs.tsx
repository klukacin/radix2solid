import * as TabsPrimitive from "@wsagency/radix2solid-primitives/tabs";
import { omit, type Element } from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import { marginPropDefs, type MarginProps } from "../props/margin.props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import {
  tabsListPropDefs,
  tabsRootPropDefs,
  tabsContentPropDefs,
} from "./tabs.props.js";

type TabsRootProps = ComposedProps<
  Omit<TabsPrimitive.TabsProps, "color" | "defaultChecked"> &
    MarginProps &
    GetPropDefTypes<typeof tabsRootPropDefs>
>;
type TabsListProps = Omit<
  TabsPrimitive.TabsListProps,
  RemovedProps | "children"
> &
  MarginProps &
  GetPropDefTypes<typeof tabsListPropDefs> & { children?: Element };
type TabsTriggerProps = Omit<
  TabsPrimitive.TabsTriggerProps,
  RemovedProps | "children"
> & { children?: Element };
type TabsContentProps = ComposedProps<
  Omit<
    TabsPrimitive.TabsContentProps,
    "color" | "defaultValue" | "defaultChecked"
  > &
    MarginProps &
    GetPropDefTypes<typeof tabsContentPropDefs>
>;
function TabsRoot(props: TabsRootProps): Element {
  const parsed = extractProps(props, marginPropDefs);
  const rootProps = omit(parsed, "class") as TabsPrimitive.TabsProps;
  return (
    <TabsPrimitive.Root
      {...rootProps}
      class={["rt-TabsRoot", parsed.class]}
    />
  );
}
function TabsList(props: TabsListProps): Element {
  const parsed = extractProps(props, tabsListPropDefs, marginPropDefs);
  const listProps = omit(parsed, "class", "color");
  return (
    <TabsPrimitive.List
      {...listProps}
      asChild={false}
      data-accent-color={parsed.color}
      class={["rt-BaseTabList", "rt-TabsList", parsed.class]}
    />
  );
}
function TabsTrigger(props: TabsTriggerProps): Element {
  const triggerProps = omit(props, "class", "children");
  return (
    <TabsPrimitive.Trigger
      {...triggerProps}
      asChild={false}
      class={[
        "rt-reset",
        "rt-BaseTabListTrigger",
        "rt-TabsTrigger",
        props.class,
      ]}
    >
      <span class="rt-BaseTabListTriggerInner rt-TabsTriggerInner">
        {props.children}
      </span>
      <span class="rt-BaseTabListTriggerInnerHidden rt-TabsTriggerInnerHidden">
        {props.children}
      </span>
    </TabsPrimitive.Trigger>
  );
}
function TabsContent(props: TabsContentProps): Element {
  const parsed = extractProps(props, marginPropDefs);
  const contentProps = omit(parsed, "class") as TabsPrimitive.TabsContentProps;
  return (
    <TabsPrimitive.Content
      {...contentProps}
      class={["rt-TabsContent", parsed.class]}
    />
  );
}
export {
  TabsRoot as Root,
  TabsList as List,
  TabsTrigger as Trigger,
  TabsContent as Content,
};
export type {
  TabsRootProps as RootProps,
  TabsListProps as ListProps,
  TabsTriggerProps as TriggerProps,
  TabsContentProps as ContentProps,
};
