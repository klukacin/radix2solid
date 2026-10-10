import { merge, type Element } from 'solid-js';
import { BaseButton, type BaseButtonProps } from './_internal/base-button.js';

export type IconButtonProps = BaseButtonProps;
export function IconButton(props: IconButtonProps): Element {
  return <BaseButton {...merge(props, { get class() { return ['rt-IconButton', props.class]; } })} />;
}
