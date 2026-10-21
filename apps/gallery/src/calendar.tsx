import * as Calendar from "@wsagency/radix2solid-primitives/calendar";
import type {
  DateValue,
  MonthValue,
} from "@wsagency/radix2solid-primitives/calendar";
import {
  createMemo,
  createSignal,
  Errored,
  For,
  Show,
  untrack,
  type Accessor,
  type Context,
  type Element,
} from "solid-js";

const useCalendarScope = Calendar.createCalendarScope();
type CalendarScope = {
  __scopeCalendar?: Record<string, Context<any>[]> | undefined;
};
type CalendarWeekStart = NonNullable<Calendar.CalendarProps["weekStartsOn"]>;
type CalendarDirection = NonNullable<Calendar.CalendarProps["dir"]>;
type CalendarWeek = Calendar.CalendarGridState["weeks"][number];
type NativeDayRef = (node: HTMLButtonElement | undefined) => void;

type SceneActions = {
  changeBounds(): void;
  setMonth(month: MonthValue): void;
  reverseBounds(): void;
  setWeekStartsOn(weekStartsOn: CalendarWeekStart): void;
  setLocaleAndDirection(): void;
  setAllUnavailable(value: boolean): void;
  removeCalendar(): void;
};

type SceneProps = {
  id: string;
  today?: DateValue;
  initialValue?: DateValue | null;
  initialMonth?: MonthValue;
  initialMin?: DateValue;
  initialMax?: DateValue;
  controlledMonth?: boolean;
  refuseMonthChange?: boolean;
  locale?: string;
  weekStartsOn?: CalendarWeekStart;
  dir?: CalendarDirection;
  disabled?: boolean;
  readOnly?: boolean;
  allUnavailable?: boolean;
  remountGridOnMonth?: boolean;
  useSlotParts?: boolean;
  focusDayRef?: NativeDayRef;
  focusDate?: DateValue;
  onDayKeyDown?: Calendar.CalendarDayProps["onKeyDown"];
  controls?: (actions: SceneActions) => Element;
};

function CalendarScene(props: SceneProps): Element {
  const today = props.today ?? "2026-10-18";
  const [mounted, setMounted] = createSignal(true);
  const [value, setValue] = createSignal<DateValue | null>(
    props.initialValue === undefined ? today : props.initialValue,
  );
  const [month, setMonth] = createSignal<MonthValue>(
    props.initialMonth ?? (props.initialValue ?? today).slice(0, 7),
  );
  const [requestedMonth, setRequestedMonth] = createSignal("");
  const [min, setMin] = createSignal<DateValue | undefined>(props.initialMin);
  const [max, setMax] = createSignal<DateValue | undefined>(props.initialMax);
  const [locale, setLocale] = createSignal(props.locale ?? "en-US");
  const [weekStartsOn, setWeekStartsOn] = createSignal<CalendarWeekStart>(
    props.weekStartsOn ?? 0,
  );
  const [dir, setDir] = createSignal<CalendarDirection>(props.dir ?? "ltr");
  const [allUnavailable, setAllUnavailable] = createSignal(
    props.allUnavailable ?? false,
  );
  const scope = useCalendarScope();
  const actions: SceneActions = {
    changeBounds() {
      setMin("2026-11-15");
      setMax(undefined);
    },
    reverseBounds() {
      setMin("2026-12-01");
      setMax("2026-11-15");
    },
    setMonth(next) {
      setMonth(next);
    },
    setWeekStartsOn(next) {
      setWeekStartsOn(next);
    },
    setLocaleAndDirection() {
      setLocale("fr-FR");
      setWeekStartsOn(1);
      setDir("rtl");
    },
    setAllUnavailable(next) {
      setAllUnavailable(next);
    },
    removeCalendar() {
      setMounted(false);
    },
  };
  const rootProps = {
    get value() {
      return value();
    },
    onValueChange: setValue,
    get viewMonth() {
      return props.controlledMonth ? month() : undefined;
    },
    defaultViewMonth: props.initialMonth,
    onViewMonthChange(next: MonthValue) {
      setRequestedMonth(next);
      if (!props.refuseMonthChange) setMonth(next);
    },
    get min() {
      return min();
    },
    get max() {
      return max();
    },
    get locale() {
      return locale();
    },
    get weekStartsOn() {
      return weekStartsOn();
    },
    get dir() {
      return dir();
    },
    get isDateUnavailable() {
      return (_date: DateValue) => allUnavailable();
    },
    disabled: props.disabled,
    readOnly: props.readOnly,
  };
  return (
    <section
      id={props.id}
      aria-label={props.id}
    >
      {props.controls?.(actions)}
      <Show when={mounted()}>
        <Errored
          fallback={(error) => <div role="alert">{String(error())}</div>}
        >
          <Calendar.Root
            {...scope}
            {...rootProps}
            today={today}
          >
            <CalendarParts
              scope={scope}
              useSlotParts={props.useSlotParts}
              gridRemountKey={props.remountGridOnMonth ? month() : undefined}
              focusDayRef={props.focusDayRef}
              focusDate={props.focusDate}
              onDayKeyDown={props.onDayKeyDown}
            />
          </Calendar.Root>
        </Errored>
      </Show>
      <output aria-label="Accepted date">{value() ?? "empty"}</output>
      <output aria-label="Requested month">{requestedMonth()}</output>
    </section>
  );
}

function CalendarParts(props: {
  scope: CalendarScope;
  useSlotParts?: boolean;
  gridRemountKey?: MonthValue;
  focusDayRef?: NativeDayRef;
  focusDate?: DateValue;
  onDayKeyDown?: Calendar.CalendarDayProps["onKeyDown"];
}): Element {
  return (
    <>
      <Calendar.Header {...props.scope}>
        <Calendar.PrevTrigger
          {...props.scope}
          aria-label="Previous month"
        />
        <Calendar.Heading {...props.scope} />
        <Calendar.NextTrigger
          {...props.scope}
          aria-label="Next month"
        />
      </Calendar.Header>
      <Show
        when={props.gridRemountKey ?? "stable"}
        keyed
      >
        {(_month) => (
          <Show
            when={props.useSlotParts}
            fallback={
              <Calendar.Grid {...props.scope}>
                {(state) => (
                  <GridContents
                    state={state}
                    scope={props.scope}
                    focusDayRef={props.focusDayRef}
                    focusDate={props.focusDate}
                    onDayKeyDown={props.onDayKeyDown}
                  />
                )}
              </Calendar.Grid>
            }
          >
            <Calendar.Grid
              {...props.scope}
              asChild
            >
              {(target) =>
                target("div", {
                  children: <SlotCalendarContents scope={props.scope} />,
                })
              }
            </Calendar.Grid>
          </Show>
        )}
      </Show>
    </>
  );
}

function GridContents(props: {
  state: Calendar.CalendarGridState;
  scope: CalendarScope;
  focusDayRef?: NativeDayRef;
  focusDate?: DateValue;
  onDayKeyDown?: Calendar.CalendarDayProps["onKeyDown"];
}): Element {
  return (
    <>
      <Calendar.Row {...props.scope}>
        {props.state.weekdays.map((weekday) => (
          <Calendar.HeaderCell
            {...props.scope}
            weekday={weekday.index}
          >
            {weekday.shortLabel}
          </Calendar.HeaderCell>
        ))}
      </Calendar.Row>
      <For
        each={props.state.weeks}
        keyed={(week) => week.find((entry) => entry !== null)!.date}
      >
        {(week) => (
          <CalendarGridWeek
            week={week}
            scope={props.scope}
            focusDayRef={props.focusDayRef}
            focusDate={props.focusDate}
            onDayKeyDown={props.onDayKeyDown}
          />
        )}
      </For>
    </>
  );
}

function CalendarGridWeek(props: {
  week: Accessor<CalendarWeek>;
  scope: CalendarScope;
  focusDayRef?: NativeDayRef;
  focusDate?: DateValue;
  onDayKeyDown?: Calendar.CalendarDayProps["onKeyDown"];
}): Element {
  const weekKey = createMemo(
    () => props.week().find((entry) => entry !== null)!.date,
  );
  const cells = createMemo(() =>
    props.week().map((entry, index) => ({
      key: entry === null ? `padding:${weekKey()}:${index}` : entry.date,
      entry,
    })),
  );
  return (
    <Calendar.Row {...props.scope}>
      <For
        each={cells()}
        keyed={(cell) => cell.key}
      >
        {(cell) => (
          <Show
            when={cell().entry}
            fallback={
              <div
                role="gridcell"
                aria-disabled="true"
              />
            }
          >
            {(entry) => {
              const focusDayRef = (node: HTMLButtonElement | undefined) =>
                untrack(() => {
                  if (entry().date === (props.focusDate ?? "2026-10-19"))
                    props.focusDayRef?.(node);
                });
              return (
                <Calendar.Cell
                  {...props.scope}
                  date={entry().date}
                >
                  <Calendar.Day
                    {...props.scope}
                    date={entry().date}
                    data-calendar-record-label={entry().label}
                    ref={focusDayRef}
                    onKeyDown={props.onDayKeyDown}
                  />
                </Calendar.Cell>
              );
            }}
          </Show>
        )}
      </For>
    </Calendar.Row>
  );
}

function SlotCalendarContents(props: { scope: CalendarScope }): Element {
  return (
    <>
      <Calendar.Row {...props.scope}>
        <Calendar.HeaderCell
          {...props.scope}
          weekday={0}
        >
          Sun
        </Calendar.HeaderCell>
        <Calendar.HeaderCell
          {...props.scope}
          weekday={1}
        >
          Mon
        </Calendar.HeaderCell>
        <Calendar.HeaderCell
          {...props.scope}
          weekday={2}
        >
          Tue
        </Calendar.HeaderCell>
        <Calendar.HeaderCell
          {...props.scope}
          weekday={3}
        >
          Wed
        </Calendar.HeaderCell>
        <Calendar.HeaderCell
          {...props.scope}
          weekday={4}
        >
          Thu
        </Calendar.HeaderCell>
        <Calendar.HeaderCell
          {...props.scope}
          weekday={5}
        >
          Fri
        </Calendar.HeaderCell>
        <Calendar.HeaderCell
          {...props.scope}
          weekday={6}
        >
          Sat
        </Calendar.HeaderCell>
      </Calendar.Row>
      <Calendar.Row {...props.scope}>
        <Calendar.Cell
          {...props.scope}
          date="2026-10-18"
        >
          <Calendar.Day
            {...props.scope}
            asChild
            date="2026-10-18"
          >
            {(target) =>
              target("button", { id: "calendar-slot-day", children: "18" })
            }
          </Calendar.Day>
        </Calendar.Cell>
      </Calendar.Row>
    </>
  );
}

export function CalendarExamples(): Element {
  const [cancelArrow, setCancelArrow] = createSignal(false);
  let refDay: HTMLButtonElement | undefined;
  let leadingDay: HTMLButtonElement | undefined;
  return (
    <section aria-label="Native calendars">
      <style>
        {
          '[data-calendar-fixture] button:focus-visible,[data-calendar-fixture] [role="grid"]:focus-visible{outline:3px solid Highlight;outline-offset:2px}@media(forced-colors:active){[data-calendar-fixture] [aria-disabled="true"]{text-decoration:line-through}}'
        }
      </style>
      <div data-calendar-fixture>
        <CalendarScene id="calendar-independent" />
        <CalendarScene
          id="calendar-bounds-uncontrolled"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          controls={(actions) => (
            <button onClick={actions.changeBounds}>Change bounds</button>
          )}
        />
        <CalendarScene
          id="calendar-bounds"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          controlledMonth
          refuseMonthChange
          controls={(actions) => (
            <button onClick={actions.changeBounds}>Change bounds</button>
          )}
        />
        <CalendarScene
          id="calendar-unavailable-rtl"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          allUnavailable
          dir="rtl"
        />
        <CalendarScene
          id="calendar-hydration"
          initialValue="2026-10-18"
          initialMonth="2026-10"
        />
        <CalendarScene
          id="calendar-week-start"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          weekStartsOn={1}
        />
        <CalendarScene
          id="calendar-week-start-focus-recovery"
          initialValue="2026-09-27"
          initialMonth="2026-10"
          controlledMonth
          focusDate="2026-09-27"
          focusDayRef={(node) => {
            leadingDay = node;
          }}
          controls={(actions) => (
            <>
              <button
                type="button"
                onClick={() => leadingDay?.focus()}
              >
                Focus leading day
              </button>
              <button
                type="button"
                onClick={() => actions.setWeekStartsOn(1)}
              >
                Set Monday week start
              </button>
              <button
                type="button"
                onClick={() => actions.setWeekStartsOn(0)}
              >
                Restore Sunday week start
              </button>
            </>
          )}
        />
        <CalendarScene
          id="calendar-value-derived-month"
          initialValue="2026-11-12"
          today="2026-10-18"
        />
        <CalendarScene
          id="calendar-short-month-repair"
          initialValue="2025-01-31"
          initialMonth="2025-01"
          controlledMonth
          controls={(actions) => (
            <button onClick={() => actions.setMonth("2025-02")}>
              Set February 2025 month
            </button>
          )}
        />
        <CalendarScene
          id="calendar-controlled-adjacent-day"
          initialValue="2026-11-01"
          today="2026-10-18"
          initialMonth="2026-10"
          controlledMonth
          initialMin="2026-11-01"
          initialMax="2026-11-07"
        />
        <CalendarScene
          id="calendar-accepted-adjacent-navigation"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          controlledMonth
        />
        <CalendarScene
          id="calendar-same-date-remount"
          initialValue="2026-11-01"
          today="2026-10-18"
          initialMonth="2026-10"
          remountGridOnMonth
        />
        <CalendarScene
          id="calendar-arabic-day-label"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          locale="ar-EG"
        />
        <CalendarScene
          id="calendar-disabled"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          disabled
        />
        <CalendarScene
          id="calendar-readonly"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          readOnly
        />
        <CalendarScene
          id="calendar-key-policy"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          onDayKeyDown={(event) => {
            if (cancelArrow()) event.preventDefault();
          }}
          controls={() => (
            <button onClick={() => setCancelArrow(true)}>
              Cancel next calendar key
            </button>
          )}
        />
        <CalendarScene
          id="calendar-cancellation"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          focusDayRef={(node) => {
            refDay = node;
          }}
          onDayKeyDown={(event) =>
            event.key === "ArrowRight" && event.preventDefault()
          }
          controls={(actions) => (
            <>
              <button onClick={() => refDay?.focus()}>
                Focus October 19 via Calendar Day ref
              </button>
              <button>Outside focus</button>
              <button onClick={actions.removeCalendar}>
                Remove focused calendar
              </button>
            </>
          )}
        />
        <CalendarScene
          id="calendar-instance-one"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          controls={(actions) => (
            <button onClick={actions.setLocaleAndDirection}>
              Change locale, week start and direction
            </button>
          )}
        />
        <CalendarScene
          id="calendar-instance-two"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          locale="es-ES"
        />
        <CalendarScene
          id="calendar-invalid-bounds"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          controls={(actions) => (
            <button onClick={actions.reverseBounds}>Set reversed bounds</button>
          )}
        />
        <CalendarScene
          id="calendar-refused-day-navigation"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          controlledMonth
          refuseMonthChange
          controls={(actions) => (
            <button onClick={() => actions.setMonth("2026-10")}>
              Keep October controlled
            </button>
          )}
        />
        <CalendarScene
          id="calendar-external-month"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          controlledMonth
          controls={(actions) => (
            <>
              <button onClick={() => actions.setMonth("2026-11")}>
                Set external month to November
              </button>
              <button>Outside month focus</button>
            </>
          )}
        />
        <CalendarScene
          id="calendar-slots"
          initialValue="2026-10-18"
          initialMonth="2026-10"
          useSlotParts
        />
        <CalendarScene
          id="calendar-early-year"
          initialValue="0099-02-28"
          initialMonth="0099-02"
          today="0099-02-28"
        />
      </div>
    </section>
  );
}
