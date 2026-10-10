import { createMemo, merge, omit, untrack, type Element } from 'solid-js';
import { dynamic, isServer, type ComponentProps, type ValidComponent } from '@solidjs/web';
import { Slot, withServerInputDefaults, type SlotProps, type SlotRender } from '../slot/slot.js';
import { equalRefs } from './refs.js';

export type PrimitiveProps<T extends ValidComponent = 'button'> = Omit<ComponentProps<T>, 'children'> & {
  as?: T;
} & ({ asChild: true; children: SlotRender } | { asChild?: false; children?: Element });

export function Primitive<T extends ValidComponent = 'button'>(props: PrimitiveProps<T>): Element {
  const forwarded = omit(props, 'as', 'asChild');
  if (untrack(() => props.asChild)) {
    // The Slot boundary validates the structural render-function contract at runtime.
    const slotProps = merge(forwarded) as unknown as SlotProps;
    return Slot(slotProps);
  }
  // A props source may replace its object without changing any ref callbacks.
  const ref = createMemo(() => forwarded.ref, { equals: equalRefs });
  const native = merge(forwarded, { get ref() { return ref(); } });
  const Target = dynamic(() => props.as ?? 'button');
  // The selected tag/component consumes the same native forwarded prop view.
  const hostProps = (isServer ? withServerInputDefaults(untrack(() => props.as ?? 'button'), native) : native) as ComponentProps<T | 'button'>;
  return <Target {...hostProps} />;
}
