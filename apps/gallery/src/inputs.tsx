import { Combobox, Command, Dialog } from "@wsagency/radix2solid-primitives";
import type { ComboboxItem } from "@wsagency/radix2solid-primitives/combobox";
import { createSignal, For, Show, type Element } from "solid-js";

const basic: readonly ComboboxItem[] = [
  { value: "alpha", label: "Alpha" },
  { value: "blocked", label: "Unavailable", disabled: true },
  { value: "beta", label: "Beta" },
];
const surface = {
  background: "Canvas",
  color: "CanvasText",
  border: "1px solid",
  padding: "8px",
  "z-index": 30,
};
const dialogSurface = {
  ...surface,
  position: "fixed",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(420px, 80vw)",
  "max-height": "75vh",
  overflow: "auto",
} as const;
const viewport = { "max-height": "150px", overflow: "auto" };

function Suggestions(props: {
  name: string;
  items: readonly ComboboxItem[];
  empty?: string;
}): Element {
  return (
    <Combobox.Portal>
      <Combobox.Content style={surface}>
        <Combobox.List
          aria-label={props.name}
          style={viewport}
        >
          <Combobox.Group>
            <Combobox.Label>Choices</Combobox.Label>
            <For each={props.items}>
              {(item) => (
                <Combobox.Item
                  value={item.value}
                  id={
                    item.value === "alpha"
                      ? false
                      : item.value === "beta"
                        ? ""
                        : undefined
                  }
                  style={{ padding: "8px" }}
                >
                  <Combobox.ItemText>
                    <strong>{item.label}</strong>
                  </Combobox.ItemText>
                  <Combobox.ItemIndicator>Selected</Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </For>
          </Combobox.Group>
        </Combobox.List>
        <Combobox.Empty aria-label={props.empty ?? `${props.name} empty`}>
          No choices
        </Combobox.Empty>
      </Combobox.Content>
    </Combobox.Portal>
  );
}
function Draft(): Element {
  const [required, setRequired] = createSignal(false),
    [disabled, setDisabled] = createSignal(false),
    [readOnly, setReadOnly] = createSignal(false);
  const [items, setItems] = createSignal(basic),
    [submits, setSubmits] = createSignal(0),
    [changes, setChanges] = createSignal(0);
  const [override, setOverride] = createSignal(false),
    [value, setValue] = createSignal<string | null>("alpha");
  return (
    <section aria-label="Draft inputs">
      <label>
        <input
          type="checkbox"
          checked={required()}
          onChange={(e) => setRequired(e.currentTarget.checked)}
        />
        Require draft choice
      </label>
      <label>
        <input
          type="checkbox"
          checked={disabled()}
          onChange={(e) => setDisabled(e.currentTarget.checked)}
        />
        Disable draft choice
      </label>
      <label>
        <input
          type="checkbox"
          checked={readOnly()}
          onChange={(e) => setReadOnly(e.currentTarget.checked)}
        />
        Read only draft choice
      </label>
      <button
        onClick={() => {
          setValue("alpha");
          setOverride(true);
        }}
      >
        Set draft Alpha
      </button>
      <button
        onClick={() => {
          setValue(null);
          setOverride(true);
        }}
      >
        Set draft null
      </button>
      <button
        onClick={() => setItems(basic.filter((item) => item.value !== "alpha"))}
      >
        Remove draft Alpha
      </button>
      <form
        aria-label="Draft choice form"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmits((n) => n + 1);
        }}
        onChange={(e) => {
          if ((e.target as HTMLInputElement).name === "choice")
            setChanges((n) => n + 1);
        }}
      >
        <Combobox.Root
          items={items()}
          defaultValue="alpha"
          value={override() ? value() : undefined}
          onValueChange={(key) => {
            if (override()) setValue(key);
          }}
          name="choice"
          required={required()}
          disabled={disabled()}
          readOnly={readOnly()}
        >
          <Combobox.Input
            id={false}
            aria-label="Draft choice"
            aria-describedby="draft-choice-description"
          />
          <Combobox.Trigger aria-label="Toggle draft suggestions">
            Suggestions
          </Combobox.Trigger>
          <Combobox.Clear aria-label="Clear draft choice">Clear</Combobox.Clear>
          <Suggestions
            name="Draft suggestions"
            items={items()}
          />
        </Combobox.Root>
        <button type="submit">Submit draft choice</button>
      </form>
      <p id="draft-choice-description">
        Choose an existing item; drafts are not submitted.
      </p>
      <output aria-label="Draft submissions">{submits()}</output>
      <output aria-label="Draft key changes">{changes()}</output>
      <form aria-label="Unknown choice form">
        <Combobox.Root
          items={basic}
          defaultValue="missing"
          name="unknown-choice"
        >
          <Combobox.Input aria-label="Unknown choice" />
        </Combobox.Root>
      </form>
      <form aria-label="Server draft form">
        <Combobox.Root
          items={basic}
          defaultValue="alpha"
          defaultQuery="draft"
          name="server-draft"
        >
          <Combobox.Input aria-label="Server draft choice" />
        </Combobox.Root>
      </form>
    </section>
  );
}
function Controlled(): Element {
  const [value, setValue] = createSignal<string | null>("alpha"),
    [query, setQuery] = createSignal("Alpha"),
    [open, setOpen] = createSignal(false);
  const [acceptKey, setAcceptKey] = createSignal(false),
    [acceptQuery, setAcceptQuery] = createSignal(false),
    [acceptOpen, setAcceptOpen] = createSignal(false),
    [defer, setDefer] = createSignal(false);
  const [keys, setKeys] = createSignal<(string | null)[]>([]),
    [queries, setQueries] = createSignal<string[]>([]),
    [items, setItems] = createSignal(basic),
    [render, setRender] = createSignal(0);
  let pending: string | null = null;
  return (
    <section
      aria-label="Controlled inputs"
      data-render={render()}
    >
      <label>
        <input
          type="checkbox"
          checked={acceptKey()}
          onChange={(e) => setAcceptKey(e.currentTarget.checked)}
        />
        Accept controlled key
      </label>
      <label>
        <input
          type="checkbox"
          checked={acceptQuery()}
          onChange={(e) => setAcceptQuery(e.currentTarget.checked)}
        />
        Accept controlled query
      </label>
      <label>
        <input
          type="checkbox"
          checked={acceptOpen()}
          onChange={(e) => setAcceptOpen(e.currentTarget.checked)}
        />
        Accept controlled open
      </label>
      <label>
        <input
          type="checkbox"
          checked={defer()}
          onChange={(e) => setDefer(e.currentTarget.checked)}
        />
        Defer controlled key
      </label>
      <button onClick={() => setValue(pending)}>
        Apply pending controlled key
      </button>
      <button onClick={() => setOpen(true)}>Open controlled suggestions</button>
      <button onClick={() => setQuery("Alpha")}>
        Set controlled query Alpha
      </button>
      <button onClick={() => setQuery("Beta")}>
        Set controlled query Beta
      </button>
      <button
        onClick={() => {
          setKeys([]);
          setQueries([]);
        }}
      >
        Clear controlled proposal log
      </button>
      <button onClick={() => setRender((n) => n + 1)}>
        Rerender controlled parent
      </button>
      <button
        onClick={() => setItems(basic.filter((item) => item.value !== "alpha"))}
      >
        Remove controlled Alpha
      </button>
      <button
        onClick={() =>
          setItems(
            basic.map((item) =>
              item.value === "alpha" ? { ...item, disabled: true } : item,
            ),
          )
        }
      >
        Disable controlled Alpha
      </button>
      <button onClick={() => setItems(basic)}>Restore controlled Alpha</button>
      <form
        aria-label="Controlled choice form"
        onSubmit={(e) => e.preventDefault()}
      >
        <Combobox.Root
          items={items()}
          value={value()}
          query={query()}
          open={open()}
          filter={false}
          name="controlled-choice"
          onValueChange={(key) => {
            setKeys((previous) => [...previous, key]);
            if (defer()) pending = key;
            else if (acceptKey()) setValue(key);
          }}
          onQueryChange={(text) => {
            setQueries((previous) => [...previous, text]);
            if (acceptQuery()) setQuery(text);
          }}
          onOpenChange={(next) => {
            if (acceptOpen()) setOpen(next);
          }}
        >
          <Combobox.Input aria-label="Controlled choice" />
          <Suggestions
            name="Controlled suggestions"
            items={items()}
          />
        </Combobox.Root>
      </form>
      <output aria-label="Controlled key proposals">
        {JSON.stringify(keys())}
      </output>
      <output aria-label="Controlled query proposals">
        {JSON.stringify(queries())}
      </output>
    </section>
  );
}
function Reset(): Element {
  const [value, setValue] = createSignal<string | null>("alpha"),
    [query, setQuery] = createSignal("Alpha"),
    [accept, setAccept] = createSignal(true),
    [prevent, setPrevent] = createSignal(false);
  const [items, setItems] = createSignal(basic),
    [mounted, setMounted] = createSignal(true),
    [callbacks, setCallbacks] = createSignal(0);
  return (
    <section aria-label="Reset inputs">
      <label>
        <input
          type="checkbox"
          checked={accept()}
          onChange={(e) => setAccept(e.currentTarget.checked)}
        />
        Accept choice reset
      </label>
      <label>
        <input
          type="checkbox"
          checked={prevent()}
          onChange={(e) => setPrevent(e.currentTarget.checked)}
        />
        Prevent choice reset
      </label>
      <button onClick={() => setValue("beta")}>Set reset Beta</button>
      <button
        onClick={() => setItems(basic.filter((item) => item.value !== "alpha"))}
      >
        Remove reset Alpha
      </button>
      <button onClick={() => setMounted(false)}>Unmount reset choice</button>
      <form
        id="external-choice-form"
        aria-label="External choice form"
        onReset={(e) => {
          if (prevent()) e.preventDefault();
        }}
      >
        <button type="reset">Reset external choice</button>
      </form>
      <form
        id="decoy-choice-form"
        aria-label="Decoy choice form"
      />
      <Show when={mounted()}>
        <Combobox.Root
          items={items()}
          value={value()}
          query={query()}
          name="reset-choice"
          form="external-choice-form"
          filter={false}
          onValueChange={(key) => {
            setCallbacks((n) => n + 1);
            if (accept()) setValue(key);
          }}
          onQueryChange={(text) => {
            setCallbacks((n) => n + 1);
            if (accept()) setQuery(text);
          }}
        >
          <Combobox.Input
            aria-label="Reset choice"
            asChild
          >
            {(target) =>
              target("input", {
                name: "wrong-choice",
                form: "decoy-choice-form",
              })
            }
          </Combobox.Input>
          <Suggestions
            name="Reset suggestions"
            items={items()}
          />
        </Combobox.Root>
      </Show>
      <output aria-label="Reset callback count">{callbacks()}</output>
    </section>
  );
}
function Lifecycle(): Element {
  const initial: readonly ComboboxItem[] = [
    { value: "alpha", label: "Alpha" },
    { value: "beta", label: "Beta" },
    { value: "gamma", label: "Gamma" },
  ];
  const [items, setItems] = createSignal(initial),
    [dir, setDir] = createSignal<"ltr" | "rtl">("ltr"),
    [suffix, setSuffix] = createSignal(false);
  return (
    <section aria-label="Lifecycle inputs">
      <button onClick={() => setDir("ltr")}>Use LTR inputs</button>
      <button onClick={() => setDir("rtl")}>Use RTL inputs</button>
      <button onClick={() => setSuffix(true)}>Use suffix choice filter</button>
      <button
        onClick={() => setItems((items) => items.map((item) => ({ ...item })))}
      >
        Replace choice objects
      </button>
      <button
        onClick={() =>
          setItems((items) => [...items].reverse().map((item) => ({ ...item })))
        }
      >
        Reverse choice objects
      </button>
      <button
        onClick={() =>
          setItems([{ value: "blocked", label: "Unavailable", disabled: true }])
        }
      >
        Show disabled choices only
      </button>
      <button
        onClick={() =>
          setItems([
            { value: "same-1", label: "Same" },
            { value: "same-2", label: "Same" },
          ])
        }
      >
        Show duplicate choice labels
      </button>
      <button
        onClick={() =>
          setItems(
            Array.from({ length: 25 }, (_, i) => ({
              value: `choice-${i}`,
              label: `Choice ${i}`,
            })),
          )
        }
      >
        Show long choice list
      </button>
      <form
        aria-label="Lifecycle choice form"
        onSubmit={(e) => e.preventDefault()}
      >
        <Combobox.Root
          items={items()}
          name="lifecycle-choice"
          dir={dir()}
          filter={
            suffix()
              ? (item, query) =>
                  item.label.toLowerCase().endsWith(query.trim().toLowerCase())
              : undefined
          }
        >
          <Combobox.Input aria-label="Lifecycle choice" />
          <Combobox.Trigger aria-label="Toggle lifecycle suggestions">
            Suggestions
          </Combobox.Trigger>
          <Suggestions
            name="Lifecycle suggestions"
            items={items()}
            empty="Lifecycle empty"
          />
        </Combobox.Root>
        <button type="button">After lifecycle choice</button>
      </form>
    </section>
  );
}
function NativeChoice(): Element {
  const [cancelKeys, setCancelKeys] = createSignal(false),
    [cancel, setCancel] = createSignal(false),
    [commits, setCommits] = createSignal(0),
    [submits, setSubmits] = createSignal(0);
  const items = [
    ...basic,
    ...Array.from({ length: 12 }, (_, i) => ({
      value: `native-${i}`,
      label: `Native extra ${i}`,
    })),
  ];
  let input: HTMLInputElement | undefined;
  return (
    <section aria-label="Native target inputs">
      <label>
        <input
          type="checkbox"
          checked={cancelKeys()}
          onChange={(e) => setCancelKeys(e.currentTarget.checked)}
        />
        Cancel native input keys
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancel()}
          onChange={(e) => setCancel(e.currentTarget.checked)}
        />
        Cancel native choice activation
      </label>
      <button onClick={() => input?.focus()}>Focus native choice ref</button>
      <form
        id="native-choice-form"
        aria-label="Native choice form"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmits((n) => n + 1);
        }}
      >
        <Combobox.Root
          items={items}
          name="native-choice"
          filter={false}
          onValueChange={() => setCommits((n) => n + 1)}
        >
          <Combobox.Input
            aria-label="Native choice"
            ref={(node) => {
              input = node;
            }}
            onKeyDown={(e) => {
              if (cancelKeys()) e.preventDefault();
            }}
            asChild
          >
            {(target) => target("input", {})}
          </Combobox.Input>
          <Combobox.Trigger
            aria-label="Toggle native suggestions"
            asChild
          >
            {(target) => target("button", { children: "Suggestions" })}
          </Combobox.Trigger>
          <Combobox.Clear
            aria-label="Clear native choice"
            asChild
          >
            {(target) => target("button", { children: "Clear" })}
          </Combobox.Clear>
          <Combobox.Portal>
            <Combobox.Content style={surface}>
              <Combobox.List
                aria-label="Native suggestions"
                style={viewport}
                asChild
              >
                {(target) =>
                  target("div", {
                    id: "native-choice-child-list",
                    children: (
                      <Combobox.Group>
                        <Combobox.Label asChild>
                          {(label) =>
                            label("span", {
                              id: "native-choice-child-label",
                              children: "Native choices",
                            })
                          }
                        </Combobox.Label>
                        <Combobox.Item
                          value="alpha"
                          aria-label="Native Alpha button"
                          onClick={(e) => {
                            if (cancel()) e.preventDefault();
                          }}
                          asChild
                        >
                          {(item) =>
                            item("button", {
                              id: "native-choice-child-alpha",
                              type: "submit",
                              form: "native-choice-form",
                              children: "Alpha",
                            })
                          }
                        </Combobox.Item>
                        <Combobox.Item
                          value="beta"
                          aria-label="Native Beta link"
                          onClick={(e) => {
                            if (cancel()) e.preventDefault();
                          }}
                          asChild
                        >
                          {(item) =>
                            item("a", {
                              id: "native-choice-child-beta",
                              href: "#native-choice-navigation",
                              children: "Beta",
                            })
                          }
                        </Combobox.Item>
                        <For each={items.slice(3)}>
                          {(item) => (
                            <Combobox.Item
                              value={item.value}
                              style={{ padding: "12px" }}
                            >
                              <Combobox.ItemText />
                            </Combobox.Item>
                          )}
                        </For>
                      </Combobox.Group>
                    ),
                  })
                }
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Portal>
        </Combobox.Root>
      </form>
      <output aria-label="Native choice commits">{commits()}</output>
      <output aria-label="Native choice submissions">{submits()}</output>
    </section>
  );
}
function Commands(): Element {
  const initial = [
    { value: "alpha", label: "Run Alpha" },
    { value: "blocked", label: "Unavailable action", disabled: true },
    { value: "beta", label: "Run Beta" },
  ];
  const [search, setSearch] = createSignal(""),
    [accept, setAccept] = createSignal(true),
    [clamp, setClamp] = createSignal(false),
    [items, setItems] = createSignal(initial);
  const [alpha, setAlpha] = createSignal(0),
    [beta, setBeta] = createSignal(0),
    [submits, setSubmits] = createSignal(0),
    [generation, setGeneration] = createSignal(1);
  const [filter, setFilter] = createSignal(false);
  return (
    <section aria-label="Inline commands">
      <label>
        <input
          type="checkbox"
          checked={accept()}
          onChange={(e) => setAccept(e.currentTarget.checked)}
        />
        Accept command search
      </label>
      <label>
        <input
          type="checkbox"
          checked={clamp()}
          onChange={(e) => setClamp(e.currentTarget.checked)}
        />
        Clamp command cursor
      </label>
      <label>
        <input
          type="checkbox"
          checked={filter()}
          onChange={(e) => setFilter(e.currentTarget.checked)}
        />
        Filter command results
      </label>
      <button
        onClick={() => setItems((items) => items.map((item) => ({ ...item })))}
      >
        Replace command objects
      </button>
      <button
        onClick={() =>
          setItems((items) => [...items].reverse().map((item) => ({ ...item })))
        }
      >
        Reverse command objects
      </button>
      <button onClick={() => setItems([initial[1]!])}>
        Show disabled commands only
      </button>
      <button onClick={() => setItems([])}>Remove all commands</button>
      <button
        onClick={() =>
          setItems([
            { value: "remote-first", label: "Remote first" },
            { value: "remote-second", label: "Remote second" },
          ])
        }
      >
        Deliver remote commands
      </button>
      <button onClick={() => setItems(initial)}>
        Restore initial commands
      </button>
      <button onClick={() => setGeneration((n) => n + 1)}>
        Remount command list
      </button>
      <form
        aria-label="Command form"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmits((n) => n + 1);
        }}
      >
        <Command.Root
          search={search()}
          onSearchChange={(text) => {
            if (accept()) setSearch(text);
          }}
          loop={!clamp()}
        >
          <Command.Input
            id={false}
            aria-label="Command search"
          />
          <Show
            when={generation()}
            keyed
          >
            {(_generation) => (
              <Command.List aria-label="Command results">
                <Command.Group>
                  <Command.Label>Available commands</Command.Label>
                  <For
                    each={items().filter(
                      (item) =>
                        !filter() ||
                        item.label
                          .toLowerCase()
                          .includes(search().toLowerCase()),
                    )}
                  >
                    {(item) => (
                      <Command.Item
                        value={item.value}
                        id={
                          item.value === "alpha"
                            ? false
                            : item.value === "beta"
                              ? ""
                              : undefined
                        }
                        textValue={item.label}
                        disabled={item.disabled}
                        onSelect={() => {
                          if (item.value === "alpha") setAlpha((n) => n + 1);
                          if (item.value === "beta") setBeta((n) => n + 1);
                        }}
                      >
                        {item.label}
                      </Command.Item>
                    )}
                  </For>
                </Command.Group>
              </Command.List>
            )}
          </Show>
          <span
            role="status"
            aria-label="Command loading"
          >
            Results supplied by the application
          </span>
          <Command.Empty aria-label="No commands">No commands</Command.Empty>
        </Command.Root>
      </form>
      <output aria-label="Command actions">
        alpha:{alpha()},beta:{beta()}
      </output>
      <output aria-label="Command submissions">{submits()}</output>
    </section>
  );
}
function NativeCommands(): Element {
  const [cancel, setCancel] = createSignal(false),
    [button, setButton] = createSignal(0),
    [link, setLink] = createSignal(0),
    [submits, setSubmits] = createSignal(0);
  let input: HTMLInputElement | undefined;
  return (
    <section aria-label="Native target commands">
      <label>
        <input
          type="checkbox"
          checked={cancel()}
          onChange={(e) => setCancel(e.currentTarget.checked)}
        />
        Cancel native command action
      </label>
      <button onClick={() => input?.focus()}>Focus native command ref</button>
      <form
        id="native-command-form"
        aria-label="Native command form"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmits((n) => n + 1);
        }}
      >
        <Command.Root>
          <Command.Input
            aria-label="Native command search"
            ref={(node) => {
              input = node;
            }}
            asChild
          >
            {(target) => target("input", {})}
          </Command.Input>
          <Command.List
            aria-label="Native command results"
            asChild
          >
            {(target) =>
              target("div", {
                id: "native-command-child-list",
                children: (
                  <Command.Group>
                    <Command.Label asChild>
                      {(label) =>
                        label("span", {
                          id: "native-command-child-label",
                          children: "Native commands",
                        })
                      }
                    </Command.Label>
                    <Command.Item
                      value="button"
                      textValue="Native action button"
                      onSelect={(event) => {
                        if (cancel()) event.preventDefault();
                        if (!event.defaultPrevented) setButton((n) => n + 1);
                      }}
                      asChild
                    >
                      {(item) =>
                        item("button", {
                          id: "native-command-child-button",
                          type: "submit",
                          children: "Native action button",
                        })
                      }
                    </Command.Item>
                    <Command.Item
                      value="link"
                      textValue="Native action link"
                      onSelect={(event) => {
                        if (cancel()) event.preventDefault();
                        if (!event.defaultPrevented) setLink((n) => n + 1);
                      }}
                      asChild
                    >
                      {(item) =>
                        item("a", {
                          id: "native-command-child-link",
                          href: "#native-command-navigation",
                          children: "Native action link",
                        })
                      }
                    </Command.Item>
                  </Command.Group>
                ),
              })
            }
          </Command.List>
        </Command.Root>
      </form>
      <output aria-label="Native command actions">
        button:{button()},link:{link()}
      </output>
      <output aria-label="Native command submissions">{submits()}</output>
    </section>
  );
}
function EmptyResults(): Element {
  const states = [
    { name: "populated", items: basic },
    { name: "empty", items: [] },
    { name: "disabled", items: basic.filter((item) => item.disabled) },
  ];
  return (
    <section aria-label="Server result states">
      <For each={states}>
        {(state) => (
          <>
            <Command.Root>
              <Command.Input
                aria-label={`Server ${state.name} command search`}
              />
              <Command.List
                aria-label={`Server ${state.name} commands`}
                data-server-result=""
              >
                <For each={state.items}>
                  {(item) => (
                    <Command.Item
                      value={item.value}
                      textValue={item.label}
                      disabled={item.disabled}
                    >
                      {item.label}
                    </Command.Item>
                  )}
                </For>
              </Command.List>
              <Command.Empty
                aria-label={`Server ${state.name} commands empty`}
                data-server-empty=""
              >
                No commands
              </Command.Empty>
            </Command.Root>
            <Combobox.Root items={state.items}>
              <Combobox.Input aria-label={`Server ${state.name} choice`} />
              <Combobox.List
                aria-label={`Server ${state.name} choices`}
                data-server-result=""
              >
                <For each={state.items}>
                  {(item) => (
                    <Combobox.Item value={item.value}>
                      <Combobox.ItemText />
                    </Combobox.Item>
                  )}
                </For>
              </Combobox.List>
              <Combobox.Empty
                aria-label={`Server ${state.name} choices empty`}
                data-server-empty=""
              >
                No choices
              </Combobox.Empty>
            </Combobox.Root>
          </>
        )}
      </For>
    </section>
  );
}
function InputDialogs(): Element {
  const [palette, setPalette] = createSignal(false),
    [search, setSearch] = createSignal(""),
    [cancel, setCancel] = createSignal(false),
    [refuse, setRefuse] = createSignal(false),
    [actions, setActions] = createSignal(0),
    [destination, setDestination] = createSignal(false);
  let input: HTMLInputElement | undefined, next: HTMLInputElement | undefined;
  function requestPalette(open: boolean) {
    if (open) {
      setSearch("");
      setPalette(true);
    } else if (!refuse()) setPalette(false);
  }
  return (
    <section aria-label="Input dialog recipes">
      <Dialog.Root
        open={palette()}
        onOpenChange={requestPalette}
      >
        <Dialog.Trigger>Open command dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Content
            style={dialogSurface}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              input?.focus();
            }}
            onCloseAutoFocus={(event) => {
              if (destination()) event.preventDefault();
            }}
          >
            <Dialog.Title>Command palette</Dialog.Title>
            <Dialog.Description>
              Search and execute an action
            </Dialog.Description>
            <label>
              <input
                type="checkbox"
                checked={cancel()}
                onChange={(e) => setCancel(e.currentTarget.checked)}
              />
              Cancel palette action
            </label>
            <label>
              <input
                type="checkbox"
                checked={refuse()}
                onChange={(e) => setRefuse(e.currentTarget.checked)}
              />
              Refuse palette close
            </label>
            <Command.Root
              search={search()}
              onSearchChange={setSearch}
            >
              <Command.Input
                aria-label="Palette search"
                ref={(node) => {
                  input = node;
                }}
              />
              <Command.List aria-label="Palette results">
                <Command.Item
                  value="action"
                  textValue="Run palette action"
                  onSelect={(event) => {
                    if (cancel()) event.preventDefault();
                    if (event.defaultPrevented) return;
                    requestPalette(false);
                    setActions((n) => n + 1);
                  }}
                >
                  Run palette action
                </Command.Item>
                <Command.Item
                  value="destination"
                  textValue="Open action dialog"
                  onSelect={(event) => {
                    if (cancel()) event.preventDefault();
                    if (event.defaultPrevented) return;
                    requestPalette(false);
                    setDestination(true);
                  }}
                >
                  Open action dialog
                </Command.Item>
              </Command.List>
            </Command.Root>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <output aria-label="Palette actions">{actions()}</output>
      <Dialog.Root
        open={destination()}
        onOpenChange={setDestination}
      >
        <Dialog.Portal>
          <Dialog.Content
            style={dialogSurface}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              next?.focus();
            }}
          >
            <Dialog.Title>Action destination</Dialog.Title>
            <Dialog.Description>Action opened another modal</Dialog.Description>
            <input
              aria-label="Destination input"
              ref={(node) => {
                next = node;
              }}
            />
            <Dialog.Close>Close destination</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root>
        <Dialog.Trigger>Open choice dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Content style={dialogSurface}>
            <Dialog.Title>Choice dialog</Dialog.Title>
            <Dialog.Description>Select an existing item</Dialog.Description>
            <div
              style={{ display: "flex", gap: "8px", "margin-bottom": "8px" }}
            >
              <button>Choice dialog outside popup</button>
              <Dialog.Close>Close choice dialog</Dialog.Close>
            </div>
            <Combobox.Root items={basic}>
              <Combobox.Input aria-label="Dialog choice" />
              <Suggestions
                name="Dialog suggestions"
                items={basic}
              />
            </Combobox.Root>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
function InvalidConfiguration(): Element {
  const [invalid, setInvalid] = createSignal<"duplicate" | "empty" | null>(
    null,
  );
  return (
    <section aria-label="Input configuration errors">
      <button onClick={() => setInvalid("duplicate")}>
        Render duplicate choice keys
      </button>
      <button onClick={() => setInvalid("empty")}>
        Render empty choice key
      </button>
      <Show when={invalid()}>
        {(kind) => (
          <Combobox.Root
            items={
              kind() === "duplicate"
                ? [
                    { value: "same", label: "One" },
                    { value: "same", label: "Two" },
                  ]
                : [{ value: "", label: "Empty" }]
            }
          >
            <Combobox.Input aria-label="Invalid configuration choice" />
          </Combobox.Root>
        )}
      </Show>
    </section>
  );
}
export function Inputs(): Element {
  return (
    <section aria-label="Native editable inputs">
      <h2>Editable inputs and actions</h2>
      <Draft />
      <Controlled />
      <Reset />
      <Lifecycle />
      <NativeChoice />
      <Commands />
      <NativeCommands />
      <EmptyResults />
      <InputDialogs />
      <InvalidConfiguration />
    </section>
  );
}
