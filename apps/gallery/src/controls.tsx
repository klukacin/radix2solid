import {
  AccessibleIcon,
  Accordion,
  Announce,
  AspectRatio,
  Avatar,
  Checkbox,
  Collapsible,
  Dialog,
  Direction,
  Label,
  Progress,
  RadioGroup,
  Separator,
  Switch,
  Tabs,
  ToggleGroup,
  Toolbar,
} from "@wsagency/radix2solid-primitives";
import { Portal, type ComponentProps } from "@solidjs/web";
import { createSignal, For, Show, type Element } from "solid-js";

const avatarSource =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="teal"/></svg>',
  );

export function Controls(): Element {
  const [iconLabel, setIconLabel] = createSignal("Close action");
  const [ratio, setRatio] = createSignal(4 / 3);
  const [progress, setProgress] = createSignal<number | null>(40);
  const [maximum, setMaximum] = createSignal(80);
  const [vertical, setVertical] = createSignal(false);
  const [decorative, setDecorative] = createSignal(false);
  const [labelEvents, setLabelEvents] = createSignal<string[]>([]);
  const [avatarSrc, setAvatarSrc] = createSignal<string | undefined>(
    avatarSource,
  );
  const [avatarImage, setAvatarImage] = createSignal(true);
  const [avatarCallback, setAvatarCallback] = createSignal("initial");
  const [avatarEvents, setAvatarEvents] = createSignal<string[]>([]);
  const [delayedAvatar, setDelayedAvatar] = createSignal(false);
  const [firstAnnouncement, setFirstAnnouncement] = createSignal(true);
  const [announcements, setAnnouncements] = createSignal(true);
  const [announcement, setAnnouncement] = createSignal("Saved draft");
  const [announcementVersion, setAnnouncementVersion] = createSignal(1);
  const [announcementType, setAnnouncementType] = createSignal<
    "polite" | "assertive" | "off"
  >("polite");
  const [customAnnouncement, setCustomAnnouncement] = createSignal(false);
  const [disclosureOpen, setDisclosureOpen] = createSignal(false);
  const [disclosureAccept, setDisclosureAccept] = createSignal(false);
  const [disclosureCancel, setDisclosureCancel] = createSignal(false);
  const [disclosureDisabled, setDisclosureDisabled] = createSignal(false);
  const [disclosureDefault, setDisclosureDefault] = createSignal(false);
  const [disclosureEvents, setDisclosureEvents] = createSignal<string[]>([]);
  const [accordionValue, setAccordionValue] = createSignal("");
  const [accordionAccept, setAccordionAccept] = createSignal(false);
  const [accordionCollapsible, setAccordionCollapsible] = createSignal(false);
  const [accordionHorizontal, setAccordionHorizontal] = createSignal(false);
  const [accordionDisabled, setAccordionDisabled] = createSignal(false);
  const [accordionCancel, setAccordionCancel] = createSignal(false);
  const [accordionEvents, setAccordionEvents] = createSignal<string[]>([]);
  const [accordionItems, setAccordionItems] = createSignal([
    "one",
    "two",
    "three",
  ]);
  const [multipleEvents, setMultipleEvents] = createSignal<string[]>([]);
  let multipleOne: HTMLButtonElement | undefined;
  let multipleTwo: HTMLButtonElement | undefined;
  const [formChecked, setFormChecked] =
    createSignal<Checkbox.CheckedState>(false);
  const [formAccept, setFormAccept] = createSignal(false);
  const [formCancel, setFormCancel] = createSignal(false);
  const [formStop, setFormStop] = createSignal(false);
  const [formDisabled, setFormDisabled] = createSignal(false);
  const [formDefault, setFormDefault] = createSignal(false);
  const [formEvents, setFormEvents] = createSignal<string[]>([]);
  const [formChanges, setFormChanges] = createSignal<string[]>([]);
  const [formClicks, setFormClicks] = createSignal(0);
  const [cancelReset, setCancelReset] = createSignal(false);
  const [iframeBody, setIframeBody] = createSignal<HTMLElement>();
  const [iframeSubmits, setIframeSubmits] = createSignal(0);
  const [asyncIframeChecked, setAsyncIframeChecked] =
    createSignal<boolean>(false);
  const [asyncIframeSubmits, setAsyncIframeSubmits] = createSignal(0);
  const createIframeInput = (
    props: ComponentProps<"input">,
  ): HTMLInputElement => {
    const frameDocument = iframeBody()?.ownerDocument;
    if (!frameDocument) throw new Error("Checkbox iframe is not mounted.");
    const input = frameDocument.createElement("input");
    const {
      ref,
      style,
      onFocus,
      onInvalid,
      form,
      "aria-hidden": ariaHidden,
      ...attributes
    } = props;
    Object.assign(input, attributes);
    if (form) input.setAttribute("form", form);
    if (ariaHidden !== undefined)
      input.setAttribute("aria-hidden", String(ariaHidden));
    if (style && typeof style === "object") Object.assign(input.style, style);
    const listen = (type: string, handler: unknown) => {
      if (typeof handler === "function")
        input.addEventListener(type, handler as EventListener);
      else if (Array.isArray(handler) && typeof handler[0] === "function")
        input.addEventListener(type, (event) =>
          (handler[0] as (data: unknown, event: Event) => void)(
            handler[1],
            event,
          ),
        );
    };
    listen("focus", onFocus);
    listen("invalid", onInvalid);
    // This frame-realm probe covers focus routing only, not Checkbox state sync.
    void ref;
    return input;
  };
  const [radioValue, setRadioValue] = createSignal<string | null>("one");
  const [radioAccept, setRadioAccept] = createSignal(false);
  const [radioHorizontal, setRadioHorizontal] = createSignal(false);
  const [radioLoop, setRadioLoop] = createSignal(true);
  const [radioCancel, setRadioCancel] = createSignal(false);
  const [radioResetCancel, setRadioResetCancel] = createSignal(false);
  const [radioDisabled, setRadioDisabled] = createSignal(false);
  const [radioItems, setRadioItems] = createSignal(["one", "two", "three"]);
  const [radioEvents, setRadioEvents] = createSignal<string[]>([]);
  const [radioChanges, setRadioChanges] = createSignal<string[]>([]);
  const [radioClicks, setRadioClicks] = createSignal(0);
  const [tabValue, setTabValue] = createSignal("one");
  const [tabAccept, setTabAccept] = createSignal(false);
  const [tabManual, setTabManual] = createSignal(true);
  const [tabVertical, setTabVertical] = createSignal(false);
  const [tabLoop, setTabLoop] = createSignal(true);
  const [tabCancel, setTabCancel] = createSignal(false);
  const [tabItems, setTabItems] = createSignal([
    "one",
    "two",
    "three",
    "forced",
  ]);
  const [tabEvents, setTabEvents] = createSignal<string[]>([]);
  const [tabBlurs, setTabBlurs] = createSignal(0);
  const [editableTabEvents, setEditableTabEvents] = createSignal<string[]>([]);
  const [toggleValue, setToggleValue] = createSignal("");
  const [toggleAccept, setToggleAccept] = createSignal(false);
  const [toggleDisabled, setToggleDisabled] = createSignal(false);
  const [toggleEvents, setToggleEvents] = createSignal<string[]>([]);
  const [multipleToggleEvents, setMultipleToggleEvents] = createSignal<
    string[]
  >([]);
  let toggleOne: HTMLButtonElement | undefined;
  let toggleTwo: HTMLButtonElement | undefined;
  const [toolbarVertical, setToolbarVertical] = createSignal(false);
  const [toolbarDisabled, setToolbarDisabled] = createSignal(false);
  const [toolbarClicks, setToolbarClicks] = createSignal(0);
  return (
    <section aria-label="Simple native controls">
      <h2>Simple native controls</h2>
      <button type="button">
        <AccessibleIcon.Root label={iconLabel()}>
          {(target) =>
            target("svg", {
              width: 24,
              height: 24,
              viewBox: "0 0 32 32",
              "aria-hidden": "false",
              children: (
                <path
                  d="M2 30 L30 2 M30 30 L2 2"
                  stroke="currentColor"
                />
              ),
            })
          }
        </AccessibleIcon.Root>
      </button>
      <button onClick={() => setIconLabel("Dismiss action")}>
        Change icon label
      </button>
      <div style={{ width: "240px" }}>
        <AspectRatio.Root
          id="control-ratio"
          ratio={ratio()}
          style={{ position: "relative", "outline-color": "rgb(1, 2, 3)" }}
        >
          Responsive media
        </AspectRatio.Root>
      </div>
      <button onClick={() => setRatio(2)}>Change media ratio</button>
      <Progress.Root
        aria-label="Transfer"
        value={progress()}
        max={maximum()}
        getValueLabel={(value, max) => `${value} of ${max}`}
      >
        <Progress.Indicator id="transfer-indicator">
          Transfer indicator
        </Progress.Indicator>
        <Progress.Root
          aria-label="Nested transfer"
          value={2}
          max={4}
        >
          <Progress.Indicator id="nested-progress-indicator">
            Nested transfer indicator
          </Progress.Indicator>
        </Progress.Root>
      </Progress.Root>
      <button onClick={() => setProgress(80)}>Complete transfer</button>
      <button onClick={() => setProgress(null)}>Indeterminate transfer</button>
      <button
        onClick={() => {
          setMaximum(0);
          setProgress(-1);
        }}
      >
        Invalid transfer boundaries
      </button>
      <button
        onClick={() => {
          setMaximum(80);
          setProgress(0);
        }}
      >
        Zero transfer
      </button>
      <Separator.Root
        id="control-separator"
        orientation={vertical() ? "vertical" : "horizontal"}
        decorative={decorative()}
      />
      <button onClick={() => setVertical(true)}>Vertical separator</button>
      <button onClick={() => setDecorative(true)}>Decorative separator</button>
      <Label.Root for="native-control-input">Native text field</Label.Root>
      <input id="native-control-input" />
      <Label.Root
        id="control-label"
        onMouseDown={() =>
          setLabelEvents((previous) => [...previous, "mousedown"])
        }
      >
        Label actions{" "}
        <button
          type="button"
          onClick={() => setLabelEvents((previous) => [...previous, "click"])}
        >
          Nested label action
        </button>
      </Label.Root>
      <output id="label-events">{labelEvents().join(",")}</output>
      <Avatar.Root>
        <Show when={avatarImage()}>
          <Avatar.Image
            src={avatarSrc()}
            alt="Account avatar"
            crossorigin="anonymous"
            referrerpolicy="no-referrer"
            onLoadingStatusChange={
              avatarCallback() === "initial"
                ? (status) =>
                    setAvatarEvents((previous) => [
                      ...previous,
                      `initial:${status}`,
                    ])
                : (status) =>
                    setAvatarEvents((previous) => [
                      ...previous,
                      `latest:${status}`,
                    ])
            }
          />
        </Show>
        <Avatar.Fallback id="avatar-fallback">Account initials</Avatar.Fallback>
      </Avatar.Root>
      <button onClick={() => setAvatarSrc("/avatar-slow.svg")}>
        Load delayed avatar
      </button>
      <button onClick={() => setAvatarSrc("/avatar-broken.svg")}>
        Break avatar
      </button>
      <button onClick={() => setAvatarSrc(undefined)}>Clear avatar</button>
      <button onClick={() => setAvatarSrc(avatarSource)}>
        Load good avatar
      </button>
      <button onClick={() => setAvatarCallback("latest")}>
        Change avatar callback
      </button>
      <button onClick={() => setAvatarImage(false)}>Remove avatar image</button>
      <output id="avatar-events">{avatarEvents().join(",")}</output>
      <button onClick={() => setDelayedAvatar(true)}>
        Mount delayed avatar
      </button>
      <button onClick={() => setDelayedAvatar(false)}>
        Remove delayed avatar
      </button>
      <Show when={delayedAvatar()}>
        <Avatar.Root>
          <Avatar.Image alt="Delayed account avatar" />
          <Avatar.Fallback
            delayMs={200}
            id="delayed-avatar-fallback"
          >
            Delayed initials
          </Avatar.Fallback>
        </Avatar.Root>
      </Show>
      <Show when={announcements()}>
        <Show when={firstAnnouncement()}>
          <Announce.Root>
            <strong data-version={announcementVersion()}>
              {announcement()}
            </strong>
          </Announce.Root>
        </Show>
        <Announce.Root type={announcementType()}>Sync ready</Announce.Root>
        <Show when={customAnnouncement()}>
          <Announce.Root
            asChild
            regionIdentifier="custom"
            type="polite"
            role="log"
            aria-atomic="true"
            aria-relevant="additions text"
          >
            {(target) =>
              target("p", { children: <strong>Custom update</strong> })
            }
          </Announce.Root>
        </Show>
      </Show>
      <button
        onClick={() => {
          setAnnouncement("Saved changes");
          setAnnouncementVersion(2);
        }}
      >
        Update announcement
      </button>
      <button onClick={() => setFirstAnnouncement(false)}>
        Remove first announcement
      </button>
      <button onClick={() => setAnnouncementType("assertive")}>
        Assertive announcement
      </button>
      <button onClick={() => setCustomAnnouncement(true)}>
        Mount custom announcement
      </button>
      <button onClick={() => setAnnouncements(false)}>
        Remove all announcements
      </button>
      <style>{`@keyframes disclosure-exit { from { opacity: 1; } to { opacity: 0; } }
      .controlled-disclosure[data-state="closed"] { animation: disclosure-exit 500ms linear; }`}</style>
      <Collapsible.Root
        open={disclosureOpen()}
        disabled={disclosureDisabled()}
        onOpenChange={
          disclosureAccept()
            ? (open) => {
                setDisclosureEvents((previous) => [
                  ...previous,
                  `latest:${open}`,
                ]);
                setDisclosureOpen(open);
              }
            : (open) =>
                setDisclosureEvents((previous) => [
                  ...previous,
                  `initial:${open}`,
                ])
        }
      >
        <Collapsible.Trigger
          onClick={(event) => {
            if (disclosureCancel()) event.preventDefault();
          }}
        >
          Controlled disclosure
        </Collapsible.Trigger>
        <Collapsible.Content
          data-testid="controlled-disclosure-content"
          class="controlled-disclosure"
          style={{ width: "320px" }}
        >
          <div style={{ height: "56px" }}>Disclosure body</div>
        </Collapsible.Content>
      </Collapsible.Root>
      <button onClick={() => setDisclosureAccept(true)}>
        Accept disclosure changes
      </button>
      <button onClick={() => setDisclosureCancel(true)}>
        Cancel disclosure clicks
      </button>
      <button onClick={() => setDisclosureDisabled(true)}>
        Disable disclosure
      </button>
      <output id="disclosure-events">{disclosureEvents().join(",")}</output>
      <Collapsible.Root defaultOpen={disclosureDefault()}>
        <Collapsible.Trigger>Default disclosure</Collapsible.Trigger>
        <Collapsible.Content>Default disclosure body</Collapsible.Content>
      </Collapsible.Root>
      <button onClick={() => setDisclosureDefault(true)}>
        Change disclosure default
      </button>
      <Collapsible.Root>
        <Collapsible.Trigger>Forced disclosure</Collapsible.Trigger>
        <Collapsible.Content forceMount>
          Forced disclosure body
        </Collapsible.Content>
      </Collapsible.Root>
      <Collapsible.Root>
        <Collapsible.Trigger>Factory disclosure</Collapsible.Trigger>
        <Collapsible.Content
          asChild
          data-testid="factory-disclosure-content"
        >
          {(target) =>
            target("article", { children: "Factory disclosure body" })
          }
        </Collapsible.Content>
      </Collapsible.Root>
      <Direction.DirectionProvider dir={accordionHorizontal() ? "rtl" : "ltr"}>
        <Accordion.Root
          type="single"
          value={accordionValue()}
          collapsible={accordionCollapsible()}
          disabled={accordionDisabled()}
          orientation={accordionHorizontal() ? "horizontal" : "vertical"}
          onKeyDown={(event) => {
            if (accordionCancel()) event.preventDefault();
          }}
          onValueChange={
            accordionAccept()
              ? (value) => {
                  setAccordionEvents((previous) => [
                    ...previous,
                    `latest:${value}`,
                  ]);
                  setAccordionValue(value);
                }
              : (value) =>
                  setAccordionEvents((previous) => [
                    ...previous,
                    `initial:${value}`,
                  ])
          }
        >
          <For each={accordionItems()}>
            {(value) => (
              <Accordion.Item
                value={value}
                disabled={value === "two"}
              >
                <Accordion.Header>
                  <Accordion.Trigger>
                    Single {value[0]!.toUpperCase() + value.slice(1)}
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  Single content {value}
                  <Show when={value === "one"}>
                    <Accordion.Root type="multiple">
                      <Accordion.Item value="nested">
                        <Accordion.Header>
                          <Accordion.Trigger>Nested item</Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content>Nested content</Accordion.Content>
                      </Accordion.Item>
                    </Accordion.Root>
                  </Show>
                </Accordion.Content>
              </Accordion.Item>
            )}
          </For>
        </Accordion.Root>
      </Direction.DirectionProvider>
      <button onClick={() => setAccordionAccept(true)}>
        Accept accordion changes
      </button>
      <button onClick={() => setAccordionCollapsible(true)}>
        Make single collapsible
      </button>
      <button
        onClick={() => setAccordionItems((previous) => previous.toReversed())}
      >
        Reorder accordion items
      </button>
      <button onClick={() => setAccordionHorizontal(true)}>
        Horizontal RTL accordion
      </button>
      <button onClick={() => setAccordionCancel(true)}>
        Cancel accordion navigation
      </button>
      <button onClick={() => setAccordionDisabled(true)}>
        Disable accordion
      </button>
      <output id="accordion-events">{accordionEvents().join(",")}</output>
      <Accordion.Root
        type="multiple"
        onValueChange={(value) =>
          setMultipleEvents((previous) => [...previous, value.join("+")])
        }
      >
        <Accordion.Item value="one">
          <Accordion.Header>
            <Accordion.Trigger
              ref={(node) => {
                multipleOne = node;
              }}
            >
              Multiple One
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Multiple content one</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="two">
          <Accordion.Header>
            <Accordion.Trigger
              ref={(node) => {
                multipleTwo = node;
              }}
            >
              Multiple Two
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Multiple content two</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
      <button
        onClick={() => {
          multipleOne?.click();
          multipleTwo?.click();
        }}
      >
        Open both multiple items
      </button>
      <output id="multiple-accordion-events">
        {multipleEvents().join(",")}
      </output>
      <form
        id="native-controls-form"
        onReset={(event) => {
          if (cancelReset()) event.preventDefault();
        }}
        onChange={(event) => {
          const input = event.target;
          if (input instanceof HTMLInputElement)
            setFormChanges((previous) => [
              ...previous,
              `${input.name}:${input.checked}:${input.indeterminate}:${input.defaultChecked}`,
            ]);
        }}
      >
        <Label.Root for="controlled-checkbox">Controlled checkbox</Label.Root>
        <div onClick={() => setFormClicks((previous) => previous + 1)}>
          <Checkbox.Root
            id="controlled-checkbox"
            name="checked"
            value="yes"
            checked={formChecked()}
            disabled={formDisabled()}
            onClick={(event) => {
              if (formCancel()) event.preventDefault();
              if (formStop()) event.stopPropagation();
            }}
            onCheckedChange={
              formAccept()
                ? (checked) => {
                    setFormEvents((previous) => [
                      ...previous,
                      `latest:${checked}`,
                    ]);
                    setFormChecked(checked);
                  }
                : (checked) =>
                    setFormEvents((previous) => [
                      ...previous,
                      `initial:${checked}`,
                    ])
            }
          >
            <Checkbox.Indicator data-testid="checked-indicator">
              Checked indicator
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
        <Checkbox.Root
          aria-label="Mixed checkbox"
          name="mixed"
          value="mixed-value"
          defaultChecked="indeterminate"
        >
          <Checkbox.Indicator>Mixed indicator</Checkbox.Indicator>
        </Checkbox.Root>
        <Checkbox.Root
          aria-label="Default checkbox"
          name="default"
          defaultChecked={formDefault()}
        />
        <Checkbox.Root
          aria-label="Required checkbox"
          name="required"
          required
        />
        <Switch.Root
          aria-label="Notifications switch"
          name="notifications"
          value="enabled"
          defaultChecked
        >
          <Switch.Thumb data-testid="switch-thumb" />
        </Switch.Root>
        <button type="reset">Reset native controls</button>
      </form>
      <Checkbox.Root
        aria-label="External checkbox"
        name="external-check"
        value="external"
        form="native-controls-form"
        defaultChecked
      />
      <Switch.Root
        aria-label="External switch"
        name="external-switch"
        form="native-controls-form"
        defaultChecked
      />
      <Checkbox.unstable_Provider name="split-check">
        <Checkbox.unstable_Trigger aria-label="Split checkbox">
          <Checkbox.Indicator>Split indicator</Checkbox.Indicator>
        </Checkbox.unstable_Trigger>
        <Checkbox.unstable_BubbleInput />
      </Checkbox.unstable_Provider>
      <Switch.unstable_Provider>
        <Switch.unstable_Trigger aria-label="Split switch">
          <Switch.Thumb />
        </Switch.unstable_Trigger>
        <Switch.unstable_BubbleInput />
      </Switch.unstable_Provider>
      <Checkbox.Root
        asChild
        aria-label="Factory checkbox"
      >
        {(target) => target("button", { children: "Factory check" })}
      </Checkbox.Root>
      <button onClick={() => setFormAccept(true)}>
        Accept checked changes
      </button>
      <button onClick={() => setFormChecked(true)}>
        Set checked programmatically
      </button>
      <button onClick={() => setFormChecked(false)}>
        Clear checked programmatically
      </button>
      <button onClick={() => setFormDefault(true)}>
        Change checked default
      </button>
      <button onClick={() => setFormCancel(true)}>Cancel checked clicks</button>
      <button onClick={() => setFormStop(true)}>
        Stop checked propagation
      </button>
      <button onClick={() => setFormDisabled(true)}>
        Disable checked control
      </button>
      <button onClick={() => setCancelReset(true)}>Cancel native reset</button>
      <output id="checked-events">{formEvents().join(",")}</output>
      <output id="form-changes">{formChanges().join(",")}</output>
      <output id="form-clicks">{formClicks()}</output>
      <iframe
        id="checkbox-test-frame"
        title="Checkbox test frame"
        ref={(node) => {
          const updateIframeBody = () =>
            setIframeBody(node.contentDocument?.body ?? undefined);
          updateIframeBody();
          node.addEventListener("load", updateIframeBody, { once: true });
        }}
      />
      <Show when={iframeBody()}>
        {(body) => (
          <Portal mount={body()}>
            <form
              id="iframe-checkbox-form"
              onSubmit={(event) => {
                event.preventDefault();
                setIframeSubmits((previous) => previous + 1);
              }}
            >
              <Label.Root for="iframe-required-checkbox">
                Iframe required checkbox
              </Label.Root>
              <Checkbox.Root
                id="iframe-required-checkbox"
                name="iframe-required"
                form="iframe-checkbox-form"
                required
              />
              <button type="submit">Submit iframe checkbox</button>
              <output id="iframe-checkbox-submits">{iframeSubmits()}</output>
            </form>
            <form id="iframe-cross-realm-form">
              <Checkbox.unstable_Provider
                name="iframe-cross-realm"
                form="iframe-cross-realm-form"
                required
              >
                <Checkbox.unstable_Trigger
                  aria-label="Iframe cross-realm checkbox"
                />
                <Checkbox.unstable_BubbleInput asChild>
                  {(target) => target(createIframeInput, {})}
                </Checkbox.unstable_BubbleInput>
              </Checkbox.unstable_Provider>
            </form>
            <form
              id="async-iframe-checkbox-form"
              onSubmit={(event) => {
                event.preventDefault();
                setAsyncIframeSubmits((previous) => previous + 1);
              }}
            >
              <Checkbox.Root
                aria-label="Delayed iframe checkbox"
                name="delayed-iframe"
                form="async-iframe-checkbox-form"
                required
                checked={asyncIframeChecked()}
                onCheckedChange={(checked) => {
                  setTimeout(
                    () => setAsyncIframeChecked(checked === true),
                    30,
                  );
                }}
              />
              <button type="submit">Submit delayed iframe checkbox</button>
              <output id="async-iframe-checkbox-submits">
                {asyncIframeSubmits()}
              </output>
            </form>
          </Portal>
        )}
      </Show>
      <button onClick={() => setAsyncIframeChecked(false)}>
        Clear delayed checkbox programmatically
      </button>
      <button onClick={() => setAsyncIframeChecked(true)}>
        Set delayed checkbox programmatically
      </button>
      <form
        id="radio-main"
        onReset={(event) => {
          if (radioResetCancel()) event.preventDefault();
        }}
        onChange={(event) => {
          const input = event.target;
          if (input instanceof HTMLInputElement)
            setRadioChanges((previous) => [
              ...previous,
              `${input.name}:${input.value}:${input.checked}`,
            ]);
        }}
      >
        <Direction.DirectionProvider dir={radioHorizontal() ? "rtl" : "ltr"}>
          <div onClick={() => setRadioClicks((previous) => previous + 1)}>
            <RadioGroup.Root
              aria-label="Controlled choices"
              name="pet"
              value={radioValue()}
              disabled={radioDisabled()}
              loop={radioLoop()}
              orientation={radioHorizontal() ? "horizontal" : "vertical"}
              onValueChange={
                radioAccept()
                  ? (value) => {
                      setRadioEvents((previous) => [
                        ...previous,
                        `latest:${value}`,
                      ]);
                      setRadioValue(value);
                    }
                  : (value) =>
                      setRadioEvents((previous) => [
                        ...previous,
                        `initial:${value}`,
                      ])
              }
            >
              <For each={radioItems()}>
                {(value) => (
                  <RadioGroup.Item
                    value={value}
                    aria-label={`Controlled ${value}`}
                    disabled={value === "two"}
                    onKeyDown={(event) => {
                      if (radioCancel()) event.preventDefault();
                    }}
                  >
                    <RadioGroup.Indicator>
                      Controlled indicator {value}
                    </RadioGroup.Indicator>
                  </RadioGroup.Item>
                )}
              </For>
              <RadioGroup.Root
                aria-label="Nested choices"
                defaultValue="nested"
              >
                <RadioGroup.Item
                  value="nested"
                  aria-label="Nested radio"
                />
              </RadioGroup.Root>
            </RadioGroup.Root>
          </div>
        </Direction.DirectionProvider>
        <button type="reset">Reset radio choices</button>
      </form>
      <form id="radio-other">
        <button type="reset">Reset other radio choices</button>
      </form>
      <RadioGroup.Root
        aria-label="External choices"
        name="pet"
        form="radio-other"
        defaultValue="two"
      >
        <RadioGroup.Item
          value="one"
          aria-label="External one"
        >
          <RadioGroup.Indicator>External indicator one</RadioGroup.Indicator>
        </RadioGroup.Item>
        <RadioGroup.Item
          value="two"
          aria-label="External two"
        >
          <RadioGroup.Indicator>External indicator two</RadioGroup.Indicator>
        </RadioGroup.Item>
      </RadioGroup.Root>
      <RadioGroup.Root
        aria-label="Empty choices"
        name="empty"
        form="radio-main"
        required
      >
        <RadioGroup.unstable_ItemProvider value="split">
          <RadioGroup.unstable_ItemTrigger aria-label="Split radio">
            <RadioGroup.Indicator>Split radio indicator</RadioGroup.Indicator>
          </RadioGroup.unstable_ItemTrigger>
          <RadioGroup.unstable_ItemBubbleInput />
        </RadioGroup.unstable_ItemProvider>
      </RadioGroup.Root>
      <button onClick={() => setRadioAccept(true)}>Accept radio changes</button>
      <button onClick={() => setRadioValue("three")}>
        Set radio programmatically
      </button>
      <button onClick={() => setRadioValue(null)}>Clear radio selection</button>
      <button onClick={() => setRadioHorizontal(true)}>
        Horizontal RTL radio
      </button>
      <button onClick={() => setRadioLoop(false)}>Stop radio looping</button>
      <button
        onClick={() => setRadioItems((previous) => previous.toReversed())}
      >
        Reorder radio items
      </button>
      <button onClick={() => setRadioCancel(true)}>
        Cancel radio navigation
      </button>
      <button onClick={() => setRadioResetCancel(true)}>
        Cancel radio reset
      </button>
      <button onClick={() => setRadioDisabled(true)}>
        Disable radio group
      </button>
      <output id="radio-events">{radioEvents().join(",")}</output>
      <output id="radio-changes">{radioChanges().join(",")}</output>
      <output id="radio-clicks">{radioClicks()}</output>
      <Tabs.Root
        value={tabValue()}
        dir="rtl"
        orientation={tabVertical() ? "vertical" : "horizontal"}
        activationMode={tabManual() ? "manual" : "automatic"}
        onValueChange={
          tabAccept()
            ? (value) => {
                setTabEvents((previous) => [...previous, `latest:${value}`]);
                setTabValue(value);
              }
            : (value) =>
                setTabEvents((previous) => [...previous, `initial:${value}`])
        }
      >
        <Tabs.List
          aria-label="Document tabs"
          loop={tabLoop()}
        >
          <For each={tabItems()}>
            {(value) => (
              <Tabs.Trigger
                value={value}
                disabled={value === "two" || value === "forced"}
                onKeyDown={(event) => {
                  if (tabCancel()) event.preventDefault();
                }}
              >
                Document {value}
              </Tabs.Trigger>
            )}
          </For>
        </Tabs.List>
        <Tabs.Content value="one">
          <input
            aria-label="Tab editor"
            onBlur={() => setTabBlurs((previous) => previous + 1)}
          />
          <Tabs.Root defaultValue="nested">
            <Tabs.List aria-label="Nested tabs">
              <Tabs.Trigger value="nested">Nested tab</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="nested">Nested tab content</Tabs.Content>
          </Tabs.Root>
        </Tabs.Content>
        <Tabs.Content
          value="three"
          data-testid="document-three"
        >
          Document three content
        </Tabs.Content>
        <Tabs.Content
          value="forced"
          forceMount
          data-testid="forced-tab-content"
        >
          Forced tab content
        </Tabs.Content>
      </Tabs.Root>
      <button onClick={() => setTabAccept(true)}>Accept tab changes</button>
      <button onClick={() => setTabManual(false)}>Automatic tabs</button>
      <button onClick={() => setTabVertical(true)}>Vertical tabs</button>
      <button onClick={() => setTabLoop(false)}>Stop tab looping</button>
      <button onClick={() => setTabItems((previous) => previous.toReversed())}>
        Reorder tabs
      </button>
      <button onClick={() => setTabCancel(true)}>Cancel tab navigation</button>
      <output id="tab-events">{tabEvents().join(",")}</output>
      <output id="tab-blurs">{tabBlurs()}</output>
      <ToggleGroup.Root
        type="single"
        aria-label="Alignment toggles"
        value={toggleValue()}
        disabled={toggleDisabled()}
        dir="rtl"
        orientation="horizontal"
        onValueChange={
          toggleAccept()
            ? (value) => {
                setToggleEvents((previous) => [...previous, `latest:${value}`]);
                setToggleValue(value);
              }
            : (value) =>
                setToggleEvents((previous) => [...previous, `initial:${value}`])
        }
      >
        <ToggleGroup.Item value="one">Align one</ToggleGroup.Item>
        <ToggleGroup.Item
          value="two"
          disabled
        >
          Align two
        </ToggleGroup.Item>
        <ToggleGroup.Item value="three">Align three</ToggleGroup.Item>
      </ToggleGroup.Root>
      <ToggleGroup.Root
        type="multiple"
        aria-label="Formatting toggles"
        onValueChange={(values) =>
          setMultipleToggleEvents((previous) => [...previous, values.join("+")])
        }
      >
        <ToggleGroup.Item
          value="bold"
          ref={(node) => {
            toggleOne = node;
          }}
        >
          Format bold
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="italic"
          ref={(node) => {
            toggleTwo = node;
          }}
        >
          Format italic
        </ToggleGroup.Item>
      </ToggleGroup.Root>
      <button
        onClick={() => {
          toggleOne?.click();
          toggleTwo?.click();
        }}
      >
        Toggle both formats
      </button>
      <button onClick={() => setToggleAccept(true)}>
        Accept toggle changes
      </button>
      <button onClick={() => setToggleDisabled(true)}>
        Disable alignment toggles
      </button>
      <output id="toggle-events">{toggleEvents().join(",")}</output>
      <output id="multiple-toggle-events">
        {multipleToggleEvents().join(",")}
      </output>
      <Toolbar.Root
        aria-label="Editor actions"
        dir="rtl"
        orientation={toolbarVertical() ? "vertical" : "horizontal"}
      >
        <Toolbar.Button>Toolbar first</Toolbar.Button>
        <Toolbar.Button disabled>Toolbar disabled</Toolbar.Button>
        <Toolbar.Separator
          decorative={false}
          id="toolbar-divider"
        />
        <Toolbar.ToggleGroup
          type="multiple"
          aria-label="Toolbar formats"
          disabled={toolbarDisabled()}
        >
          <Toolbar.ToggleItem value="bold">Toolbar bold</Toolbar.ToggleItem>
          <Toolbar.ToggleItem value="italic">Toolbar italic</Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
        <Toolbar.Link
          href="#toolbar-target"
          onClick={(event) => {
            event.preventDefault();
            setToolbarClicks((previous) => previous + 1);
          }}
        >
          Toolbar link
        </Toolbar.Link>
      </Toolbar.Root>
      <button onClick={() => setToolbarVertical(true)}>Vertical toolbar</button>
      <button onClick={() => setToolbarDisabled(true)}>
        Disable toolbar formats
      </button>
      <output id="toolbar-clicks">{toolbarClicks()}</output>
      <Dialog.Root>
        <Dialog.Trigger>Open grouped toggles</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Content>
            <Dialog.Title>Grouped toggle focus</Dialog.Title>
            <Dialog.Description>
              Group is the first focusable control.
            </Dialog.Description>
            <ToggleGroup.Root
              type="single"
              aria-label="Dialog choices"
            >
              <ToggleGroup.Item value="one">Dialog choice one</ToggleGroup.Item>
              <ToggleGroup.Item value="two">Dialog choice two</ToggleGroup.Item>
            </ToggleGroup.Root>
            <Dialog.Close>Close grouped toggles</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Tabs.Root
        defaultValue="one"
        activationMode="manual"
        onValueChange={(value) =>
          setEditableTabEvents((previous) => [...previous, value])
        }
      >
        <Tabs.List aria-label="Editable tabs">
          <Tabs.Trigger value="one">Editable tab one</Tabs.Trigger>
          <Tabs.Trigger
            value="two"
            asChild
            aria-label="Editable tab two"
          >
            {(target) => target("div", { children: <em>Editable tab two</em> })}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="one">
          <input aria-label="Tab panel editor" />
          Editable first panel
        </Tabs.Content>
        <Tabs.Content value="two">Editable second panel</Tabs.Content>
      </Tabs.Root>
      <output id="editable-tab-events">{editableTabEvents().join(",")}</output>
    </section>
  );
}
