// Generated from icons/chevron-up.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function ChevronUpIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M11.1581 8.86501C11.3595 9.05356 11.6763 9.04292 11.8651 8.84157C12.0536 8.6401 12.043 8.32331 11.8416 8.13454L7.84165 4.38454C7.64941 4.20464 7.35029 4.20464 7.15805 4.38454L3.15805 8.13454L3.09165 8.21169C2.95746 8.40141 2.96967 8.66532 3.13461 8.84157C3.29985 9.01783 3.56347 9.04831 3.76157 8.92653L3.84165 8.86501L7.49985 5.4363L11.1581 8.86501Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default ChevronUpIcon;
