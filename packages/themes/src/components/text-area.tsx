import { omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive } from '@wsagency/radix2solid-primitives/internal';
import { textAreaPropDefs } from './text-area.props.js';
import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

export type TextAreaProps = Omit<ComponentProps<'textarea'>, 'color' | 'size' | 'value' | 'defaultValue'> & MarginProps & GetPropDefTypes<typeof textAreaPropDefs> & { defaultValue?: string; value?: string };
export function TextArea(props: TextAreaProps): Element {
  const parsed = extractProps(props, textAreaPropDefs, marginPropDefs);
  const inputProps = omit(parsed, 'color', 'radius', 'class', 'style');
  return <div data-accent-color={parsed.color} data-radius={parsed.radius} class={['rt-TextAreaRoot', parsed.class]} style={parsed.style}>
    <Primitive as="textarea" {...inputProps} class="rt-reset rt-TextAreaInput" />
  </div>;
}
