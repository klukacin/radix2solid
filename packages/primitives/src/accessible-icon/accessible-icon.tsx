// Native port of Radix AccessibleIcon; upstream MIT, Copyright (c) 2022 WorkOS.
import { merge, untrack, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { createSlot, type SlotRender } from '../slot/slot.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

const IconSlot = createSlot('AccessibleIcon');
const hiddenIcon = { 'aria-hidden': 'true', focusable: 'false' };
export interface AccessibleIconProps { label: string; children: SlotRender; }
export function AccessibleIcon(props: AccessibleIconProps): Element {
  const render = untrack(() => props.children);
  if (typeof render !== 'function') throw new TypeError('AccessibleIcon requires a single-target render function.');
  return <>
    <IconSlot>{target => render((component, childProps) => {
      // Force accessibility fields without changing the target's other native props.
      const forwarded = merge(childProps, hiddenIcon) as ComponentProps<typeof component>;
      return target(component, forwarded);
    })}</IconSlot>
    <VisuallyHidden>{props.label}</VisuallyHidden>
  </>;
}
