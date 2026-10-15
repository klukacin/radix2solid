import * as Native from "@wsagency/radix2solid-primitives/dropdown-menu";
import {
  Slottable,
  type SlotRender,
} from "@wsagency/radix2solid-primitives/slot";
import {
  createContext,
  merge,
  omit,
  Show,
  untrack,
  useContext,
  type Element,
} from "solid-js";

import type {
  ComposedProps,
  RemovedProps,
} from "../helpers/component-props.js";
import { extractProps } from "../helpers/extract-props.js";
import type { GetPropDefTypes } from "../props/prop-def.js";
import { createMenuAlignOffset } from "./_internal/menu-align-offset.js";
import {
  dropdownMenuContentPropDefs,
  dropdownMenuItemPropDefs,
  dropdownMenuCheckboxItemPropDefs,
  dropdownMenuRadioItemPropDefs,
} from "./dropdown-menu.props.js";
import {
  ChevronDownIcon,
  ThickCheckIcon,
  ThickChevronRightIcon,
  type IconProps,
} from "./icons.js";
import { ScrollArea } from "./scroll-area.js";
import { Theme, useThemeContext } from "./theme.js";

type ContentSettings = GetPropDefTypes<typeof dropdownMenuContentPropDefs>;
const ContentContext = createContext<ContentSettings>({});
type DropdownMenuRootProps = Native.DropdownMenuProps;
type DropdownMenuTriggerProps = Omit<
  Native.DropdownMenuTriggerProps,
  RemovedProps | "children"
> & { children: SlotRender };
type DropdownMenuContentProps = Omit<
  Extract<Native.DropdownMenuContentProps, { asChild?: false }>,
  RemovedProps
> &
  ContentSettings & { container?: Native.DropdownMenuPortalProps["container"] };
type DropdownMenuItemProps = ComposedProps<
  Omit<Native.DropdownMenuItemProps, RemovedProps> &
    GetPropDefTypes<typeof dropdownMenuItemPropDefs>
>;
type DropdownMenuLabelProps = Omit<
  Extract<Native.DropdownMenuLabelProps, { asChild?: false }>,
  RemovedProps
>;
type DropdownMenuGroupProps = Omit<
  Extract<Native.DropdownMenuGroupProps, { asChild?: false }>,
  RemovedProps
>;
type DropdownMenuRadioGroupProps = Omit<
  Extract<Native.DropdownMenuRadioGroupProps, { asChild?: false }>,
  RemovedProps
>;
type DropdownMenuRadioItemProps = Omit<
  Extract<Native.DropdownMenuRadioItemProps, { asChild?: false }>,
  RemovedProps
> &
  GetPropDefTypes<typeof dropdownMenuRadioItemPropDefs>;
type DropdownMenuCheckboxItemProps = Omit<
  Extract<Native.DropdownMenuCheckboxItemProps, { asChild?: false }>,
  RemovedProps
> &
  GetPropDefTypes<typeof dropdownMenuCheckboxItemPropDefs>;
type DropdownMenuSubProps = Native.DropdownMenuSubProps;
type DropdownMenuSubTriggerProps = Omit<
  Extract<Native.DropdownMenuSubTriggerProps, { asChild?: false }>,
  RemovedProps
>;
type DropdownMenuSubContentProps = Omit<
  Extract<Native.DropdownMenuSubContentProps, { asChild?: false }>,
  RemovedProps
> & { container?: Native.DropdownMenuPortalProps["container"] };
type DropdownMenuSeparatorProps = Omit<
  Extract<Native.DropdownMenuSeparatorProps, { asChild?: false }>,
  RemovedProps
>;
function DropdownMenuRoot(props: DropdownMenuRootProps): Element {
  return <Native.Root {...props} />;
}
function DropdownMenuTrigger(props: DropdownMenuTriggerProps): Element {
  return (
    <Native.Trigger
      {...props}
      asChild
    />
  );
}
function DropdownMenuSub(props: DropdownMenuSubProps): Element {
  return <Native.Sub {...props} />;
}
function DropdownMenuContent(props: DropdownMenuContentProps): Element {
  const theme = useThemeContext(),
    parsed = extractProps(props, dropdownMenuContentPropDefs);
  const settings: ContentSettings = {
    get size() {
      return props.size ?? dropdownMenuContentPropDefs.size.default;
    },
    get variant() {
      return props.variant ?? dropdownMenuContentPropDefs.variant.default;
    },
    get highContrast() {
      return (
        props.highContrast ?? dropdownMenuContentPropDefs.highContrast.default
      );
    },
    get color() {
      return parsed.color || theme.accentColor;
    },
  };
  const forwarded = merge(
    { align: "start" as const, sideOffset: 4, collisionPadding: 10 },
    omit(parsed, "children", "class", "color", "container", "forceMount"),
    {
      asChild: false as const,
      get ["data-accent-color"]() {
        return settings.color;
      },
      get class() {
        return [
          "rt-PopperContent",
          "rt-BaseMenuContent",
          "rt-DropdownMenuContent",
          parsed.class,
        ];
      },
      get children() {
        return (
          <ScrollArea type="auto">
            <div class="rt-BaseMenuViewport rt-DropdownMenuViewport">
              <ContentContext value={settings}>{props.children}</ContentContext>
            </div>
          </ScrollArea>
        );
      },
    },
  );
  return (
    <Native.Portal
      container={props.container}
      forceMount={props.forceMount}
    >
      <Theme asChild>{(target) => target(Native.Content, forwarded)}</Theme>
    </Native.Portal>
  );
}
function DropdownMenuSubContent(props: DropdownMenuSubContentProps): Element {
  const settings = useContext(ContentContext),
    parsed = extractProps(merge(settings, props), dropdownMenuContentPropDefs);
  const alignment = createMenuAlignOffset(() => parsed.class);
  const forwarded = merge(
    {
      get alignOffset() {
        return alignment.offset();
      },
      sideOffset: 1,
      collisionPadding: 10,
    },
    omit(parsed, "children", "class", "color", "container", "forceMount"),
    {
      asChild: false as const,
      get ["data-accent-color"]() {
        return settings.color;
      },
      get class() {
        return [
          "rt-PopperContent",
          "rt-BaseMenuContent",
          "rt-BaseMenuSubContent",
          "rt-DropdownMenuContent",
          "rt-DropdownMenuSubContent",
          parsed.class,
        ];
      },
      get children() {
        return (
          <ScrollArea type="auto">
            <alignment.Viewport class="rt-BaseMenuViewport rt-DropdownMenuViewport">
              {props.children}
            </alignment.Viewport>
          </ScrollArea>
        );
      },
    },
  );
  return (
    <Native.Portal
      container={props.container}
      forceMount={props.forceMount}
    >
      <Theme asChild>{(target) => target(Native.SubContent, forwarded)}</Theme>
    </Native.Portal>
  );
}
function DropdownMenuItem(props: DropdownMenuItemProps): Element {
  const shortcut = (
    <Show when={props.shortcut}>
      <div class="rt-BaseMenuShortcut rt-DropdownMenuShortcut">
        {props.shortcut}
      </div>
    </Show>
  );
  const child = untrack(() => props.asChild)
    ? Slottable({
        child: untrack(() => props.children) as SlotRender,
        trailing: shortcut,
      })
    : undefined;
  const content = (): Element => (
    <>
      {props.children as Element}
      {shortcut}
    </>
  );
  const forwarded = merge(
    omit(props, "class", "children", "color", "shortcut"),
    {
      get ["data-accent-color"]() {
        return props.color;
      },
      get class() {
        return [
          "rt-reset",
          "rt-BaseMenuItem",
          "rt-DropdownMenuItem",
          props.class,
        ];
      },
      get children() {
        return child ?? content();
      },
    },
  ) as Native.DropdownMenuItemProps;
  return <Native.Item {...forwarded} />;
}
function DropdownMenuCheckboxItem(
  props: DropdownMenuCheckboxItemProps,
): Element {
  const forwarded = merge(
    omit(props, "class", "children", "color", "shortcut"),
    {
      get ["data-accent-color"]() {
        return props.color;
      },
      get class() {
        return [
          "rt-BaseMenuItem",
          "rt-BaseMenuCheckboxItem",
          "rt-DropdownMenuItem",
          "rt-DropdownMenuCheckboxItem",
          props.class,
        ];
      },
    },
  );
  return (
    <Native.CheckboxItem
      {...forwarded}
      asChild={false}
    >
      {props.children}
      <Native.ItemIndicator class="rt-BaseMenuItemIndicator rt-DropdownMenuItemIndicator">
        <ThickCheckIcon class="rt-BaseMenuItemIndicatorIcon rt-ContextMenuItemIndicatorIcon" />
      </Native.ItemIndicator>
      <Show when={props.shortcut}>
        <div class="rt-BaseMenuShortcut rt-DropdownMenuShortcut">
          {props.shortcut}
        </div>
      </Show>
    </Native.CheckboxItem>
  );
}
function DropdownMenuRadioItem(props: DropdownMenuRadioItemProps): Element {
  const forwarded = merge(omit(props, "class", "children", "color"), {
    get ["data-accent-color"]() {
      return props.color;
    },
    get class() {
      return [
        "rt-BaseMenuItem",
        "rt-BaseMenuRadioItem",
        "rt-DropdownMenuItem",
        "rt-DropdownMenuRadioItem",
        props.class,
      ];
    },
  });
  return (
    <Native.RadioItem
      {...forwarded}
      asChild={false}
    >
      {props.children}
      <Native.ItemIndicator class="rt-BaseMenuItemIndicator rt-DropdownMenuItemIndicator">
        <ThickCheckIcon class="rt-BaseMenuItemIndicatorIcon rt-DropdownMenuItemIndicatorIcon" />
      </Native.ItemIndicator>
    </Native.RadioItem>
  );
}
function DropdownMenuSubTrigger(props: DropdownMenuSubTriggerProps): Element {
  const forwarded = merge(omit(props, "class", "children"), {
    get class() {
      return [
        "rt-BaseMenuItem",
        "rt-BaseMenuSubTrigger",
        "rt-DropdownMenuItem",
        "rt-DropdownMenuSubTrigger",
        props.class,
      ];
    },
  });
  return (
    <Native.SubTrigger
      {...forwarded}
      asChild={false}
    >
      {props.children}
      <div class="rt-BaseMenuShortcut rt-DropdownMenuShortcut">
        <ThickChevronRightIcon class="rt-BaseMenuSubTriggerIcon rt-DropdownMenuSubtriggerIcon" />
      </div>
    </Native.SubTrigger>
  );
}
function DropdownMenuLabel(props: DropdownMenuLabelProps): Element {
  const forwarded = merge(props, {
    get class() {
      return ["rt-BaseMenuLabel", "rt-DropdownMenuLabel", props.class];
    },
  });
  return (
    <Native.Label
      {...forwarded}
      asChild={false}
    />
  );
}
function DropdownMenuGroup(props: DropdownMenuGroupProps): Element {
  const forwarded = merge(props, {
    get class() {
      return ["rt-BaseMenuGroup", "rt-DropdownMenuGroup", props.class];
    },
  });
  return (
    <Native.Group
      {...forwarded}
      asChild={false}
    />
  );
}
function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps): Element {
  const forwarded = merge(props, {
    get class() {
      return [
        "rt-BaseMenuRadioGroup",
        "rt-DropdownMenuRadioGroup",
        props.class,
      ];
    },
  });
  return (
    <Native.RadioGroup
      {...forwarded}
      asChild={false}
    />
  );
}
function DropdownMenuSeparator(props: DropdownMenuSeparatorProps): Element {
  const forwarded = merge(props, {
    get class() {
      return ["rt-BaseMenuSeparator", "rt-DropdownMenuSeparator", props.class];
    },
  });
  return (
    <Native.Separator
      {...forwarded}
      asChild={false}
    />
  );
}
export {
  DropdownMenuRoot as Root,
  DropdownMenuTrigger as Trigger,
  ChevronDownIcon as TriggerIcon,
  DropdownMenuContent as Content,
  DropdownMenuItem as Item,
  DropdownMenuLabel as Label,
  DropdownMenuGroup as Group,
  DropdownMenuRadioGroup as RadioGroup,
  DropdownMenuRadioItem as RadioItem,
  DropdownMenuCheckboxItem as CheckboxItem,
  DropdownMenuSub as Sub,
  DropdownMenuSubTrigger as SubTrigger,
  DropdownMenuSubContent as SubContent,
  DropdownMenuSeparator as Separator,
};
export type {
  DropdownMenuRootProps as RootProps,
  DropdownMenuTriggerProps as TriggerProps,
  IconProps as TriggerIconProps,
  DropdownMenuContentProps as ContentProps,
  DropdownMenuItemProps as ItemProps,
  DropdownMenuLabelProps as LabelProps,
  DropdownMenuGroupProps as GroupProps,
  DropdownMenuRadioGroupProps as RadioGroupProps,
  DropdownMenuRadioItemProps as RadioItemProps,
  DropdownMenuCheckboxItemProps as CheckboxItemProps,
  DropdownMenuSubProps as SubProps,
  DropdownMenuSubTriggerProps as SubTriggerProps,
  DropdownMenuSubContentProps as SubContentProps,
  DropdownMenuSeparatorProps as SeparatorProps,
};
