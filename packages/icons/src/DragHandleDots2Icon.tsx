// Generated from icons/drag-handle-dots-2.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function DragHandleDots2Icon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M5.5 10.375C6.12132 10.375 6.625 10.8787 6.625 11.5C6.625 12.1213 6.12132 12.625 5.5 12.625C4.87868 12.625 4.375 12.1213 4.375 11.5C4.375 10.8787 4.87868 10.375 5.5 10.375ZM9.5 10.375C10.1213 10.375 10.625 10.8787 10.625 11.5C10.625 12.1213 10.1213 12.625 9.5 12.625C8.87868 12.625 8.375 12.1213 8.375 11.5C8.375 10.8787 8.87868 10.375 9.5 10.375ZM5.5 6.375C6.12132 6.375 6.625 6.87868 6.625 7.5C6.625 8.12132 6.12132 8.625 5.5 8.625C4.87868 8.625 4.375 8.12132 4.375 7.5C4.375 6.87868 4.87868 6.375 5.5 6.375ZM9.5 6.375C10.1213 6.375 10.625 6.87868 10.625 7.5C10.625 8.12132 10.1213 8.625 9.5 8.625C8.87868 8.625 8.375 8.12132 8.375 7.5C8.375 6.87868 8.87868 6.375 9.5 6.375ZM5.5 2.375C6.12132 2.375 6.625 2.87868 6.625 3.5C6.625 4.12132 6.12132 4.625 5.5 4.625C4.87868 4.625 4.375 4.12132 4.375 3.5C4.375 2.87868 4.87868 2.375 5.5 2.375ZM9.5 2.375C10.1213 2.375 10.625 2.87868 10.625 3.5C10.625 4.12132 10.1213 4.625 9.5 4.625C8.87868 4.625 8.375 4.12132 8.375 3.5C8.375 2.87868 8.87868 2.375 9.5 2.375Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default DragHandleDots2Icon;
