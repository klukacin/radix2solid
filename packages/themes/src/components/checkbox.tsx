import { omit, type Element } from 'solid-js';
import { dynamic } from '@solidjs/web';
import * as CheckboxPrimitive from '@radix-solid/primitives/checkbox';
import { createControllableState } from '@radix-solid/primitives/internal';
import { checkboxPropDefs } from './checkbox.props.js';
import { ThickCheckIcon, ThickDividerHorizontalIcon } from './icons.js';
import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

export type CheckboxProps = Omit<CheckboxPrimitive.CheckboxProps, 'asChild' | 'color' | 'defaultValue' | 'children'> & MarginProps & GetPropDefTypes<typeof checkboxPropDefs>;
export function Checkbox(props: CheckboxProps): Element {
  const parsed = extractProps(props, checkboxPropDefs, marginPropDefs);
  const [checked, setChecked] = createControllableState<CheckboxPrimitive.CheckedState>({ value: () => props.checked, get defaultValue() { return props.defaultChecked ?? false; }, get onChange() { return props.onCheckedChange; } });
  const Icon = dynamic(() => checked() === 'indeterminate' ? ThickDividerHorizontalIcon : ThickCheckIcon);
  return <CheckboxPrimitive.Root {...omit(parsed, 'color', 'class', 'checked', 'onCheckedChange')} asChild={false}
    checked={checked()} onCheckedChange={setChecked} data-accent-color={parsed.color} class={['rt-reset', 'rt-BaseCheckboxRoot', 'rt-CheckboxRoot', parsed.class]}>
    <CheckboxPrimitive.Indicator __scopeCheckbox={props.__scopeCheckbox} asChild class="rt-BaseCheckboxIndicator rt-CheckboxIndicator">{target => target(Icon, {})}</CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>;
}
