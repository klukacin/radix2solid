import { isServer } from "@solidjs/web";
import {
  createEffect,
  createMemo,
  createSignal,
  merge,
  omit,
  onCleanup,
  untrack,
  type Accessor,
  type Element,
} from "solid-js";

import {
  createCalendarScope,
  createCalendarState,
  CalendarStateProvider,
  type CalendarProps,
  type CalendarState,
  type DateValue,
  type MonthValue,
} from "../calendar/calendar.js";
import { monthOf } from "../calendar/date.js";
import {
  createContextScope,
  type Scope,
  type CreateScope,
} from "../internal/context.js";
import { composeEventHandlers, callEventHandler } from "../internal/events.js";
import { focus } from "../internal/focus-scope.js";
import {
  useFormValidityOwner,
  useFormFieldMetadata,
  type FormValidityOwner,
} from "../internal/form-validity.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import {
  createPopoverScope,
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  usePopoverContext,
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverPortalProps,
  type PopoverContentProps,
  type PopoverTitleProps,
  type PopoverDescriptionProps,
  type PopoverCloseProps,
} from "../popover/popover.js";
import {
  concatAriaIds,
  type SlotRender,
  type SlotTarget,
} from "../slot/slot.js";

const [createDatePickerContext, makeDatePickerScope] = createContextScope(
  "DatePicker",
  [createCalendarScope, createPopoverScope],
);
const [DatePickerProvider, useDatePicker] =
  createDatePickerContext<DatePickerContext>("DatePicker");
export const createDatePickerScope: CreateScope = makeDatePickerScope;

type DatePickerCalendarState = CalendarState & {
  dir(): "ltr" | "rtl";
  labelDate(date: DateValue): string;
};
type DatePickerBridgeMetadata = {
  node: HTMLInputElement;
  invalid: boolean;
  formInvalid: boolean;
  describedBy?: string;
};

function hasDataInvalid(value: unknown): boolean {
  return value !== undefined && value !== null && value !== false;
}
function revealFocusedElement(
  content: HTMLElement | undefined,
  target: EventTarget | null,
): void {
  const focused = target as HTMLElement | null;
  if (
    !content ||
    !focused ||
    typeof focused.getBoundingClientRect !== "function" ||
    !content.contains(focused) ||
    content.clientHeight === 0 ||
    content.scrollHeight <= content.clientHeight
  )
    return;
  const contentRect = content.getBoundingClientRect();
  const scaleY = contentRect.height / content.offsetHeight;
  if (!Number.isFinite(scaleY) || scaleY <= 0) return;
  const visibleTop = contentRect.top + content.clientTop * scaleY;
  const visibleBottom = visibleTop + content.clientHeight * scaleY;
  const focusedRect = focused.getBoundingClientRect();
  if (focusedRect.top < visibleTop)
    content.scrollTop -= (visibleTop - focusedRect.top) / scaleY;
  else if (focusedRect.bottom > visibleBottom)
    content.scrollTop += (focusedRect.bottom - visibleBottom) / scaleY;
}
const datePickerFocusOwner = Symbol("DatePicker.focusOwner");
type DatePickerFocusEvent = FocusEvent & { [datePickerFocusOwner]?: boolean };

function handleDatePickerContentFocus(
  content: HTMLDivElement | undefined,
  event: FocusEvent,
  consumer: unknown,
): void {
  const focusEvent = event as DatePickerFocusEvent;
  const alreadyOwned = focusEvent[datePickerFocusOwner] === true;
  focusEvent[datePickerFocusOwner] = true;
  callEventHandler(consumer, event);
  if (!alreadyOwned && !event.defaultPrevented)
    revealFocusedElement(content, event.target);
}

type DatePickerContext = {
  state: DatePickerCalendarState;
  props: DatePickerProps;
  open: Accessor<boolean>;
  setOpen(open: boolean): void;
  setTrigger(node: HTMLButtonElement | undefined): void;
  trigger(): HTMLButtonElement | undefined;
  requestUserValue(value: DateValue | null): void;
  setBridge(
    node: HTMLInputElement | undefined,
    owner: FormValidityOwner | null,
  ): void;
  bridgeMetadata(): DatePickerBridgeMetadata | undefined;
  setBridgeMetadata(
    node: HTMLInputElement,
    metadata: Omit<DatePickerBridgeMetadata, "node"> | undefined,
  ): void;
  resetTo(value: DateValue | null): void;
  revision: Accessor<number>;
  content(): HTMLDivElement | undefined;
  setContent(node: HTMLDivElement | undefined): void;
  clearContent(node: HTMLDivElement): void;
};
type DatePickerProjection = {
  value: DateValue | null;
  min: DatePickerProps["min"];
  max: DatePickerProps["max"];
  unavailable: DatePickerProps["isDateUnavailable"];
  unavailableForValue: boolean;
  baseline: string;
};

type Without<P, K extends PropertyKey> = P extends unknown ? Omit<P, K> : never;
export type DatePickerProps = Without<CalendarProps, "__scopeCalendar"> & {
  __scopeDatePicker?: Scope;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  name?: string;
  form?: string;
  required?: boolean;
};
type DatePickerHostProps = Without<
  DatePickerProps,
  | "__scopeDatePicker"
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "viewMonth"
  | "defaultViewMonth"
  | "onViewMonthChange"
  | "today"
  | "locale"
  | "weekStartsOn"
  | "dir"
  | "min"
  | "max"
  | "isDateUnavailable"
  | "disabled"
  | "readOnly"
  | "open"
  | "defaultOpen"
  | "onOpenChange"
  | "modal"
  | "name"
  | "form"
  | "required"
>;

export function DatePicker(props: DatePickerProps): Element {
  const scope = untrack(() => props.__scopeDatePicker);
  const popoverProps = merge(
    omit(
      props,
      "__scopeDatePicker",
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
      "name",
      "form",
      "required",
      "open",
      "defaultOpen",
      "onOpenChange",
      "children",
      "asChild",
    ),
    {
      get __scopePopover() {
        return scope;
      },
      get open() {
        return props.open;
      },
      get defaultOpen() {
        return props.defaultOpen;
      },
      get onOpenChange() {
        return props.onOpenChange;
      },
      get modal() {
        return props.modal;
      },
    },
  ) as PopoverProps;
  return (
    <Popover {...popoverProps}>
      <DatePickerState
        props={props}
        scope={scope}
      />
    </Popover>
  );
}

function DatePickerState(props: {
  props: DatePickerProps;
  scope?: Scope;
}): Element {
  const root = untrack(() => props.props);
  const popover = usePopoverContext(
    { __scopePopover: untrack(() => props.scope) },
    "DatePicker",
  );
  const [bridgeNode, setBridgeNode] = createSignal<
    HTMLInputElement | undefined
  >();
  const [bridgeMetadataState, setBridgeMetadataState] = createSignal<
    DatePickerBridgeMetadata | undefined
  >();
  let contentNode: HTMLDivElement | undefined;
  const refreshBridgeValidity = (node: HTMLInputElement) => {
    if (!isServer)
      setBridgeMetadataState((current) =>
        current?.node === node
          ? { ...current, invalid: current.formInvalid || !node.validity.valid }
          : current,
      );
  };
  let bridge: HTMLInputElement | undefined;
  let bridgeOwner: FormValidityOwner | null = null;
  let unregister: (() => void) | undefined;
  let lastProjected: DateValue | null | undefined;
  let candidate:
    | { requested: DateValue | null; previous: DateValue | null }
    | undefined;
  let resetPending = false;
  let settlementQueued = false;
  let alive = true;
  let constraintSnapshot: readonly unknown[] | undefined;
  const [trigger, setTrigger] = createSignal<HTMLButtonElement | undefined>();
  let revision = 0;
  const readRevision = () => revision;
  const advanceRevision = () => {
    revision += 1;
  };
  const content = () => contentNode;
  const setContent = (node: HTMLDivElement | undefined) => {
    if (!isServer) contentNode = node;
  };
  const clearContent = (node: HTMLDivElement) => {
    if (!isServer && contentNode === node) contentNode = undefined;
  };

  const calendarProps = merge(
    omit(
      root,
      "__scopeDatePicker",
      "open",
      "defaultOpen",
      "onOpenChange",
      "modal",
      "name",
      "form",
      "required",
    ),
    {
      get onValueChange() {
        return root.onValueChange;
      },
    },
  ) as CalendarProps;
  const state = createCalendarState(calendarProps, {
    onCommit: (date) => {
      markUserRequest(date);
      popover.setOpen(false);
    },
  }) as DatePickerCalendarState;
  const projection = createMemo((): DatePickerProjection => {
    const value = state.value();
    const unavailable = state.props.isDateUnavailable;
    const unavailableForValue =
      value !== null && (unavailable?.(value) ?? false);
    return {
      value,
      min: state.props.min,
      max: state.props.max,
      unavailable,
      unavailableForValue,
      baseline: unavailableForValue ? "This date is unavailable." : "",
    };
  });
  const baseline = () => projection().baseline;
  const project = (node: HTMLInputElement, snapshot: DatePickerProjection) => {
    node.value = snapshot.value ?? "";
    if (!bridgeOwner) node.setCustomValidity(snapshot.baseline);
    refreshBridgeValidity(node);
  };
  const markUserRequest = (next: DateValue | null) => {
    candidate = { requested: next, previous: lastProjected ?? state.value() };
    queueSettlement();
  };
  const requestUserValue = (next: DateValue | null) => {
    markUserRequest(next);
    state.requestValue(next);
  };
  const dispatch = (
    node: HTMLInputElement,
    type: "input" | "change",
    bubbles: boolean,
  ) => {
    node.dispatchEvent(
      new node.ownerDocument.defaultView!.Event(type, { bubbles }),
    );
  };
  const queueSettlement = () => {
    if (settlementQueued) return;
    settlementQueued = true;
    queueMicrotask(() => {
      settlementQueued = false;
      if (!alive) return;
      const pending = candidate;
      candidate = undefined;
      const snapshot = untrack(projection);
      const accepted = snapshot.value;
      const previous = lastProjected;
      if (bridge) project(bridge, snapshot);
      lastProjected = accepted;
      let dispatchesChange = false;
      if (
        pending &&
        !resetPending &&
        pending.previous !== accepted &&
        pending.requested === accepted
      ) {
        if (bridge) {
          dispatchesChange = true;
          dispatch(bridge, "input", true);
          dispatch(bridge, "change", true);
        }
      } else if (
        !pending &&
        !resetPending &&
        previous !== undefined &&
        previous !== accepted &&
        bridge
      ) {
        dispatchesChange = true;
        dispatch(bridge, "change", false);
      }
      resetPending = false;
      if (bridgeOwner && !dispatchesChange) bridgeOwner.revalidate();
    });
  };
  const setBridge = (
    node: HTMLInputElement | undefined,
    owner: FormValidityOwner | null,
  ) => {
    if (!node) {
      const previous = bridge;
      if (previous) {
        unregister?.();
        unregister = undefined;
        bridge = undefined;
        bridgeOwner = null;
      }
      if (!isServer) {
        setBridgeNode(undefined);
        if (previous)
          setBridgeMetadataState((current) =>
            current?.node === previous ? undefined : current,
          );
      }
      return;
    }
    bridge = node;
    bridgeOwner = owner;
    setBridgeNode(node);
    if (owner && !unregister)
      unregister = owner.register({ baseline, revision: readRevision });
    const snapshot = untrack(projection);
    project(node, snapshot);
    lastProjected = snapshot.value;
  };
  const resetTo = (value: DateValue | null) => {
    resetPending = true;
    candidate = undefined;
    state.requestValue(value);
    queueSettlement();
  };
  const bridgeMetadata = (): DatePickerBridgeMetadata | undefined => {
    const metadata = bridgeMetadataState();
    return metadata?.node === bridgeNode() ? metadata : undefined;
  };
  const setBridgeMetadata = (
    node: HTMLInputElement,
    metadata: Omit<DatePickerBridgeMetadata, "node"> | undefined,
  ) => {
    if (isServer) return;
    setBridgeMetadataState((current) => {
      if (!metadata) return current?.node === node ? undefined : current;
      if (bridge !== node) return current;
      return { node, ...metadata };
    });
  };
  const context: DatePickerContext = {
    state,
    props: root,
    open: popover.open,
    setOpen: popover.setOpen,
    trigger,
    setTrigger,
    requestUserValue,
    setBridge,
    bridgeMetadata,
    setBridgeMetadata,
    resetTo,
    revision: readRevision,
    content,
    setContent,
    clearContent,
  };

  let wasOpen = false;
  let pendingEntryMonth: MonthValue | undefined;
  if (!isServer)
    createEffect(
      () =>
        [
          popover.open(),
          state.value(),
          state.viewMonth(),
          root.viewMonth,
          root.min,
          root.max,
        ] as const,
      ([opened, selected, month, controlledMonth, min, max]) => {
        if (!opened) {
          wasOpen = false;
          pendingEntryMonth = undefined;
          return;
        }
        if (!wasOpen) {
          wasOpen = true;
          if (controlledMonth === undefined && selected !== null) {
            let target = monthOf(selected);
            const minMonth = min?.slice(0, 7),
              maxMonth = max?.slice(0, 7);
            if (minMonth && target < minMonth) target = minMonth as MonthValue;
            if (maxMonth && target > maxMonth) target = maxMonth as MonthValue;
            pendingEntryMonth = target;
            untrack(() => state.requestViewMonth(target));
          } else pendingEntryMonth = month;
        }
        if (pendingEntryMonth !== undefined && month === pendingEntryMonth) {
          pendingEntryMonth = undefined;
          state.focusEntry();
        }
      },
      { transparent: true },
    );

  if (!isServer)
    createEffect(
      () => [projection(), bridgeNode()] as const,
      ([snapshot, node]) => {
        const constraints = [
          snapshot.min,
          snapshot.max,
          snapshot.unavailable,
        ] as const;
        const policyChanged =
          !constraintSnapshot ||
          constraints.some(
            (entry, index) => entry !== constraintSnapshot![index],
          );
        constraintSnapshot = constraints;
        const valueChanged = lastProjected !== snapshot.value;
        if (policyChanged || valueChanged) advanceRevision();
        if (!node) return;
        project(node, snapshot);
        const dispatchesChange =
          valueChanged &&
          lastProjected !== undefined &&
          !candidate &&
          !resetPending;
        if (dispatchesChange) dispatch(node, "change", false);
        if (valueChanged) lastProjected = snapshot.value;
        if (
          bridgeOwner &&
          (policyChanged || valueChanged) &&
          !dispatchesChange &&
          !settlementQueued
        )
          bridgeOwner.revalidate();
      },
      { transparent: true },
    );

  onCleanup(() => {
    alive = false;
    unregister?.();
    unregister = undefined;
    bridge = undefined;
    bridgeOwner = null;
    setContent(undefined);
    if (!isServer) {
      setBridgeNode(undefined);
      setBridgeMetadataState(undefined);
    }
    candidate = undefined;
  });

  const rootForwardedProps = omit(
    root,
    "__scopeDatePicker",
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
    "open",
    "defaultOpen",
    "onOpenChange",
    "modal",
    "name",
    "form",
    "required",
  ) as DatePickerHostProps;
  const rootHostProps = merge(
    {
      get dir() {
        return state.dir();
      },
    },
    rootForwardedProps,
  );
  return (
    <DatePickerProvider
      scope={props.scope}
      value={context}
    >
      <Primitive
        as="div"
        {...(rootHostProps as PrimitiveProps<"div">)}
      />
    </DatePickerProvider>
  );
}

function useContext(consumer: string, scope?: Scope): DatePickerContext {
  return useDatePicker(consumer, scope);
}

export type DatePickerTriggerProps = Omit<
  PopoverTriggerProps,
  "__scopePopover"
> & { __scopeDatePicker?: Scope };
export function DatePickerTrigger(props: DatePickerTriggerProps): Element {
  const context = useContext(
    "DatePicker.Trigger",
    untrack(() => props.__scopeDatePicker),
  );
  const field = useFormFieldMetadata();
  const forwarded = merge(omit(props, "__scopeDatePicker"), {
    get __scopePopover() {
      return props.__scopeDatePicker;
    },
    get disabled() {
      return !!props.disabled || !!context.state.props.disabled;
    },
    get ["aria-invalid"]() {
      const fieldInvalid =
        field !== undefined &&
        context.props.name !== undefined &&
        field.name() === context.props.name &&
        field.serverInvalid();
      return fieldInvalid || context.bridgeMetadata()?.invalid
        ? "true"
        : props["aria-invalid"];
    },
    get ["aria-describedby"]() {
      return concatAriaIds(
        props["aria-describedby"],
        context.bridgeMetadata()?.describedBy,
      );
    },
    get ref() {
      return composeRefs(props.ref, context.setTrigger);
    },
  }) as PopoverTriggerProps;
  return <PopoverTrigger {...forwarded} />;
}
export type DatePickerValueProps = Omit<
  PrimitiveProps<"span">,
  "children" | "asChild"
> & { __scopeDatePicker?: Scope; placeholder?: Element } & (
    | { asChild: true; children: SlotRender }
    | { asChild?: false; children?: Element }
  );
export function DatePickerValue(props: DatePickerValueProps): Element {
  const context = useContext(
    "DatePicker.Value",
    untrack(() => props.__scopeDatePicker),
  );
  const forwarded = merge(omit(props, "__scopeDatePicker", "placeholder"), {
    get children() {
      const children = props.children;
      if (children != null) return children;
      const value = context.state.value();
      return value !== null
        ? context.state.labelDate(value)
        : props.placeholder;
    },
  }) as PrimitiveProps<"span">;
  return (
    <Primitive
      as="span"
      {...forwarded}
    />
  );
}
export type DatePickerPortalProps = Omit<
  PopoverPortalProps,
  "__scopePopover"
> & { __scopeDatePicker?: Scope };
export function DatePickerPortal(props: DatePickerPortalProps): Element {
  const forwarded = merge(omit(props, "__scopeDatePicker"), {
    get __scopePopover() {
      return props.__scopeDatePicker;
    },
  }) as PopoverPortalProps;
  return <PopoverPortal {...forwarded} />;
}
export type DatePickerContentProps = Omit<
  PopoverContentProps,
  "__scopePopover"
> & { __scopeDatePicker?: Scope };
export function DatePickerContent(props: DatePickerContentProps): Element {
  const context = useContext(
    "DatePicker.Content",
    untrack(() => props.__scopeDatePicker),
  );
  let ownedContent: HTMLDivElement | undefined;
  const setContentRef = (node: HTMLDivElement | undefined) => {
    if (node) {
      ownedContent = node;
      context.setContent(node);
    } else if (ownedContent) {
      context.clearContent(ownedContent);
      ownedContent = undefined;
    }
  };
  onCleanup(() => {
    if (ownedContent) context.clearContent(ownedContent);
  });
  const forwarded = merge(
    omit(props, "__scopeDatePicker", "dir", "onFocusIn"),
    {
      get __scopePopover() {
        return props.__scopeDatePicker;
      },
      get dir() {
        return context.state.dir();
      },
      get ref() {
        return composeRefs(props.ref, setContentRef);
      },
      onFocusIn: (event: FocusEvent) =>
        handleDatePickerContentFocus(context.content(), event, props.onFocusIn),
      get onPlaced() {
        return () => {
          props.onPlaced?.();
          const content = context.content();
          if (content)
            revealFocusedElement(content, content.ownerDocument.activeElement);
        };
      },
    },
  ) as PopoverContentProps;
  return <PopoverContent {...forwarded} />;
}
export type DatePickerTitleProps = Omit<PopoverTitleProps, "__scopePopover"> & {
  __scopeDatePicker?: Scope;
};
export function DatePickerTitle(props: DatePickerTitleProps): Element {
  const forwarded = merge(omit(props, "__scopeDatePicker"), {
    get __scopePopover() {
      return props.__scopeDatePicker;
    },
  }) as PopoverTitleProps;
  return <PopoverTitle {...forwarded} />;
}
export type DatePickerDescriptionProps = Omit<
  PopoverDescriptionProps,
  "__scopePopover"
> & { __scopeDatePicker?: Scope };
export function DatePickerDescription(
  props: DatePickerDescriptionProps,
): Element {
  const forwarded = merge(omit(props, "__scopeDatePicker"), {
    get __scopePopover() {
      return props.__scopeDatePicker;
    },
  }) as PopoverDescriptionProps;
  return <PopoverDescription {...forwarded} />;
}
export type DatePickerCloseProps = Omit<PopoverCloseProps, "__scopePopover"> & {
  __scopeDatePicker?: Scope;
};
export function DatePickerClose(props: DatePickerCloseProps): Element {
  const forwarded = merge(omit(props, "__scopeDatePicker"), {
    get __scopePopover() {
      return props.__scopeDatePicker;
    },
  }) as PopoverCloseProps;
  return <PopoverClose {...forwarded} />;
}

export type DatePickerClearProps = Without<
  PrimitiveProps<"button">,
  "children" | "asChild"
> & { __scopeDatePicker?: Scope } & (
    | { asChild: true; children: SlotRender }
    | { asChild?: false; children?: Element }
  );
export function DatePickerClear(props: DatePickerClearProps): Element {
  const context = useContext(
    "DatePicker.Clear",
    untrack(() => props.__scopeDatePicker),
  );
  const forwarded = merge(
    omit(props, "__scopeDatePicker", "onClick", "type", "disabled"),
    {
      type: "button" as const,
      get disabled() {
        return (
          !!props.disabled ||
          !!context.state.props.disabled ||
          !!context.state.props.readOnly
        );
      },
      onClick: composeEventHandlers(
        () => props.onClick,
        () => context.requestUserValue(null),
      ),
    },
  );
  return (
    <Primitive
      as="button"
      {...(forwarded as PrimitiveProps<"button">)}
    />
  );
}

export type DatePickerCalendarProps = PrimitiveProps<"div"> & {
  __scopeDatePicker?: Scope;
};
export function DatePickerCalendar(props: DatePickerCalendarProps): Element {
  const context = useContext(
    "DatePicker.Calendar",
    untrack(() => props.__scopeDatePicker),
  );
  const forwarded = merge(omit(props, "__scopeDatePicker", "dir"), {
    get dir() {
      return context.state.dir();
    },
  });
  return (
    <CalendarStateProvider
      state={context.state}
      scope={props.__scopeDatePicker}
    >
      <Primitive
        as="div"
        {...forwarded}
      />
    </CalendarStateProvider>
  );
}

export type DatePickerFormControlProps = Omit<
  PrimitiveProps<"input">,
  | "type"
  | "value"
  | "defaultValue"
  | "name"
  | "form"
  | "required"
  | "disabled"
  | "readOnly"
  | "readonly"
  | "min"
  | "max"
  | "children"
  | "asChild"
> & { __scopeDatePicker?: Scope } & (
    | { asChild: true; children: SlotRender }
    | { asChild?: false; children?: Element }
  );
export function DatePickerFormControl(
  props: DatePickerFormControlProps,
): Element {
  const context = useContext(
    "DatePicker.FormControl",
    untrack(() => props.__scopeDatePicker),
  );
  const validityOwner = useFormValidityOwner() ?? null;
  const [node, setNode] = createSignal<HTMLInputElement | undefined>();
  const initialValue = untrack(context.state.value);
  let alive = true;
  const name = () => context.props.name;
  const form = () => context.props.form;
  const runtimeProps = props as DatePickerFormControlProps &
    Record<string, unknown>;
  const [targetDescriptionReader, setTargetDescriptionReader] = createSignal<
    (() => unknown) | undefined
  >();
  if (!isServer)
    createEffect(
      () => {
        const element = node();
        const dataInvalid = runtimeProps["data-invalid"];
        const describedBy = runtimeProps["aria-describedby"];
        const targetDescription = targetDescriptionReader()?.();
        const constraintInputs = [
          context.state.value(),
          context.props.required,
          context.state.props.min,
          context.state.props.max,
          context.state.props.disabled,
          context.state.props.readOnly,
          context.state.props.isDateUnavailable,
        ];
        return [
          element,
          dataInvalid,
          describedBy,
          targetDescription,
          constraintInputs,
        ] as const;
      },
      ([element, dataInvalid, describedBy, targetDescription]) => {
        if (!element) return;
        const formInvalid = hasDataInvalid(dataInvalid);
        const syncMetadata = () =>
          context.setBridgeMetadata(element, {
            invalid: formInvalid || !element.validity.valid,
            formInvalid,
            describedBy: concatAriaIds(describedBy, targetDescription),
          });
        syncMetadata();
        element.addEventListener("input", syncMetadata);
        element.addEventListener("change", syncMetadata);
        element.addEventListener("invalid", syncMetadata);
        return () => {
          element.removeEventListener("input", syncMetadata);
          element.removeEventListener("change", syncMetadata);
          element.removeEventListener("invalid", syncMetadata);
          context.setBridgeMetadata(element, undefined);
        };
      },
      { transparent: true },
    );
  const validateConfig = (child: Record<string, unknown> = {}) => {
    const rootName = name();
    const rootForm = form();
    if (validityOwner && validityOwner.name() !== rootName)
      throw new TypeError(
        "DatePicker.FormControl name must match its Form.Control name.",
      );
    if (
      validityOwner &&
      validityOwner.form() !== undefined &&
      validityOwner.form() !== rootForm
    )
      throw new TypeError(
        "DatePicker.FormControl form must match its Form.Control form.",
      );
    if (child.name !== undefined && child.name !== rootName)
      throw new TypeError(
        "DatePicker.FormControl target name must match DatePicker.Root name.",
      );
    if (child.form !== undefined && child.form !== rootForm)
      throw new TypeError(
        "DatePicker.FormControl target form must match DatePicker.Root form.",
      );
  };
  untrack(() =>
    validateConfig({ name: runtimeProps.name, form: runtimeProps.form }),
  );
  const setRef = (element: HTMLInputElement | undefined) => {
    setNode(element);
    context.setBridge(element, validityOwner);
  };
  const hiddenStyle = {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    "white-space": "nowrap",
    border: "0",
  };
  const rootProps = merge(
    omit(props, "__scopeDatePicker", "asChild", "children", "ref"),
    {
      get id() {
        return props.id;
      },
      onFocus: (event: FocusEvent) => {
        callEventHandler(props.onFocus, event);
        const target = context.trigger();
        if (!event.defaultPrevented && target) focus(target, false, false);
      },
    },
  );
  const canonical = {
    type: "date" as const,
    get value() {
      return context.state.value() ?? "";
    },
    defaultValue: initialValue ?? "",
    get name() {
      return name();
    },
    get form() {
      return form();
    },
    get required() {
      return context.props.required;
    },
    get disabled() {
      return context.state.props.disabled;
    },
    get readonly() {
      return context.state.props.readOnly;
    },
    get min() {
      return context.state.props.min;
    },
    get max() {
      return context.state.props.max;
    },
    "aria-hidden": "true",
    tabindex: -1,
    style: hiddenStyle,
  };
  if (!isServer)
    createEffect(
      () => {
        validateConfig({ name: runtimeProps.name, form: runtimeProps.form });
        return true;
      },
      {
        effect: () => {},
        error: (error) => {
          throw error;
        },
      },
      { transparent: true },
    );
  if (!isServer)
    createEffect(
      node,
      (element) => {
        if (!element) return;
        const document = element.ownerDocument;
        let current = true;
        const timers = new Set<number>();
        const reset = (event: Event) => {
          if (event.target !== element.form) return;
          const timer = document.defaultView!.setTimeout(() => {
            timers.delete(timer);
            if (!current || !alive || event.defaultPrevented) return;
            context.resetTo(initialValue ?? null);
          }, 0);
          timers.add(timer);
        };
        document.addEventListener("reset", reset);
        return () => {
          current = false;
          document.removeEventListener("reset", reset);
          for (const timer of timers) document.defaultView!.clearTimeout(timer);
        };
      },
      { transparent: true },
    );
  onCleanup(() => {
    alive = false;
    context.setBridge(undefined, validityOwner);
  });
  const targetRender = (target: SlotTarget) =>
    untrack(() => props.children as SlotRender)((component, childProps) => {
      untrack(() => validateConfig(childProps as Record<string, unknown>));
      if (!isServer)
        createEffect(
          () => {
            validateConfig(childProps as Record<string, unknown>);
            return true;
          },
          {
            effect: () => {},
            error: (error) => {
              throw error;
            },
          },
          { transparent: true },
        );
      if (!isServer) {
        let readDescription: (() => unknown) | undefined = () =>
          childProps["aria-describedby"];
        const targetDescription = () => readDescription?.();
        createEffect(
          () => targetDescription,
          (reader) => {
            setTargetDescriptionReader(() => reader);
            return () => {
              readDescription = undefined;
            };
          },
          { transparent: true },
        );
      }
      const forwarded = merge(
        omit(
          childProps,
          "value",
          "defaultValue",
          "type",
          "name",
          "form",
          "required",
          "disabled",
          "readonly",
          "readOnly",
          "min",
          "max",
        ),
        {
          get id() {
            return props.id ?? childProps.id;
          },
          get ref() {
            return composeRefs(
              props.ref,
              childProps.ref as typeof props.ref,
              setRef,
            );
          },
        },
        canonical,
      );
      return target(component, forwarded as never);
    });
  const hostProps = merge(rootProps, canonical, {
    get asChild() {
      return props.asChild;
    },
    get ref() {
      return composeRefs(props.ref, setRef);
    },
    get children() {
      return props.asChild ? targetRender : undefined;
    },
  }) as PrimitiveProps<"input">;
  return (
    <Primitive
      as="input"
      {...hostProps}
    />
  );
}

export {
  DatePicker as Root,
  DatePickerTrigger as Trigger,
  DatePickerValue as Value,
  DatePickerPortal as Portal,
  DatePickerContent as Content,
  DatePickerTitle as Title,
  DatePickerDescription as Description,
  DatePickerClose as Close,
  DatePickerClear as Clear,
  DatePickerCalendar as Calendar,
  DatePickerFormControl as FormControl,
};
