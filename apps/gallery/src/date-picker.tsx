import { isServer, Portal } from "@solidjs/web";
import * as Calendar from "@wsagency/radix2solid-primitives/calendar";
import type { DateValue } from "@wsagency/radix2solid-primitives/calendar";
import * as DatePicker from "@wsagency/radix2solid-primitives/date-picker";
import * as Dialog from "@wsagency/radix2solid-primitives/dialog";
import * as Form from "@wsagency/radix2solid-primitives/form";
import * as Popover from "@wsagency/radix2solid-primitives/popover";
import {
  createSignal,
  Errored,
  For,
  Show,
  type Accessor,
  type Element,
} from "solid-js";

const useDatePickerScope = DatePicker.createDatePickerScope();
const useMetadataFormScope = Form.createFormScope();
const useNestedMetadataFormScope = Form.createFormScope();
type CalendarScope = Calendar.CalendarProps["__scopeCalendar"];
type PickerScope = { __scopeDatePicker?: CalendarScope };
type Week = Calendar.CalendarGridState["weeks"][number];

function Grid(props: { scope: PickerScope }): Element {
  const calendarScope = () => props.scope.__scopeDatePicker;
  return (
    <>
      <Calendar.Header __scopeCalendar={calendarScope()}>
        <Calendar.PrevTrigger
          __scopeCalendar={calendarScope()}
          aria-label="Previous month"
        >
          Previous month
        </Calendar.PrevTrigger>
        <Calendar.Heading __scopeCalendar={calendarScope()} />
        <Calendar.NextTrigger
          __scopeCalendar={calendarScope()}
          aria-label="Next month"
        >
          Next month
        </Calendar.NextTrigger>
      </Calendar.Header>
      <Calendar.Grid __scopeCalendar={calendarScope()}>
        {(state) => (
          <>
            <Calendar.Row
              __scopeCalendar={calendarScope()}
              style={{
                display: "grid",
                "grid-template-columns": "repeat(7, minmax(0, 1fr))",
              }}
            >
              <For each={state.weekdays}>
                {(weekday) => (
                  <Calendar.HeaderCell
                    __scopeCalendar={calendarScope()}
                    weekday={weekday.index}
                  >
                    {weekday.shortLabel}
                  </Calendar.HeaderCell>
                )}
              </For>
            </Calendar.Row>
            <For each={state.weeks}>
              {(week) => (
                <GridWeek
                  week={week}
                  scope={calendarScope()}
                />
              )}
            </For>
          </>
        )}
      </Calendar.Grid>
    </>
  );
}
function GridWeek(props: { week: Week; scope?: CalendarScope }): Element {
  return (
    <Calendar.Row
      __scopeCalendar={props.scope}
      style={{
        display: "grid",
        "grid-template-columns": "repeat(7, minmax(0, 1fr))",
      }}
    >
      <For each={props.week}>
        {(entry) =>
          entry === null ? (
            <div
              role="gridcell"
              aria-disabled="true"
            />
          ) : (
            <Calendar.Cell
              __scopeCalendar={props.scope}
              date={entry.date}
            >
              <Calendar.Day
                __scopeCalendar={props.scope}
                date={entry.date}
              >
                {entry.label}
              </Calendar.Day>
            </Calendar.Cell>
          )
        }
      </For>
    </Calendar.Row>
  );
}

type PickerProps = {
  id: string;
  label: string;
  title?: string;
  root?: Omit<DatePicker.DatePickerProps, "today" | "asChild">;
  bridge?: (scope: PickerScope) => Element;
  controls?: Element;
  beforeCalendar?: Element;
  afterCalendar?: Element;
  children?: Element;
  clear?: boolean;
  inlineContent?: boolean;
  calendarContent?: Element;
  portalContainer?: Accessor<
    globalThis.Element | DocumentFragment | null | undefined
  >;
  accepted?: Accessor<string>;
  triggerDescribedBy?: string | Accessor<string | undefined>;
};
function Picker(props: PickerProps): Element {
  const scope = useDatePickerScope();
  const triggerProps = {
    get ["aria-describedby"]() {
      const value = props.triggerDescribedBy;
      return typeof value === "function" ? value() : value;
    },
  };
  return (
    <section
      id={props.id}
      aria-label={props.id}
    >
      <DatePicker.Root
        {...scope}
        {...props.root}
        today="2026-10-18"
      >
        <DatePicker.Trigger
          {...scope}
          aria-label={props.label}
          {...triggerProps}
        >
          <DatePicker.Value
            {...scope}
            placeholder={props.label}
          />
        </DatePicker.Trigger>
        {props.bridge?.(scope)}
        {props.clear && (
          <DatePicker.Clear {...scope}>Clear date</DatePicker.Clear>
        )}
        {props.inlineContent ? (
          <DatePicker.Content
            {...scope}
            style={{
              "max-height":
                "min(80vh, var(--radix-popover-content-available-height, 100dvh))",
              "overflow-y": "auto",
            }}
          >
            <DatePicker.Title {...scope}>
              {props.title ?? props.label}
            </DatePicker.Title>
            {props.beforeCalendar}
            <DatePicker.Calendar {...scope}>
              <Grid scope={scope} />
              {props.calendarContent}
            </DatePicker.Calendar>
            {props.afterCalendar}
            <DatePicker.Close {...scope}>Close date picker</DatePicker.Close>
          </DatePicker.Content>
        ) : (
          <DatePicker.Portal
            {...scope}
            container={props.portalContainer?.()}
          >
            <DatePicker.Content
              {...scope}
              style={{
                "max-height":
                  "min(80vh, var(--radix-popover-content-available-height, 100dvh))",
                "overflow-y": "auto",
              }}
            >
              <DatePicker.Title {...scope}>
                {props.title ?? props.label}
              </DatePicker.Title>
              {props.beforeCalendar}
              <DatePicker.Calendar {...scope}>
                <Grid scope={scope} />
                {props.calendarContent}
              </DatePicker.Calendar>
              {props.afterCalendar}
              <DatePicker.Close {...scope}>Close date picker</DatePicker.Close>
            </DatePicker.Content>
          </DatePicker.Portal>
        )}
      </DatePicker.Root>
      {props.accepted && (
        <output aria-label="Accepted date">{props.accepted()}</output>
      )}
      {props.controls}
      {props.children}
    </section>
  );
}
type DynamicConflictKind =
  | "root-name"
  | "root-form"
  | "owner-name"
  | "owner-form"
  | "raw-child-name"
  | "raw-child-form";

function DynamicConflictProbe(props: {
  kind: DynamicConflictKind;
  label: string;
}): Element {
  const [rootName, setRootName] = createSignal("scheduled");
  const [rootForm, setRootForm] = createSignal(
    `date-picker-dynamic-${props.kind}-form`,
  );
  const [ownerName, setOwnerName] = createSignal("scheduled");
  const [ownerForm, setOwnerForm] = createSignal(
    `date-picker-dynamic-${props.kind}-form`,
  );
  const [childName, setChildName] = createSignal("scheduled");
  const [childForm, setChildForm] = createSignal(
    `date-picker-dynamic-${props.kind}-form`,
  );
  const formId = `date-picker-dynamic-${props.kind}-form`;
  const otherFormId = `${formId}-other`;
  const makeConflict = () => {
    switch (props.kind) {
      case "root-name":
        setRootName("other-scheduled");
        break;
      case "root-form":
        setRootForm(otherFormId);
        break;
      case "owner-name":
        setOwnerName("other-scheduled");
        break;
      case "owner-form":
        setOwnerForm(otherFormId);
        break;
      case "raw-child-name":
        setChildName("other-scheduled");
        break;
      case "raw-child-form":
        setChildForm(otherFormId);
        break;
    }
  };
  return (
    <div>
      <button
        type="button"
        onClick={makeConflict}
      >
        Make DatePicker {props.label} conflict
      </button>
      <Errored
        fallback={(error) => {
          const failure = error();
          if (!(failure instanceof TypeError)) throw failure;
          return (
            <div
              role="alert"
              aria-label="DatePicker dynamic configuration rejected"
              data-error-type={failure.name}
            />
          );
        }}
      >
        <form id={otherFormId} />
        <Form.Root id={formId}>
          <Form.Field name={ownerName()}>
            <Picker
              id={`date-picker-dynamic-${props.kind}`}
              label={`Dynamic ${props.label} date`}
              root={{
                name: rootName(),
                form: rootForm(),
                defaultValue: "2026-10-18",
              }}
              bridge={(scope) => (
                <Form.Control
                  form={ownerForm()}
                  asChild
                >
                  {(target) =>
                    target(DatePicker.FormControl, {
                      __scopeDatePicker: scope.__scopeDatePicker,
                      asChild: true,
                      children: (childTarget) =>
                        childTarget("input", {
                          get name() {
                            return childName();
                          },
                          get form() {
                            return childForm();
                          },
                        }),
                    })
                  }
                </Form.Control>
              )}
            />
          </Form.Field>
        </Form.Root>
      </Errored>
    </div>
  );
}

type InitialConflictKind = "raw-name" | "raw-form" | "masked-field-name";

function InitialConflictProbe(props: {
  kind: InitialConflictKind;
  label: string;
}): Element {
  const [mounted, setMounted] = createSignal(false);
  const formId = `date-picker-initial-${props.kind}-form`;
  const otherFormId = `${formId}-other`;
  const fieldName = props.kind === "masked-field-name" ? "other" : "due";
  const targetProps =
    props.kind === "raw-name"
      ? { name: "other" }
      : props.kind === "raw-form"
        ? { form: otherFormId }
        : { name: "due" };
  return (
    <div>
      <button
        type="button"
        onClick={() => setMounted(true)}
      >
        Mount initial DatePicker {props.label} conflict
      </button>
      <Errored
        fallback={(error) => {
          const failure = error();
          if (!(failure instanceof TypeError)) throw failure;
          return (
            <div
              role="alert"
              aria-label={`Initial DatePicker ${props.label} conflict rejected`}
              data-conflict-kind={props.kind}
              data-error-type={failure.name}
            >
              Configuration rejected
            </div>
          );
        }}
      >
        <Show when={mounted()}>
          <form id={otherFormId} />
          <Form.Root id={formId}>
            <Form.Field name={fieldName}>
              <Picker
                id={`date-picker-initial-${props.kind}`}
                label={`Initial ${props.label} date`}
                root={{ name: "due", form: formId }}
                bridge={(scope) => (
                  <Form.Control
                    name={
                      props.kind === "masked-field-name" ? undefined : "due"
                    }
                    form={formId}
                    asChild
                  >
                    {(target) =>
                      target(DatePicker.FormControl, {
                        __scopeDatePicker: scope.__scopeDatePicker,
                        asChild: true,
                        children: (childTarget) =>
                          childTarget("input", targetProps),
                      })
                    }
                  </Form.Control>
                )}
              />
            </Form.Field>
          </Form.Root>
        </Show>
      </Errored>
    </div>
  );
}

function FormMetadataExamples(props: { initiallyInvalid: boolean }): Element {
  const formScope = useMetadataFormScope();
  const nestedFormScope = useNestedMetadataFormScope();
  const datePickerScope = useDatePickerScope();
  const [serverInvalid, setServerInvalid] = createSignal(
    props.initiallyInvalid,
  );
  const [barrierHost, setBarrierHost] = createSignal<HTMLElement>();
  return (
    <section
      id="date-picker-form-metadata"
      aria-label="DatePicker Form metadata scopes"
    >
      <div
        id="date-picker-metadata-root-barrier-host"
        ref={setBarrierHost}
      />
      <Form.Root
        __scopeForm={formScope.__scopeForm}
        id="date-picker-metadata-form"
      >
        <DatePicker.Root
          {...datePickerScope}
          name="metadata-date"
          today="2026-10-18"
          defaultValue="2026-10-18"
        >
          <Form.Field
            __scopeForm={formScope.__scopeForm}
            name="metadata-date"
            serverInvalid={serverInvalid()}
          >
            <p id="metadata-caller-help">
              Caller-provided scheduled date help.
            </p>
            <p id="metadata-raw-trigger-help">Raw button description.</p>
            <p id="metadata-target-help">Native target description.</p>
            <p id="metadata-shared-help">Shared metadata help.</p>
            <DatePicker.Trigger
              {...datePickerScope}
              asChild
              aria-label="Scoped scheduled date"
              aria-describedby={
                serverInvalid()
                  ? "metadata-caller-help metadata-shared-help metadata-server-error"
                  : "metadata-caller-help metadata-shared-help"
              }
            >
              {(target) =>
                target("button", {
                  "aria-describedby":
                    "metadata-raw-trigger-help metadata-shared-help",
                  children: <DatePicker.Value {...datePickerScope} />,
                })
              }
            </DatePicker.Trigger>
            <Form.Control
              __scopeForm={formScope.__scopeForm}
              id="metadata-date-control"
              asChild
            >
              {(target) =>
                target(DatePicker.FormControl, {
                  __scopeDatePicker: datePickerScope.__scopeDatePicker,
                  asChild: true,
                  children: (nativeTarget) =>
                    nativeTarget("input", {
                      "aria-describedby":
                        "metadata-target-help metadata-shared-help",
                    }),
                })
              }
            </Form.Control>
            <Show when={serverInvalid()}>
              <Form.Message
                __scopeForm={formScope.__scopeForm}
                id="metadata-server-error"
                forceMatch
              >
                Server rejected scoped date
              </Form.Message>
            </Show>
            <DatePicker.Root
              {...datePickerScope}
              name="different-metadata-date"
              today="2026-10-18"
              defaultValue="2026-10-18"
            >
              <DatePicker.Trigger
                {...datePickerScope}
                aria-label="Mismatched metadata date"
              >
                Different name
              </DatePicker.Trigger>
            </DatePicker.Root>
            <DatePicker.Root
              {...datePickerScope}
              name="metadata-date"
              today="2026-10-18"
              defaultValue="2026-10-18"
            >
              <Show when={barrierHost()}>
                {(host) => (
                  <Portal mount={host()}>
                    <Form.Root
                      __scopeForm={nestedFormScope.__scopeForm}
                      id="date-picker-metadata-nested-form"
                    >
                      <DatePicker.Trigger
                        {...datePickerScope}
                        aria-label="Independent root barrier date"
                        aria-describedby="metadata-barrier-help"
                      >
                        Nested root date
                      </DatePicker.Trigger>
                    </Form.Root>
                  </Portal>
                )}
              </Show>
            </DatePicker.Root>
          </Form.Field>
        </DatePicker.Root>
        <button
          type="button"
          onClick={() => setServerInvalid(false)}
        >
          Clear scoped server error
        </button>
        <button
          type="button"
          onClick={() => setServerInvalid(true)}
        >
          Restore scoped server error
        </button>
      </Form.Root>
      <p id="metadata-barrier-help">Independent root help.</p>
    </section>
  );
}

function traceEvent(
  setTrace: (value: (previous: string) => string) => void,
  event: Event,
): void {
  const node = event.currentTarget as HTMLInputElement;
  const part = `${event.type}:${node.value}:${event.bubbles}`;
  setTrace((previous) => (previous ? `${previous},${part}` : part));
}
type HostEventObservation = { type: string; value: string; bubbles: boolean };
function observeHostEvent(event: Event): HostEventObservation {
  const target = event.currentTarget as HTMLInputElement;
  return { type: event.type, value: target.value, bubbles: event.bubbles };
}

export function DatePickerExamples(
  props: { initiallyOpenDatePicker?: boolean } = {},
): Element {
  const [refusedRequested, setRefusedRequested] = createSignal("");
  const [refusedOpenRequests, setRefusedOpenRequests] = createSignal("");
  const [refusedCloseOpen, setRefusedCloseOpen] = createSignal(false);
  const [refusedCloseRequests, setRefusedCloseRequests] = createSignal("");
  const [refusedMonth, setRefusedMonth] = createSignal("");
  const [uncontrolledDate, setUncontrolledDate] =
    createSignal<DateValue>("2026-10-18");
  const [controlledDate, setControlledDate] =
    createSignal<DateValue>("2026-10-18");
  const [refusedCloseDate, setRefusedCloseDate] =
    createSignal<DateValue>("2026-10-18");
  const [nativeMin, setNativeMin] = createSignal<DateValue | undefined>();
  const [nativeMax, setNativeMax] = createSignal<DateValue | undefined>();
  const [submission, setSubmission] = createSignal("none");
  const [managedUnavailable, setManagedUnavailable] = createSignal(
    !props.initiallyOpenDatePicker,
  );
  const [serverInvalid, setServerInvalid] = createSignal(
    !!props.initiallyOpenDatePicker,
  );
  const [startOlderCheck, setStartOlderCheck] = createSignal(false);
  const pendingChecks: {
    value: DateValue;
    resolve: (invalid: boolean) => void;
  }[] = [];
  const [managedDate, setManagedDate] = createSignal<DateValue>("2026-10-18");
  const [managedBridgeMounted, setManagedBridgeMounted] = createSignal(true);
  const [resetTrace, setResetTrace] = createSignal("");
  const [resetDate, setResetDate] = createSignal<DateValue>("2026-10-18");
  const [resetOpen, setResetOpen] = createSignal(false);
  const [externalForm, setExternalForm] = createSignal<string | undefined>();
  const [resetMounted, setResetMounted] = createSignal(true);
  const [refuseResetNext, setRefuseResetNext] = createSignal(false);
  const [refuseResetValue, setRefuseResetValue] =
    createSignal<DateValue>("2026-10-18");
  const [pendingRefusal, setPendingRefusal] = createSignal("");
  const [hostAccepted, setHostAccepted] = createSignal<DateValue>("2026-10-18");
  const [hostEvents, setHostEvents] = createSignal<HostEventObservation[]>([]);
  const [hostInput, setHostInput] = createSignal<HTMLInputElement>();
  const [dismissMounted, setDismissMounted] = createSignal(true);
  const [innerDate, setInnerDate] = createSignal<DateValue>("2026-10-18");
  const [nestedPortalContainer, setNestedPortalContainer] =
    createSignal<HTMLDivElement>();
  const outerDate: DateValue = "2026-10-18";

  if (!isServer) queueMicrotask(() => setRefuseResetValue("2026-10-19"));
  const selectPortalDay = (fixture: string, date: DateValue) => {
    const trigger = document.querySelector<HTMLButtonElement>(
      `#${fixture} button[aria-haspopup="dialog"]`,
    );
    const dialogId = trigger?.getAttribute("aria-controls");
    const label = new Intl.DateTimeFormat("en-US", {
      calendar: "gregory",
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${date}T12:00:00Z`));
    document
      .getElementById(dialogId ?? "")
      ?.querySelector(`[aria-label="${label}"]`)
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  };
  const resetChoice = (date: DateValue) => {
    setResetOpen(true);
    queueMicrotask(() => selectPortalDay("date-picker-reset", date));
  };
  const resetForm = () =>
    document
      .querySelector<HTMLFormElement>("#date-picker-reset-inner")
      ?.reset();

  return (
    <section aria-label="DatePicker fixtures">
      <Picker
        id="date-picker-refused-selection"
        label="Choose a date"
        accepted={() => "2026-10-18"}
        root={{
          value: "2026-10-18",
          onValueChange: (value) => setRefusedRequested(value ?? "empty"),
        }}
        controls={
          <output aria-label="Value requests">{refusedRequested()}</output>
        }
      />
      <Picker
        id="date-picker-refused-open"
        label="Cannot open yet"
        accepted={() => "2026-10-18"}
        root={{
          open: false,
          defaultValue: "2026-10-18",
          onOpenChange: (value) => setRefusedOpenRequests(String(value)),
        }}
        controls={
          <output aria-label="Open requests">{refusedOpenRequests()}</output>
        }
      />
      <Picker
        id="date-picker-refused-close"
        label="Choose another date"
        root={{
          get open() {
            return refusedCloseOpen();
          },
          onOpenChange: (value) => {
            setRefusedCloseRequests(String(value));
            if (value) setRefusedCloseOpen(true);
          },
          get value() {
            return refusedCloseDate();
          },
          onValueChange: (value) => {
            if (value !== null) setRefusedCloseDate(value);
          },
        }}
        controls={
          <>
            <output aria-label="Accepted date">{refusedCloseDate()}</output>
            <output aria-label="Open requests">{refusedCloseRequests()}</output>
          </>
        }
      />
      <Picker
        id="date-picker-refused-month"
        label="Browse dates"
        root={{
          value: "2026-10-18",
          viewMonth: "2026-10",
          onViewMonthChange: (month) => setRefusedMonth(month),
        }}
        controls={
          <>
            <output aria-label="Requested month">{refusedMonth()}</output>
            <output aria-label="Accepted date">2026-10-18</output>
          </>
        }
      />

      <Picker
        id="date-picker-reopen-selection"
        label="Reopen selected date"
        root={{
          get value() {
            return uncontrolledDate();
          },
          onValueChange: (value) => {
            if (value !== null) setUncontrolledDate(value);
          },
        }}
        accepted={() => uncontrolledDate()}
      />
      <Picker
        id="date-picker-controlled-reopen"
        label="Controlled month date"
        root={{
          get value() {
            return controlledDate();
          },
          onValueChange: (value) => {
            if (value !== null) setControlledDate(value);
          },
          viewMonth: "2026-10",
        }}
        controls={
          <button
            type="button"
            onClick={() => setControlledDate("2026-11-12")}
          >
            Set accepted date to November
          </button>
        }
        accepted={() => controlledDate()}
      />

      <section id="date-picker-native-form">
        <button type="button">Before native date field</button>
        <form
          id="native-date-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            setSubmission(String(new FormData(form).get("due") ?? ""));
          }}
        >
          <p id="native-date-help">Choose a due date.</p>
          <p id="native-bridge-help">
            A due date is required and must be inside the allowed range.
          </p>
          <Picker
            id="native-date-picker"
            label="Due date"
            clear
            triggerDescribedBy={() =>
              nativeMin() !== undefined || nativeMax() !== undefined
                ? "native-date-help native-date-range-error"
                : "native-date-help"
            }
            root={{
              name: "due",
              required: true,
              get min() {
                return nativeMin();
              },
              get max() {
                return nativeMax();
              },
            }}
            bridge={(scope) => (
              <DatePicker.FormControl
                {...scope}
                aria-describedby="native-bridge-help"
                aria-label="Due date"
                onInvalid={() => setSubmission("blocked")}
              />
            )}
            controls={
              <>
                <button type="submit">Submit due date</button>
                <button
                  type="button"
                  onClick={() => setNativeMin("2026-10-19")}
                >
                  Set minimum after accepted date
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNativeMin(undefined);
                    setNativeMax("2026-10-17");
                  }}
                >
                  Set maximum before accepted date
                </button>
                <output aria-label="Submission">{submission()}</output>
                <Show
                  when={nativeMin() !== undefined || nativeMax() !== undefined}
                >
                  <output
                    id="native-date-range-error"
                    aria-label="Date error"
                  >
                    Date is outside the allowed range
                  </output>
                </Show>
              </>
            }
          />
        </form>

        <section id="native-date-input-alternative">
          <label for="native-date-input-alternative-control">
            Native date input alternative
          </label>
          <input
            id="native-date-input-alternative-control"
            type="date"
          />
        </section>
      </section>
      <section id="date-picker-unavailable-form">
        <form>
          <Picker
            id="unavailable-picker"
            label="Unavailable date"
            triggerDescribedBy="unavailable-date-help"
            root={{
              name: "due",
              defaultValue: "2026-10-18",
              isDateUnavailable: () => true,
            }}
            bridge={(scope) => (
              <DatePicker.FormControl
                {...scope}
                aria-describedby="unavailable-date-error"
                aria-label="Unavailable date"
              />
            )}
          >
            <p id="unavailable-date-help">Choose an available date.</p>
            <p id="unavailable-date-error">This date is unavailable.</p>
          </Picker>
        </form>
      </section>
      <section id="date-picker-readonly-form">
        <form>
          <Picker
            id="readonly-picker"
            label="Read-only date"
            clear
            root={{
              name: "due",
              defaultValue: "2026-10-18",
              readOnly: true,
              required: true,
              min: "2026-10-25",
            }}
            bridge={(scope) => (
              <DatePicker.FormControl
                {...scope}
                aria-label="Read-only date"
              />
            )}
          />
        </form>
      </section>
      <section id="date-picker-disabled-form">
        <form>
          <Picker
            id="disabled-picker"
            label="Disabled date"
            root={{
              name: "due",
              defaultValue: "2026-10-18",
              disabled: true,
              required: true,
            }}
            bridge={(scope) => (
              <DatePicker.FormControl
                {...scope}
                aria-label="Disabled date"
              />
            )}
          />
        </form>
      </section>

      <section id="date-picker-managed-form">
        <Form.Root id="scheduled-form">
          <Form.Field
            name="scheduled"
            serverInvalid={serverInvalid()}
          >
            <Form.Label>Choose the scheduled date</Form.Label>
            <p id="scheduled-date-help">Choose a date from the calendar.</p>
            <Picker
              id="managed-picker"
              label="Scheduled date"
              triggerDescribedBy={() =>
                props.initiallyOpenDatePicker
                  ? "scheduled-date-help scheduled-server-error"
                  : "scheduled-date-help"
              }
              accepted={() => managedDate()}
              root={{
                name: "scheduled",
                form: "scheduled-form",
                get value() {
                  return managedDate();
                },
                onValueChange: (value) => {
                  if (value !== null) setManagedDate(value);
                },
                get isDateUnavailable() {
                  const unavailable = managedUnavailable();
                  return (date: DateValue) =>
                    unavailable && date < "2026-10-20";
                },
              }}
              bridge={(scope: PickerScope) => (
                <Show when={managedBridgeMounted()}>
                  <Form.Control
                    id="scheduled-date-control"
                    form="scheduled-form"
                    asChild
                  >
                    {(target) =>
                      target(DatePicker.FormControl, {
                        __scopeDatePicker: scope.__scopeDatePicker,
                        asChild: true,
                        children: (nativeTarget) =>
                          nativeTarget("input", {
                            "aria-describedby": "scheduled-target-help",
                          }),
                      })
                    }
                  </Form.Control>
                </Show>
              )}
            />
            <p id="scheduled-target-help">Target input explanation.</p>
            <Form.Message
              match={(value) =>
                startOlderCheck() &&
                (value === "2026-10-20" || value === "2026-10-21")
                  ? new Promise<boolean>((resolve) =>
                      pendingChecks.push({
                        value: value as DateValue,
                        resolve,
                      }),
                    )
                  : false
              }
            >
              Current date rejected
            </Form.Message>
            <Show when={serverInvalid()}>
              <Form.Message
                id="scheduled-server-error"
                forceMatch
              >
                Server rejected date
              </Form.Message>
            </Show>
            <Form.ValidityState>
              {(validity) => (
                <>
                  <Show when={managedUnavailable() && validity?.customError}>
                    <Form.Message forceMatch>Date is unavailable</Form.Message>
                  </Show>
                  <output aria-label="Scheduled date custom error state">
                    {String(!!validity?.customError)}
                  </output>
                </>
              )}
            </Form.ValidityState>
          </Form.Field>
          <button
            type="button"
            onClick={() => {
              setStartOlderCheck(true);
              setManagedDate("2026-10-20");
            }}
          >
            Start older validation
          </button>
          <button
            type="button"
            onClick={() => setManagedDate("2026-10-19")}
          >
            Change baseline and accepted date
          </button>
          <button
            type="button"
            onClick={() => setManagedDate("2026-10-21")}
          >
            Set current accepted validation date
          </button>
          <button
            type="button"
            onClick={() => {
              const date = managedDate();
              for (let index = pendingChecks.length - 1; index >= 0; index--)
                if (pendingChecks[index].value === date)
                  pendingChecks.splice(index, 1)[0].resolve(true);
            }}
          >
            Resolve current accepted validation as invalid
          </button>
          <button
            type="button"
            onClick={() => {
              const index = pendingChecks.findIndex(
                (check) => check.value === "2026-10-20",
              );
              if (index >= 0) pendingChecks.splice(index, 1)[0].resolve(false);
            }}
          >
            Resolve older validation
          </button>
          <button
            type="button"
            onClick={() => setManagedUnavailable(false)}
          >
            Clear baseline
          </button>
          <button
            type="button"
            onClick={() => setServerInvalid(true)}
          >
            Restore server error
          </button>
          <button
            type="button"
            onClick={() => setServerInvalid(false)}
          >
            Clear server error
          </button>
          <button
            type="button"
            onClick={() => setManagedBridgeMounted(false)}
          >
            Unmount managed native control
          </button>
          <button
            type="button"
            onClick={() => setManagedBridgeMounted(true)}
          >
            Remount managed native control
          </button>
        </Form.Root>
      </section>

      <section id="date-picker-reset">
        <form id="external-date-form" />
        <form id="date-picker-reset-inner">
          <Show when={resetMounted()}>
            <Picker
              id="reset-picker"
              label="Resettable date"
              accepted={() => resetDate()}
              root={{
                name: "appointment",
                get value() {
                  return resetDate();
                },
                onValueChange: (date) => {
                  if (refuseResetNext()) {
                    setRefuseResetNext(false);
                    return;
                  }
                  if (date !== null) setResetDate(date);
                },
                get form() {
                  return externalForm();
                },
                get open() {
                  return resetOpen();
                },
                onOpenChange: setResetOpen,
              }}
              bridge={(scope) => (
                <DatePicker.FormControl
                  {...scope}
                  aria-label="Resettable date"
                  onInput={(event) => traceEvent(setResetTrace, event)}
                  onChange={(event) => traceEvent(setResetTrace, event)}
                />
              )}
            />
          </Show>
          <button
            type="button"
            onClick={() => resetChoice("2026-10-19")}
          >
            Choose October 19, 2026
          </button>
          <button
            type="button"
            onClick={() => setResetDate("2026-10-20")}
          >
            Set date programmatically
          </button>
          <button
            type="button"
            onClick={() => resetChoice("2026-10-20")}
          >
            No-op selection request
          </button>
          <button
            type="button"
            onClick={() => setRefuseResetNext(true)}
          >
            Refuse next value request
          </button>
          <button
            type="button"
            onClick={() =>
              document
                .querySelector("#date-picker-reset-inner")
                ?.addEventListener("reset", (event) => event.preventDefault(), {
                  once: true,
                })
            }
          >
            Cancel next reset
          </button>
          <button
            type="button"
            onClick={() => setExternalForm("external-date-form")}
          >
            Reassociate external form
          </button>
          <button
            type="button"
            onClick={() => setResetMounted(false)}
          >
            Unmount DatePicker
          </button>
          <button
            type="button"
            onClick={() => setResetMounted(true)}
          >
            Remount DatePicker
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setResetMounted(false);
            }}
          >
            Queue reset and unmount DatePicker
          </button>
          <button
            type="button"
            onClick={() => resetForm()}
          >
            Reset form
          </button>
        </form>
        <button
          type="button"
          aria-label="Outside reset focus"
        >
          Outside reset focus
        </button>
        <output aria-label="Native event trace">{resetTrace()}</output>
      </section>
      <section id="date-picker-reset-refused">
        <Form.Root id="reset-refused-form">
          <Picker
            id="reset-refused-picker"
            label="Refused reset date"
            accepted={() => refuseResetValue()}
            root={{
              name: "appointment",
              get value() {
                return refuseResetValue();
              },
              onValueChange: () => undefined,
            }}
            bridge={(scope) => (
              <DatePicker.FormControl
                {...scope}
                aria-label="Refused reset date"
              />
            )}
            controls={
              <button
                type="button"
                onClick={() =>
                  document
                    .querySelector<HTMLFormElement>("#reset-refused-form")
                    ?.reset()
                }
              >
                Reset date
              </button>
            }
          />
        </Form.Root>
      </section>

      <Picker
        id="date-picker-ssr-closed"
        label="Closed SSR date"
        root={{ defaultValue: "2026-10-18" }}
      />
      {props.initiallyOpenDatePicker && (
        <Picker
          id="date-picker-ssr-open"
          label="Open SSR date"
          inlineContent
          root={{ defaultOpen: true, defaultValue: "2026-10-18" }}
        />
      )}
      <Dialog.Root>
        <section id="date-picker-nested-layers">
          <Dialog.Trigger>Open date-picker host dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Content>
              <Dialog.Title>Date-picker host dialog</Dialog.Title>
              <Picker
                id="nested-picker"
                label="Choose nested date"
                root={{ defaultValue: "2026-10-18" }}
              />
              <Dialog.Close>Close host</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </section>
      </Dialog.Root>
      <Picker
        id="date-picker-tab-modes"
        label="Open nonmodal date picker"
        title="Nonmodal date picker"
        controls={<button type="button">Outside date picker</button>}
        beforeCalendar={<button type="button">First date control</button>}
        afterCalendar={<button type="button">Last date control</button>}
      >
        <Picker
          id="tab-modal-picker"
          label="Open modal date picker"
          title="Modal date picker"
          root={{ modal: true }}
          beforeCalendar={<button type="button">First date control</button>}
          afterCalendar={<button type="button">Last date control</button>}
        />
      </Picker>
      <section id="date-picker-modal-forcemount-closed">
        <Popover.Root modal>
          <Popover.Trigger>Closed forced modal popover trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              forceMount
              aria-label="Closed forced modal popover"
              style={{ display: "none" }}
            />
          </Popover.Portal>
        </Popover.Root>
      </section>

      <Picker
        id="date-picker-locale"
        label="Rendez-vous"
        root={{ defaultValue: "2026-10-18", locale: "fr-FR", weekStartsOn: 1 }}
        controls={
          <output aria-label="Formatted date">
            {new Intl.DateTimeFormat("fr-FR", {
              calendar: "gregory",
              timeZone: "UTC",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date("2026-10-18T12:00:00Z"))}
          </output>
        }
      />

      <section id="date-picker-explicit-bridge">
        <Form.Root>
          <Picker
            id="explicit-bridge-picker"
            label="Appointment date"
            root={{ name: "appointment", defaultValue: null }}
            bridge={(scope) => (
              <DatePicker.FormControl
                {...scope}
                aria-label="Appointment date"
                onInput={(event) => traceEvent(setResetTrace, event)}
                onChange={(event) => traceEvent(setResetTrace, event)}
              />
            )}
            controls={
              <output aria-label="Form event trace">{resetTrace()}</output>
            }
          />
        </Form.Root>
        <Form.Root>
          <Picker
            id="root-only-name-picker"
            label="Root-only name"
            root={{ name: "appointment" }}
          />
        </Form.Root>
      </section>
      <Form.Root id="date-picker-host-arbitration-form">
        <Form.Field name="due">
          <Picker
            id="date-picker-host-arbitration"
            label="Arbitrated date"
            accepted={() => hostAccepted()}
            root={{
              get value() {
                return hostAccepted();
              },
              name: "due",
              form: "date-picker-host-arbitration-form",
              required: true,
              min: "2026-10-10",
              max: "2026-10-25",
              onValueChange: (date) => {
                if (date) setPendingRefusal(date);
              },
            }}
            bridge={(scope) => (
              <Form.Control
                name="due"
                form="date-picker-host-arbitration-form"
                required
                asChild
                onInput={(event) =>
                  setHostEvents((events) => [
                    ...events,
                    observeHostEvent(event),
                  ])
                }
                onChange={(event) =>
                  setHostEvents((events) => [
                    ...events,
                    observeHostEvent(event),
                  ])
                }
              >
                {(target) =>
                  target(DatePicker.FormControl, {
                    __scopeDatePicker: scope.__scopeDatePicker,
                    asChild: true,
                    ref: setHostInput,
                    children: (childTarget) =>
                      childTarget("input", {
                        type: "text",
                        value: "1999-01-01",
                        required: false,
                        disabled: true,
                        readonly: true,
                        min: "9999-01-01",
                        max: "9999-12-31",
                      }),
                  })
                }
              </Form.Control>
            )}
            controls={
              <>
                <output aria-label="Target event observations">
                  <For each={hostEvents()}>
                    {(event) => (
                      <span
                        data-event-type={event.type}
                        data-event-value={event.value}
                        data-event-bubbles={String(event.bubbles)}
                      />
                    )}
                  </For>
                </output>
                <output aria-label="Pending date request">
                  {pendingRefusal()}
                </output>
                <button
                  type="button"
                  onClick={() => hostInput()?.focus()}
                >
                  Focus captured date input
                </button>
                <button
                  type="button"
                  onClick={() => setPendingRefusal("refused")}
                >
                  Resolve deferred refusal
                </button>
                <button
                  type="button"
                  onClick={() => setHostAccepted("2026-10-19")}
                >
                  Accept date programmatically
                </button>
              </>
            }
          />
        </Form.Field>
      </Form.Root>
      <section
        id="date-picker-initial-conflicts"
        aria-label="DatePicker initial name and form conflicts"
      >
        <InitialConflictProbe
          kind="raw-name"
          label="raw name"
        />
        <InitialConflictProbe
          kind="raw-form"
          label="raw form"
        />
        <InitialConflictProbe
          kind="masked-field-name"
          label="masked Form.Field name"
        />
      </section>
      <Picker
        id="date-picker-field-name-resolution"
        label="Form.Field owner picker"
        root={{ name: "due" }}
        bridge={(scope) => (
          <Errored fallback={() => <div role="alert">Field name mismatch</div>}>
            <Form.Root>
              <Form.Field name="due">
                <Form.Control asChild>
                  {(target) =>
                    target(DatePicker.FormControl, {
                      __scopeDatePicker: scope.__scopeDatePicker,
                      asChild: true,
                      children: (childTarget) => childTarget("input", {}),
                    })
                  }
                </Form.Control>
              </Form.Field>
            </Form.Root>
          </Errored>
        )}
      />
      <section
        id="date-picker-dynamic-conflicts"
        aria-label="DatePicker dynamic name and form conflicts"
      >
        <DynamicConflictProbe
          kind="root-name"
          label="Root name"
        />
        <DynamicConflictProbe
          kind="root-form"
          label="Root form"
        />
        <DynamicConflictProbe
          kind="owner-name"
          label="owner name"
        />
        <DynamicConflictProbe
          kind="owner-form"
          label="owner form"
        />
        <DynamicConflictProbe
          kind="raw-child-name"
          label="raw-child name"
        />
        <DynamicConflictProbe
          kind="raw-child-form"
          label="raw-child form"
        />
      </section>

      <section id="date-picker-dismissal">
        <Show when={dismissMounted()}>
          <Picker
            id="dismiss-picker"
            label="Dismissible date"
            accepted={() => "2026-10-18"}
            root={{ defaultValue: "2026-10-18" }}
            beforeCalendar={<button type="button">Inside date picker</button>}
          />
        </Show>
        <output aria-label="Accepted date">2026-10-18</output>
        <button type="button">Outside date-picker target</button>
        <button
          type="button"
          onClick={() => setDismissMounted(false)}
        >
          Remove date-picker trigger
        </button>
      </section>
      <Picker
        id="date-picker-scoped-roots"
        label="Open outer scoped date picker"
        title="Outer scoped date picker"
        accepted={() => outerDate}
        root={{ defaultValue: "2026-10-18" }}
        calendarContent={
          <div
            id="scoped-inner-portal-host"
            ref={setNestedPortalContainer}
          />
        }
        afterCalendar={
          <Picker
            id="scoped-inner-picker"
            label="Open inner scoped date picker"
            title="Inner scoped date picker"
            portalContainer={nestedPortalContainer}
            root={{
              defaultValue: "2026-10-18",
              onValueChange: (value) => {
                if (value !== null) setInnerDate(value);
              },
            }}
          />
        }
      >
        <output aria-label="Outer accepted date">{outerDate}</output>
        <output aria-label="Inner accepted date">{innerDate()}</output>
      </Picker>
      <FormMetadataExamples
        initiallyInvalid={!!props.initiallyOpenDatePicker}
      />
    </section>
  );
}
