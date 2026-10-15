import { isServer } from "@solidjs/web";
// Native Radix ScrollArea port; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createEffect,
  createSignal,
  merge,
  omit,
  onCleanup,
  runWithOwner,
  Show,
  untrack,
  type Accessor,
  type Element,
} from "solid-js";

import { useDirection, type Direction } from "../direction/direction.js";
import { createContextScope, type Scope } from "../internal/context.js";
import { composeEventHandlers } from "../internal/events.js";
import { createPresence } from "../internal/presence.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import { mergeStyles, type SlotRender } from "../slot/slot.js";

type Scoped = { __scopeScrollArea?: Scope };
type Axis = "horizontal" | "vertical";
type ScrollType = "auto" | "always" | "scroll" | "hover";
type Dimensions = {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
};
export type ScrollAreaProps = PrimitiveProps<"div"> &
  Scoped & { type?: ScrollType; dir?: Direction; scrollHideDelay?: number };
export type ScrollAreaViewportProps = PrimitiveProps<"div"> &
  Scoped & { nonce?: string; disableImplicitContentElement?: boolean };
export type ScrollAreaContentProps = PrimitiveProps<"div"> & Scoped;
export type ScrollAreaScrollbarProps = PrimitiveProps<"div"> &
  Scoped & { orientation?: Axis; forceMount?: true };
export type ScrollAreaThumbProps = PrimitiveProps<"div"> &
  Scoped & { forceMount?: true };
export type ScrollAreaCornerProps = PrimitiveProps<"div"> & Scoped;
const [createScrollAreaContext, createScrollAreaScope] =
  createContextScope("ScrollArea");
export { createScrollAreaScope };
const [Provider, useScrollArea] = createScrollAreaContext<{
  node: Accessor<HTMLElement | undefined>;
  viewport: Accessor<HTMLElement | undefined>;
  viewportRef: (node: HTMLElement | undefined) => void;
  content: Accessor<HTMLElement | undefined>;
  contentRef: (node: HTMLElement | undefined) => void;
  type: Accessor<ScrollType>;
  direction: Accessor<Direction>;
  delay: Accessor<number>;
  enabled: Accessor<{ horizontal: number; vertical: number }>;
  enable: (axis: Axis, delta: number) => void;
  sizes: Accessor<Dimensions>;
  offsets: Accessor<{ x: number; y: number }>;
  bars: Accessor<{ horizontal?: HTMLElement; vertical?: HTMLElement }>;
  setBar: (axis: Axis, node: HTMLElement | undefined) => void;
  corner: Accessor<{ width: number; height: number }>;
  setCorner: (width: number, height: number) => void;
}>("ScrollArea");
const [ScrollbarProvider, useScrollbar] = createScrollAreaContext<{
  horizontal: Accessor<boolean>;
  hasThumb: Accessor<boolean>;
  thumbSize: Accessor<number>;
  offset: Accessor<number>;
  pointerOffset: number;
  padding: Accessor<{ start: number; end: number }>;
}>("ScrollAreaScrollbar");

function observeResize(elements: HTMLElement[], measure: () => void) {
  const view = elements[0]!.ownerDocument.defaultView!;
  let frame = 0;
  // Browser-delivered measurements are imperative, independent of ambient render ownership.
  const update = () => runWithOwner(null, measure);
  // Geometry writes can resize observed ancestors; commit outside the delivery loop.
  const observer = new view.ResizeObserver(() => {
    view.cancelAnimationFrame(frame);
    frame = view.requestAnimationFrame(update);
  });
  for (const element of elements) observer.observe(element);
  measure();
  return () => {
    observer.disconnect();
    view.cancelAnimationFrame(frame);
  };
}

export function ScrollArea(props: ScrollAreaProps): Element {
  const scope = untrack(() => props.__scopeScrollArea),
    direction = useDirection(() => props.dir);
  const [node, ref] = createSignal<HTMLElement | undefined>(),
    [viewport, viewportRef] = createSignal<HTMLElement | undefined>(),
    [content, contentRef] = createSignal<HTMLElement | undefined>();
  const [enabled, setEnabled] = createSignal({ horizontal: 0, vertical: 0 });
  const [sizes, setSizes] = createSignal<Dimensions>({
    width: 0,
    height: 0,
    contentWidth: 0,
    contentHeight: 0,
  });
  const [offsets, setOffsets] = createSignal({ x: 0, y: 0 });
  const [bars, setBars] = createSignal<{
    horizontal?: HTMLElement;
    vertical?: HTMLElement;
  }>({});
  const [corner, setCornerSize] = createSignal({ width: 0, height: 0 });
  const context = {
    node,
    viewport,
    viewportRef,
    content,
    contentRef,
    direction,
    enabled,
    sizes,
    offsets,
    bars,
    corner,
    type: () => props.type ?? "hover",
    delay: () => props.scrollHideDelay ?? 600,
    enable: (axis: Axis, delta: number) => {
      setEnabled((previous) => ({
        ...previous,
        [axis]: previous[axis] + delta,
      }));
    },
    setBar: (axis: Axis, element: HTMLElement | undefined) => {
      setBars((previous) => ({ ...previous, [axis]: element }));
    },
    setCorner: (width: number, height: number) => {
      setCornerSize({ width, height });
    },
  };
  if (!isServer)
    createEffect(
      () => [viewport(), content()] as const,
      ([element, child]) => {
        if (!element) return;
        const view = element.ownerDocument.defaultView!;
        let frame = 0,
          idle = 0;
        const position = () => {
          setOffsets({ x: element.scrollLeft, y: element.scrollTop });
        };
        const measure = () => {
          setSizes({
            width: element.clientWidth,
            height: element.clientHeight,
            contentWidth: element.scrollWidth,
            contentHeight: element.scrollHeight,
          });
          position();
        };
        const loop = () => {
          position();
          frame = view.requestAnimationFrame(loop);
        };
        const scroll = () => {
          position();
          if (!frame) frame = view.requestAnimationFrame(loop);
          view.clearTimeout(idle);
          idle = view.setTimeout(() => {
            view.cancelAnimationFrame(frame);
            frame = 0;
          }, 100);
        };
        const stopResize = observeResize(
          child ? [element, child] : [element],
          measure,
        );
        element.addEventListener("scroll", scroll);
        return () => {
          stopResize();
          element.removeEventListener("scroll", scroll);
          view.cancelAnimationFrame(frame);
          view.clearTimeout(idle);
        };
      },
      { transparent: true },
    );
  const style = () =>
    mergeStyles(
      {
        position: "relative",
        "--radix-scroll-area-corner-width": `${corner().width}px`,
        "--radix-scroll-area-corner-height": `${corner().height}px`,
      },
      props.style,
    );
  const forwarded = merge(
    {
      get dir() {
        return direction();
      },
    },
    omit(props, "__scopeScrollArea", "type", "dir", "scrollHideDelay"),
    {
      get ref() {
        return composeRefs(props.ref, ref);
      },
      get style() {
        return style();
      },
    },
  );
  return (
    <Provider
      scope={scope}
      value={context}
    >
      <Primitive
        as="div"
        {...forwarded}
      />
    </Provider>
  );
}

export function ScrollAreaViewport(props: ScrollAreaViewportProps): Element {
  const scope = untrack(() => props.__scopeScrollArea),
    root = useScrollArea("ScrollAreaViewport", scope);
  if (!isServer) onCleanup(() => root.viewportRef(undefined));
  const style = () =>
    mergeStyles(
      {
        "overflow-x": root.enabled().horizontal ? "scroll" : "hidden",
        "overflow-y": root.enabled().vertical ? "scroll" : "hidden",
      },
      props.style,
    );
  const implicitContent = (child: Element) => (
    <ScrollAreaContent __scopeScrollArea={scope}>{child}</ScrollAreaContent>
  );
  const children = () => {
    if (props.asChild) {
      const render = props.children as SlotRender;
      return ((target) =>
        render((component, nativeProps) => {
          const content = merge(nativeProps, {
            get children() {
              const child = (nativeProps as { children?: Element }).children;
              return props.disableImplicitContentElement
                ? child
                : implicitContent(child);
            },
          }) as typeof nativeProps;
          return target(component, content);
        })) satisfies SlotRender;
    }
    return props.disableImplicitContentElement ? (
      props.children
    ) : (
      <ScrollAreaContent __scopeScrollArea={scope}>
        {props.children}
      </ScrollAreaContent>
    );
  };
  const forwarded = merge(
    { "data-radix-scroll-area-viewport": "", tabindex: 0 },
    omit(
      props,
      "__scopeScrollArea",
      "nonce",
      "disableImplicitContentElement",
      "children",
    ),
    {
      get ref() {
        return composeRefs(props.ref, root.viewportRef);
      },
      get style() {
        return style();
      },
      get children() {
        return children();
      },
    },
  );
  return (
    <>
      <style nonce={props.nonce}>
        {
          "[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}"
        }
      </style>
      <Primitive
        as="div"
        {...(forwarded as PrimitiveProps<"div">)}
      />
    </>
  );
}

export function ScrollAreaContent(props: ScrollAreaContentProps): Element {
  const root = useScrollArea(
    "ScrollAreaContent",
    untrack(() => props.__scopeScrollArea),
  );
  if (!isServer) onCleanup(() => root.contentRef(undefined));
  const forwarded = merge(
    { "data-radix-scroll-area-content": "" },
    omit(props, "__scopeScrollArea"),
    {
      get ref() {
        return composeRefs(props.ref, root.contentRef);
      },
      get style() {
        return mergeStyles(
          { "min-width": "100%", display: "table" },
          props.style,
        );
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

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps): Element {
  const scope = untrack(() => props.__scopeScrollArea),
    root = useScrollArea("ScrollAreaScrollbar", scope);
  const horizontal = () => props.orientation === "horizontal";
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const [barSize, setBarSize] = createSignal(0),
    [padding, setPadding] = createSignal({ start: 0, end: 0 });
  const [visible, setVisible] = createSignal(false);
  const contentSize = () =>
    horizontal() ? root.sizes().contentWidth : root.sizes().contentHeight;
  const viewportSize = () =>
    horizontal() ? root.sizes().width : root.sizes().height;
  const overflow = () => contentSize() > viewportSize();
  const usable = () => barSize() - padding().start - padding().end;
  const thumbSize = () =>
    contentSize()
      ? Math.max(18, (usable() * viewportSize()) / contentSize())
      : 0;
  const hasThumb = () => viewportSize() > 0 && overflow();
  const maxScroll = () => Math.max(0, contentSize() - viewportSize());
  const offset = () => {
    const max = maxScroll();
    if (!max) return 0;
    const scroll = horizontal() ? root.offsets().x : root.offsets().y;
    const fraction =
      horizontal() && root.direction() === "rtl"
        ? 1 + scroll / max
        : scroll / max;
    return Math.max(0, Math.min(1, fraction)) * (usable() - thumbSize());
  };
  const context = {
    horizontal,
    hasThumb,
    thumbSize,
    offset,
    padding,
    pointerOffset: 0,
  };
  const requested = () =>
    root.type() === "always" ||
    (root.type() === "auto"
      ? overflow()
      : root.type() === "hover"
        ? visible() && overflow()
        : visible());
  const presence = createPresence(requested, () => !!props.forceMount);
  let controller: { interact: (active: boolean) => void } | undefined;
  let drag:
    | {
        node: HTMLElement;
        id: number;
        rect: DOMRect;
        body: HTMLElement;
        viewport: HTMLElement;
        selection: string;
        behavior: string;
      }
    | undefined;
  function release() {
    const current = drag;
    drag = undefined;
    context.pointerOffset = 0;
    if (!current) return;
    current.body.style.webkitUserSelect = current.selection;
    current.viewport.style.scrollBehavior = current.behavior;
    if (current.node.hasPointerCapture(current.id))
      current.node.releasePointerCapture(current.id);
  }
  function dragTo(event: PointerEvent) {
    if (!drag) return;
    const pointer = horizontal()
      ? event.clientX - drag.rect.left
      : event.clientY - drag.rect.top;
    const thumbOffset = context.pointerOffset || thumbSize() / 2;
    const min = padding().start + thumbOffset,
      max = barSize() - padding().end - (thumbSize() - thumbOffset);
    const fraction =
      min === max ? 0 : Math.max(0, Math.min(1, (pointer - min) / (max - min)));
    if (horizontal())
      drag.viewport.scrollLeft =
        root.direction() === "rtl"
          ? (fraction - 1) * maxScroll()
          : fraction * maxScroll();
    else drag.viewport.scrollTop = fraction * maxScroll();
  }
  if (!isServer) {
    onCleanup(release);
    createEffect(
      () => (horizontal() ? ("horizontal" as const) : ("vertical" as const)),
      (axis) => {
        root.enable(axis, 1);
        return () => root.enable(axis, -1);
      },
      { transparent: true },
    );
    createEffect(
      () => [root.node(), root.viewport(), root.type(), root.delay()] as const,
      ([container, viewport, type, delay]) => {
        if (!container || !viewport) return;
        const view = container.ownerDocument.defaultView!;
        let hide = 0,
          idle = 0,
          interacting = false,
          scrolling = false;
        const pause = () => {
          view.clearTimeout(hide);
          hide = 0;
        };
        const queueHide = () => {
          pause();
          if (
            !interacting &&
            !scrolling &&
            !(type === "hover" && container.matches(":hover"))
          )
            hide = view.setTimeout(() => {
              setVisible(false);
            }, delay);
        };
        const enter = () => {
            pause();
            setVisible(true);
          },
          leave = () => queueHide();
        const scroll = () => {
          pause();
          scrolling = true;
          setVisible(true);
          view.clearTimeout(idle);
          idle = view.setTimeout(() => {
            scrolling = false;
            queueHide();
          }, 100);
        };
        controller = {
          interact: (active) => {
            interacting = active;
            if (active) pause();
            else queueHide();
          },
        };
        setVisible(type === "hover" && container.matches(":hover"));
        if (type === "hover") {
          container.addEventListener("pointerenter", enter);
          container.addEventListener("pointerleave", leave);
        }
        if (type === "scroll") viewport.addEventListener("scroll", scroll);
        return () => {
          pause();
          view.clearTimeout(idle);
          controller = undefined;
          container.removeEventListener("pointerenter", enter);
          container.removeEventListener("pointerleave", leave);
          viewport.removeEventListener("scroll", scroll);
        };
      },
      { transparent: true },
    );
    createEffect(
      () => [node(), horizontal()] as const,
      ([element, isHorizontal]) => {
        if (!element) return;
        const axis = isHorizontal ? "horizontal" : "vertical",
          view = element.ownerDocument.defaultView!;
        root.setBar(axis, element);
        const measure = () => {
          const style = view.getComputedStyle(element);
          setBarSize(isHorizontal ? element.clientWidth : element.clientHeight);
          setPadding({
            start:
              parseFloat(isHorizontal ? style.paddingLeft : style.paddingTop) ||
              0,
            end:
              parseFloat(
                isHorizontal ? style.paddingRight : style.paddingBottom,
              ) || 0,
          });
        };
        const wheel = (event: WheelEvent) => {
          const viewport = untrack(root.viewport);
          if (!viewport || !element.contains(event.target as Node)) return;
          const delta = isHorizontal ? event.deltaX : event.deltaY;
          const previous = isHorizontal
            ? viewport.scrollLeft
            : viewport.scrollTop;
          const maximum = untrack(maxScroll),
            rtl = isHorizontal && untrack(root.direction) === "rtl";
          const next = Math.max(
            rtl ? -maximum : 0,
            Math.min(rtl ? 0 : maximum, previous + delta),
          );
          if (isHorizontal) viewport.scrollLeft = next;
          else viewport.scrollTop = next;
          if (next !== previous) event.preventDefault();
        };
        const stopResize = observeResize([element], measure);
        element.ownerDocument.addEventListener("wheel", wheel, {
          passive: false,
        });
        return () => {
          stopResize();
          element.ownerDocument.removeEventListener("wheel", wheel);
          root.setBar(axis, undefined);
          release();
        };
      },
      { transparent: true },
    );
  }
  const style = () =>
    mergeStyles(
      horizontal()
        ? {
            position: "absolute",
            bottom: 0,
            left:
              root.direction() === "rtl"
                ? "var(--radix-scroll-area-corner-width)"
                : 0,
            right:
              root.direction() === "rtl"
                ? 0
                : "var(--radix-scroll-area-corner-width)",
            "--radix-scroll-area-thumb-width": `${thumbSize()}px`,
            "--radix-scroll-area-thumb-height": "100%",
            "touch-action": "none",
            "user-select": "none",
          }
        : {
            position: "absolute",
            top: 0,
            bottom: "var(--radix-scroll-area-corner-height)",
            [root.direction() === "rtl" ? "left" : "right"]: 0,
            "--radix-scroll-area-thumb-height": `${thumbSize()}px`,
            "--radix-scroll-area-thumb-width": "100%",
            "touch-action": "none",
            "user-select": "none",
          },
      props.style,
    );
  const forwarded = merge(
    {
      get ["data-state"]() {
        return requested() ? "visible" : "hidden";
      },
      get ["data-orientation"]() {
        return horizontal() ? "horizontal" : "vertical";
      },
    },
    omit(props, "__scopeScrollArea", "orientation", "forceMount"),
    {
      get ref() {
        return composeRefs(props.ref, ref, presence.ref);
      },
      get style() {
        return style();
      },
      onPointerEnter: composeEventHandlers<PointerEvent>(
        () => props.onPointerEnter,
        () => controller?.interact(true),
      ),
      onPointerLeave: composeEventHandlers<PointerEvent>(
        () => props.onPointerLeave,
        () => controller?.interact(false),
      ),
      onPointerDown: composeEventHandlers<PointerEvent>(
        () => props.onPointerDown,
        (event) => {
          const element = node(),
            viewport = root.viewport();
          if (!element || !viewport || event.button !== 0 || drag) return;
          const body = element.ownerDocument.body;
          drag = {
            node: element,
            id: event.pointerId,
            rect: element.getBoundingClientRect(),
            body,
            viewport,
            selection: body.style.webkitUserSelect,
            behavior: viewport.style.scrollBehavior,
          };
          element.setPointerCapture(event.pointerId);
          body.style.webkitUserSelect = "none";
          viewport.style.scrollBehavior = "auto";
          dragTo(event);
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        () => props.onPointerMove,
        (event) => {
          if (drag?.id === event.pointerId) dragTo(event);
        },
      ),
      onPointerUp: composeEventHandlers<PointerEvent>(
        () => props.onPointerUp,
        (event) => {
          if (drag?.id === event.pointerId) release();
        },
      ),
      onPointerCancel: composeEventHandlers<PointerEvent>(
        () => props.onPointerCancel,
        (event) => {
          if (drag?.id === event.pointerId) release();
        },
      ),
      onLostPointerCapture: composeEventHandlers<PointerEvent>(
        () => props.onLostPointerCapture,
        (event) => {
          if (drag?.id === event.pointerId) release();
        },
      ),
    },
  );
  function Mounted(): Element {
    if (!isServer)
      onCleanup(() => {
        release();
        ref(undefined);
        presence.ref(undefined);
      });
    return (
      <Primitive
        as="div"
        {...forwarded}
      />
    );
  }
  return (
    <ScrollbarProvider
      scope={scope}
      value={context}
    >
      <Show when={presence.mounted()}>
        <Mounted />
      </Show>
    </ScrollbarProvider>
  );
}

export function ScrollAreaThumb(props: ScrollAreaThumbProps): Element {
  const scope = untrack(() => props.__scopeScrollArea),
    scrollbar = useScrollbar("ScrollAreaThumb", scope);
  const presence = createPresence(scrollbar.hasThumb, () => !!props.forceMount);
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const style = () =>
    mergeStyles(
      {
        position: "absolute",
        left: scrollbar.horizontal() ? `${scrollbar.padding().start}px` : "0px",
        top: scrollbar.horizontal() ? "0px" : `${scrollbar.padding().start}px`,
        width: "var(--radix-scroll-area-thumb-width)",
        height: "var(--radix-scroll-area-thumb-height)",
        transform: `translate3d(${scrollbar.horizontal() ? scrollbar.offset() : 0}px, ${scrollbar.horizontal() ? 0 : scrollbar.offset()}px, 0)`,
      },
      props.style,
    );
  const forwarded = merge(
    {
      get ["data-state"]() {
        return scrollbar.hasThumb() ? "visible" : "hidden";
      },
    },
    omit(props, "__scopeScrollArea", "forceMount"),
    {
      get ref() {
        return composeRefs(props.ref, ref, presence.ref);
      },
      get style() {
        return style();
      },
      onPointerDown: composeEventHandlers<PointerEvent>(
        () => props.onPointerDown,
        (event) => {
          const rect = node()?.getBoundingClientRect();
          if (rect)
            scrollbar.pointerOffset = scrollbar.horizontal()
              ? event.clientX - rect.left
              : event.clientY - rect.top;
        },
      ),
      onPointerUp: composeEventHandlers<PointerEvent>(
        () => props.onPointerUp,
        () => {
          scrollbar.pointerOffset = 0;
        },
      ),
      onPointerCancel: composeEventHandlers<PointerEvent>(
        () => props.onPointerCancel,
        () => {
          scrollbar.pointerOffset = 0;
        },
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

export function ScrollAreaCorner(props: ScrollAreaCornerProps): Element {
  const root = useScrollArea(
    "ScrollAreaCorner",
    untrack(() => props.__scopeScrollArea),
  );
  if (!isServer)
    createEffect(
      root.bars,
      (bars) => {
        const element = bars.horizontal ?? bars.vertical;
        if (!element) {
          root.setCorner(0, 0);
          return;
        }
        const measure = () => {
          root.setCorner(
            bars.vertical?.offsetWidth ?? 0,
            bars.horizontal?.offsetHeight ?? 0,
          );
        };
        const stopResize = observeResize(
          [bars.horizontal, bars.vertical].filter(
            (node): node is HTMLElement => !!node,
          ),
          measure,
        );
        return () => {
          stopResize();
          root.setCorner(0, 0);
        };
      },
      { transparent: true },
    );
  const present = () =>
    !!root.bars().horizontal &&
    !!root.bars().vertical &&
    root.type() !== "scroll" &&
    root.corner().width > 0 &&
    root.corner().height > 0;
  const style = () =>
    mergeStyles(
      {
        position: "absolute",
        width: `${root.corner().width}px`,
        height: `${root.corner().height}px`,
        bottom: 0,
        [root.direction() === "rtl" ? "left" : "right"]: 0,
      },
      props.style,
    );
  const forwarded = merge(omit(props, "__scopeScrollArea"), {
    get style() {
      return style();
    },
  });
  return (
    <Show when={present()}>
      <Primitive
        as="div"
        {...forwarded}
      />
    </Show>
  );
}
