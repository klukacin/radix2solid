import { Tree } from "@wsagency/radix2solid-primitives";
import { createSignal, Errored, Show, type Element } from "solid-js";

export function Trees(): Element {
  const [value, setValue] = createSignal<string | null>("guide");
  const [expanded, setExpanded] = createSignal<readonly string[]>([
    "projects",
    "docs",
    "locked",
  ]);
  const [selectionRequests, setSelectionRequests] = createSignal<
    (string | null)[]
  >([]);
  const [expansionRequests, setExpansionRequests] = createSignal<
    (readonly string[])[]
  >([]);
  const [activations, setActivations] = createSignal<string[]>([]);
  const [acceptSelection, setAcceptSelection] = createSignal(true);
  const [acceptExpansion, setAcceptExpansion] = createSignal(true);
  const [cancelActivation, setCancelActivation] = createSignal(false);
  const [cancelKeys, setCancelKeys] = createSignal(false);
  const [cancelDisclosure, setCancelDisclosure] = createSignal(false);
  const [mode, setMode] = createSignal<"single" | "none">("single");
  const [dir, setDir] = createSignal<"ltr" | "rtl">("ltr");
  const [removed, setRemoved] = createSignal<string[]>([]);
  const [disabled, setDisabled] = createSignal<string[]>(["locked"]);
  const [allDisabled, setAllDisabled] = createSignal(false);
  const [empty, setEmpty] = createSignal(false);
  const [mounted, setMounted] = createSignal(true);
  const [exiting, setExiting] = createSignal(false);
  const [invalid, setInvalid] = createSignal<"empty" | "duplicate" | null>(
    null,
  );
  let docsTrigger: HTMLButtonElement | undefined;

  const itemProps = (key: string, textValue = key) => ({
    value: key,
    textValue,
    "data-tree-key": key,
    get disabled() {
      return allDisabled() || disabled().includes(key);
    },
    onActivate(event: Event) {
      setActivations((previous) => [...previous, key]);
      if (cancelActivation()) event.preventDefault();
    },
    onKeyDown(event: KeyboardEvent) {
      if (cancelKeys()) event.preventDefault();
    },
  });
  const collapse = (key: string) =>
    setExpanded((previous) => previous.filter((value) => value !== key));
  const remove = (key: string) => setRemoved((previous) => [...previous, key]);
  const restore = (key: string) =>
    setRemoved((previous) => previous.filter((value) => value !== key));
  const disable = (key: string) =>
    setDisabled((previous) => [...previous, key]);

  const [nativeValue, setNativeValue] = createSignal<string | null>(null);
  const [nativeActivations, setNativeActivations] = createSignal<string[]>([]);
  const [nativeRequests, setNativeRequests] = createSignal<(string | null)[]>(
    [],
  );
  const [cancelNative, setCancelNative] = createSignal(false);
  const [cancelNativeKeys, setCancelNativeKeys] = createSignal(false);
  const [nativeButton, setNativeButton] = createSignal<
    HTMLElement | undefined
  >();
  const [nativeLink, setNativeLink] = createSignal<HTMLElement | undefined>();
  const nativeProps = (key: string) => ({
    value: key,
    textValue: key,
    "data-tree-key": key,
    onActivate(event: Event) {
      setNativeActivations((previous) => [...previous, key]);
      if (cancelNative()) event.preventDefault();
    },
    onKeyDown(event: KeyboardEvent) {
      if (cancelNativeKeys()) event.preventDefault();
    },
  });

  return (
    <section aria-label="Native tree controls">
      <style>{`
      [data-workspace-tree] [role=treeitem] { padding: 4px; }
      [data-workspace-tree] [role=group] { padding-inline-start: 20px; }
      [data-workspace-tree] [role=treeitem]:focus { outline: 2px solid royalblue; outline-offset: -2px; }
      [data-workspace-tree] [data-selected] > [data-tree-label] { background: #dde9ff; color: #152b49; }
      [data-workspace-tree] [aria-disabled=true] > [data-tree-label] { opacity: .55; }
      [data-tree-exiting][data-state=closed] { animation: tree-exit 60s linear; }
      @keyframes tree-exit { from { opacity: 1; } to { opacity: 0; } }
    `}</style>
      <h2>Tree: independent focus, selection, activation and expansion</h2>
      <p>
        Arrow keys move focus; Space selects; Enter activates. Disclosure
        buttons expand only. For ordinary sidebar links, prefer a disclosure
        list rather than a composite tree.
      </p>
      <label>
        <input
          type="checkbox"
          checked={acceptSelection()}
          onChange={(event) => setAcceptSelection(event.currentTarget.checked)}
        />
        Accept tree selection
      </label>
      <label>
        <input
          type="checkbox"
          checked={acceptExpansion()}
          onChange={(event) => setAcceptExpansion(event.currentTarget.checked)}
        />
        Accept tree expansion
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancelActivation()}
          onChange={(event) => setCancelActivation(event.currentTarget.checked)}
        />
        Cancel tree activation
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancelKeys()}
          onChange={(event) => setCancelKeys(event.currentTarget.checked)}
        />
        Cancel tree keys
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancelDisclosure()}
          onChange={(event) => setCancelDisclosure(event.currentTarget.checked)}
        />
        Cancel tree disclosure
      </label>
      <div>
        <button onClick={() => setDir("rtl")}>Use RTL tree</button>
        <button onClick={() => setMode("none")}>Use action-only tree</button>
        <button onClick={() => setMode("single")}>
          Use single-selection tree
        </button>
        <button onClick={() => setValue("api")}>Select API externally</button>
        <button onClick={() => setValue(null)}>Clear tree selection</button>
        <button
          onClick={() =>
            setExpanded(["locked", "projects", "locked", "docs", "projects"])
          }
        >
          Set duplicate tree expansions
        </button>
        <button onClick={() => docsTrigger?.click()}>
          Request Docs collapse
        </button>
        <button
          onClick={() =>
            setExpanded((previous) =>
              previous.includes("docs") ? previous : [...previous, "docs"],
            )
          }
        >
          Expand Docs externally
        </button>
        <button onClick={() => collapse("docs")}>
          Collapse Docs externally
        </button>
        <button onClick={() => collapse("locked")}>
          Collapse Locked externally
        </button>
        <button onClick={() => collapse("projects")}>
          Collapse Projects externally
        </button>
        <button onClick={() => remove("guide")}>Remove Guide</button>
        <button onClick={() => restore("guide")}>Restore Guide</button>
        <button onClick={() => disable("guide")}>Disable Guide</button>
        <button onClick={() => disable("docs")}>Disable Docs</button>
        <button onClick={() => disable("projects")}>Disable Projects</button>
        <button onClick={() => remove("alpha")}>Remove Alpha</button>
        <button onClick={() => disable("alpine")}>Disable Alpine</button>
        <button onClick={() => remove("zulu")}>Remove Zulu</button>
        <button onClick={() => remove("projects")}>Remove Projects</button>
        <button onClick={() => restore("projects")}>Restore Projects</button>
        <button onClick={() => setEmpty(true)}>Empty workspace tree</button>
        <button onClick={() => setEmpty(false)}>Restore workspace tree</button>
        <button onClick={() => setAllDisabled(true)}>
          Disable all tree items
        </button>
        <button onClick={() => setAllDisabled(false)}>
          Enable all tree items
        </button>
        <button onClick={() => setExiting(true)}>Use exiting Docs group</button>
        <button onClick={() => setMounted(false)}>
          Unmount workspace tree
        </button>
        <button onClick={() => setMounted(true)}>Mount workspace tree</button>
      </div>
      <button>Before workspace tree</button>
      <Show when={mounted()}>
        <Tree.Root
          aria-label="Workspace"
          data-workspace-tree
          value={value()}
          expandedValues={expanded()}
          selectionMode={mode()}
          dir={dir()}
          onValueChange={(next) => {
            setSelectionRequests((previous) => [...previous, next]);
            if (acceptSelection()) setValue(next);
          }}
          onExpandedValuesChange={(next) => {
            setExpansionRequests((previous) => [...previous, next]);
            if (acceptExpansion()) setExpanded(next);
          }}
        >
          <Show when={!empty()}>
            <Show when={!removed().includes("projects")}>
              <Tree.Item
                {...itemProps("projects")}
                hasChildren
              >
                <Tree.ItemText data-tree-label>Projects</Tree.ItemText>
                <Tree.ItemIndicator> ▸</Tree.ItemIndicator>
                <Tree.ItemGroup>
                  <Tree.Item
                    {...itemProps("docs")}
                    hasChildren
                  >
                    <Tree.ItemText data-tree-label>Docs</Tree.ItemText>
                    <Tree.ExpandTrigger
                      ref={(node) => {
                        docsTrigger = node;
                        return () => {
                          docsTrigger = undefined;
                        };
                      }}
                      aria-label="Expand Docs"
                    >
                      Toggle Docs
                    </Tree.ExpandTrigger>
                    <Tree.ItemGroup
                      forceMount={exiting() ? undefined : true}
                      data-tree-exiting={exiting() ? "" : undefined}
                    >
                      <Show when={!removed().includes("guide")}>
                        <Tree.Item {...itemProps("guide")}>
                          <Tree.ItemText data-tree-label>Guide</Tree.ItemText>
                        </Tree.Item>
                      </Show>
                      <Tree.Item
                        {...itemProps("api")}
                        aria-level={3}
                        aria-posinset={2}
                        aria-setsize={8}
                      >
                        <Tree.ItemText data-tree-label>
                          API reference
                        </Tree.ItemText>
                      </Tree.Item>
                    </Tree.ItemGroup>
                  </Tree.Item>
                  <Tree.Item {...itemProps("notes")}>
                    <Tree.ItemText data-tree-label>Notes</Tree.ItemText>
                  </Tree.Item>
                </Tree.ItemGroup>
              </Tree.Item>
            </Show>
            <Tree.Item
              {...itemProps("locked")}
              hasChildren
            >
              <Tree.ItemText data-tree-label>Locked</Tree.ItemText>
              <Tree.ItemGroup>
                <Tree.Item
                  {...itemProps("public")}
                  aria-level={2}
                  aria-posinset={4}
                  aria-setsize={-1}
                >
                  <Tree.ItemText data-tree-label>Public</Tree.ItemText>
                </Tree.Item>
              </Tree.ItemGroup>
            </Tree.Item>
            <Tree.Item
              {...itemProps("archive")}
              hasChildren
            >
              <Tree.ItemText data-tree-label>Archive</Tree.ItemText>
              <Tree.ExpandTrigger
                aria-label="Expand Archive"
                onClick={(event) => {
                  if (cancelDisclosure()) event.preventDefault();
                }}
              >
                Toggle Archive
              </Tree.ExpandTrigger>
              <Tree.ItemGroup>
                <Tree.Item {...itemProps("archived")}>
                  <Tree.ItemText data-tree-label>Archived item</Tree.ItemText>
                </Tree.Item>
              </Tree.ItemGroup>
            </Tree.Item>
            <Show when={!removed().includes("alpha")}>
              <Tree.Item {...itemProps("alpha")}>
                <Tree.ItemText data-tree-label>Report</Tree.ItemText>
              </Tree.Item>
            </Show>
            <Tree.Item {...itemProps("alpine")}>
              <Tree.ItemText data-tree-label>Report</Tree.ItemText>
            </Tree.Item>
            <Show when={!removed().includes("zulu")}>
              <Tree.Item {...itemProps("zulu", "zebra")}>
                <Tree.ItemText data-tree-label>
                  <strong>Rich</strong> label
                </Tree.ItemText>
              </Tree.Item>
            </Show>
          </Show>
        </Tree.Root>
      </Show>
      <button>After workspace tree</button>
      <output id="tree-value">{value() ?? ""}</output>
      <output id="tree-selection-requests">
        {JSON.stringify(selectionRequests())}
      </output>
      <output id="tree-expansion-requests">
        {JSON.stringify(expansionRequests())}
      </output>
      <output id="tree-activations">{JSON.stringify(activations())}</output>
      <label>
        <input
          type="checkbox"
          checked={cancelNative()}
          onChange={(event) => setCancelNative(event.currentTarget.checked)}
        />
        Cancel native tree activation
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancelNativeKeys()}
          onChange={(event) => setCancelNativeKeys(event.currentTarget.checked)}
        />
        Cancel native tree keys
      </label>
      <Tree.Root
        aria-label="Native targets"
        value={nativeValue()}
        onValueChange={(next) => {
          setNativeRequests((previous) => [...previous, next]);
          setNativeValue(next);
        }}
      >
        <Tree.Item
          {...nativeProps("button")}
          ref={setNativeButton}
          asChild
        >
          {(target) =>
            target("button", {
              type: "button",
              get children() {
                return <Tree.ItemText>Native button</Tree.ItemText>;
              },
            })
          }
        </Tree.Item>
        <Tree.Item
          {...nativeProps("link")}
          ref={setNativeLink}
          asChild
        >
          {(target) =>
            target("a", {
              href: "#tree-native-destination",
              get children() {
                return <Tree.ItemText>Native link</Tree.ItemText>;
              },
            })
          }
        </Tree.Item>
      </Tree.Root>
      <span id="tree-native-destination">Native anchor destination</span>
      <output id="tree-native-refs">
        {nativeButton()?.tagName},{nativeLink()?.tagName}
      </output>
      <output id="tree-native-activations">
        {JSON.stringify(nativeActivations())}
      </output>
      <output id="tree-native-selection-requests">
        {JSON.stringify(nativeRequests())}
      </output>
      <button onClick={() => setInvalid("empty")}>Mount empty tree keys</button>
      <button onClick={() => setInvalid("duplicate")}>
        Mount duplicate tree keys
      </button>
      <Errored
        fallback={(error) => (
          <output id="tree-key-error">{String(error())}</output>
        )}
      >
        <Show when={invalid()}>
          <Tree.Root aria-label="Invalid keys">
            <Tree.Item
              value={invalid() === "empty" ? "" : "duplicate"}
              textValue="First"
            >
              <Tree.ItemText>First</Tree.ItemText>
            </Tree.Item>
            <Show when={invalid() === "duplicate"}>
              <Tree.Item
                value="duplicate"
                textValue="Second"
              >
                <Tree.ItemText>Second</Tree.ItemText>
              </Tree.Item>
            </Show>
          </Tree.Root>
        </Show>
      </Errored>
    </section>
  );
}
