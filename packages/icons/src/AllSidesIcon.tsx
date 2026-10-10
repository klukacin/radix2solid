// Generated from icons/all-sides.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function AllSidesIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M7.5 14.25L5.25 12H9.75L7.5 14.25ZM3 9.75L0.75 7.5L3 5.25V9.75ZM14.25 7.5L12 9.75V5.25L14.25 7.5ZM9.75 3H5.25L7.5 0.75L9.75 3Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default AllSidesIcon;
