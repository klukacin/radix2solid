// Generated from icons/magnifying-glass.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function MagnifyingGlassIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56246 10.6304 8.5378 10.0146 9.30762L12.8535 12.1465L12.918 12.2246C13.0461 12.4187 13.0244 12.6827 12.8535 12.8535C12.6827 13.0244 12.4187 13.0461 12.2246 12.918L12.1465 12.8535L9.30762 10.0146C8.5378 10.6304 7.56246 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2ZM6.5 3C4.567 3 3 4.567 3 6.5C3 8.433 4.567 10 6.5 10C8.433 10 10 8.433 10 6.5C10 4.567 8.433 3 6.5 3Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default MagnifyingGlassIcon;
