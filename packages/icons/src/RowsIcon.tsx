// Generated from icons/rows.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function RowsIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M14 12.8492L14 14.15L1 14.15L1 12.8492L14 12.8492ZM14 8.84921L14 10.15L1 10.15L1 8.84921L14 8.84921ZM14 4.84921L14 6.14999L1 6.14999L1 4.84921L14 4.84921ZM14 0.849213L14 2.14999L1 2.14999L1 0.849213L14 0.849213Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default RowsIcon;
