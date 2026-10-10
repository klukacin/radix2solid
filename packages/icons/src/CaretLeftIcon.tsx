// Generated from icons/caret-left.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function CaretLeftIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M5.04988 7.50012C5.04994 7.6194 5.09737 7.73413 5.18172 7.81848L8.18172 10.8185L8.25203 10.8761C8.4267 10.9914 8.66466 10.9723 8.81844 10.8185C8.97222 10.6647 8.99141 10.4267 8.87606 10.2521L8.81844 10.1818L6.1368 7.50012L8.81844 4.81848C8.99411 4.64281 8.99398 4.35751 8.81844 4.18176C8.6427 4.00602 8.35746 4.00602 8.18172 4.18176L5.18172 7.18176C5.09733 7.26615 5.04988 7.38077 5.04988 7.50012Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default CaretLeftIcon;
