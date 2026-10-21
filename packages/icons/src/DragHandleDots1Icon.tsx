// Generated from icons/drag-handle-dots-1.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function DragHandleDots1Icon(props: IconProps): Element {
  const svgProps = omit(props, 'children', 'title', 'size');
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...svgProps}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <circle cx="4.5" cy="2.5" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="4.5" cy="4.5" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="4.5" cy="6.499" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="4.5" cy="8.499" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="4.5" cy="10.498" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="4.5" cy="12.498" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="6.5" cy="2.5" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="6.5" cy="4.5" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="6.5" cy="6.499" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="6.5" cy="8.499" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="6.5" cy="10.498" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="6.5" cy="12.498" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="8.499" cy="2.5" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="8.499" cy="4.5" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="8.499" cy="6.499" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="8.499" cy="8.499" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="8.499" cy="10.498" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="8.499" cy="12.498" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="10.499" cy="2.5" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="10.499" cy="4.5" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="10.499" cy="6.499" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="10.499" cy="8.499" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="10.499" cy="10.498" r=".6" fill={props.color ?? 'currentColor'}/><circle cx="10.499" cy="12.498" r=".6" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default DragHandleDots1Icon;
