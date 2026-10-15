import { isServer, Portal } from "@solidjs/web";
// Native Radix Toast port; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createEffect,
  createSignal,
  merge,
  omit,
  onCleanup,
  Show,
  untrack,
  type Accessor,
  type Element,
} from "solid-js";

import { createCollection } from "../internal/collection.js";
import { createContextScope, type Scope } from "../internal/context.js";
import {
  createLayer,
  registerLayerBranch,
} from "../internal/dismissable-layer.js";
import {
  composeEventHandlers,
  dispatchCancelableEvent,
} from "../internal/events.js";
import {
  activeElement,
  composedContains,
  focus,
  tabbables,
} from "../internal/focus-scope.js";
import { createPresence } from "../internal/presence.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import { createControllableState } from "../internal/state.js";
import { mergeStyles } from "../slot/slot.js";
import { VISUALLY_HIDDEN_STYLES } from "../visually-hidden/visually-hidden.js";

type Scoped = { __scopeToast?: Scope };
type SwipeDirection = "up" | "down" | "left" | "right";
type SwipeEvent = CustomEvent<{
  originalEvent: PointerEvent;
  delta: { x: number; y: number };
}> & { currentTarget: HTMLLIElement };
export type ToastProviderProps = Scoped & {
  children?: Element;
  label?: string;
  duration?: number;
  swipeDirection?: SwipeDirection;
  swipeThreshold?: number;
  announcerContainer?: globalThis.Element | DocumentFragment;
};
export type ToastViewportProps = PrimitiveProps<"ol"> &
  Scoped & { hotkey?: string[]; label?: string };
type ToastHost<P> = P extends unknown ? Omit<P, "type"> : never;
export type ToastProps = ToastHost<PrimitiveProps<"li">> &
  Scoped & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    forceMount?: true;
    type?: "foreground" | "background";
    duration?: number;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onPause?: () => void;
    onResume?: () => void;
    onSwipeStart?: (event: SwipeEvent) => void;
    onSwipeMove?: (event: SwipeEvent) => void;
    onSwipeCancel?: (event: SwipeEvent) => void;
    onSwipeEnd?: (event: SwipeEvent) => void;
  };
export type ToastTitleProps = PrimitiveProps<"div"> & Scoped;
export type ToastDescriptionProps = PrimitiveProps<"div"> & Scoped;
export type ToastCloseProps = PrimitiveProps<"button"> & Scoped;
export type ToastActionProps = ToastCloseProps & { altText: string };
const [createToastContext, createToastScope] = createContextScope("Toast");
export { createToastScope };
type Item = { escape: (event: KeyboardEvent) => void };
const [Provider, useToast] = createToastContext<{
  label: Accessor<string>;
  duration: Accessor<number>;
  direction: Accessor<SwipeDirection>;
  threshold: Accessor<number>;
  announcer: Accessor<globalThis.Element | DocumentFragment | undefined>;
  viewport: Accessor<HTMLElement | undefined>;
  viewportRef: (node: HTMLElement | undefined) => void;
  paused: Accessor<boolean>;
  pause: (value: boolean) => void;
  collection: ReturnType<typeof createCollection<Item>>;
}>("ToastProvider");
const [InteractiveProvider, useInteractive] = createToastContext<{
  close: () => void;
}>("Toast", { close() {} });

export function ToastProvider(props: ToastProviderProps): Element {
  const scope = untrack(() => props.__scopeToast);
  const [viewport, viewportRef] = createSignal<HTMLElement | undefined>(),
    [paused, pause] = createSignal(false);
  const collection = createCollection<Item>();
  if (!isServer)
    createEffect(
      () => props.label,
      (label) => {
        if (label !== undefined && !label.trim())
          console.error("ToastProvider label must be non-empty.");
      },
      { transparent: true },
    );
  const value = {
    viewport,
    viewportRef,
    paused,
    pause,
    collection,
    label: () => props.label ?? "Notification",
    duration: () => props.duration ?? 5000,
    direction: () => props.swipeDirection ?? "right",
    threshold: () => props.swipeThreshold ?? 50,
    announcer: () => props.announcerContainer,
  };
  return (
    <Provider
      scope={scope}
      value={value}
    >
      {props.children}
    </Provider>
  );
}

export function ToastViewport(props: ToastViewportProps): Element {
  const scope = untrack(() => props.__scopeToast),
    context = useToast("ToastViewport", scope)!;
  const [wrapper, wrapperRef] = createSignal<HTMLElement | undefined>();
  const count = () => context.collection.items().length;
  const candidates = (backwards = false) => {
    const groups = context.collection
      .items(context.viewport())
      .reverse()
      .map(({ node }) => [node, ...tabbables(node)]);
    return backwards
      ? groups.reverse().flatMap((group) => group.reverse())
      : groups.flat();
  };
  const tryFocus = (nodes: HTMLElement[]) => {
    const view = context.viewport();
    if (!view) return;
    const previous = activeElement(view.ownerDocument);
    for (const node of nodes) {
      focus(node);
      if (activeElement(view.ownerDocument) !== previous) return;
    }
  };
  const escape = (event: KeyboardEvent) => {
    const view = context.viewport();
    if (!view) return false;
    const focused = context.collection
      .items(view)
      .find(({ node }) =>
        composedContains(node, activeElement(view.ownerDocument)),
      );
    if (!focused) return false;
    focused.value.escape(event);
    event.preventDefault();
    return true;
  };
  const keydown = composeEventHandlers<KeyboardEvent>(
    () => props.onKeyDown,
    (event) => {
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey)
        return;
      const all = candidates(event.shiftKey),
        current = activeElement(
          (event.currentTarget as HTMLElement).ownerDocument,
        );
      if (event.shiftKey && current === context.viewport()) return;
      const next =
        current === context.viewport()
          ? all
          : all.slice(all.indexOf(current!) + 1);
      if (next.length) {
        event.preventDefault();
        tryFocus(next);
      }
    },
  );
  if (!isServer)
    createEffect(
      () => [wrapper(), context.viewport()] as const,
      ([element, view]) => {
        if (!element || !view) return;
        const doc = element.ownerDocument,
          win = doc.defaultView!;
        const unregister = registerLayerBranch(element, escape);
        let pointer = false,
          focused = element.contains(activeElement(doc)),
          blurred = !doc.hasFocus();
        const sync = () => context.pause(pointer || focused || blurred);
        const enter = () => {
            pointer = true;
            sync();
          },
          leave = () => {
            pointer = false;
            sync();
          };
        const focusIn = () => {
          focused = true;
          sync();
        };
        const focusOut = (event: FocusEvent) => {
          focused = composedContains(
            element,
            event.relatedTarget as Node | null,
          );
          sync();
        };
        const blur = () => {
            blurred = true;
            sync();
          },
          resume = () => {
            blurred = false;
            sync();
          };
        const hotkey = (event: KeyboardEvent) => {
          const keys = props.hotkey ?? ["F8"];
          if (
            count() &&
            keys.length &&
            keys.every((key) =>
              key === "altKey" ||
              key === "ctrlKey" ||
              key === "metaKey" ||
              key === "shiftKey"
                ? event[key]
                : event.code === key,
            )
          ) {
            focus(view);
            event.preventDefault();
          }
        };
        element.addEventListener("pointerenter", enter);
        element.addEventListener("pointerleave", leave);
        element.addEventListener("focusin", focusIn);
        element.addEventListener("focusout", focusOut);
        win.addEventListener("blur", blur);
        win.addEventListener("focus", resume);
        doc.addEventListener("keydown", hotkey);
        view.addEventListener("keydown", keydown);
        untrack(sync);
        return () => {
          unregister();
          element.removeEventListener("pointerenter", enter);
          element.removeEventListener("pointerleave", leave);
          element.removeEventListener("focusin", focusIn);
          element.removeEventListener("focusout", focusOut);
          win.removeEventListener("blur", blur);
          win.removeEventListener("focus", resume);
          doc.removeEventListener("keydown", hotkey);
          view.removeEventListener("keydown", keydown);
          context.pause(false);
        };
      },
      { transparent: true },
    );
  const proxy = (backwards: boolean) => (
    <span
      tabindex={count() ? 0 : -1}
      aria-hidden="true"
      style={VISUALLY_HIDDEN_STYLES}
      onFocus={(event) => {
        if (
          !composedContains(
            context.viewport()!,
            event.relatedTarget as Node | null,
          )
        )
          tryFocus(candidates(backwards));
      }}
    />
  );
  const forwarded = merge(
    omit(props, "__scopeToast", "hotkey", "label", "onKeyDown"),
    {
      get ref() {
        return composeRefs(context.viewportRef, props.ref);
      },
      tabindex: -1,
    },
  );
  return (
    <div
      ref={wrapperRef}
      role="region"
      tabindex={-1}
      aria-label={(props.label ?? "Notifications ({hotkey})").replace(
        "{hotkey}",
        (props.hotkey ?? ["F8"]).join("+").replace(/Key|Digit/g, ""),
      )}
      style={{ "pointer-events": count() ? "auto" : "none" }}
    >
      {proxy(false)}
      <Primitive
        as="ol"
        {...forwarded}
      />
      {proxy(true)}
    </div>
  );
}

function announce(
  node: HTMLElement,
  label: string,
  priority: "assertive" | "polite",
  container?: globalThis.Element | DocumentFragment,
) {
  const doc = node.ownerDocument,
    win = doc.defaultView!,
    region = doc.createElement("span");
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", priority);
  region.setAttribute("aria-atomic", "true");
  Object.assign(region.style, VISUALLY_HIDDEN_STYLES);
  (container ?? doc.body).append(region);
  const unregister = registerLayerBranch(region);
  let frame = 0,
    timer = 0;
  const text = (element: Node): string => {
    if (element.nodeType === 3) return element.textContent ?? "";
    if (element.nodeType !== 1) return "";
    const host = element as HTMLElement;
    if (
      host.hidden ||
      host.getAttribute("aria-hidden") === "true" ||
      win.getComputedStyle(host).display === "none" ||
      win.getComputedStyle(host).visibility === "hidden"
    )
      return "";
    if (host.hasAttribute("data-radix-toast-announce-exclude"))
      return host.getAttribute("data-radix-toast-announce-alt") ?? "";
    return [...host.childNodes].map(text).join(" ");
  };
  frame = win.requestAnimationFrame(() => {
    frame = win.requestAnimationFrame(() => {
      region.textContent = `${label} ${text(node)}`;
      timer = win.setTimeout(() => {
        unregister();
        region.remove();
      }, 1000);
    });
  });
  return () => {
    win.cancelAnimationFrame(frame);
    win.clearTimeout(timer);
    unregister();
    region.remove();
  };
}

export function Toast(props: ToastProps): Element {
  const scope = untrack(() => props.__scopeToast),
    context = useToast("Toast", scope)!;
  const [open, setOpen] = createControllableState({
    value: () => props.open,
    get defaultValue() {
      return props.defaultOpen ?? true;
    },
    get onChange() {
      return props.onOpenChange;
    },
  });
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const presence = createPresence(open, () => props.forceMount === true);
  const close = () => {
    const element = node();
    if (
      element &&
      composedContains(element, activeElement(element.ownerDocument))
    )
      focus(context.viewport());
    setOpen(false);
  };
  const escape = (event: KeyboardEvent) => {
    props.onEscapeKeyDown?.(event);
    if (!event.defaultPrevented) close();
  };
  createLayer(node, {
    active: () => open(),
    modal: () => false,
    trigger: () => undefined,
    dismiss: close,
    kind: "layer",
    focusScope: false,
    loopFocus: false,
    onEscapeKeyDown: (event) => props.onEscapeKeyDown?.(event),
    onPointerDownOutside: (event) => event.preventDefault(),
    onFocusOutside: (event) => event.preventDefault(),
  });
  if (!isServer) {
    createEffect(
      node,
      (element) => {
        if (element)
          return untrack(() =>
            context.collection.register(element, { escape }),
          );
      },
      { transparent: true },
    );
    let remaining = Infinity,
      lastDuration = Infinity,
      wasOpen = false,
      wasPaused = untrack(context.paused);
    createEffect(
      () =>
        [
          node(),
          open(),
          props.duration || context.duration(),
          context.paused(),
        ] as const,
      ([element, opened, duration, paused]) => {
        if (!element || !opened) {
          wasOpen = false;
          wasPaused = paused;
          return;
        }
        if (!wasOpen || duration !== lastDuration) remaining = duration;
        if (wasOpen && paused !== wasPaused) {
          if (paused) props.onPause?.();
          else props.onResume?.();
        }
        wasOpen = true;
        wasPaused = paused;
        lastDuration = duration;
        if (!duration || paused || !Number.isFinite(remaining)) return;
        const win = element.ownerDocument.defaultView!,
          started = win.performance.now();
        const timer = win.setTimeout(close, Math.max(0, remaining));
        return () => {
          win.clearTimeout(timer);
          remaining = Math.max(
            0,
            remaining - (win.performance.now() - started),
          );
        };
      },
      { transparent: true },
    );
    createEffect(
      () => [node(), open(), props.type, context.announcer()] as const,
      ([element, opened, type, container]) => {
        if (element && opened)
          return announce(
            element,
            untrack(context.label),
            type === "background" ? "polite" : "assertive",
            container,
          );
      },
      { transparent: true },
    );
  }
  let pointer:
    | {
        id: number;
        x: number;
        y: number;
        started: boolean;
        cancelled: boolean;
        delta: { x: number; y: number };
      }
    | undefined;
  let clickNode: HTMLElement | undefined;
  const clearClick = () => {
    clickNode?.removeEventListener("click", suppressClick, true);
    clickNode = undefined;
  };
  const suppressClick = (event: MouseEvent) => {
    clearClick();
    event.preventDefault();
    event.stopPropagation();
  };
  const swipe = (
    phase: "start" | "move" | "cancel" | "end",
    original: PointerEvent,
    delta: { x: number; y: number },
  ) => {
    const element = original.currentTarget as HTMLElement,
      win = element.ownerDocument.defaultView!;
    const event = new win.CustomEvent(
      `toast.swipe${phase[0]!.toUpperCase()}${phase.slice(1)}`,
      {
        bubbles: false,
        cancelable: true,
        detail: { originalEvent: original, delta },
      },
    ) as SwipeEvent;
    const consumer = {
      start: props.onSwipeStart,
      move: props.onSwipeMove,
      cancel: props.onSwipeCancel,
      end: props.onSwipeEnd,
    }[phase];
    dispatchCancelableEvent(element, event, consumer);
    if (event.defaultPrevented) return;
    element.setAttribute("data-swipe", phase);
    if (phase === "move") {
      element.style.setProperty("--radix-toast-swipe-move-x", `${delta.x}px`);
      element.style.setProperty("--radix-toast-swipe-move-y", `${delta.y}px`);
    }
    if (phase === "cancel" || phase === "end") {
      element.style.removeProperty("--radix-toast-swipe-move-x");
      element.style.removeProperty("--radix-toast-swipe-move-y");
    }
    if (phase === "end") {
      element.style.setProperty("--radix-toast-swipe-end-x", `${delta.x}px`);
      element.style.setProperty("--radix-toast-swipe-end-y", `${delta.y}px`);
      close();
    }
  };
  const end = (event: PointerEvent, cancelled = false) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const current = pointer;
    pointer = undefined;
    const element = event.currentTarget as HTMLElement;
    if (element.hasPointerCapture(event.pointerId))
      element.releasePointerCapture(event.pointerId);
    if (!current.started) return;
    if (!cancelled) {
      clearClick();
      clickNode = element;
      element.addEventListener("click", suppressClick, {
        once: true,
        capture: true,
      });
    }
    const distance = Math.max(
      Math.abs(current.delta.x),
      Math.abs(current.delta.y),
    );
    swipe(
      !cancelled && distance >= context.threshold() ? "end" : "cancel",
      event,
      current.delta,
    );
  };
  if (!isServer)
    createEffect(
      node,
      (element) => {
        if (element)
          return () => {
            if (pointer && element.hasPointerCapture(pointer.id))
              element.releasePointerCapture(pointer.id);
            pointer = undefined;
            clearClick();
          };
      },
      { transparent: true },
    );
  const forwarded = merge(
    omit(
      props,
      "__scopeToast",
      "open",
      "defaultOpen",
      "onOpenChange",
      "forceMount",
      "type",
      "duration",
      "onEscapeKeyDown",
      "onPause",
      "onResume",
      "onSwipeStart",
      "onSwipeMove",
      "onSwipeCancel",
      "onSwipeEnd",
    ),
    {
      get ref() {
        return composeRefs(ref, presence.ref, props.ref);
      },
      tabindex: 0,
      get "data-state"() {
        return open() ? "open" : "closed";
      },
      get "data-swipe-direction"() {
        return context.direction();
      },
      get style() {
        return mergeStyles(
          { "user-select": "none", "touch-action": "none" },
          props.style,
        );
      },
      onPointerDown: composeEventHandlers<PointerEvent>(
        () => props.onPointerDown,
        (event) => {
          if (event.button !== 0 || !open()) return;
          clearClick();
          pointer = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            started: false,
            cancelled: false,
            delta: { x: 0, y: 0 },
          };
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        () => props.onPointerMove,
        (event) => {
          if (!pointer || pointer.id !== event.pointerId || pointer.cancelled)
            return;
          const dx = event.clientX - pointer.x,
            dy = event.clientY - pointer.y,
            direction = context.direction(),
            horizontal = direction === "left" || direction === "right";
          const delta = {
            x: horizontal
              ? direction === "right"
                ? Math.max(0, dx)
                : Math.min(0, dx)
              : 0,
            y: horizontal
              ? 0
              : direction === "down"
                ? Math.max(0, dy)
                : Math.min(0, dy),
          };
          const buffer = event.pointerType === "touch" ? 10 : 2;
          if (
            !pointer.started &&
            Math.max(Math.abs(dx), Math.abs(dy)) > buffer
          ) {
            if (
              (horizontal
                ? Math.abs(dx) > Math.abs(dy)
                : Math.abs(dy) > Math.abs(dx)) &&
              Math.max(Math.abs(delta.x), Math.abs(delta.y)) > buffer
            ) {
              pointer.started = true;
              pointer.delta = delta;
              (event.currentTarget as HTMLElement).setPointerCapture(
                event.pointerId,
              );
              swipe("start", event, delta);
            } else pointer.cancelled = true;
          }
          if (pointer.started) {
            pointer.delta = delta;
            swipe("move", event, delta);
          }
        },
      ),
      onPointerUp: composeEventHandlers<PointerEvent>(
        () => props.onPointerUp,
        (event) => end(event),
      ),
      onPointerCancel: composeEventHandlers<PointerEvent>(
        () => props.onPointerCancel,
        (event) => end(event, true),
      ),
    },
  );
  function Mounted(): Element {
    if (!isServer)
      onCleanup(() => {
        ref(undefined);
        presence.ref(undefined);
      });
    return (
      <Primitive
        as="li"
        {...forwarded}
      />
    );
  }
  return (
    <InteractiveProvider
      scope={scope}
      value={{ close }}
    >
      <Show when={context.viewport()}>
        <Portal mount={context.viewport()}>
          <Show when={presence.mounted()}>
            <Mounted />
          </Show>
        </Portal>
      </Show>
    </InteractiveProvider>
  );
}

export function ToastTitle(props: ToastTitleProps): Element {
  const forwarded = omit(props, "__scopeToast");
  return (
    <Primitive
      as="div"
      {...forwarded}
    />
  );
}
export function ToastDescription(props: ToastDescriptionProps): Element {
  const forwarded = omit(props, "__scopeToast");
  return (
    <Primitive
      as="div"
      {...forwarded}
    />
  );
}
export function ToastClose(props: ToastCloseProps): Element {
  const scope = untrack(() => props.__scopeToast),
    context = useInteractive("ToastClose", scope)!;
  const forwarded = merge(omit(props, "__scopeToast"), {
    type: "button" as const,
    "data-radix-toast-announce-exclude": "",
    onClick: composeEventHandlers<MouseEvent>(
      () => props.onClick,
      () => context.close(),
    ),
  });
  return (
    <Primitive
      as="button"
      {...forwarded}
    />
  );
}
export function ToastAction(props: ToastActionProps): Element {
  const valid = () => props.altText.trim().length > 0;
  if (!isServer)
    createEffect(
      () => props.altText,
      (text) => {
        if (!text.trim())
          console.error("ToastAction altText must be non-empty.");
      },
      { transparent: true },
    );
  const forwarded = merge(omit(props, "altText"), {
    get "data-radix-toast-announce-alt"() {
      return props.altText;
    },
  });
  return (
    <Show when={valid()}>
      <ToastClose {...forwarded} />
    </Show>
  );
}
