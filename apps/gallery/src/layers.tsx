import { render } from "@solidjs/web";
import {
  Dialog,
  Popover,
  Direction,
  VisuallyHidden,
} from "@wsagency/radix2solid-primitives";
import {
  RovingFocusGroup,
  RovingFocusGroupItem,
} from "@wsagency/radix2solid-primitives/internal";
import {
  createSignal,
  createUniqueId,
  For,
  getOwner,
  onCleanup,
  onSettled,
  runWithOwner,
  Show,
  type Element,
} from "solid-js";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgb(0 0 0 / .25)",
  "z-index": 10,
} as const;
const dialogStyle = {
  position: "fixed",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  background: "white",
  color: "black",
  border: "1px solid #888",
  padding: "20px",
  width: "min(420px, 80vw)",
  "max-height": "75vh",
  overflow: "auto",
  "z-index": 11,
} as const;
const popoverStyle = {
  background: "white",
  color: "black",
  border: "1px solid #888",
  padding: "16px",
  width: "240px",
  "z-index": 12,
} as const;
const animationStyles =
  "@keyframes layerEnter{from{opacity:0}to{opacity:1}}@keyframes layerExit{from{opacity:1}to{opacity:0}}.layer-animated[data-state=open]{animation:layerEnter 30ms}.layer-animated[data-state=closed]{animation:layerExit 200ms}";

export function Layers(): Element {
  const [open, setOpen] = createSignal(false);
  const [accept, setAccept] = createSignal(true);
  const [newCallback, replaceCallback] = createSignal(false);
  const [requests, setRequests] = createSignal<string[]>([]);
  const [labels, setLabels] = createSignal(true);
  const [cancelOpen, setCancelOpen] = createSignal(false);
  const [cancelClose, setCancelClose] = createSignal(false);
  const [cancelEscape, setCancelEscape] = createSignal(false);
  const [cancelOutside, setCancelOutside] = createSignal(false);
  const [animated, setAnimated] = createSignal(false);
  const [field, setField] = createSignal(true);
  const [mode, setMode] = createSignal("body");
  const [shadow, setShadow] = createSignal<ShadowRoot | undefined>();
  const [container, containerRef] = createSignal<HTMLDivElement | undefined>();
  const [outsideTarget, setOutsideTarget] = createSignal("");
  const [focusEvents, setFocusEvents] = createSignal<string[]>([]);
  const [direction, setDirection] = createSignal<"ltr" | "rtl">("ltr");
  const [reversed, setReversed] = createSignal(false);
  const [placements, placed] = createSignal(0);
  const [placedAbove, placeAbove] = createSignal(false);
  const [portalProof, showPortalProof] = createSignal(false);
  let shadowHost: HTMLDivElement | undefined;
  onSettled(() => {
    const host = shadowHost!;
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = animationStyles;
    root.append(style);
    setShadow(root);
  });
  const portalContainer = () =>
    mode() === "shadow"
      ? shadow()
      : mode() === "custom"
        ? container()
        : undefined;
  const recordFocus = (name: string, event: Event, cancel: boolean) => {
    setFocusEvents((events) => [
      ...events,
      `${name}:${(event.target as HTMLElement | null)?.dataset.layer ?? "missing-target"}`,
    ]);
    if (cancel) event.preventDefault();
  };
  return (
    <section aria-label="Layer ownership">
      <style>{animationStyles}</style>
      <h2>Native layers</h2>
      <label>
        <input
          type="checkbox"
          checked={accept()}
          onChange={(event) => setAccept(event.currentTarget.checked)}
        />
        Accept dialog requests
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancelOpen()}
          onChange={(event) => setCancelOpen(event.currentTarget.checked)}
        />
        Cancel open autofocus
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancelClose()}
          onChange={(event) => setCancelClose(event.currentTarget.checked)}
        />
        Cancel close autofocus
      </label>
      <label>
        <input
          type="checkbox"
          checked={animated()}
          onChange={(event) => setAnimated(event.currentTarget.checked)}
        />
        Animate exit
      </label>
      <label>
        Portal container
        <select
          value={mode()}
          onChange={(event) => setMode(event.currentTarget.value)}
        >
          <option value="body">Body</option>
          <option value="custom">Custom element</option>
          <option value="shadow">Shadow root</option>
        </select>
      </label>
      <button onClick={() => replaceCallback(true)}>
        Replace dialog callback
      </button>
      <output id="layer-requests">{requests().join(",")}</output>
      <output id="layer-focus-events">{focusEvents().join(",")}</output>
      <output id="outside-target">{outsideTarget()}</output>
      <output id="layer-placements">{placements()}</output>
      <p id="layer-help">
        Custom description retained after built-in labels unmount.
      </p>
      <Dialog.Root
        open={open()}
        onOpenChange={(next) => {
          setRequests((requests) => [
            ...requests,
            `${newCallback() ? "new" : "old"}:${next}`,
          ]);
          if (accept()) setOpen(next);
        }}
      >
        <Dialog.Trigger>Open layered dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            data-layer-overlay
            style={overlayStyle}
            onClick={(event) => event.stopPropagation()}
          />
          <Dialog.Content
            data-layer="dialog"
            aria-labelledby={labels() ? "layer-title" : undefined}
            aria-label={labels() ? undefined : "Layered dialog"}
            aria-describedby={
              labels() ? "layer-help layer-description" : "layer-help"
            }
            class={animated() ? "layer-animated" : undefined}
            style={dialogStyle}
            onOpenAutoFocus={(event) =>
              recordFocus("open", event, cancelOpen())
            }
            onCloseAutoFocus={(event) =>
              recordFocus("close", event, cancelClose())
            }
            onEscapeKeyDown={(event) => {
              if (cancelEscape()) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              const target = event.target as HTMLElement;
              setOutsideTarget(
                target.id ||
                  (target.hasAttribute("data-layer-overlay")
                    ? "overlay"
                    : "unknown"),
              );
              if (cancelOutside()) event.preventDefault();
            }}
          >
            <Show when={labels()}>
              <Dialog.Title id="layer-title">Layered dialog</Dialog.Title>
              <Dialog.Description id="layer-description">
                Modal ownership includes descendant portals.
              </Dialog.Description>
            </Show>
            <Popover.Root>
              <Popover.Trigger>Open nested popover</Popover.Trigger>
              <Popover.Portal container={portalContainer()}>
                <Popover.Content
                  data-layer="popover"
                  style={popoverStyle}
                  side={placedAbove() ? "top" : "bottom"}
                  avoidCollisions={!placedAbove()}
                  sideOffset={8}
                  collisionPadding={8}
                  onPlaced={() => placed((value) => value + 1)}
                  onEscapeKeyDown={(event) => {
                    if (cancelEscape()) event.preventDefault();
                  }}
                  onPointerDownOutside={(event) => {
                    setOutsideTarget(
                      (event.target as HTMLElement | null)?.id ?? "unknown",
                    );
                    if (cancelOutside()) event.preventDefault();
                  }}
                >
                  <Popover.Title>Nested popover</Popover.Title>
                  <Popover.Description>
                    A focus and scroll branch.
                  </Popover.Description>
                  <input aria-label="Branch field" />
                  <div
                    data-branch-scroll
                    style={{
                      height: "90px",
                      overflow: "auto",
                      "overscroll-behavior": "contain",
                    }}
                  >
                    <div style={{ height: "400px" }}>Scrollable branch</div>
                  </div>
                  <button onClick={() => placeAbove(true)}>
                    Place popover above
                  </button>
                  <button>Branch last</button>
                  <Popover.Arrow
                    data-layer-arrow
                    fill="white"
                  />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            <NestedRenderLayer closeParent={() => setOpen(false)} />
            <label>
              <input
                type="checkbox"
                checked={cancelEscape()}
                onChange={(event) =>
                  setCancelEscape(event.currentTarget.checked)
                }
              />
              Cancel Escape
            </label>
            <label>
              <input
                type="checkbox"
                checked={cancelOutside()}
                onChange={(event) =>
                  setCancelOutside(event.currentTarget.checked)
                }
              />
              Cancel outside dismissal
            </label>
            <button onClick={() => setLabels((previous) => !previous)}>
              Toggle dialog labels
            </button>
            <button
              onClick={() =>
                document.dispatchEvent(
                  new CustomEvent("gallery.open-independent"),
                )
              }
            >
              Open independent root
            </button>
            <Show when={field()}>
              <input
                aria-label="Removable focus"
                onKeyDown={(event) => {
                  if (event.key === "Delete") setField(false);
                }}
              />
            </Show>
            <VisuallyHidden.Root>
              Accessible hidden guidance.
            </VisuallyHidden.Root>
            <Direction.Provider dir={direction()}>
              <RovingFocusGroup
                orientation="horizontal"
                loop
                role="toolbar"
                aria-label="Layer options"
                data-layer="roving"
                onEntryFocus={(event) =>
                  recordFocus("roving", event, cancelOpen())
                }
              >
                <For
                  each={
                    reversed() ? ["B", "disabled", "A"] : ["A", "disabled", "B"]
                  }
                >
                  {(name) => (
                    <RovingFocusGroupItem
                      asChild
                      focusable={name !== "disabled"}
                    >
                      {(target) =>
                        target("button", {
                          children: `Roving ${name}`,
                          disabled: name === "disabled",
                        })
                      }
                    </RovingFocusGroupItem>
                  )}
                </For>
              </RovingFocusGroup>
            </Direction.Provider>
            <button
              onClick={() =>
                setDirection((previous) => (previous === "ltr" ? "rtl" : "ltr"))
              }
            >
              Reverse direction
            </button>
            <button onClick={() => setReversed((previous) => !previous)}>
              Reverse DOM options
            </button>
            <Dialog.Close>Close layered dialog</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <NonmodalLayer />
      <Dialog.Root>
        <Dialog.Trigger>Open scrollable overlay</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            data-scrollable-overlay
            style={{ ...overlayStyle, overflow: "auto" }}
          >
            <div style={{ height: "1800px", padding: "80px" }}>
              <Dialog.Content style={{ background: "white", padding: "20px" }}>
                <Dialog.Title>Scrollable overlay dialog</Dialog.Title>
                <Dialog.Description>
                  The owning overlay scrolls without unlocking the page.
                </Dialog.Description>
                <Dialog.Close>Close scrollable overlay</Dialog.Close>
              </Dialog.Content>
            </div>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
      <ScopedLayers />
      <div
        data-custom-container
        ref={containerRef}
      />
      <div
        data-shadow-container
        ref={(element) => {
          shadowHost = element;
        }}
      />
      <button onClick={() => showPortalProof(true)}>
        Mount default-open portal
      </button>
      <Show when={portalProof()}>
        <DefaultOpenPortal />
      </Show>
    </section>
  );
}

function NonmodalLayer(): Element {
  const [intercept, setIntercept] = createSignal<
    "none" | "capture" | "bubble" | "mousedown"
  >("none");
  let interceptorNode: HTMLButtonElement | undefined;
  onSettled(() => {
    const node = interceptorNode!;
    const capture = (event: Event) => {
      if (intercept() === "capture") event.stopPropagation();
    };
    node.addEventListener("click", capture, true);
    return () => node.removeEventListener("click", capture, true);
  });
  return (
    <section aria-label="Outside interception">
      <label>
        Interception
        <select
          value={intercept()}
          onChange={(event) =>
            setIntercept(
              event.currentTarget.value as ReturnType<typeof intercept>,
            )
          }
        >
          <option value="none">None</option>
          <option value="capture">Capture click</option>
          <option value="bubble">Bubble click</option>
          <option value="mousedown">Mouse down</option>
        </select>
      </label>
      <Popover.Root>
        <Popover.Trigger>Open standalone popover</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            style={popoverStyle}
            data-layer="standalone"
            aria-describedby={undefined}
          >
            <Popover.Title>Standalone popover</Popover.Title>
            <input aria-label="Standalone field" />
            <Popover.Root>
              <Popover.Trigger>Open second standalone popover</Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  style={{ ...popoverStyle, "z-index": 13 }}
                  aria-describedby={undefined}
                >
                  <Popover.Title>Second standalone popover</Popover.Title>
                  <input aria-label="Second standalone field" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            <Popover.Close>Close standalone popover</Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <button id="outside-normal">Outside normal</button>
      <button
        id="outside-interceptor"
        ref={(element) => {
          interceptorNode = element;
        }}
        onClick={(event) => {
          if (intercept() === "bubble") event.stopPropagation();
        }}
        onMouseDown={(event) => {
          if (intercept() === "mousedown") event.stopPropagation();
        }}
      >
        Outside interceptor
      </button>
    </section>
  );
}

export function IndependentLayers(): Element {
  const [open, setOpen] = createSignal(false);
  onSettled(() => {
    const open = () => setOpen(true);
    document.addEventListener("gallery.open-independent", open);
    return () => document.removeEventListener("gallery.open-independent", open);
  });
  return (
    <Dialog.Root
      open={open()}
      onOpenChange={setOpen}
    >
      <Dialog.Trigger>Open independent dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay style={{ ...overlayStyle, "z-index": 20 }} />
        <Dialog.Content
          data-layer="independent"
          style={{ ...dialogStyle, "z-index": 21 }}
          aria-describedby={undefined}
        >
          <Dialog.Title>Independent dialog</Dialog.Title>
          <Dialog.Close>Close independent dialog</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DefaultOpenPortal(): Element {
  const [visible, setVisible] = createSignal(true);
  return (
    <Dialog.Root
      defaultOpen
      onOpenChange={setVisible}
    >
      <Dialog.Portal forceMount>
        <Dialog.Content
          data-server-portal
          style={{ ...dialogStyle, display: visible() ? "block" : "none" }}
          aria-describedby={undefined}
        >
          <Dialog.Title>Default-open client portal</Dialog.Title>
          <Dialog.Close>Close default-open portal</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ScopedLayers(): Element {
  const scope = Dialog.createDialogScope()();
  return (
    <section aria-label="Scoped layers">
      <Dialog.Root
        {...scope}
        modal={false}
      >
        <Dialog.Root modal={false}>
          <Dialog.Trigger {...scope}>Open outer scoped dialog</Dialog.Trigger>
          <Dialog.Trigger>Open inner unscoped dialog</Dialog.Trigger>
          <Dialog.Portal {...scope}>
            <Dialog.Content
              {...scope}
              style={dialogStyle}
              aria-describedby={undefined}
            >
              <Dialog.Title {...scope}>Outer scoped dialog</Dialog.Title>
              <Dialog.Close {...scope}>Close outer scoped dialog</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
          <Dialog.Portal>
            <Dialog.Content
              style={dialogStyle}
              aria-describedby={undefined}
            >
              <Dialog.Title>Inner unscoped dialog</Dialog.Title>
              <Dialog.Close>Close inner unscoped dialog</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </Dialog.Root>
    </section>
  );
}

function NestedRenderLayer(props: { closeParent: () => void }): Element {
  let host: HTMLDivElement | undefined;
  const renderId = `${createUniqueId()}-nested-`;
  const owner = getOwner();
  let active = true;
  let dispose: (() => void) | undefined;
  onCleanup(() => {
    active = false;
    dispose?.();
  });
  onSettled(() =>
    queueMicrotask(() => {
      if (!active) return;
      dispose = render(
        () =>
          runWithOwner(owner, () => (
            <Popover.Root>
              <Popover.Trigger>Open nested render-root popover</Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  style={popoverStyle}
                  sideOffset={8}
                  aria-describedby={undefined}
                >
                  <Popover.Title>Nested render-root popover</Popover.Title>
                  <input aria-label="Nested root field" />
                  <div
                    data-nested-root-scroll
                    style={{ height: "90px", overflow: "auto" }}
                  >
                    <div style={{ height: "400px" }}>Nested root scrolling</div>
                  </div>
                  <Popover.Close>
                    Close nested render-root popover
                  </Popover.Close>
                  <button onClick={() => props.closeParent()}>
                    Close parent from nested root
                  </button>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )),
        host!,
        undefined,
        { renderId },
      );
    }),
  );
  return (
    <div
      data-nested-render-root
      ref={(element) => {
        host = element;
      }}
    />
  );
}
