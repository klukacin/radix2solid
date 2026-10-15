import { isServer } from "@solidjs/web";
// Native port of Radix Switch; upstream MIT, Copyright (c) 2022 WorkOS.
import {
  createMemo,
  merge,
  omit,
  onCleanup,
  Show,
  untrack,
  type Element,
} from "solid-js";

import { createContextScope, type Scope } from "../internal/context.js";
import { composeEventHandlers } from "../internal/events.js";
import {
  createFormControl,
  createFormInput,
  type FormControlState,
} from "../internal/form-control.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import { createControllableState } from "../internal/state.js";
import { mergeStyles } from "../slot/slot.js";

const [createSwitchContext, createSwitchScope] = createContextScope("Switch");
const [Provider, useSwitch] =
  createSwitchContext<FormControlState<boolean>>("Switch");
export { createSwitchScope };
type SwitchStateProps = {
  __scopeSwitch?: Scope;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  form?: string;
};
export type SwitchProps = PrimitiveProps<"button"> & SwitchStateProps;
export type SwitchProviderProps = SwitchStateProps & { children?: Element };
export type SwitchTriggerProps = PrimitiveProps<"button"> & {
  __scopeSwitch?: Scope;
};
export type SwitchThumbProps = PrimitiveProps<"span"> & {
  __scopeSwitch?: Scope;
};
export type SwitchBubbleInputProps = PrimitiveProps<"input"> & {
  __scopeSwitch?: Scope;
};

export function SwitchProvider(props: SwitchProviderProps): Element {
  const [checked, setChecked] = createControllableState({
    value: () => props.checked,
    get defaultValue() {
      return props.defaultChecked ?? false;
    },
    get onChange() {
      return props.onCheckedChange;
    },
  });
  const state = createFormControl({
    checked,
    setChecked,
    disabled: () => props.disabled,
    required: () => props.required,
    name: () => props.name,
    value: () => props.value ?? "on",
    form: () => props.form,
  });
  return (
    <Provider
      scope={props.__scopeSwitch}
      value={state}
    >
      {props.children}
    </Provider>
  );
}

export function Switch(props: SwitchProps): Element {
  const triggerProps = omit(
    props,
    "checked",
    "defaultChecked",
    "onCheckedChange",
    "disabled",
    "required",
    "name",
    "value",
    "form",
  );
  function Input(): Element {
    const context = useSwitch(
      "Switch",
      untrack(() => props.__scopeSwitch),
    );
    return (
      <Show when={context.hasForm()}>
        <SwitchBubbleInput __scopeSwitch={props.__scopeSwitch} />
      </Show>
    );
  }
  const providerProps = omit(props, "children");
  return (
    <SwitchProvider {...providerProps}>
      <SwitchTrigger {...triggerProps} />
      <Input />
    </SwitchProvider>
  );
}

export function SwitchTrigger(props: SwitchTriggerProps): Element {
  const context = useSwitch(
    "SwitchTrigger",
    untrack(() => props.__scopeSwitch),
  );
  if (!isServer) onCleanup(() => context.controlRef(undefined));
  const forwarded = merge(
    {
      type: "button" as const,
      role: "switch" as const,
      get ["aria-checked"]() {
        return context.checked() ? ("true" as const) : ("false" as const);
      },
      get ["aria-required"]() {
        return context.required() === undefined
          ? undefined
          : context.required()
            ? ("true" as const)
            : ("false" as const);
      },
      get ["data-state"]() {
        return context.checked() ? "checked" : "unchecked";
      },
      get ["data-disabled"]() {
        return context.disabled() ? "" : undefined;
      },
      get disabled() {
        return context.disabled();
      },
      get value() {
        return context.value();
      },
      get form() {
        return context.form();
      },
    },
    omit(props, "__scopeSwitch"),
    {
      get ref() {
        return composeRefs(props.ref, context.controlRef);
      },
      onClick: composeEventHandlers<MouseEvent>(
        () => props.onClick,
        (event) => {
          if (context.disabled()) return;
          context.markInteraction(!event.cancelBubble);
          context.setChecked((previous) => !previous);
          if (context.input() && !event.cancelBubble) event.stopPropagation();
        },
      ),
    },
  );
  return <Primitive {...forwarded} />;
}

export function SwitchThumb(props: SwitchThumbProps): Element {
  const context = useSwitch(
    "SwitchThumb",
    untrack(() => props.__scopeSwitch),
  );
  const forwarded = merge(
    {
      get ["data-state"]() {
        return context.checked() ? "checked" : "unchecked";
      },
      get ["data-disabled"]() {
        return context.disabled() ? "" : undefined;
      },
    },
    omit(props, "__scopeSwitch"),
  );
  return (
    <Primitive
      as="span"
      {...forwarded}
    />
  );
}

export function SwitchBubbleInput(props: SwitchBubbleInputProps): Element {
  const context = useSwitch(
    "SwitchBubbleInput",
    untrack(() => props.__scopeSwitch),
  );
  const size = createFormInput(context);
  const style = createMemo(() => {
    const base = {
      position: "absolute",
      "pointer-events": "none",
      opacity: 0,
      margin: 0,
      transform: "translateX(-100%)",
      ...size(),
    };
    return typeof props.style === "string"
      ? mergeStyles(base, props.style)
      : Object.assign(base, props.style);
  });
  const forwarded = merge(
    {
      type: "checkbox" as const,
      "aria-hidden": "true" as const,
      tabIndex: -1,
      get checked() {
        return context.checked();
      },
      get name() {
        return context.name();
      },
      get value() {
        return context.value();
      },
      get form() {
        return context.form();
      },
      get required() {
        return context.required();
      },
      get disabled() {
        return context.disabled();
      },
    },
    omit(props, "__scopeSwitch"),
    {
      get ref() {
        return composeRefs(props.ref, context.inputRef);
      },
      get style() {
        return style();
      },
    },
  );
  return (
    <Primitive
      as="input"
      {...forwarded}
    />
  );
}
