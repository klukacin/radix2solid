// Native port of Radix RadioGroup; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createMemo, createSignal, merge, omit, onCleanup, Show, untrack, type Accessor, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { createControllableState } from '../internal/state.js';
import { composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { createPresence } from '../internal/presence.js';
import { createFormControl, createFormInput, type FormControlState } from '../internal/form-control.js';
import { createRovingFocusGroupScope, RovingFocusGroup, RovingFocusGroupItem } from '../internal/roving-focus.js';
import type { Direction } from '../direction/direction.js';
import { mergeStyles } from '../slot/slot.js';

const [createRadioGroupContext, createRadioGroupScope] = createContextScope('RadioGroup', [createRovingFocusGroupScope]);
const useRovingScope = createRovingFocusGroupScope();
const [Provider, useRadioGroup] = createRadioGroupContext<{
  value: Accessor<string | null>; setValue: (value: string | null) => void; disabled: Accessor<boolean>; required: Accessor<boolean>;
  name: Accessor<string | undefined>; form: Accessor<string | undefined>; arrow: boolean;
}>('RadioGroup');
const [ItemProvider, useItem] = createRadioGroupContext<FormControlState<boolean>>('RadioGroupItem');
export { createRadioGroupScope };
export type RadioGroupProps = PrimitiveProps<'div'> & { __scopeRadioGroup?: Scope; value?: string | null; defaultValue?: string;
  onValueChange?: (value: string) => void; name?: string; form?: string; required?: boolean; disabled?: boolean;
  orientation?: 'horizontal' | 'vertical'; dir?: Direction; loop?: boolean };
export type RadioGroupItemProviderProps = { __scopeRadioGroup?: Scope; value: string; disabled?: boolean; children?: Element };
export type RadioGroupItemProps = PrimitiveProps<'button'> & { __scopeRadioGroup?: Scope; value: string; disabled?: boolean };
export type RadioGroupItemTriggerProps = PrimitiveProps<'button'> & { __scopeRadioGroup?: Scope };
export type RadioGroupItemBubbleInputProps = PrimitiveProps<'input'> & { __scopeRadioGroup?: Scope };
export type RadioGroupIndicatorProps = PrimitiveProps<'span'> & { __scopeRadioGroup?: Scope; forceMount?: true };

export function RadioGroup(props: RadioGroupProps): Element {
  const scope = untrack(() => props.__scopeRadioGroup);
  const rovingScope = useRovingScope(scope);
  const [value, setValue] = createControllableState<string | null>({ value: () => props.value,
    get defaultValue() { return props.defaultValue ?? null; },
    // Upstream's public callback is string; native form reset may restore initial null.
    get onChange() { return props.onValueChange as ((value: string | null) => void) | undefined; } });
  const initial = untrack(value);
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const context = { value, setValue, disabled: () => props.disabled ?? false, required: () => props.required ?? false,
    name: () => props.name, form: () => props.form, arrow: false };
  if (!isServer) createEffect(node, element => {
    if (!element) return;
    const document = element.ownerDocument;
    const view = document.defaultView!;
    let active = true;
    const timers = new Set<number>();
    const keyDown = (event: KeyboardEvent) => { context.arrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key); };
    const keyUp = () => { context.arrow = false; };
    const reset = (event: Event) => {
      const input = element.querySelector<HTMLInputElement>('input[type="radio"]');
      const form = input?.form ?? (props.form ? document.getElementById(props.form) : element.closest('form'));
      if (event.target !== form) return;
      const timer = view.setTimeout(() => { timers.delete(timer); if (active && !event.defaultPrevented) setValue(initial); }, 0);
      timers.add(timer);
    };
    document.addEventListener('keydown', keyDown, true);
    document.addEventListener('keyup', keyUp);
    document.addEventListener('reset', reset);
    return () => {
      active = false;
      document.removeEventListener('keydown', keyDown, true);
      document.removeEventListener('keyup', keyUp);
      document.removeEventListener('reset', reset);
      for (const timer of timers) view.clearTimeout(timer);
    };
  }, { transparent: true });
  const forwarded = merge({ role: 'radiogroup' as const, get ['aria-required']() { return context.required() ? 'true' as const : 'false' as const; },
    get ['data-disabled']() { return context.disabled() ? '' : undefined; }, get loop() { return props.loop ?? true; }
  }, omit(props, '__scopeRadioGroup', 'value', 'defaultValue', 'onValueChange', 'name', 'form', 'required', 'disabled', 'loop'), {
    get ref() { return composeRefs(props.ref, ref); }
  });
  return <Provider scope={scope} value={context}><RovingFocusGroup {...rovingScope} {...forwarded} /></Provider>;
}

export function RadioGroupItemProvider(props: RadioGroupItemProviderProps): Element {
  const scope = untrack(() => props.__scopeRadioGroup);
  const root = useRadioGroup('RadioGroupItemProvider', scope);
  const checked = () => root.value() === props.value;
  const state = createFormControl<boolean>({ checked, setChecked: next => {
    const requested = typeof next === 'function' ? next(checked()) : next;
    if (requested) root.setValue(props.value);
  }, disabled: () => root.disabled() || props.disabled, required: root.required, name: root.name, value: () => props.value, form: root.form });
  return <ItemProvider scope={scope} value={state}>{props.children}</ItemProvider>;
}

export function RadioGroupItem(props: RadioGroupItemProps): Element {
  const triggerProps = omit(props, 'value', 'disabled');
  function Input(): Element {
    const context = useItem('RadioGroupItem', untrack(() => props.__scopeRadioGroup));
    return <Show when={context.hasForm()}><RadioGroupItemBubbleInput __scopeRadioGroup={props.__scopeRadioGroup} /></Show>;
  }
  const providerProps = omit(props, 'children');
  return <RadioGroupItemProvider {...providerProps}><RadioGroupItemTrigger {...triggerProps} /><Input /></RadioGroupItemProvider>;
}

export function RadioGroupItemTrigger(props: RadioGroupItemTriggerProps): Element {
  const scope = untrack(() => props.__scopeRadioGroup);
  const context = useItem('RadioGroupItemTrigger', scope);
  const root = useRadioGroup('RadioGroupItemTrigger', scope);
  const rovingScope = useRovingScope(scope);
  if (!isServer) onCleanup(() => context.controlRef(undefined));
  const forwarded = merge({ type: 'button' as const, role: 'radio' as const,
    get ['aria-checked']() { return context.checked() ? 'true' as const : 'false' as const; },
    get ['data-state']() { return context.checked() ? 'checked' : 'unchecked'; }, get ['data-disabled']() { return context.disabled() ? '' : undefined; },
    get disabled() { return context.disabled(); }, get value() { return context.value(); }, get form() { return context.form(); }
  }, omit(props, '__scopeRadioGroup'), {
    get ref() { return composeRefs(props.ref, context.controlRef); },
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => { if (event.key === 'Enter') event.preventDefault(); }),
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, event => {
      if (root.arrow && !context.disabled()) { const target = event.currentTarget as HTMLElement; target.click(); }
    }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, event => {
      if (context.disabled()) return;
      context.markInteraction(!event.cancelBubble);
      if (!context.checked()) context.setChecked(true);
      if (context.input() && !event.cancelBubble) event.stopPropagation();
    })
  });
  return <RovingFocusGroupItem {...rovingScope} asChild focusable={!context.disabled()} active={context.checked()}>
    {target => target(Primitive, forwarded)}
  </RovingFocusGroupItem>;
}

export function RadioGroupIndicator(props: RadioGroupIndicatorProps): Element {
  const context = useItem('RadioGroupIndicator', untrack(() => props.__scopeRadioGroup));
  const presence = createPresence(context.checked, () => !!props.forceMount);
  const forwarded = merge({ get ['data-state']() { return context.checked() ? 'checked' : 'unchecked'; }, get ['data-disabled']() { return context.disabled() ? '' : undefined; } },
    omit(props, '__scopeRadioGroup', 'forceMount'), { get ref() { return composeRefs(props.ref, presence.ref); } });
  function Mounted(): Element {
    if (!isServer) onCleanup(() => presence.ref(undefined));
    return <Primitive as="span" {...forwarded} />;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}

export function RadioGroupItemBubbleInput(props: RadioGroupItemBubbleInputProps): Element {
  const context = useItem('RadioGroupItemBubbleInput', untrack(() => props.__scopeRadioGroup));
  const size = createFormInput(context, false);
  const style = createMemo(() => {
    const base = { position: 'absolute', 'pointer-events': 'none', opacity: 0, margin: 0, transform: 'translateX(-100%)', ...size() };
    return typeof props.style === 'string' ? mergeStyles(base, props.style) : Object.assign(base, props.style);
  });
  const forwarded = merge({ type: 'radio' as const, 'aria-hidden': 'true' as const, tabIndex: -1,
    get checked() { return context.checked(); }, get name() { return context.name(); }, get value() { return context.value(); }, get form() { return context.form(); },
    get required() { return context.required(); }, get disabled() { return context.disabled(); }
  }, omit(props, '__scopeRadioGroup'), { get ref() { return composeRefs(props.ref, context.inputRef); }, get style() { return style(); } });
  return <Primitive as="input" {...forwarded} />;
}
