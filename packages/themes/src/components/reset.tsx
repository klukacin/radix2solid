import { merge, type Element } from 'solid-js';
import { Slot, type SlotProps } from '@wsagency/radix2solid-primitives/slot';

export type ResetProps = SlotProps;
export function Reset(props: ResetProps): Element {
  return <Slot {...merge(props, { get class() { return ['rt-reset', props.class]; } })} />;
}
