// Generated from icons/drag-handle-horizontal.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function DragHandleHorizontalIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M12.5814 10.1088C12.7632 10.1465 12.9008 10.3074 12.9008 10.5004C12.9006 10.6932 12.7632 10.8544 12.5814 10.892L12.5004 10.9008H2.50037C2.27958 10.9008 2.10019 10.7211 2.09998 10.5004C2.09998 10.2795 2.27945 10.1 2.50037 10.1H12.5004L12.5814 10.1088ZM12.5814 8.1088C12.7632 8.14645 12.9008 8.30743 12.9008 8.5004C12.9006 8.69325 12.7632 8.85443 12.5814 8.892L12.5004 8.90079H2.50037C2.27958 8.90079 2.10019 8.72113 2.09998 8.5004C2.09998 8.27948 2.27945 8.10001 2.50037 8.10001H12.5004L12.5814 8.1088ZM12.5814 6.1088C12.7632 6.14645 12.9008 6.30743 12.9008 6.5004C12.9006 6.69325 12.7632 6.85443 12.5814 6.892L12.5004 6.90079H2.50037C2.27958 6.90079 2.10019 6.72113 2.09998 6.5004C2.09998 6.27948 2.27945 6.10001 2.50037 6.10001H12.5004L12.5814 6.1088ZM12.5814 4.1088C12.7632 4.14645 12.9008 4.30743 12.9008 4.5004C12.9006 4.69325 12.7632 4.85443 12.5814 4.892L12.5004 4.90079H2.50037C2.27958 4.90079 2.10019 4.72113 2.09998 4.5004C2.09998 4.27948 2.27945 4.10001 2.50037 4.10001H12.5004L12.5814 4.1088Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default DragHandleHorizontalIcon;
