import type { ComponentProps } from "@solidjs/web";
import * as Splitter from "@wsagency/radix2solid-primitives/splitter";
import {
  createContext,
  createSignal,
  Errored,
  Show,
  useContext,
  type Element,
} from "solid-js";

type Event = ["change" | "commit" | "collapse", number | boolean];
const HostContext = createContext("outside");
const handleTargetProps: ComponentProps<"div"> & {
  "data-splitter-custom-handle": "";
} = { "data-splitter-custom-handle": "" };

export function Splitters(): Element {
  const [size, setSize] = createSignal(400),
    [collapsed, setCollapsed] = createSignal(false);
  const [mode, setMode] = createSignal<"accept" | "refuse" | "delay" | "round">(
      "accept",
    ),
    [acceptCollapse, setAcceptCollapse] = createSignal(true);
  const [log, setLog] = createSignal<Event[]>([]),
    [percentLog, setPercentLog] = createSignal<Event[]>([]);
  const [verticalLog, setVerticalLog] = createSignal<Event[]>([]),
    [rtlLog, setRtlLog] = createSignal<Event[]>([]);
  const [width, setWidth] = createSignal(1080),
    [axis, setAxis] = createSignal<"horizontal" | "vertical">("horizontal");
  const [rtl, setRtl] = createSignal(false),
    [unit, setUnit] = createSignal<"px" | "%">("px");
  const [pmin, setPmin] = createSignal(100),
    [pmax, setPmax] = createSignal(800),
    [smin, setSmin] = createSignal(300),
    [smax, setSmax] = createSignal<number | undefined>(700);
  const [disabled, setDisabled] = createSignal(false),
    [mounted, setMounted] = createSignal(true),
    [nested, setNested] = createSignal(true),
    [cancel, setCancel] = createSignal(false);
  const [percentMax, setPercentMax] = createSignal(70);
  const [percentPrimaryMin, setPercentPrimaryMin] = createSignal(10),
    [percentPrimaryMax, setPercentPrimaryMax] = createSignal(80),
    [percentSecondaryMin, setPercentSecondaryMin] = createSignal(30);
  const [invalid, setInvalid] = createSignal("");
  let pending = 400;
  const [rootRef, setRootRef] = createSignal<HTMLElement | undefined>(),
    [panelRef, setPanelRef] = createSignal<HTMLElement | undefined>(),
    [handleRef, setHandleRef] = createSignal<HTMLElement | undefined>();
  const append = (kind: Event[0], value: number | boolean) =>
    setLog((previous) => [...previous, [kind, value]]);
  const value = (px: number) => (unit() === "px" ? px : px / 10);
  const rootStyle = (vertical = false) => ({
    "box-sizing": "border-box" as const,
    width: vertical ? "500px" : "1080px",
    height: vertical ? "1080px" : "240px",
    padding: "8px",
    border: "2px solid gray",
    gap: "20px",
  });
  const handleStyle = (vertical = false) => ({
    width: vertical ? "100%" : "20px",
    height: vertical ? "20px" : "100%",
    background: "#777",
    cursor: vertical ? "row-resize" : "col-resize",
    outline: "revert",
  });
  function CustomHost(props: {
    children?: Element;
    [key: string]: unknown;
  }): Element {
    return (
      <HostContext value="inside splitter host">
        <div {...props} />
      </HostContext>
    );
  }
  function ContextWitness(): Element {
    const value = useContext(HostContext);
    return <span id="splitter-host-context">{value}</span>;
  }
  return (
    <section aria-label="Native splitters">
      <style>
        {
          '[data-splitter-fixture] [role="separator"]:focus-visible{outline:3px solid Highlight;outline-offset:2px}@media(forced-colors:active){[data-splitter-fixture] [role="separator"]{background:ButtonText;border:1px solid ButtonText}}'
        }
      </style>
      <div data-splitter-fixture>
        <label>
          Splitter configuration
          <select
            aria-label="Splitter configuration"
            onChange={(event) => setInvalid(event.currentTarget.value)}
          >
            <option value="">Choose configuration</option>
            {[
              "missing-px-size",
              "negative-size",
              "nonfinite-size",
              "percent-over-100",
              "zero-step",
              "reversed-bounds",
              "collapsed-rail",
              "secondary-collapse",
              "noncollapsible",
              "duplicate-primary",
              "missing-secondary",
              "wrong-order",
              "unnamed-handle",
              "valid-false-collapsed",
            ].map((name) => (
              <option value={name}>{name}</option>
            ))}
          </select>
        </label>
        <Show
          when={invalid()}
          keyed
        >
          {(kind) => (
            <Errored
              fallback={(error) => (
                <output id="splitter-configuration-error">
                  {String(error())}
                </output>
              )}
            >
              <ConfigurationExample kind={kind} />
            </Errored>
          )}
        </Show>
        <button onClick={() => setSize(value(700))}>
          Set pixel size to 700
        </button>
        <button onClick={() => setSize(value(400.5))}>
          Set pixel size to 400.5
        </button>
        <button onClick={() => setWidth(880)}>Narrow pixel container</button>
        <button onClick={() => setWidth(1080)}>Restore pixel container</button>
        <button
          onClick={() => {
            setPmin(value(600));
            setPmax(value(800));
            setSmin(value(500));
            setSmax(value(700));
          }}
        >
          Set pixel overflow
        </button>
        <button
          onClick={() => {
            setPmin(value(100));
            setPmax(value(200));
            setSmin(0);
            setSmax(value(300));
          }}
        >
          Set pixel underflow
        </button>
        <button onClick={() => setWidth(80)}>Set pixel zero</button>
        <button onClick={() => setMode("refuse")}>Refuse pixel requests</button>
        <button onClick={() => setMode("accept")}>Accept pixel requests</button>
        <button onClick={() => setMode("delay")}>Delay pixel requests</button>
        <button onClick={() => setSize(pending)}>
          Apply delayed pixel request
        </button>
        <button onClick={() => setMode("round")}>
          Round pixel acceptance to 25
        </button>
        <button onClick={() => setAxis("vertical")}>Rotate pixel axis</button>
        <button onClick={() => setRtl(true)}>Reverse pixel direction</button>
        <button
          onClick={() => {
            if (unit() === "px") {
              setUnit("%");
              setSize(size() / 10);
              setPmin(pmin() / 10);
              setPmax(pmax() / 10);
              setSmin(smin() / 10);
              setSmax(smax() === undefined ? 100 : smax()! / 10);
            }
          }}
        >
          Convert pixel units
        </button>
        <button onClick={() => setPmax(value(500))}>
          Constrain pixel maximum
        </button>
        <button onClick={() => setDisabled(true)}>
          Disable pixel splitter
        </button>
        <button onClick={() => setMounted(false)}>
          Unmount pixel splitter
        </button>
        <button onClick={() => setMounted(true)}>Remount pixel splitter</button>
        <button onClick={() => setNested(false)}>
          Unmount nested splitter
        </button>
        <button onClick={() => setCancel(true)}>
          Cancel pixel interactions
        </button>
        <button onClick={() => setSmax(unit() === "%" ? 100 : undefined)}>
          Allow pixel collapse space
        </button>
        <button onClick={() => setAcceptCollapse(false)}>
          Refuse pixel collapse
        </button>
        <button onClick={() => setAcceptCollapse(true)}>
          Accept pixel collapse
        </button>
        <button onClick={() => setCollapsed(true)}>
          Collapse pixel externally
        </button>
        <button onClick={() => setCollapsed(false)}>
          Restore pixel externally
        </button>
        <button>Outside pixel focus</button>
        <Show when={mounted()}>
          <Splitter.Root
            asChild
            id="splitter-pixel"
            ref={setRootRef}
            unit={unit()}
            size={size()}
            collapsed={collapsed()}
            disabled={disabled()}
            orientation={axis()}
            dir={rtl() ? "rtl" : "ltr"}
            onSizeChange={(proposal) => {
              append("change", proposal);
              pending = proposal;
              if (mode() === "accept") setSize(proposal);
              else if (mode() === "round")
                setSize(Math.ceil(proposal / 25) * 25);
            }}
            onSizeCommit={(accepted) => append("commit", accepted)}
            onCollapsedChange={(proposal) => {
              append("collapse", proposal);
              if (acceptCollapse()) setCollapsed(proposal);
            }}
            style={{
              ...rootStyle(axis() === "vertical"),
              [axis() === "horizontal" ? "width" : "height"]: `${width()}px`,
            }}
          >
            {(target) =>
              target(CustomHost, {
                get children() {
                  return (
                    <>
                      <Splitter.Panel
                        asChild
                        side="primary"
                        id="splitter-pixel-primary"
                        ref={setPanelRef}
                        minSize={pmin()}
                        maxSize={pmax()}
                        collapsible
                        collapsedSize={value(20)}
                      >
                        {(panel) =>
                          panel("article", {
                            children: (
                              <>
                                <ContextWitness />
                                <input aria-label="Pixel draft" />
                                <div
                                  id="splitter-pixel-scroll"
                                  role="region"
                                  aria-label="Scrollable primary content"
                                  tabindex={0}
                                  style={{ height: "100px", overflow: "auto" }}
                                >
                                  <div style={{ height: "600px" }}>
                                    Scrollable primary content
                                  </div>
                                </div>
                                <button>Before pixel handle</button>
                              </>
                            ),
                          })
                        }
                      </Splitter.Panel>
                      <Splitter.Handle
                        asChild
                        ref={setHandleRef}
                        aria-label="Pixel workspace"
                        style={handleStyle(axis() === "vertical")}
                        onKeyDown={(event) => {
                          if (cancel()) event.preventDefault();
                        }}
                        onPointerDown={(event) => {
                          if (cancel()) event.preventDefault();
                        }}
                      >
                        {(handle) => handle("div", handleTargetProps)}
                      </Splitter.Handle>
                      <Splitter.Panel
                        side="secondary"
                        id="splitter-pixel-secondary"
                        minSize={smin()}
                        maxSize={smax()}
                      >
                        <Show when={nested()}>
                          <Splitter.Root
                            id="splitter-nested"
                            unit="px"
                            defaultSize={100}
                            style={{ width: "100%", height: "120px" }}
                          >
                            <Splitter.Panel
                              side="primary"
                              id="splitter-nested-primary"
                            >
                              Nested primary
                            </Splitter.Panel>
                            <Splitter.Handle
                              aria-label="Nested workspace"
                              style={{ width: "20px", background: "gray" }}
                            />
                            <Splitter.Panel
                              side="secondary"
                              id="splitter-nested-secondary"
                            >
                              Nested secondary
                            </Splitter.Panel>
                          </Splitter.Root>
                        </Show>
                      </Splitter.Panel>
                    </>
                  );
                },
              })
            }
          </Splitter.Root>
        </Show>
        <output id="splitter-pixel-events">{JSON.stringify(log())}</output>
        <output
          id="splitter-pixel-refs"
          aria-label="Last received Splitter refs"
        >
          {rootRef()?.id === "splitter-pixel" &&
          panelRef()?.tagName === "ARTICLE" &&
          handleRef()?.getAttribute("role") === "separator"
            ? "actual hosts"
            : "awaiting refs"}
        </output>
        <button onClick={() => setPercentMax(100)}>
          Allow percentage collapse space
        </button>
        <button
          onClick={() => {
            setPercentPrimaryMin(60);
            setPercentPrimaryMax(60);
            setPercentSecondaryMin(50);
            setPercentMax(50);
          }}
        >
          Set percentage overflow
        </button>
        <button
          onClick={() => {
            setPercentPrimaryMin(10);
            setPercentPrimaryMax(20);
            setPercentSecondaryMin(0);
            setPercentMax(30);
          }}
        >
          Set percentage underflow
        </button>
        <Splitter.Root
          id="splitter-percent"
          defaultSize={40}
          style={rootStyle()}
          onSizeChange={(v) =>
            setPercentLog((previous) => [...previous, ["change", v]])
          }
          onSizeCommit={(v) =>
            setPercentLog((previous) => [...previous, ["commit", v]])
          }
          onCollapsedChange={(v) =>
            setPercentLog((previous) => [...previous, ["collapse", v]])
          }
        >
          <Splitter.Panel
            side="primary"
            id="splitter-percent-primary"
            minSize={percentPrimaryMin()}
            maxSize={percentPrimaryMax()}
            collapsible
            collapsedSize={2}
          >
            Percentage primary
          </Splitter.Panel>
          <Splitter.Handle
            aria-label="Percentage workspace"
            style={handleStyle()}
          />
          <Splitter.Panel
            side="secondary"
            id="splitter-percent-secondary"
            minSize={percentSecondaryMin()}
            maxSize={percentMax()}
          >
            Percentage secondary
          </Splitter.Panel>
        </Splitter.Root>
        <output id="splitter-percent-events">
          {JSON.stringify(percentLog())}
        </output>
        <Splitter.Root
          id="splitter-vertical"
          unit="px"
          defaultSize={400}
          orientation="vertical"
          style={rootStyle(true)}
          onSizeChange={(v) =>
            setVerticalLog((previous) => [...previous, ["change", v]])
          }
          onSizeCommit={(v) =>
            setVerticalLog((previous) => [...previous, ["commit", v]])
          }
        >
          <Splitter.Panel
            side="primary"
            id="splitter-vertical-primary"
            minSize={100}
            maxSize={800}
          >
            Vertical primary
          </Splitter.Panel>
          <Splitter.Handle
            aria-label="Vertical workspace"
            style={handleStyle(true)}
          />
          <Splitter.Panel
            side="secondary"
            id="splitter-vertical-secondary"
            minSize={300}
            maxSize={700}
          >
            Vertical secondary
          </Splitter.Panel>
        </Splitter.Root>
        <output id="splitter-vertical-events">
          {JSON.stringify(verticalLog())}
        </output>
        <Splitter.Root
          id="splitter-rtl"
          unit="px"
          defaultSize={400}
          dir="rtl"
          style={rootStyle()}
          onSizeChange={(v) =>
            setRtlLog((previous) => [...previous, ["change", v]])
          }
          onSizeCommit={(v) =>
            setRtlLog((previous) => [...previous, ["commit", v]])
          }
        >
          <Splitter.Panel
            side="primary"
            id="splitter-rtl-primary"
            minSize={100}
            maxSize={800}
          >
            RTL primary
          </Splitter.Panel>
          <Splitter.Handle
            aria-label="RTL workspace"
            style={handleStyle()}
          />
          <Splitter.Panel
            side="secondary"
            id="splitter-rtl-secondary"
            minSize={300}
            maxSize={700}
          >
            RTL secondary
          </Splitter.Panel>
        </Splitter.Root>
        <output id="splitter-rtl-events">{JSON.stringify(rtlLog())}</output>
        <Splitter.Root
          id="splitter-default"
          style={rootStyle()}
        >
          <Splitter.Panel
            side="primary"
            id="splitter-default-primary"
          >
            Default half
          </Splitter.Panel>
          <Splitter.Handle
            aria-label="Default workspace"
            style={handleStyle()}
          />
          <Splitter.Panel
            side="secondary"
            id="splitter-default-secondary"
          >
            Default remainder
          </Splitter.Panel>
        </Splitter.Root>
        <Splitter.Root
          id="splitter-initial-collapse"
          unit="px"
          defaultSize={400}
          defaultCollapsed
          style={rootStyle()}
        >
          <Splitter.Panel
            side="primary"
            id="splitter-initial-collapse-primary"
            minSize={100}
            maxSize={800}
            collapsible
            collapsedSize={20}
          >
            <input aria-label="Initially collapsed draft" />
          </Splitter.Panel>
          <Splitter.Handle
            aria-label="Initially collapsed workspace"
            style={handleStyle()}
          />
          <Splitter.Panel
            side="secondary"
            id="splitter-initial-collapse-secondary"
            minSize={300}
          >
            Collapsed remainder
          </Splitter.Panel>
        </Splitter.Root>
        <Splitter.Root
          id="splitter-reconcile"
          unit="px"
          defaultSize={100}
          style={rootStyle()}
          onSizeChange={(v) => append("change", v)}
          onSizeCommit={(v) => append("commit", v)}
        >
          <Splitter.Panel
            side="primary"
            id="splitter-reconcile-primary"
            minSize={100}
            maxSize={800}
          >
            Provisional own-bound primary
          </Splitter.Panel>
          <Splitter.Handle
            aria-label="Reconciled workspace"
            style={handleStyle()}
          />
          <Splitter.Panel
            side="secondary"
            id="splitter-reconcile-secondary"
            minSize={300}
            maxSize={700}
          >
            Bounded remainder
          </Splitter.Panel>
        </Splitter.Root>
      </div>
    </section>
  );
}

function ConfigurationExample(props: { kind: string }): Element {
  const kind = props.kind;
  return (
    <Splitter.Root
      unit={kind === "missing-px-size" ? "px" : "%"}
      defaultSize={
        kind === "missing-px-size"
          ? undefined
          : kind === "negative-size"
            ? -1
            : kind === "nonfinite-size"
              ? NaN
              : kind === "percent-over-100"
                ? 101
                : 40
      }
      step={kind === "zero-step" ? 0 : undefined}
      defaultCollapsed={kind === "noncollapsible"}
      style={{ width: "400px", height: "80px" }}
    >
      {kind === "wrong-order" && (
        <Splitter.Panel side="secondary">Wrong order</Splitter.Panel>
      )}
      <Splitter.Panel
        side="primary"
        minSize={10}
        maxSize={kind === "reversed-bounds" ? 5 : 80}
        collapsedSize={kind === "collapsed-rail" ? 11 : 0}
      >
        Configuration primary
      </Splitter.Panel>
      {kind === "duplicate-primary" && (
        <Splitter.Panel side="primary">Duplicate</Splitter.Panel>
      )}
      <Splitter.Handle
        aria-label={
          kind === "unnamed-handle" ? undefined : "Configuration workspace"
        }
        style={{ width: "20px" }}
      />
      {kind !== "missing-secondary" && kind !== "wrong-order" && (
        <Splitter.Panel
          side="secondary"
          collapsible={kind === "secondary-collapse" ? false : undefined}
        >
          Configuration secondary
        </Splitter.Panel>
      )}
    </Splitter.Root>
  );
}
