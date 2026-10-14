import { merge, type Element } from 'solid-js';
import { BaseButton, type BaseButtonProps } from './_internal/base-button.js';

export type ButtonProps = BaseButtonProps;
export function Button(props: ButtonProps): Element {
  const forwarded = merge(props, { get class() { return ['rt-Button', props.class]; } });
  return <BaseButton {...forwarded} />;
}
