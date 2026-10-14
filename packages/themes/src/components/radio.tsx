import { omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, composeEventHandlers } from '@wsagency/radix2solid-primitives/internal';
import { radioPropDefs } from './radio.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import { extractProps } from '../helpers/extract-props.js';
import type { NotInputRadioAttributes } from '../helpers/input-attributes.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

export type RadioProps = Omit<ComponentProps<'input'>, NotInputRadioAttributes | 'color' | 'defaultValue' | 'value'> & MarginProps & GetPropDefTypes<typeof radioPropDefs> & { value: string; onValueChange?: (value: string) => void };
export function Radio(props: RadioProps): Element {
  const parsed = extractProps(props, radioPropDefs, marginPropDefs);
  const inputProps = omit(parsed, 'color', 'class', 'onValueChange', 'onChange');
  return <Primitive as="input" {...inputProps} type="radio" data-accent-color={parsed.color}
    class={['rt-reset', 'rt-BaseRadioRoot', 'rt-RadioRoot', parsed.class]}
    onChange={composeEventHandlers<Event>(() => props.onChange, event => props.onValueChange?.((event.currentTarget as HTMLInputElement).value))} />;
}
