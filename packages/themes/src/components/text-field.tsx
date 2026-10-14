import { omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, composeRefs } from '@wsagency/radix2solid-primitives/internal';
import { textFieldRootPropDefs, textFieldSlotPropDefs } from './text-field.props.js';
import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { NotInputTextualAttributes } from '../helpers/input-attributes.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

type TextFieldRootProps = Omit<ComponentProps<'input'>, NotInputTextualAttributes | 'color' | 'defaultValue' | 'size' | 'type' | 'value'> & MarginProps & GetPropDefTypes<typeof textFieldRootPropDefs> & {
  defaultValue?: string | number; value?: string | number; type?: 'date' | 'datetime-local' | 'email' | 'hidden' | 'month' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'time' | 'url' | 'week';
};
type TextFieldSlotProps = Omit<ComponentProps<'div'>, 'color'> & GetPropDefTypes<typeof textFieldSlotPropDefs>;
function TextFieldRoot(props: TextFieldRootProps): Element {
  let input: HTMLInputElement | undefined;
  const parsed = extractProps(props, textFieldRootPropDefs, marginPropDefs);
  const inputProps = omit(parsed, 'children', 'class', 'color', 'radius', 'style', 'ref');
  return <div data-accent-color={parsed.color} data-radius={parsed.radius} style={parsed.style} class={['rt-TextFieldRoot', parsed.class]}
    onPointerDown={event => {
      const target = event.target as globalThis.Element;
      if (target.closest('input, button, a') || !input) return;
      const field = input, right = target.closest(".rt-TextFieldSlot[data-side='right'], .rt-TextFieldSlot:not([data-side='right']) ~ .rt-TextFieldSlot:not([data-side='left'])");
      const position = right ? field.value.length : 0;
      field.ownerDocument.defaultView!.requestAnimationFrame(() => {
        try { field.setSelectionRange(position, position); } catch { /* Non-text input types do not support selection. */ }
        field.focus();
      });
    }}>
    <Primitive as="input" spellcheck="false" {...inputProps}
      ref={composeRefs(props.ref, node => { input = node; })} class="rt-reset rt-TextFieldInput" />
    {props.children}
  </div>;
}
function TextFieldSlot(props: TextFieldSlotProps): Element {
  const parsed = extractProps(props, textFieldSlotPropDefs);
  const slotProps = omit(parsed, 'color', 'side', 'class');
  return <div data-accent-color={parsed.color} data-side={parsed.side} {...slotProps} class={['rt-TextFieldSlot', parsed.class]} />;
}
export { TextFieldRoot as Root, TextFieldSlot as Slot };
export type { TextFieldRootProps as RootProps, TextFieldSlotProps as SlotProps };
