import { Select } from "@wsagency/radix2solid-primitives";
import { createSignal, For, type Element } from "solid-js";

export function Selects(): Element {
  const [value, setValue] = createSignal("apple");
  const [accept, setAccept] = createSignal(false);
  const [latest, setLatest] = createSignal(false);
  const [stop, setStop] = createSignal(false);
  const [cancelReset, setCancelReset] = createSignal(false);
  const [requests, setRequests] = createSignal<string[]>([]);
  const [changes, setChanges] = createSignal(0);
  const [dir, setDir] = createSignal<"ltr" | "rtl">("ltr");
  const [position, setPosition] = createSignal<"item-aligned" | "popper">(
    "item-aligned",
  );
  const request = (source: string, next: string) => {
    setRequests((previous) => [...previous, `${source}:${next}`]);
    if (accept()) setValue(next);
  };
  return (
    <section
      aria-label="Native select controls"
      onChange={(event) => {
        if ((event.target as HTMLSelectElement).matches('select[name="fruit"]'))
          setChanges((previous) => previous + 1);
      }}
    >
      <form
        id="select-form"
        onReset={(event) => {
          if (cancelReset()) event.preventDefault();
        }}
      >
        <button type="reset">Reset fruit</button>
      </form>
      <label>
        <input
          type="checkbox"
          checked={accept()}
          onChange={(event) => setAccept(event.currentTarget.checked)}
        />
        Accept select requests
      </label>
      <label>
        <input
          type="checkbox"
          checked={stop()}
          onChange={(event) => setStop(event.currentTarget.checked)}
        />
        Stop select propagation
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancelReset()}
          onChange={(event) => setCancelReset(event.currentTarget.checked)}
        />
        Cancel select reset
      </label>
      <button onClick={() => setLatest(true)}>Replace select callback</button>
      <button onClick={() => setValue("cherry")}>
        Set fruit programmatically
      </button>
      <button onClick={() => setDir("rtl")}>Use RTL select</button>
      <button onClick={() => setPosition("popper")}>Use popper select</button>
      <Select.Root
        value={value()}
        onValueChange={
          latest()
            ? (next) => request("latest", next)
            : (next) => request("old", next)
        }
        name="fruit"
        form="select-form"
        required
        dir={dir()}
      >
        <Select.Trigger
          aria-label="Fruit"
          style={{ padding: "0.5rem", width: "210px" }}
        >
          <Select.Value placeholder="Choose fruit" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position={position()}
            data-fruit-content
            style={{
              background: "Canvas",
              color: "CanvasText",
              border: "1px solid",
              "z-index": 20,
            }}
          >
            <Select.ScrollUpButton>▲</Select.ScrollUpButton>
            <Select.Viewport
              nonce="gallery-nonce"
              style={{
                padding: "6px",
                "max-height": position() === "popper" ? "180px" : undefined,
              }}
            >
              <Select.Group>
                <Select.Label>Fruit options</Select.Label>
                <Select.Item
                  value="apple"
                  style={{ padding: "8px" }}
                  onKeyDown={(event) => {
                    if (stop()) event.stopPropagation();
                  }}
                  onPointerUp={(event) => {
                    if (stop()) event.stopPropagation();
                  }}
                >
                  <Select.ItemText>
                    <strong>Apple</strong>
                  </Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
                <Select.Item
                  value="blocked"
                  disabled
                  style={{ padding: "8px" }}
                >
                  <Select.ItemText>Unavailable fruit</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="banana"
                  style={{ padding: "8px" }}
                  onKeyDown={(event) => {
                    if (stop()) event.stopPropagation();
                  }}
                  onPointerUp={(event) => {
                    if (stop()) event.stopPropagation();
                  }}
                >
                  <Select.ItemText>Banana</Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
                <Select.Item
                  value="blueberry"
                  style={{ padding: "8px" }}
                >
                  <Select.ItemText>Blueberry</Select.ItemText>
                </Select.Item>
                <Select.Item
                  value="cherry"
                  style={{ padding: "8px" }}
                >
                  <Select.ItemText>Cherry</Select.ItemText>
                </Select.Item>
                <For each={Array.from({ length: 20 }, (_, index) => index)}>
                  {(index) => (
                    <Select.Item
                      value={`extra-${index}`}
                      style={{ padding: "8px" }}
                    >
                      <Select.ItemText>Extra fruit {index}</Select.ItemText>
                    </Select.Item>
                  )}
                </For>
              </Select.Group>
              <Select.Separator />
              <Select.Item
                value=""
                style={{ padding: "8px" }}
              >
                <Select.ItemText>Clear fruit</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
            <Select.ScrollDownButton>▼</Select.ScrollDownButton>
            <Select.Arrow />
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <output id="select-value">{value()}</output>
      <output id="select-requests">{requests().join(",")}</output>
      <output id="select-form-changes">{changes()}</output>
      <Select.Root defaultValue="one">
        <Select.Trigger aria-label="Inline select">
          <Select.Value asChild>{(target) => target("span", {})}</Select.Value>
          <Select.Icon />
        </Select.Trigger>
        <Select.Content
          position="popper"
          style={{ background: "Canvas", border: "1px solid", "z-index": 20 }}
          asChild
        >
          {(target) =>
            target("section", {
              get children() {
                return (
                  <Select.Viewport>
                    <Select.Item value="one">
                      <Select.ItemText asChild>
                        {(target) =>
                          target("span", {
                            get children() {
                              return <strong>First inline</strong>;
                            },
                          })
                        }
                      </Select.ItemText>
                    </Select.Item>
                    <Select.Item value="two">
                      <Select.ItemText>Second inline</Select.ItemText>
                      <input aria-label="Select descendant" />
                    </Select.Item>
                  </Select.Viewport>
                );
              },
            })
          }
        </Select.Content>
      </Select.Root>
      <Select.unstable_Provider defaultValue="split">
        <Select.Trigger aria-label="Split select">
          <Select.Value />
        </Select.Trigger>
        <Select.Content position="popper">
          <Select.Viewport>
            <Select.Item value="split">
              <Select.ItemText>Split option</Select.ItemText>
            </Select.Item>
          </Select.Viewport>
        </Select.Content>
        <Select.unstable_BubbleInput
          name="split"
          form="select-form"
          asChild
        >
          {(target) => target("select", {})}
        </Select.unstable_BubbleInput>
      </Select.unstable_Provider>
    </section>
  );
}
