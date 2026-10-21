import { isServer } from "@solidjs/web";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  getOwner,
  merge,
  omit,
  onCleanup,
  untrack,
  type Accessor,
  type Element,
} from "solid-js";

import { useDirection, type Direction } from "../direction/direction.js";
import { createContextScope, type Scope } from "../internal/context.js";
import { composeEventHandlers } from "../internal/events.js";
import { focus } from "../internal/focus-scope.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import { createControllableState } from "../internal/state.js";
import type { SlotRender } from "../slot/slot.js";
import {
  addDays,
  addMonths,
  assertDate,
  assertMonth,
  monthGrid,
  monthOf,
  weekdayOf,
  type DateValue,
  type MonthValue,
} from "./date.js";

export type { DateValue, MonthValue } from "./date.js";

const [createCalendarContext, createCalendarScope] =
  createContextScope("Calendar");
const [CalendarProvider, useCalendar] =
  createCalendarContext<CalendarStateInternal>("Calendar");
export { createCalendarScope };

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type FocusIntent = {
  readonly date: DateValue | null;
  readonly kind: "entry" | "navigation" | "reconcile";
};

export type CalendarProps = PrimitiveProps<"div"> & {
  __scopeCalendar?: Scope;
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  onValueChange?: (value: DateValue | null) => void;
  viewMonth?: MonthValue;
  defaultViewMonth?: MonthValue;
  onViewMonthChange?: (month: MonthValue) => void;
  today: DateValue;
  locale?: string;
  weekStartsOn?: WeekdayIndex;
  dir?: Direction;
  min?: DateValue;
  max?: DateValue;
  isDateUnavailable?: (date: DateValue) => boolean;
  disabled?: boolean;
  readOnly?: boolean;
};

export interface CalendarGridDay {
  readonly date: DateValue;
  readonly label: string;
  readonly selected: boolean;
  readonly today: boolean;
  readonly unavailable: boolean;
  readonly outsideMonth: boolean;
}

export interface CalendarGridState {
  readonly weekdays: readonly {
    readonly index: WeekdayIndex;
    readonly shortLabel: string;
    readonly longLabel: string;
  }[];
  readonly weeks: readonly (readonly (CalendarGridDay | null)[])[];
}

export interface CalendarState {
  readonly props: CalendarProps;
  readonly value: Accessor<DateValue | null>;
  readonly viewMonth: Accessor<MonthValue>;
  readonly cursor: Accessor<DateValue | null>;
  requestValue(value: DateValue | null): void;
  requestViewMonth(month: MonthValue): void;
  commit(date: DateValue): void;
  focusEntry(): void;
}

interface CalendarStateInternal extends CalendarState {
  readonly dir: Accessor<Direction>;
  readonly disabled: Accessor<boolean>;
  readonly readOnly: Accessor<boolean>;
  readonly id: string;
  readonly headingId: string;
  readonly gridId: string;
  isUnavailable(date: DateValue): boolean;
  isInBounds(date: DateValue): boolean;
  isToday(date: DateValue): boolean;
  isSelected(date: DateValue): boolean;
  isOutsideMonth(date: DateValue): boolean;
  labelDate(date: DateValue): string;
  labelDay(date: DateValue): string;
  labelMonth(): string;
  weekdayLabels(): readonly {
    readonly index: WeekdayIndex;
    readonly shortLabel: string;
    readonly longLabel: string;
  }[];
  weekdayLabel(index: WeekdayIndex): {
    readonly index: WeekdayIndex;
    readonly shortLabel: string;
    readonly longLabel: string;
  };
  canNavigate(delta: -1 | 1): boolean;
  navigateMonth(delta: -1 | 1): void;
  moveFocus(date: DateValue): void;
  setCursorFromFocus(date: DateValue): void;
  dayTabIndex(date: DateValue): 0 | -1;
  registerGrid(node: HTMLElement | undefined): void | (() => void);
  registerDay(date: DateValue, node: HTMLButtonElement): () => void;
  setFocusWithin(value: boolean): void;
  handleGridFocusOut(
    grid: HTMLElement,
    target: HTMLElement,
    relatedTarget: Node | null,
  ): void;
}

export function createCalendarState(
  props: CalendarProps,
  options?: { onCommit?: (date: DateValue) => void },
): CalendarState {
  function validateConfiguration(): void {
    assertDate(props.today);
    if (props.value != null) assertDate(props.value);
    if (props.defaultValue != null) assertDate(props.defaultValue);
    if (props.viewMonth !== undefined) assertMonth(props.viewMonth);
    if (props.defaultViewMonth !== undefined)
      assertMonth(props.defaultViewMonth);
    if (props.min !== undefined) assertDate(props.min);
    if (props.max !== undefined) assertDate(props.max);
    if (
      props.min !== undefined &&
      props.max !== undefined &&
      props.min > props.max
    ) {
      throw new RangeError("Calendar: min must not be after max.");
    }
    const weekStartsOn = props.weekStartsOn ?? 0;
    if (
      !Number.isInteger(weekStartsOn) ||
      weekStartsOn < 0 ||
      weekStartsOn > 6
    ) {
      throw new RangeError(
        "Calendar: weekStartsOn must be a weekday from 0 through 6.",
      );
    }
  }

  untrack(validateConfiguration);
  const dir = useDirection(() => props.dir);
  const id = createUniqueId();
  const headingId = `${id}-heading`;
  const gridId = `${id}-grid`;
  const initialValue = untrack(() => props.defaultValue ?? null);
  const initialDate = untrack(
    () =>
      (props.value !== undefined ? props.value : initialValue) ?? props.today,
  );
  const initialMonth = untrack(
    () => props.defaultViewMonth ?? monthOf(initialDate),
  );
  const boundedInitialMonth = untrack(() =>
    clampMonth(initialMonth, props.min, props.max),
  );
  const [value, requestValueRaw] = createControllableState<DateValue | null>({
    value: () => props.value,
    defaultValue: initialValue,
    get onChange() {
      return props.onValueChange;
    },
  });
  const [viewMonth, requestViewMonthRaw] = createControllableState<MonthValue>({
    value: () => props.viewMonth,
    defaultValue: boundedInitialMonth,
    get onChange() {
      return props.onViewMonthChange;
    },
  });
  const initialCursor = untrack(() =>
    initialEntry(
      value(),
      viewMonth(),
      props.today,
      props.min,
      props.max,
      props.weekStartsOn ?? 0,
    ),
  );
  const [cursorValue, setCursorValue] = createSignal<DateValue | null>(
    initialCursor,
  );
  const cursor: Accessor<DateValue | null> = cursorValue;
  const [focusIntent, setFocusIntent] = createSignal<FocusIntent | null>(null);
  const [focusWithin, setFocusWithinValue] = createSignal(false);
  const dayNodes = new Map<DateValue, HTMLButtonElement>();
  let gridNode: HTMLElement | undefined;
  let blurTicket = 0,
    blurPending = false,
    disposed = false;
  const [gridVersion, setGridVersion] = createSignal(0);

  const isInBounds = (date: DateValue): boolean =>
    isDateWithinBounds(date, props.min, props.max);
  const isUnavailable = (date: DateValue): boolean =>
    !isInBounds(date) || (props.isDateUnavailable?.(date) ?? false);
  const isToday = (date: DateValue): boolean => date === props.today;
  const isSelected = (date: DateValue): boolean => value() === date;
  const isOutsideMonth = (date: DateValue): boolean =>
    monthOf(date) !== viewMonth();
  const labelDateFormatter = createMemo(
    () =>
      new Intl.DateTimeFormat(props.locale ?? "en-US", {
        calendar: "gregory",
        timeZone: "UTC",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
  );
  const labelDayFormatter = createMemo(
    () =>
      new Intl.DateTimeFormat(props.locale ?? "en-US", {
        calendar: "gregory",
        timeZone: "UTC",
        day: "numeric",
      }),
  );
  const labelMonthFormatter = createMemo(
    () =>
      new Intl.DateTimeFormat(props.locale ?? "en-US", {
        calendar: "gregory",
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }),
  );
  const shortWeekdayFormatter = createMemo(
    () =>
      new Intl.DateTimeFormat(props.locale ?? "en-US", {
        calendar: "gregory",
        timeZone: "UTC",
        weekday: "short",
      }),
  );
  const longWeekdayFormatter = createMemo(
    () =>
      new Intl.DateTimeFormat(props.locale ?? "en-US", {
        calendar: "gregory",
        timeZone: "UTC",
        weekday: "long",
      }),
  );
  untrack(labelDateFormatter);
  const labelDate = (date: DateValue): string =>
    labelDateFormatter().format(utcDate(date));
  const labelDay = (date: DateValue): string =>
    labelDayFormatter().format(utcDate(date));
  const labelMonth = (): string =>
    labelMonthFormatter().format(utcDate(`${viewMonth()}-01`));
  const weekdayLabels = createMemo(() => {
    const firstWeekday: WeekdayIndex = props.weekStartsOn ?? 0;
    const weekdays: {
      readonly index: WeekdayIndex;
      readonly shortLabel: string;
      readonly longLabel: string;
    }[] = [];
    for (let offset = 0; offset < 7; offset++) {
      const index = ((firstWeekday + offset) % 7) as WeekdayIndex;
      const date = utcWeekdayDate(index);
      weekdays.push({
        index,
        shortLabel: shortWeekdayFormatter().format(date),
        longLabel: longWeekdayFormatter().format(date),
      });
    }
    return weekdays;
  });
  const weekdayLabel = (index: WeekdayIndex) =>
    weekdayLabels().find((weekday) => weekday.index === index)!;

  function setCursor(date: DateValue | null): void {
    setCursorValue(() => date);
  }

  function requestedMonth(month: MonthValue): void {
    assertMonth(month);
    requestViewMonthRaw(
      props.viewMonth === undefined
        ? clampMonth(month, props.min, props.max)
        : month,
    );
  }

  function dayInBoundsInMonth(
    month: MonthValue,
    preferredDay: number,
    dates: readonly (DateValue | null)[],
    min: DateValue | undefined,
    max: DateValue | undefined,
  ): DateValue | null {
    let nearestInMonth: DateValue | null = null,
      nearestMonthDistance = Infinity;
    let nearestAdjacent: DateValue | null = null,
      nearestAdjacentDistance = Infinity;
    for (const date of dates) {
      if (date === null || !isDateWithinBounds(date, min, max)) continue;
      const distance = Math.abs(Number(date.slice(8)) - preferredDay);
      if (monthOf(date) === month) {
        if (distance < nearestMonthDistance) {
          nearestInMonth = date;
          nearestMonthDistance = distance;
        }
      } else if (distance < nearestAdjacentDistance) {
        nearestAdjacent = date;
        nearestAdjacentDistance = distance;
      }
    }
    return nearestInMonth ?? nearestAdjacent;
  }

  function repairCursor(
    month: MonthValue,
    previous: DateValue | null,
    dates: readonly (DateValue | null)[],
    min: DateValue | undefined,
    max: DateValue | undefined,
  ): DateValue | null {
    if (
      previous &&
      monthOf(previous) === month &&
      isDateWithinBounds(previous, min, max)
    )
      return previous;
    const preferredDay = previous ? Number(previous.slice(8)) : 1;
    return dayInBoundsInMonth(month, preferredDay, dates, min, max);
  }

  function resolveFocusIntent(intent: FocusIntent): boolean {
    if (props.disabled || (intent.kind !== "entry" && !focusWithin()))
      return false;
    if (intent.date === null) {
      const grid = gridNode;
      if (!grid?.isConnected) return false;
      focus(grid);
      const focused = grid.ownerDocument.activeElement === grid;
      if (focused) setFocusIntent(null);
      return focused;
    }
    if (intent.kind === "navigation" && monthOf(intent.date) !== viewMonth())
      return false;
    const node = dayNodes.get(intent.date),
      grid = gridNode;
    if (!node?.isConnected || !grid?.isConnected || !grid.contains(node))
      return false;
    if (intent.kind === "navigation") setCursor(intent.date);
    focus(node);
    const focused = node.ownerDocument.activeElement === node;
    if (focused) setFocusIntent(null);
    return focused;
  }

  function requestFocus(intent: FocusIntent): void {
    setFocusIntent(intent);
    if (intent.kind === "entry" && intent.date !== null) setCursor(intent.date);
    untrack(() => resolveFocusIntent(intent));
  }

  function registerDay(date: DateValue, node: HTMLButtonElement): () => void {
    dayNodes.set(date, node);
    const intent = untrack(focusIntent);
    if (intent?.date === date) untrack(() => resolveFocusIntent(intent));
    return () => {
      if (dayNodes.get(date) === node) dayNodes.delete(date);
    };
  }

  function moveFocus(date: DateValue): void {
    if (props.disabled || !isInBounds(date)) return;
    const month = monthOf(date);
    requestFocus({ date, kind: "navigation" });
    if (month !== viewMonth()) requestedMonth(month);
  }

  function focusEntry(): void {
    untrack(() => {
      if (props.disabled) return;
      const month = viewMonth();
      const selected = value();
      const min = props.min,
        max = props.max;
      const displayedDates = monthGrid(month, props.weekStartsOn ?? 0);
      const displayedAndInBounds = (date: DateValue) =>
        displayedDates.includes(date) && isDateWithinBounds(date, min, max);
      const selectedEntry =
        selected && displayedAndInBounds(selected) ? selected : null;
      const todayEntry = displayedAndInBounds(props.today) ? props.today : null;
      const entry =
        selectedEntry ??
        todayEntry ??
        dayInBoundsInMonth(month, 1, displayedDates, min, max);
      if (entry === null) setCursor(null);
      requestFocus({ date: entry, kind: "entry" });
    });
  }

  function setFocusWithin(value: boolean): void {
    blurTicket++;
    blurPending = false;
    setFocusWithinValue(value);
    if (!value) setFocusIntent(null);
  }

  function handleGridFocusOut(
    grid: HTMLElement,
    target: HTMLElement,
    relatedTarget: Node | null,
  ): void {
    if (relatedTarget && grid.contains(relatedTarget)) return;
    if (relatedTarget) {
      setFocusWithin(false);
      return;
    }
    if (blurPending) return;
    blurPending = true;
    const ticket = ++blurTicket;
    queueMicrotask(() => {
      if (disposed || ticket !== blurTicket) return;
      blurPending = false;
      const active = grid.ownerDocument.activeElement,
        currentGrid = gridNode;
      if (currentGrid?.isConnected && currentGrid.contains(active)) {
        setFocusWithinValue(true);
        const intent = untrack(focusIntent);
        if (intent) untrack(() => resolveFocusIntent(intent));
        return;
      }
      const replaced =
        !target.isConnected || !grid.isConnected || currentGrid !== grid;
      if (replaced && active === grid.ownerDocument.body) {
        setFocusWithinValue(true);
        let intent = untrack(focusIntent);
        if (!intent) {
          intent = { date: untrack(cursor), kind: "reconcile" };
          setFocusIntent(intent);
        }
        untrack(() => resolveFocusIntent(intent));
        return;
      }
      setFocusWithin(false);
    });
  }

  const owner = getOwner();
  if (owner)
    onCleanup(() => {
      disposed = true;
      blurTicket++;
      blurPending = false;
    });

  function isMonthInBounds(month: MonthValue): boolean {
    const minimum = props.min ? monthOf(props.min) : undefined;
    const maximum = props.max ? monthOf(props.max) : undefined;
    return (!minimum || month >= minimum) && (!maximum || month <= maximum);
  }

  function canNavigate(delta: -1 | 1): boolean {
    if (props.disabled) return false;
    const current = viewMonth();
    const minMonth = props.min ? monthOf(props.min) : undefined;
    const maxMonth = props.max ? monthOf(props.max) : undefined;
    if (minMonth && current < minMonth) return delta > 0;
    if (maxMonth && current > maxMonth) return delta < 0;
    const target = monthOf(addMonths(`${current}-01`, delta));
    if (target === current) return false;
    return isMonthInBounds(target);
  }

  function navigateMonth(delta: -1 | 1): void {
    if (!canNavigate(delta)) return;
    const current = viewMonth();
    const minMonth = props.min ? monthOf(props.min) : undefined;
    const maxMonth = props.max ? monthOf(props.max) : undefined;
    if (minMonth && current < minMonth && delta > 0) {
      requestedMonth(minMonth);
      return;
    }
    if (maxMonth && current > maxMonth && delta < 0) {
      requestedMonth(maxMonth);
      return;
    }
    requestedMonth(monthOf(addMonths(`${current}-01`, delta)));
  }

  const state: CalendarStateInternal = {
    props,
    value,
    viewMonth,
    cursor,
    requestValue(next) {
      if (next !== null) assertDate(next);
      requestValueRaw(next);
    },
    requestViewMonth: requestedMonth,
    commit(date) {
      assertDate(date);
      if (props.disabled || props.readOnly || isUnavailable(date)) return;
      if (monthOf(date) !== viewMonth()) requestedMonth(monthOf(date));
      requestValueRaw(date);
      options?.onCommit?.(date);
    },
    focusEntry,
    dir,
    disabled: () => props.disabled ?? false,
    readOnly: () => props.readOnly ?? false,
    id,
    headingId,
    gridId,
    isUnavailable,
    isInBounds,
    isToday,
    isSelected,
    isOutsideMonth,
    labelDate,
    labelDay,
    labelMonth,
    weekdayLabels: () => weekdayLabels(),
    weekdayLabel,
    canNavigate,
    navigateMonth,
    moveFocus,
    setCursorFromFocus(date) {
      setCursor(date);
      setFocusIntent(null);
    },
    dayTabIndex(date) {
      return !props.disabled && cursor() === date ? 0 : -1;
    },
    registerGrid(node) {
      gridNode = node;
      setGridVersion((version) => version + 1);
      return () => {
        if (gridNode === node) {
          gridNode = undefined;
          setGridVersion((version) => version + 1);
        }
      };
    },
    registerDay,
    setFocusWithin,
    handleGridFocusOut,
  };
  if (!isServer)
    createEffect(
      () =>
        [
          focusIntent(),
          focusWithin(),
          props.disabled,
          gridVersion(),
          viewMonth(),
        ] as const,
      ([intent, within, disabled]) => {
        if (!intent) return;
        if (disabled) {
          setFocusIntent(null);
          return;
        }
        if (intent.kind !== "entry" && !within) return;
        untrack(() => resolveFocusIntent(intent));
      },
      { transparent: true },
    );

  let observedMonth = untrack(viewMonth);
  let observedMin = untrack(() => props.min);
  let observedMax = untrack(() => props.max);
  let observedWeekStartsOn = untrack(() => props.weekStartsOn ?? 0);
  if (!isServer)
    createEffect(
      () => {
        validateConfiguration();
        labelDateFormatter();
        const month = viewMonth();
        const min = props.min,
          max = props.max;
        const weekStartsOn = props.weekStartsOn ?? 0;
        const boundedMonth =
          props.viewMonth === undefined ? clampMonth(month, min, max) : month;
        return { month, min, max, boundedMonth, weekStartsOn };
      },
      {
        effect: ({
          month: snapshotMonth,
          min,
          max,
          boundedMonth,
          weekStartsOn,
        }) => {
          let month = snapshotMonth;
          if (boundedMonth !== month) {
            untrack(() => requestedMonth(boundedMonth));
            month = untrack(viewMonth);
            if (month !== boundedMonth) return;
          }
          const displayedGridChanged =
            month !== observedMonth || weekStartsOn !== observedWeekStartsOn;
          if (
            displayedGridChanged ||
            min !== observedMin ||
            max !== observedMax
          ) {
            const previousCursor = untrack(cursor);
            const intent = untrack(focusIntent);
            const dates = monthGrid(month, weekStartsOn);
            const navigationDate =
              intent?.kind === "navigation" &&
              intent.date !== null &&
              monthOf(intent.date) === month &&
              isDateWithinBounds(intent.date, min, max)
                ? intent.date
                : null;
            const entryDate =
              intent?.kind === "entry" &&
              intent.date !== null &&
              dates.includes(intent.date) &&
              isDateWithinBounds(intent.date, min, max)
                ? intent.date
                : null;
            const nextCursor =
              navigationDate ??
              entryDate ??
              untrack(() =>
                repairCursor(month, previousCursor, dates, min, max),
              );
            const monthChanged = month !== observedMonth;
            const intentCompatible =
              intent !== null &&
              (intent.date === null
                ? nextCursor === null
                : isDateWithinBounds(intent.date, min, max) &&
                  (!displayedGridChanged || dates.includes(intent.date)) &&
                  (!monthChanged ||
                    intent.kind !== "navigation" ||
                    monthOf(intent.date) === month));
            observedMonth = month;
            observedMin = min;
            observedMax = max;
            observedWeekStartsOn = weekStartsOn;
            setCursor(nextCursor);
            if (intent && !intentCompatible) setFocusIntent(null);
            if (untrack(focusWithin) && !untrack(() => props.disabled)) {
              if (
                !intentCompatible ||
                (intent?.kind === "reconcile" && intent.date !== nextCursor) ||
                (intent?.date === null && nextCursor !== null)
              ) {
                setFocusIntent({ date: nextCursor, kind: "reconcile" });
              }
            }
          }
        },
        error: (error) => {
          throw error;
        },
      },
      { transparent: true },
    );
  return state;
}

export function CalendarStateProvider(props: {
  state: CalendarState;
  scope?: Scope;
  children?: Element;
}): Element {
  const state = untrack(() => props.state as CalendarStateInternal);
  return (
    <CalendarProvider
      value={state}
      scope={props.scope}
    >
      {props.children}
    </CalendarProvider>
  );
}

export function Calendar(props: CalendarProps): Element {
  const scope = untrack(() => props.__scopeCalendar);
  const state = createCalendarState(props) as CalendarStateInternal;
  const forwarded = merge(
    {
      get dir() {
        return state.dir();
      },
      get ["data-disabled"]() {
        return state.disabled() ? "" : undefined;
      },
      get ["data-readonly"]() {
        return state.readOnly() ? "" : undefined;
      },
      get ref() {
        return props.ref;
      },
    },
    omit(
      props,
      "__scopeCalendar",
      "value",
      "defaultValue",
      "onValueChange",
      "viewMonth",
      "defaultViewMonth",
      "onViewMonthChange",
      "today",
      "locale",
      "weekStartsOn",
      "dir",
      "min",
      "max",
      "isDateUnavailable",
      "disabled",
      "readOnly",
      "ref",
    ),
  );
  return (
    <CalendarStateProvider
      state={state}
      scope={scope}
    >
      <Primitive
        as="div"
        {...forwarded}
      />
    </CalendarStateProvider>
  );
}

export type CalendarHeaderProps = PrimitiveProps<"div"> & {
  __scopeCalendar?: Scope;
};
export function CalendarHeader(props: CalendarHeaderProps): Element {
  useCalendar(
    "CalendarHeader",
    untrack(() => props.__scopeCalendar),
  );
  const forwarded = merge(
    { "data-calendar-header": "" },
    omit(props, "__scopeCalendar"),
  );
  return (
    <Primitive
      as="div"
      {...forwarded}
    />
  );
}

export type CalendarHeadingProps = PrimitiveProps<"h2"> & {
  __scopeCalendar?: Scope;
};
export function CalendarHeading(props: CalendarHeadingProps): Element {
  const state = useCalendar(
    "CalendarHeading",
    untrack(() => props.__scopeCalendar),
  );
  const forwarded = merge(
    omit(
      props,
      "__scopeCalendar",
      "id",
      "aria-live",
      "aria-atomic",
      "children",
    ),
    {
      id: state.headingId,
      "aria-live": "polite" as const,
      "aria-atomic": "true" as const,
      get children() {
        return props.children ?? state.labelMonth();
      },
    },
  ) as PrimitiveProps<"h2">;
  return (
    <Primitive
      as="h2"
      {...forwarded}
    />
  );
}

export type CalendarPrevTriggerProps = PrimitiveProps<"button"> & {
  __scopeCalendar?: Scope;
};
export function CalendarPrevTrigger(props: CalendarPrevTriggerProps): Element {
  const state = useCalendar(
    "CalendarPrevTrigger",
    untrack(() => props.__scopeCalendar),
  );
  const disabled = () =>
    props.disabled === true || state.disabled() || !state.canNavigate(-1);
  const forwarded = merge(
    omit(props, "__scopeCalendar", "onClick", "disabled"),
    {
      get type() {
        return props.type ?? "button";
      },
      get disabled() {
        return disabled();
      },
      get ["data-disabled"]() {
        return disabled() ? "" : undefined;
      },
      onClick: composeEventHandlers<MouseEvent>(
        () => props.onClick,
        () => state.navigateMonth(-1),
      ),
    },
  ) as PrimitiveProps<"button">;
  return (
    <Primitive
      as="button"
      {...forwarded}
    />
  );
}

export type CalendarNextTriggerProps = PrimitiveProps<"button"> & {
  __scopeCalendar?: Scope;
};
export function CalendarNextTrigger(props: CalendarNextTriggerProps): Element {
  const state = useCalendar(
    "CalendarNextTrigger",
    untrack(() => props.__scopeCalendar),
  );
  const disabled = () =>
    props.disabled === true || state.disabled() || !state.canNavigate(1);
  const forwarded = merge(
    omit(props, "__scopeCalendar", "onClick", "disabled"),
    {
      get type() {
        return props.type ?? "button";
      },
      get disabled() {
        return disabled();
      },
      get ["data-disabled"]() {
        return disabled() ? "" : undefined;
      },
      onClick: composeEventHandlers<MouseEvent>(
        () => props.onClick,
        () => state.navigateMonth(1),
      ),
    },
  ) as PrimitiveProps<"button">;
  return (
    <Primitive
      as="button"
      {...forwarded}
    />
  );
}

export type CalendarGridProps = Omit<
  PrimitiveProps<"div">,
  "children" | "asChild"
> & { __scopeCalendar?: Scope } & (
    | { asChild: true; children: SlotRender }
    | {
        asChild?: false;
        children?: Element | ((state: CalendarGridState) => Element);
      }
  );
export function CalendarGrid(props: CalendarGridProps): Element {
  const state = useCalendar(
    "CalendarGrid",
    untrack(() => props.__scopeCalendar),
  );
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer)
    createEffect(
      node,
      (element) =>
        element ? untrack(() => state.registerGrid(element)) : undefined,
      { transparent: true },
    );
  const weekdays = createMemo(() => state.weekdayLabels());
  const weeks = createMemo(() => {
    const dates = monthGrid(state.viewMonth(), state.props.weekStartsOn ?? 0);
    const weeks: (CalendarGridDay | null)[][] = [];
    for (let row = 0; row < 6; row++) {
      const week: (CalendarGridDay | null)[] = [];
      for (let column = 0; column < 7; column++) {
        const date = dates[row * 7 + column]!;
        week.push(
          date === null
            ? null
            : {
                date,
                get label() {
                  return state.labelDay(date);
                },
                get selected() {
                  return state.isSelected(date);
                },
                get today() {
                  return state.isToday(date);
                },
                get unavailable() {
                  return state.isUnavailable(date);
                },
                get outsideMonth() {
                  return state.isOutsideMonth(date);
                },
              },
        );
      }
      weeks.push(week);
    }
    return weeks;
  });
  const gridState: CalendarGridState = {
    get weekdays() {
      return weekdays();
    },
    get weeks() {
      return weeks();
    },
  };
  const focusIn = composeEventHandlers<FocusEvent>(
    () => props.onFocusIn,
    () => state.setFocusWithin(true),
  );
  const focusOut = composeEventHandlers<FocusEvent>(
    () => props.onFocusOut,
    (event) =>
      state.handleGridFocusOut(
        event.currentTarget as HTMLElement,
        event.target as HTMLElement,
        event.relatedTarget as Node | null,
      ),
  );
  const handleFocusIn = (event: FocusEvent) => untrack(() => focusIn(event));
  const handleFocusOut = (event: FocusEvent) => untrack(() => focusOut(event));
  const forwarded = merge(
    omit(
      props,
      "__scopeCalendar",
      "children",
      "ref",
      "tabindex",
      "id",
      "role",
      "aria-labelledby",
      "onFocusIn",
      "onFocusOut",
    ),
    {
      role: "grid" as const,
      id: state.gridId,
      "aria-labelledby": state.headingId,
      get tabindex() {
        return state.disabled()
          ? -1
          : state.cursor() === null
            ? 0
            : props.tabindex;
      },
      get ref() {
        return composeRefs(props.ref, ref);
      },
      onFocusIn: handleFocusIn,
      onFocusOut: handleFocusOut,
      get children() {
        if (props.asChild) return props.children;
        const children = props.children as
          | Element
          | ((state: CalendarGridState) => Element)
          | undefined;
        return typeof children === "function" ? children(gridState) : children;
      },
    },
  ) as PrimitiveProps<"div">;
  return (
    <Primitive
      as="div"
      {...forwarded}
    />
  );
}

export type CalendarRowProps = PrimitiveProps<"div"> & {
  __scopeCalendar?: Scope;
};
export function CalendarRow(props: CalendarRowProps): Element {
  useCalendar(
    "CalendarRow",
    untrack(() => props.__scopeCalendar),
  );
  const forwarded = merge(
    { role: "row" as const },
    omit(props, "__scopeCalendar"),
  );
  return (
    <Primitive
      as="div"
      {...forwarded}
    />
  );
}

export type CalendarHeaderCellProps = Omit<
  PrimitiveProps<"div">,
  "children" | "asChild"
> & { __scopeCalendar?: Scope; weekday: WeekdayIndex } & (
    | { asChild: true; children: SlotRender }
    | { asChild?: false; children?: Element }
  );
export function CalendarHeaderCell(props: CalendarHeaderCellProps): Element {
  const state = useCalendar(
    "CalendarHeaderCell",
    untrack(() => props.__scopeCalendar),
  );
  const weekday = () => state.weekdayLabel(props.weekday);
  const forwarded = merge(
    omit(props, "__scopeCalendar", "weekday", "children", "role", "aria-label"),
    {
      role: "columnheader" as const,
      get ["aria-label"]() {
        return weekday().longLabel;
      },
      get children() {
        return props.children ?? weekday().shortLabel;
      },
    },
  ) as PrimitiveProps<"div">;
  return (
    <Primitive
      as="div"
      {...forwarded}
    />
  );
}

export type CalendarCellProps = PrimitiveProps<"div"> & {
  __scopeCalendar?: Scope;
  date: DateValue;
};
export function CalendarCell(props: CalendarCellProps): Element {
  const state = useCalendar(
    "CalendarCell",
    untrack(() => props.__scopeCalendar),
  );
  untrack(() => assertDate(props.date));
  const forwarded = merge(
    omit(props, "__scopeCalendar", "date", "role", "aria-selected"),
    {
      role: "gridcell" as const,
      get ["aria-selected"]() {
        return state.isSelected(props.date)
          ? ("true" as const)
          : ("false" as const);
      },
      get ["data-selected"]() {
        return state.isSelected(props.date) ? "" : undefined;
      },
      get ["data-today"]() {
        return state.isToday(props.date) ? "" : undefined;
      },
      get ["data-disabled"]() {
        return state.isUnavailable(props.date) || state.disabled()
          ? ""
          : undefined;
      },
      get ["data-outside-month"]() {
        return state.isOutsideMonth(props.date) ? "" : undefined;
      },
    },
  ) as PrimitiveProps<"div">;
  return (
    <Primitive
      as="div"
      {...forwarded}
    />
  );
}

export type CalendarDayProps = Omit<
  PrimitiveProps<"button">,
  "children" | "asChild"
> & { __scopeCalendar?: Scope; date: DateValue } & (
    | { asChild: true; children: SlotRender }
    | { asChild?: false; children?: Element }
  );
export function CalendarDay(props: CalendarDayProps): Element {
  const state = useCalendar(
    "CalendarDay",
    untrack(() => props.__scopeCalendar),
  );
  untrack(() => assertDate(props.date));
  const [node, ref] = createSignal<HTMLButtonElement | undefined>();
  if (!isServer)
    createEffect(
      node,
      (element) =>
        element
          ? untrack(() => state.registerDay(props.date, element))
          : undefined,
      { transparent: true },
    );
  const unavailable = () => state.isUnavailable(props.date);
  const blocked = () =>
    state.disabled() || props.disabled === true || unavailable();
  const forwarded = merge(
    omit(
      props,
      "__scopeCalendar",
      "date",
      "children",
      "type",
      "disabled",
      "aria-label",
      "aria-current",
      "aria-disabled",
      "tabindex",
      "ref",
      "onFocus",
      "onClick",
      "onKeyDown",
    ),
    {
      get type() {
        return props.type ?? "button";
      },
      get disabled() {
        return state.disabled() || props.disabled === true;
      },
      get "aria-label"() {
        return state.labelDate(props.date);
      },
      get ["aria-current"]() {
        return state.isToday(props.date) ? ("date" as const) : undefined;
      },
      get ["aria-disabled"]() {
        return blocked() ? ("true" as const) : undefined;
      },
      get tabindex() {
        return blocked() && (state.disabled() || props.disabled === true)
          ? -1
          : state.dayTabIndex(props.date);
      },
      get ["data-selected"]() {
        return state.isSelected(props.date) ? "" : undefined;
      },
      get ["data-today"]() {
        return state.isToday(props.date) ? "" : undefined;
      },
      get ["data-disabled"]() {
        return blocked() ? "" : undefined;
      },
      get ["data-outside-month"]() {
        return state.isOutsideMonth(props.date) ? "" : undefined;
      },
      get ref() {
        return composeRefs(props.ref, ref);
      },
      onFocus: composeEventHandlers<FocusEvent>(
        () => props.onFocus,
        () => state.setCursorFromFocus(props.date),
      ),
      onClick: composeEventHandlers<MouseEvent>(
        () => props.onClick,
        () => {
          if (!props.disabled) state.commit(props.date);
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        () => props.onKeyDown,
        (event) => handleDayKeyDown(event, state, props.date),
      ),
      get children() {
        return props.children ?? state.labelDay(props.date);
      },
    },
  ) as PrimitiveProps<"button">;
  return (
    <Primitive
      as="button"
      {...forwarded}
    />
  );
}

function handleDayKeyDown(
  event: KeyboardEvent,
  state: CalendarStateInternal,
  date: DateValue,
): void {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.keyCode === 229 ||
    state.disabled() ||
    event.target !== event.currentTarget
  )
    return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const shift = event.shiftKey;
  if (shift && event.key !== "PageUp" && event.key !== "PageDown") return;
  let next: DateValue | undefined;
  if (event.key === "ArrowRight")
    next = addDays(date, state.dir() === "rtl" ? -1 : 1);
  else if (event.key === "ArrowLeft")
    next = addDays(date, state.dir() === "rtl" ? 1 : -1);
  else if (event.key === "ArrowDown") next = addDays(date, 7);
  else if (event.key === "ArrowUp") next = addDays(date, -7);
  else if (event.key === "Home" || event.key === "End") {
    const weekday = weekdayOf(date);
    const weekStartsOn = state.props.weekStartsOn ?? 0;
    const offset = (weekday - weekStartsOn + 7) % 7;
    next = addDays(date, event.key === "Home" ? -offset : 6 - offset);
  } else if (event.key === "PageUp" || event.key === "PageDown") {
    const direction = event.key === "PageUp" ? -1 : 1;
    next = addMonths(date, direction * (shift ? 12 : 1));
  } else return;
  event.preventDefault();
  if (state.isInBounds(next)) state.moveFocus(next);
}

function isDateWithinBounds(
  date: DateValue,
  min: DateValue | undefined,
  max: DateValue | undefined,
): boolean {
  return (
    (min === undefined || date >= min) && (max === undefined || date <= max)
  );
}

function clampMonth(
  month: MonthValue,
  min?: DateValue,
  max?: DateValue,
): MonthValue {
  const minimum = min ? monthOf(min) : undefined;
  const maximum = max ? monthOf(max) : undefined;
  return minimum && month < minimum
    ? minimum
    : maximum && month > maximum
      ? maximum
      : month;
}

function initialEntry(
  value: DateValue | null,
  month: MonthValue,
  today: DateValue,
  min: DateValue | undefined,
  max: DateValue | undefined,
  weekStartsOn: WeekdayIndex,
): DateValue | null {
  const dates = monthGrid(month, weekStartsOn);
  const inBounds = (date: DateValue) =>
    (min === undefined || date >= min) && (max === undefined || date <= max);
  const displayedAndInBounds = (date: DateValue) =>
    dates.includes(date) && inBounds(date);
  if (value && displayedAndInBounds(value)) return value;
  if (displayedAndInBounds(today)) return today;
  let firstAdjacent: DateValue | null = null;
  for (const date of dates) {
    if (date === null || !inBounds(date)) continue;
    if (monthOf(date) === month) return date;
    firstAdjacent ??= date;
  }
  return firstAdjacent;
}

function utcDate(date: DateValue): Date {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(0);
  value.setUTCFullYear(year!, month! - 1, day!);
  value.setUTCHours(12, 0, 0, 0);
  return value;
}

function utcWeekdayDate(index: WeekdayIndex): Date {
  const value = new Date(0);
  value.setUTCFullYear(2026, 10, 1 + index);
  value.setUTCHours(12, 0, 0, 0);
  return value;
}
