// Generated from icons/align-bottom.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function AlignBottomIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M8 2C8.55228 2 9 2.44772 9 3V14H13.5C13.7761 14 14 14.2239 14 14.5C14 14.7761 13.7761 15 13.5 15H1.5C1.22386 15 1 14.7761 1 14.5C1 14.2239 1.22386 14 1.5 14H6V3C6 2.44772 6.44772 2 7 2H8Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default AlignBottomIcon;
