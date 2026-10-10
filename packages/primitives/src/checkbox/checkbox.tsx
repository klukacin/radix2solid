// Native port of Radix Checkbox; upstream MIT, Copyright (c) 2022 WorkOS.
import { createMemo, merge, omit, onCleanup, Show, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { createControllableState } from '../internal/state.js';
import { composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { createPresence } from '../internal/presence.js';
import { createFormControl, createFormInput, type FormControlState, type CheckedState } from '../internal/form-control.js';
import { mergeStyles } from '../slot/slot.js';

export type { CheckedState };
const [createCheckboxContext, createCheckboxScope] = createContextScope('Checkbox');
const [Provider, useCheckbox] = createCheckboxContext<FormControlState>('Checkbox');
export { createCheckboxScope };
type CheckboxStateProps = { __scopeCheckbox?: Scope; checked?: CheckedState; defaultChecked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void; disabled?: boolean; required?: boolean; name?: string;
  value?: string; form?: string };
export type CheckboxProps = PrimitiveProps<'button'> & CheckboxStateProps;
export type CheckboxProviderProps = CheckboxStateProps & { children?: Element };
export type CheckboxTriggerProps = PrimitiveProps<'button'> & { __scopeCheckbox?: Scope };
export type CheckboxIndicatorProps = PrimitiveProps<'span'> & { __scopeCheckbox?: Scope; forceMount?: true };
export type CheckboxBubbleInputProps = PrimitiveProps<'input'> & { __scopeCheckbox?: Scope };
const dataState = (checked: CheckedState) => checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked';

export function CheckboxProvider(props: CheckboxProviderProps): Element {
  const [checked, setChecked] = createControllableState<CheckedState>({ value: () => props.checked,
    get defaultValue() { return props.defaultChecked ?? false; }, get onChange() { return props.onCheckedChange; } });
  const state = createFormControl({ checked, setChecked, disabled: () => props.disabled, required: () => props.required,
    name: () => props.name, value: () => props.value ?? 'on', form: () => props.form });
  return <Provider scope={props.__scopeCheckbox} value={state}>{props.children}</Provider>;
}

export function Checkbox(props: CheckboxProps): Element {
  const triggerProps = omit(props, 'checked', 'defaultChecked', 'onCheckedChange', 'disabled', 'required', 'name', 'value', 'form');
  function Input(): Element {
    const context = useCheckbox('Checkbox', untrack(() => props.__scopeCheckbox));
    return <Show when={context.hasForm()}><CheckboxBubbleInput __scopeCheckbox={props.__scopeCheckbox} /></Show>;
  }
  return <CheckboxProvider {...omit(props, 'children')}><CheckboxTrigger {...triggerProps} /><Input /></CheckboxProvider>;
}

export function CheckboxTrigger(props: CheckboxTriggerProps): Element {
  const context = useCheckbox('CheckboxTrigger', untrack(() => props.__scopeCheckbox));
  if (!isServer) onCleanup(() => context.controlRef(undefined));
  const forwarded = merge({ type: 'button' as const, role: 'checkbox' as const,
    get ['aria-checked']() { return context.checked() === 'indeterminate' ? 'mixed' as const : context.checked() ? 'true' as const : 'false' as const; },
    get ['aria-required']() { return context.required() === undefined ? undefined : context.required() ? 'true' as const : 'false' as const; },
    get ['data-state']() { return dataState(context.checked()); }, get ['data-disabled']() { return context.disabled() ? '' : undefined; },
    get disabled() { return context.disabled(); }, get value() { return context.value(); }, get form() { return context.form(); }
  }, omit(props, '__scopeCheckbox'), {
    get ref() { return composeRefs(props.ref, context.controlRef); },
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => { if (event.key === 'Enter') event.preventDefault(); }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, event => {
      if (context.disabled()) return;
      context.markInteraction(!event.cancelBubble);
      context.setChecked(previous => previous === 'indeterminate' ? true : !previous);
      if (context.input() && !event.cancelBubble) event.stopPropagation();
    })
  });
  return <Primitive {...forwarded} />;
}

export function CheckboxIndicator(props: CheckboxIndicatorProps): Element {
  const context = useCheckbox('CheckboxIndicator', untrack(() => props.__scopeCheckbox));
  const presence = createPresence(() => context.checked() !== false, () => !!props.forceMount);
  const style = createMemo(() => typeof props.style === 'string' ? mergeStyles({ 'pointer-events': 'none' }, props.style) : Object.assign({ 'pointer-events': 'none' }, props.style));
  const forwarded = merge({ get ['data-state']() { return dataState(context.checked()); }, get ['data-disabled']() { return context.disabled() ? '' : undefined; } },
    omit(props, '__scopeCheckbox', 'forceMount'), { get style() { return style(); }, get ref() { return composeRefs(props.ref, presence.ref); } });
  function Mounted(): Element {
    if (!isServer) onCleanup(() => presence.ref(undefined));
    return <Primitive as="span" {...forwarded} />;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}

export function CheckboxBubbleInput(props: CheckboxBubbleInputProps): Element {
  const context = useCheckbox('CheckboxBubbleInput', untrack(() => props.__scopeCheckbox));
  const size = createFormInput(context);
  const style = createMemo(() => {
    const base = { position: 'absolute', 'pointer-events': 'none', opacity: 0, margin: 0, transform: 'translateX(-100%)', ...size() };
    return typeof props.style === 'string' ? mergeStyles(base, props.style) : Object.assign(base, props.style);
  });
  const forwarded = merge({ type: 'checkbox' as const, 'aria-hidden': 'true' as const, tabIndex: -1,
    get checked() { return context.checked() === true; },
    get name() { return context.name(); }, get value() { return context.value(); }, get form() { return context.form(); },
    get required() { return context.required(); }, get disabled() { return context.disabled(); }
  }, omit(props, '__scopeCheckbox'), { get ref() { return composeRefs(props.ref, context.inputRef); }, get style() { return style(); } });
  return <Primitive as="input" {...forwarded} />;
}
