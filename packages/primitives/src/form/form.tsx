import { isServer } from "@solidjs/web";
// Native Radix Form; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  merge,
  omit,
  onCleanup,
  Show,
  untrack,
  type Element,
} from "solid-js";

import { createContextScope, type Scope } from "../internal/context.js";
import { callEventHandler, composeEventHandlers } from "../internal/events.js";
import { focus } from "../internal/focus-scope.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import { Label, type LabelProps } from "../label/label.js";
import { concatAriaIds } from "../slot/slot.js";

type Scoped = { __scopeForm?: Scope };
type BuiltinMatcher = Exclude<keyof ValidityState, "customError">;
type CustomMatcher = (
  value: string,
  formData: FormData,
) => boolean | Promise<boolean>;
export type FormProps = Scoped &
  PrimitiveProps<"form"> & { onClearServerErrors?: () => void };
export type FormFieldProps = Scoped &
  PrimitiveProps<"div"> & { name: string; serverInvalid?: boolean };
export type FormLabelProps = Scoped & LabelProps & { name?: string };
export type FormControlProps = Scoped & PrimitiveProps<"input">;
export type FormMessageProps = Scoped &
  PrimitiveProps<"span"> & {
    name?: string;
    match?: BuiltinMatcher | CustomMatcher;
    forceMatch?: boolean;
  };
export type FormValidityStateProps = Scoped & {
  name?: string;
  children: (validity: ValidityState | undefined) => Element;
};
export type FormSubmitProps = Scoped & PrimitiveProps<"button">;
const builtinKeys = [
  "badInput",
  "patternMismatch",
  "rangeOverflow",
  "rangeUnderflow",
  "stepMismatch",
  "tooLong",
  "tooShort",
  "typeMismatch",
  "valueMissing",
] as const;
const invalidMessage = "This value is not valid";
const messages: Record<BuiltinMatcher, string | undefined> = {
  badInput: invalidMessage,
  patternMismatch: "This value does not match the required pattern",
  rangeOverflow: "This value is too large",
  rangeUnderflow: "This value is too small",
  stepMismatch: "This value does not match the required step",
  tooLong: "This value is too long",
  tooShort: "This value is too short",
  typeMismatch: "This value does not match the required type",
  valid: undefined,
  valueMissing: "This value is missing",
};
interface FieldData {
  validity?: ValidityState;
  errors: Map<symbol, boolean>;
  matchers: Map<symbol, CustomMatcher>;
  version: number;
  messageIds: Set<string>;
  serverInvalid: () => boolean;
  control?: HTMLInputElement;
}
interface FormState {
  data: (name: string) => FieldData;
  read: (name: string) => FieldData;
  notify: () => void;
  controls: Map<HTMLInputElement, () => void>;
}
interface FieldState {
  name: () => string;
  id: string;
}
const [createFormContext, createFormScope] = createContextScope("Form");
const [Provider, useForm] = createFormContext<FormState>("Form.Root");
const [FieldProvider, useField] = createFormContext<FieldState>("Form.Field");
export { createFormScope };
function validitySnapshot(validity: ValidityState): ValidityState {
  return {
    badInput: validity.badInput,
    patternMismatch: validity.patternMismatch,
    rangeOverflow: validity.rangeOverflow,
    rangeUnderflow: validity.rangeUnderflow,
    stepMismatch: validity.stepMismatch,
    tooLong: validity.tooLong,
    tooShort: validity.tooShort,
    typeMismatch: validity.typeMismatch,
    valueMissing: validity.valueMissing,
    customError: validity.customError,
    valid: validity.valid,
  };
}
function resolveName(
  props: { name?: unknown },
  field: FieldState | null,
  consumer: string,
) {
  return () => {
    const name = typeof props.name === "string" ? props.name : field?.name();
    if (name === undefined)
      throw new Error(`${consumer} requires a name or Form.Field.`);
    return name;
  };
}
function firstInvalidControl(form: HTMLFormElement) {
  for (const control of form.elements) {
    if (
      control instanceof form.ownerDocument.defaultView!.HTMLElement &&
      (("validity" in control && !(control.validity as ValidityState).valid) ||
        control.getAttribute("aria-invalid") === "true")
    )
      return control;
  }
}
function validAttribute(data: FieldData) {
  return data.validity?.valid === true && !data.serverInvalid()
    ? true
    : undefined;
}
function invalidAttribute(data: FieldData) {
  return data.validity?.valid === false || data.serverInvalid()
    ? true
    : undefined;
}

export function Form(props: FormProps): Element {
  const entries = new Map<string, FieldData>(),
    controls = new Map<HTMLInputElement, () => void>();
  // ponytail: one form revision; use per-field revisions if very large forms make updates costly.
  const [revision, setRevision] = createSignal(0);
  const data = (name: string) => {
    let value = entries.get(name);
    if (!value) {
      value = {
        errors: new Map(),
        matchers: new Map(),
        version: 0,
        messageIds: new Set(),
        serverInvalid: () => false,
      };
      entries.set(name, value);
    }
    return value;
  };
  const state: FormState = {
    data,
    read: (name) => {
      revision();
      return data(name);
    },
    notify: () => {
      setRevision((value) => value + 1);
    },
    controls,
  };
  const [node, ref] = createSignal<HTMLFormElement | undefined>();
  let alive = true;
  const timers = new Map<number, Window>();
  onCleanup(() => {
    alive = false;
    for (const [timer, view] of timers) view.clearTimeout(timer);
  });
  if (!isServer)
    createEffect(
      node,
      (form) => {
        if (!form) return;
        const invalid = (event: Event) => {
          callEventHandler(props.onInvalid, event);
          if (event.defaultPrevented) return;
          focus(firstInvalidControl(form), false, false);
          // Managed controls validate at the target before suppressing native UI.
          if (!controls.has(event.target as HTMLInputElement))
            event.preventDefault();
        };
        const externalInvalid = (event: Event) => {
          const control = event.target;
          if (
            control instanceof form.ownerDocument.defaultView!.HTMLElement &&
            !form.contains(control) &&
            "form" in control &&
            control.form === form &&
            !event.defaultPrevented
          ) {
            focus(firstInvalidControl(form), false, false);
            if (!controls.has(control as HTMLInputElement))
              event.preventDefault();
          }
        };
        form.addEventListener("invalid", invalid, true);
        form.ownerDocument.addEventListener("invalid", externalInvalid, true);
        return () => {
          form.removeEventListener("invalid", invalid, true);
          form.ownerDocument.removeEventListener(
            "invalid",
            externalInvalid,
            true,
          );
        };
      },
      { transparent: true },
    );
  const forwarded = merge(
    omit(props, "__scopeForm", "onClearServerErrors", "onInvalid"),
    {
      get ref() {
        return composeRefs(props.ref, ref);
      },
      onSubmit(event: SubmitEvent) {
        try {
          callEventHandler(props.onSubmit, event);
        } finally {
          props.onClearServerErrors?.();
        }
      },
      onReset(event: Event) {
        callEventHandler(props.onReset, event);
        const form = event.currentTarget as HTMLFormElement,
          view = form.ownerDocument.defaultView!;
        const timer = view.setTimeout(() => {
          timers.delete(timer);
          if (!alive || event.defaultPrevented) return;
          for (const clear of controls.values()) clear();
          untrack(() => props.onClearServerErrors?.());
        }, 0);
        timers.set(timer, view);
      },
    },
  );
  return (
    <Provider
      scope={props.__scopeForm}
      value={state}
    >
      <Primitive
        as="form"
        {...(forwarded as PrimitiveProps<"form">)}
      />
    </Provider>
  );
}

export function FormField(props: FormFieldProps): Element {
  const scope = untrack(() => props.__scopeForm),
    root = useForm("Form.Field", scope),
    id = createUniqueId();
  const field: FieldState = { name: () => props.name, id };
  if (isServer)
    untrack(() => {
      const serverInvalid = () => props.serverInvalid ?? false;
      root.data(props.name).serverInvalid = serverInvalid;
    });
  else
    createEffect(
      () => [props.name, props.serverInvalid] as const,
      ([name]) => {
        const data = root.data(name),
          serverInvalid = () => props.serverInvalid ?? false;
        data.serverInvalid = serverInvalid;
        root.notify();
        return () => {
          if (data.serverInvalid === serverInvalid) {
            data.serverInvalid = () => false;
            root.notify();
          }
        };
      },
      { transparent: true },
    );
  const forwarded = merge(omit(props, "__scopeForm", "name", "serverInvalid"), {
    get ["data-valid"]() {
      return validAttribute(root.read(props.name));
    },
    get ["data-invalid"]() {
      return invalidAttribute(root.read(props.name));
    },
  });
  return (
    <FieldProvider
      scope={props.__scopeForm}
      value={field}
    >
      <Primitive
        as="div"
        {...(forwarded as PrimitiveProps<"div">)}
      />
    </FieldProvider>
  );
}

export function FormLabel(props: FormLabelProps): Element {
  const scope = untrack(() => props.__scopeForm),
    root = useForm("Form.Label", scope),
    field = useField("Form.Label", scope, true);
  const name = resolveName(props, field, "Form.Label");
  const forwarded = merge(omit(props, "__scopeForm", "name"), {
    get for() {
      return props.for ?? root.read(name()).control?.id ?? field?.id;
    },
    get ["data-valid"]() {
      return validAttribute(root.read(name()));
    },
    get ["data-invalid"]() {
      return invalidAttribute(root.read(name()));
    },
  });
  return <Label {...(forwarded as LabelProps)} />;
}

export function FormControl(props: FormControlProps): Element {
  const scope = untrack(() => props.__scopeForm),
    root = useForm("Form.Control", scope),
    field = useField("Form.Control", scope, true);
  const name = resolveName(props, field, "Form.Control"),
    generatedId = createUniqueId();
  const [node, ref] = createSignal<HTMLInputElement | undefined>();
  const serverInvalid = createMemo(() => root.read(name()).serverInvalid());
  let generation = 0,
    alive = true;
  onCleanup(() => {
    alive = false;
    generation++;
  });
  const clear = () => {
    generation++;
    const control = node();
    control?.setCustomValidity("");
    const data = root.data(name());
    data.validity = undefined;
    data.errors.clear();
    root.notify();
  };
  const validate = () => {
    const control = untrack(node);
    if (!control) return;
    const fieldName = name(),
      data = root.data(fieldName),
      value = control.value,
      version = data.version,
      request = ++generation;
    control.setCustomValidity("");
    const native = validitySnapshot(control.validity);
    if (builtinKeys.some((key) => native[key])) {
      data.errors.clear();
      data.validity = native;
      root.notify();
      return;
    }
    const formData = control.form
      ? new control.ownerDocument.defaultView!.FormData(control.form)
      : new control.ownerDocument.defaultView!.FormData();
    const errors = new Map<symbol, boolean>(),
      pending: Promise<readonly [symbol, boolean]>[] = [];
    let syncError = false;
    for (const [key, match] of data.matchers) {
      const result = match(value, formData);
      if (typeof result === "boolean") {
        errors.set(key, result);
        syncError ||= result;
      } else
        pending.push(
          Promise.resolve(result).then((invalid) => [key, invalid] as const),
        );
    }
    const current = () =>
      alive &&
      request === generation &&
      node() === control &&
      root.controls.has(control) &&
      name() === fieldName &&
      control.value === value &&
      data.version === version &&
      builtinKeys.every((key) => control.validity[key] === native[key]);
    const publish = () => {
      let invalid = false;
      for (const error of errors.values()) invalid ||= error;
      control.setCustomValidity(invalid ? invalidMessage : "");
      data.errors = errors;
      data.validity = validitySnapshot(control.validity);
      root.notify();
    };
    publish();
    if (pending.length)
      void Promise.all(pending).then((results) => {
        if (!current() || syncError) return;
        for (const [key, invalid] of results) errors.set(key, invalid);
        publish();
      });
  };
  if (!isServer)
    createEffect(
      () =>
        [
          node(),
          name(),
          props.value,
          props.type,
          props.required,
          props.pattern,
          props.min,
          props.max,
          props.step,
          props.minlength,
          props.maxlength,
        ] as const,
      ([control, fieldName]) => {
        if (!control) return;
        const data = root.data(fieldName);
        data.control = control;
        root.controls.set(control, clear);
        untrack(clear);
        const observer =
          new control.ownerDocument.defaultView!.MutationObserver(() =>
            root.notify(),
          );
        observer.observe(control, {
          attributes: true,
          attributeFilter: ["id"],
        });
        return () => {
          observer.disconnect();
          generation++;
          root.controls.delete(control);
          if (data.control === control) {
            data.control = undefined;
            data.validity = undefined;
            data.errors.clear();
            root.notify();
          }
        };
      },
      { transparent: true },
    );
  if (!isServer)
    createEffect(
      () => [node(), serverInvalid()] as const,
      ([control, invalid]) => {
        if (!control || !invalid) return;
        let current = true;
        queueMicrotask(() => {
          const form = control.form;
          if (
            current &&
            alive &&
            node() === control &&
            serverInvalid() &&
            form &&
            firstInvalidControl(form) === control
          )
            focus(control, false, false);
        });
        return () => {
          current = false;
        };
      },
      { transparent: true },
    );
  const forwarded = merge({ title: "" }, omit(props, "__scopeForm"), {
    get id() {
      return props.id ?? field?.id ?? generatedId;
    },
    get name() {
      return name();
    },
    get ref() {
      return composeRefs(props.ref, ref);
    },
    get ["data-valid"]() {
      return validAttribute(root.read(name()));
    },
    get ["data-invalid"]() {
      return invalidAttribute(root.read(name()));
    },
    get ["aria-invalid"]() {
      return root.read(name()).serverInvalid()
        ? ("true" as const)
        : props["aria-invalid"];
    },
    get ["aria-describedby"]() {
      return concatAriaIds(
        props["aria-describedby"],
        ...root.read(name()).messageIds,
      );
    },
    onInput: composeEventHandlers(
      () => props.onInput,
      () => untrack(clear),
    ),
    onChange: composeEventHandlers(
      () => props.onChange,
      () => untrack(validate),
    ),
    onInvalid: composeEventHandlers(
      () => props.onInvalid,
      (event) => {
        untrack(validate);
        event.preventDefault();
      },
    ),
  });
  return (
    <Primitive
      as="input"
      {...(forwarded as PrimitiveProps<"input">)}
    />
  );
}

export function FormMessage(props: FormMessageProps): Element {
  const scope = untrack(() => props.__scopeForm),
    root = useForm("Form.Message", scope),
    field = useField("Form.Message", scope, true);
  const name = resolveName(props, field, "Form.Message"),
    generatedId = createUniqueId(),
    key = Symbol();
  if (!isServer)
    createEffect(
      () => [name(), props.match] as const,
      ([fieldName, match]) => {
        if (typeof match !== "function") return;
        const data = root.data(fieldName);
        data.matchers.set(key, match);
        data.version++;
        root.notify();
        return () => {
          data.matchers.delete(key);
          data.errors.delete(key);
          data.version++;
          root.notify();
        };
      },
      { transparent: true },
    );
  const visible = () => {
    if (props.forceMatch) return true;
    const data = root.read(name()),
      match = props.match;
    return match === undefined
      ? true
      : typeof match === "function"
        ? data.errors.get(key) === true
        : data.validity?.[match] === true;
  };
  function Mounted(): Element {
    const [node, ref] = createSignal<HTMLElement | undefined>();
    if (!isServer)
      createEffect(
        () => [node(), name(), props.id] as const,
        ([element, fieldName]) => {
          if (!element) return;
          const data = root.data(fieldName);
          let registered = "";
          const sync = () => {
            data.messageIds.delete(registered);
            registered = element.id;
            if (registered) data.messageIds.add(registered);
            root.notify();
          };
          sync();
          const observer =
            new element.ownerDocument.defaultView!.MutationObserver(sync);
          observer.observe(element, {
            attributes: true,
            attributeFilter: ["id"],
          });
          return () => {
            observer.disconnect();
            data.messageIds.delete(registered);
            root.notify();
          };
        },
        { transparent: true },
      );
    const forwarded = merge(
      omit(props, "__scopeForm", "name", "match", "forceMatch"),
      {
        get id() {
          return props.id ?? generatedId;
        },
        get ref() {
          return composeRefs(props.ref, ref);
        },
        get children() {
          return (
            props.children ??
            (typeof props.match === "string"
              ? messages[props.match]
              : invalidMessage)
          );
        },
      },
    );
    return (
      <Primitive
        as="span"
        {...(forwarded as PrimitiveProps<"span">)}
      />
    );
  }
  return (
    <Show when={visible()}>
      <Mounted />
    </Show>
  );
}

export function FormValidityState(props: FormValidityStateProps): Element {
  const scope = untrack(() => props.__scopeForm),
    root = useForm("Form.ValidityState", scope),
    field = useField("Form.ValidityState", scope, true);
  const name = resolveName(props, field, "Form.ValidityState");
  return <>{props.children(root.read(name()).validity)}</>;
}
export function FormSubmit(props: FormSubmitProps): Element {
  const forwarded = merge(
    { type: "submit" as const },
    omit(props, "__scopeForm"),
  ) as PrimitiveProps<"button">;
  return (
    <Primitive
      as="button"
      {...forwarded}
    />
  );
}
