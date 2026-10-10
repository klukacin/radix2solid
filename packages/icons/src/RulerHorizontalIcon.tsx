// Generated from icons/ruler-horizontal.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function RulerHorizontalIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M14.6006 4.00977C14.8286 4.05629 15 4.25829 15 4.5V10.5C15 10.7761 14.7761 11 14.5 11H0.5C0.223858 11 0 10.7761 0 10.5V4.5L0.00976562 4.39941C0.056292 4.17145 0.258287 4 0.5 4H14.5L14.6006 4.00977ZM1 10H14V5H12.9248V6.5C12.9248 6.73472 12.7347 6.9248 12.5 6.9248C12.2653 6.9248 12.0752 6.73472 12.0752 6.5V5H10.9248V6.5C10.9248 6.73472 10.7347 6.9248 10.5 6.9248C10.2653 6.9248 10.0752 6.73472 10.0752 6.5V5H8.9248V7.5C8.9248 7.73472 8.73472 7.9248 8.5 7.9248C8.26528 7.9248 8.0752 7.73472 8.0752 7.5V5H6.9248V6.5C6.9248 6.73472 6.73472 6.9248 6.5 6.9248C6.26528 6.9248 6.0752 6.73472 6.0752 6.5V5H4.9248V6.5C4.9248 6.73472 4.73472 6.9248 4.5 6.9248C4.26528 6.9248 4.0752 6.73472 4.0752 6.5V5H2.9248V7.5C2.9248 7.73472 2.73472 7.9248 2.5 7.9248C2.26528 7.9248 2.0752 7.73472 2.0752 7.5V5H1V10Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default RulerHorizontalIcon;
