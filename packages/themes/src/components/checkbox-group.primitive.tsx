import { merge, omit, untrack, type Element } from 'solid-js';
import * as Checkbox from '@wsagency/radix2solid-primitives/checkbox';
import { useDirection } from '@wsagency/radix2solid-primitives/direction';
import { Primitive, createContextScope, createControllableState, RovingFocusGroup, RovingFocusGroupItem, createRovingFocusGroupScope, type Scope, type PrimitiveProps } from '@wsagency/radix2solid-primitives/internal';
import type { ComposedProps } from '../helpers/component-props.js';

const [createContext, createCheckboxGroupScope] = createContextScope('CheckboxGroup', [createRovingFocusGroupScope, Checkbox.createCheckboxScope]);
const useRovingScope = createRovingFocusGroupScope(), useCheckboxScope = Checkbox.createCheckboxScope();
const [Provider, useGroup] = createContext<{ name?: string; required: boolean; disabled: boolean; value: string[]; check: (value: string) => void; uncheck: (value: string) => void }>('CheckboxGroup');
export { createCheckboxGroupScope };
export type CheckboxGroupProps = PrimitiveProps<'div'> & { __scopeCheckboxGroup?: Scope; name?: string; required?: boolean; disabled?: boolean; dir?: 'ltr' | 'rtl'; orientation?: 'horizontal' | 'vertical'; loop?: boolean; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void };
export type CheckboxGroupItemProps = ComposedProps<Omit<Checkbox.CheckboxProps, 'checked' | 'defaultChecked' | 'onCheckedChange' | 'name'> & { __scopeCheckboxGroup?: Scope; value: string }>;
export type CheckboxGroupIndicatorProps = Checkbox.CheckboxIndicatorProps & { __scopeCheckboxGroup?: Scope };
export function CheckboxGroup(props: CheckboxGroupProps): Element {
  const scope = untrack(() => props.__scopeCheckboxGroup), roving = useRovingScope(scope);
  const direction = useDirection(() => props.dir);
  const [value, setValue] = createControllableState<string[]>({ value: () => props.value, get defaultValue() { return props.defaultValue ?? []; }, get onChange() { return props.onValueChange; } });
  const context = { get name() { return props.name; }, get required() { return props.required ?? false; }, get disabled() { return props.disabled ?? false; }, get value() { return value(); },
    check: (item: string) => setValue(previous => [...previous, item]), uncheck: (item: string) => setValue(previous => previous.filter(value => value !== item)) };
  const forwarded = merge({ role: 'group' as const, get dir() { return direction(); }, get ['data-disabled']() { return context.disabled ? '' : undefined; } },
    omit(props, '__scopeCheckboxGroup', 'name', 'required', 'disabled', 'dir', 'orientation', 'loop', 'value', 'defaultValue', 'onValueChange'));
  return <Provider scope={scope} value={context}><RovingFocusGroup {...roving} orientation={props.orientation} dir={direction()} loop={props.loop ?? true} asChild>
    {target => target(Primitive, merge({ as: 'div' as const }, forwarded))}
  </RovingFocusGroup></Provider>;
}
export function CheckboxGroupItem(props: CheckboxGroupItemProps): Element {
  const scope = untrack(() => props.__scopeCheckboxGroup), context = useGroup('CheckboxGroupItem', scope);
  const roving = useRovingScope(scope), checkbox = useCheckboxScope(scope);
  const checked = () => context.value.includes(props.value), disabled = () => context.disabled || !!props.disabled;
  const forwarded = merge({ get name() { return context.name; }, get required() { return context.required; } },
    omit(props, '__scopeCheckboxGroup'), { __scopeCheckbox: checkbox.__scopeCheckbox }, { get checked() { return checked(); }, get disabled() { return disabled(); },
      onCheckedChange: (next: Checkbox.CheckedState) => { if (next) context.check(props.value); else context.uncheck(props.value); } });
  return <RovingFocusGroupItem {...roving} focusable={!disabled()} active={checked()} asChild>{target => target(Checkbox.Root, forwarded as Checkbox.CheckboxProps)}</RovingFocusGroupItem>;
}
export function CheckboxGroupIndicator(props: CheckboxGroupIndicatorProps): Element {
  const scope = useCheckboxScope(untrack(() => props.__scopeCheckboxGroup));
  return <Checkbox.Indicator {...omit(props, '__scopeCheckboxGroup')} {...scope} />;
}
export { CheckboxGroup as Root, CheckboxGroupItem as Item, CheckboxGroupIndicator as Indicator };
