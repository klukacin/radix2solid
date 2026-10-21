import {
  Theme,
  ThemePanel,
  Button,
  Text,
  Flex,
  Checkbox,
  Radio,
  TextField,
  DropdownMenu,
  Dialog,
  Popover,
} from "@wsagency/radix2solid-themes";
import { createSignal, Show } from "solid-js";

import "@wsagency/radix2solid-themes/styles.css";
import "./theme-extensions.css";

export function ThemeExtensions() {
  const [identity, setIdentity] = createSignal("calm");
  const [appearance, setAppearance] = createSignal<"light" | "dark">("light");
  const [accent, setAccent] = createSignal<"custom" | "jade">("custom");
  const [loading, setLoading] = createSignal(true);
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [showPanel, setShowPanel] = createSignal(false);
  return (
    <section
      aria-label="Theme extensions"
      id="theme-extensions"
    >
      <div
        ref={setContainer}
        id="extension-portals"
      />
      <Theme
        id="extension-main"
        accentColor={accent()}
        customAccent={identity()}
        appearance={appearance()}
        scaling="115%"
        style={{ "min-height": "0" }}
      >
        <Button
          id="extension-button"
          size="2"
        >
          Custom accent action
        </Button>
        <Button
          id="extension-explicit"
          color="custom"
        >
          Explicit custom action
        </Button>
        <Button
          id="extension-loading"
          loading={loading()}
          onClick={() => setLoading(true)}
        >
          Loading action
        </Button>
        <button onClick={() => setLoading((value) => !value)}>
          Toggle extension loading
        </button>
        <button
          onClick={() =>
            setIdentity((value) => (value === "calm" ? "brand-b" : "calm"))
          }
        >
          Replace extension palette
        </button>
        <button
          onClick={() =>
            setAppearance((value) => (value === "light" ? "dark" : "light"))
          }
        >
          Toggle extension appearance
        </button>
        <button
          onClick={() =>
            setAccent((value) => (value === "custom" ? "jade" : "custom"))
          }
        >
          Toggle extension accent
        </button>
        <Flex
          gap="3"
          direction={{ initial: "column", sm: "row" }}
          id="extension-responsive"
        >
          <Theme
            id="extension-sidebar"
            scaling="90%"
          >
            <Button id="extension-small">Sidebar action</Button>
            <Text
              id="extension-text-small"
              size="2"
            >
              Sidebar text
            </Text>
          </Theme>
          <Theme
            id="extension-content"
            scaling="120%"
            customAccent="brand-b"
          >
            <Button id="extension-large">Content action</Button>
            <Text
              id="extension-text-large"
              size="2"
            >
              Content text
            </Text>
          </Theme>
        </Flex>
        <Theme
          id="extension-css-override"
          class="extension-app-scale"
        >
          <Button id="extension-override-button">Application scale</Button>
        </Theme>
        <Theme style={{ "--scaling": "1.25" }}>
          <Button id="extension-inline-button">Inline scale</Button>
        </Theme>
        <Checkbox
          aria-label="Extension checkbox"
          defaultChecked
        />
        <Radio
          aria-label="Extension radio"
          defaultChecked
          name="extension-radio"
          value="selected"
        />
        <TextField.Root
          aria-label="Extension field"
          placeholder="Extension field"
        />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {(target) => target(Button, { children: "Extension menu" })}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            variant="solid"
            id="extension-menu"
          >
            <DropdownMenu.Item>Extension item</DropdownMenu.Item>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>
                Extension submenu
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent id="extension-submenu">
                <DropdownMenu.Item>Nested extension item</DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        <Dialog.Root>
          <Dialog.Trigger>
            {(target) => target(Button, { children: "Extension dialog" })}
          </Dialog.Trigger>
          <Dialog.Content
            container={container()}
            id="extension-dialog"
          >
            <Dialog.Title>Extension dialog title</Dialog.Title>
            <Dialog.Description>
              Portable palette and scaling.
            </Dialog.Description>
            <Button id="extension-dialog-button">Dialog custom action</Button>
            <button onClick={() => setIdentity("brand-b")}>
              Replace open extension palette
            </button>
            <Popover.Root>
              <Popover.Trigger>
                {(target) =>
                  target(Button, { children: "Extension nested popover" })
                }
              </Popover.Trigger>
              <Popover.Content
                id="extension-popover"
                aria-label="Extension nested popover"
              >
                <Button>Nested custom action</Button>
                <Text
                  color="custom"
                  id="extension-popover-tone"
                >
                  Portable palette text
                </Text>
                <button onClick={() => setAppearance("dark")}>
                  Darken open extension palette
                </button>
              </Popover.Content>
            </Popover.Root>
            <Dialog.Close>
              {(target) =>
                target(Button, { children: "Close extension dialog" })
              }
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Root>
        <button onClick={() => setShowPanel(true)}>
          Mount extension ThemePanel
        </button>
        <div id="extension-panel">
          <Show when={showPanel()}>
            <ThemePanel defaultOpen={false} />
          </Show>
        </div>
        <div
          class="radix-themes light"
          data-accent-color="jade"
          data-gray-color="sage"
          data-scaling="90%"
        >
          <button
            class="rt-reset rt-BaseButton rt-Button rt-r-size-2 rt-variant-soft rt-high-contrast"
            id="extension-legacy"
          >
            Legacy preset markup
          </button>
        </div>
      </Theme>
      <Theme
        id="extension-independent"
        accentColor="custom"
        customAccent="calm"
        appearance="light"
        scaling="90%"
        style={{ "min-height": "0" }}
      >
        <Button>Independent custom action</Button>
      </Theme>
    </section>
  );
}
