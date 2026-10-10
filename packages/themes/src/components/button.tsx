import { merge, type Element } from 'solid-js';
import { BaseButton, type BaseButtonProps } from './_internal/base-button.js';

export type ButtonProps = BaseButtonProps;
export function Button(props: ButtonProps): Element {
  return <BaseButton {...merge(props, { get class() { return ['rt-Button', props.class]; } })} />;
}
