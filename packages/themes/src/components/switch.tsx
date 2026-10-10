import { omit, type Element } from 'solid-js';
import * as SwitchPrimitive from '@radix-solid/primitives/switch';
import { switchPropDefs } from './switch.props.js';
import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

export type SwitchProps = Omit<SwitchPrimitive.SwitchProps, 'asChild' | 'color' | 'defaultValue' | 'children'> & MarginProps & GetPropDefTypes<typeof switchPropDefs>;
export function Switch(props: SwitchProps): Element {
  const parsed = extractProps(props, switchPropDefs, marginPropDefs);
  return <SwitchPrimitive.Root {...omit(parsed, 'class', 'color', 'radius')} asChild={false} data-accent-color={parsed.color} data-radius={parsed.radius}
    class={['rt-reset', 'rt-SwitchRoot', parsed.class]}>
    <SwitchPrimitive.Thumb __scopeSwitch={props.__scopeSwitch} class={['rt-SwitchThumb', { 'rt-high-contrast': props.highContrast }]} />
  </SwitchPrimitive.Root>;
}
