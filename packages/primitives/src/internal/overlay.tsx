import type { ReferenceElement } from "@floating-ui/dom";
import { isServer, Portal as NativePortal } from "@solidjs/web";
// Native port of Radix Dialog/Popover compounds; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createEffect,
  createSignal,
  createUniqueId,
  merge,
  omit,
  onCleanup,
  Show,
  untrack,
  type Element,
} from "solid-js";

import { mergeStyles } from "../slot/slot.js";
import { createContextScope, type Scope } from "./context.js";
import {
  createLayer,
  LayerContext,
  type LayerCallbacks,
} from "./dismissable-layer.js";
import { composeEventHandlers } from "./events.js";
import {
  Popper,
  PopperContent,
  usePopper,
  createPopperScope,
  type PopperContentProps,
} from "./popper.js";
import { createPresence } from "./presence.js";
import { Primitive, type PrimitiveProps } from "./primitive.js";
import { composeRefs } from "./refs.js";
import { createControllableState } from "./state.js";

type Scoped = { __scopeDialog?: Scope; __scopePopover?: Scope };
export type OverlayRootProps = Scoped & {
  children?: Element;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
};
export type OverlayButtonProps = Scoped & PrimitiveProps<"button">;
export type OverlayPortalProps = Scoped & {
  children?: Element;
  container?: globalThis.Element | DocumentFragment | null;
  forceMount?: true;
};
export type OverlayContentProps = Scoped &
  PopperContentProps &
  LayerCallbacks & { forceMount?: true };
export type OverlayPartProps<T extends "div" | "h2" | "p"> = Scoped &
  PrimitiveProps<T>;
export type OverlayOverlayProps = OverlayPartProps<"div"> & {
  forceMount?: true;
};
interface OverlayValue {
  open: () => boolean;
  setOpen: (open: boolean | ((previous: boolean) => boolean)) => void;
  modal: () => boolean;
  trigger: () => HTMLButtonElement | undefined;
  setTrigger: (node: HTMLButtonElement | undefined) => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  surfaces: Set<HTMLElement>;
  customAnchor: () => ReferenceElement | undefined;
  setCustomAnchor: (node: ReferenceElement | undefined) => void;
}
const callbacks = [
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "onFocusOutside",
  "onInteractOutside",
  "onOpenAutoFocus",
  "onCloseAutoFocus",
] as const;

/** Both compounds share lifecycle and ownership; only positioning and modal defaults differ. */
export function createOverlay(
  name: "Dialog" | "Popover",
  defaultModal: boolean,
) {
  const positioned = name === "Popover";
  const scopeKey = name === "Dialog" ? "__scopeDialog" : "__scopePopover";
  const [createContext, createScope] = createContextScope(
    name,
    positioned ? [createPopperScope] : [],
  );
  const [Provider, useOverlay] = createContext<OverlayValue>(name);
  const [PortalProvider, usePortal] = createContext<{
    forceMount: () => boolean;
  }>(`${name}Portal`, { forceMount: () => false });
  const scope = (props: Scoped) => untrack(() => props[scopeKey]);
  const context = (props: Scoped, part: string) =>
    useOverlay(`${name}${part}`, scope(props));
  function Root(props: OverlayRootProps): Element {
    const [open, setOpen] = createControllableState({
      value: () => props.open,
      get defaultValue() {
        return props.defaultOpen ?? false;
      },
      get onChange() {
        return props.onOpenChange;
      },
    });
    const [trigger, setTrigger] = createSignal<HTMLButtonElement | undefined>();
    const [customAnchor, setCustomAnchor] = createSignal<
      ReferenceElement | undefined
    >();
    const value: OverlayValue = {
      open,
      setOpen,
      modal: () => props.modal ?? defaultModal,
      trigger,
      setTrigger,
      customAnchor,
      setCustomAnchor,
      contentId: createUniqueId(),
      titleId: createUniqueId(),
      descriptionId: createUniqueId(),
      surfaces: new Set(),
    };
    const children = () => (
      <Provider
        scope={scope(props)}
        value={value}
      >
        {props.children}
      </Provider>
    );
    const renderTree = () =>
      positioned ? (
        <Popper __scopePopper={scope(props)}>{children()}</Popper>
      ) : (
        children()
      );
    return renderTree();
  }
  function Trigger(props: OverlayButtonProps): Element {
    const root = context(props, "Trigger");
    const popper = positioned ? usePopper(scope(props)) : undefined;
    const forwarded = merge(
      {
        "aria-haspopup": "dialog" as const,
        get ["aria-expanded"]() {
          return root.open() ? "true" : "false";
        },
        get ["aria-controls"]() {
          return root.open() ? root.contentId : undefined;
        },
        get ["data-state"]() {
          return root.open() ? "open" : "closed";
        },
      },
      omit(props, "__scopeDialog", "__scopePopover"),
      {
        get type() {
          return props.type ?? "button";
        },
        get ref() {
          return composeRefs(props.ref, root.setTrigger);
        },
        onClick: composeEventHandlers<MouseEvent>(
          () => props.onClick,
          () => root.setOpen((previous) => !previous),
        ),
      },
    );
    if (popper && !isServer)
      createEffect(
        () => root.customAnchor() ?? root.trigger(),
        (anchor) => {
          popper.setAnchor(anchor);
          return () => {
            if (untrack(popper.anchor) === anchor) popper.setAnchor(undefined);
          };
        },
        { transparent: true },
      );
    return (
      <Primitive
        as="button"
        {...forwarded}
      />
    );
  }
  function Portal(props: OverlayPortalProps): Element {
    context(props, "Portal");
    const portalProps = merge(
      {
        get mount() {
          return props.container ?? undefined;
        },
      },
      {
        get children() {
          return (
            <PortalProvider
              scope={scope(props)}
              value={{ forceMount: () => props.forceMount ?? false }}
            >
              {props.children}
            </PortalProvider>
          );
        },
      },
    ) as Parameters<typeof NativePortal>[0];
    return <NativePortal {...portalProps} />;
  }
  function Content(props: OverlayContentProps): Element {
    const root = context(props, "Content");
    const portal = usePortal(`${name}Content`, scope(props));
    const presence = createPresence(
      root.open,
      () => props.forceMount ?? portal.forceMount(),
    );
    function Mounted(): Element {
      const [node, ref] = createSignal<HTMLElement | undefined>();
      const layer = createLayer(
        node,
        merge(omit(props, "__scopeDialog", "__scopePopover", "forceMount"), {
          active: root.open,
          modal: root.modal,
          trigger: root.trigger,
          dismiss: () => root.setOpen(false),
          kind: positioned ? ("popover" as const) : ("dialog" as const),
          surfaces: root.surfaces,
        }),
      );
      if (!isServer) onCleanup(() => presence.ref(undefined));
      function renderContent(): Element {
        const forwarded = merge(
          { role: "dialog" as const, tabIndex: -1, id: root.contentId },
          omit(
            props,
            "__scopeDialog",
            "__scopePopover",
            "forceMount",
            ...callbacks,
          ),
          {
            get ["aria-labelledby"]() {
              if ("aria-labelledby" in props) return props["aria-labelledby"];
              const label = props["aria-label"];
              return typeof label === "string" && label.trim()
                ? undefined
                : root.titleId;
            },
            get ["aria-describedby"]() {
              return "aria-describedby" in props
                ? props["aria-describedby"]
                : root.descriptionId;
            },
            get ["aria-modal"]() {
              if ("aria-modal" in props) return props["aria-modal"];
              return root.open() && root.modal() ? "true" : undefined;
            },
            get ["data-state"]() {
              return root.open() ? "open" : "closed";
            },
            get ref() {
              return composeRefs(props.ref, ref, presence.ref);
            },
          },
        ) as PrimitiveProps<"div">;
        const popperProps = merge(forwarded, {
          get __scopePopper() {
            return scope(props);
          },
          get style() {
            return mergeStyles(
              {
                "--radix-popover-content-transform-origin":
                  "var(--radix-popper-transform-origin)",
                "--radix-popover-content-available-width":
                  "var(--radix-popper-available-width)",
                "--radix-popover-content-available-height":
                  "var(--radix-popper-available-height)",
                "--radix-popover-trigger-width":
                  "var(--radix-popper-anchor-width)",
                "--radix-popover-trigger-height":
                  "var(--radix-popper-anchor-height)",
              },
              props.style,
            );
          },
        });
        return positioned ? (
          <PopperContent {...popperProps} />
        ) : (
          <Primitive
            as="div"
            {...forwarded}
          />
        );
      }
      return <LayerContext value={layer}>{renderContent()}</LayerContext>;
    }
    return (
      <Show when={presence.mounted()}>
        <Mounted />
      </Show>
    );
  }
  function Overlay(props: OverlayOverlayProps): Element {
    const root = context(props, "Overlay");
    const portal = usePortal(`${name}Overlay`, scope(props));
    const presence = createPresence(
      () => root.open() && root.modal(),
      () => root.modal() && (props.forceMount ?? portal.forceMount()),
    );
    function Mounted(): Element {
      const [node, ref] = createSignal<HTMLElement | undefined>();
      if (!isServer)
        createEffect(
          node,
          (element) => {
            if (!element) return;
            root.surfaces.add(element);
            return () => {
              root.surfaces.delete(element);
            };
          },
          { transparent: true },
        );
      if (!isServer) onCleanup(() => presence.ref(undefined));
      const forwarded = merge(
        omit(props, "__scopeDialog", "__scopePopover", "forceMount"),
        {
          get ["data-state"]() {
            return root.open() ? "open" : "closed";
          },
          get ref() {
            return composeRefs(props.ref, ref, presence.ref);
          },
          get style() {
            return mergeStyles({ "pointer-events": "auto" }, props.style);
          },
        },
      );
      return (
        <Primitive
          as="div"
          {...forwarded}
        />
      );
    }
    return (
      <Show when={presence.mounted()}>
        <Mounted />
      </Show>
    );
  }
  function Title(props: OverlayPartProps<"h2">): Element {
    const root = context(props, "Title");
    const forwarded = merge(
      { id: root.titleId },
      omit(props, "__scopeDialog", "__scopePopover"),
    );
    return (
      <Primitive
        as="h2"
        {...forwarded}
      />
    );
  }
  function Description(props: OverlayPartProps<"p">): Element {
    const root = context(props, "Description");
    const forwarded = merge(
      { id: root.descriptionId },
      omit(props, "__scopeDialog", "__scopePopover"),
    );
    return (
      <Primitive
        as="p"
        {...forwarded}
      />
    );
  }
  function Close(props: OverlayButtonProps): Element {
    const root = context(props, "Close");
    const forwarded = merge(omit(props, "__scopeDialog", "__scopePopover"), {
      get type() {
        return props.type ?? "button";
      },
      onClick: composeEventHandlers<MouseEvent>(
        () => props.onClick,
        () => root.setOpen(false),
      ),
    });
    return (
      <Primitive
        as="button"
        {...forwarded}
      />
    );
  }
  return {
    Root,
    Trigger,
    Portal,
    Content,
    Overlay,
    Title,
    Description,
    Close,
    createScope,
    context,
    scope,
  };
}
