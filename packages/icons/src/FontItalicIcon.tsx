// Generated from icons/font-italic.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function FontItalicIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M10.6252 3.05018C10.8736 3.05028 11.0754 3.25191 11.0754 3.50037C11.0753 3.74875 10.8736 3.95047 10.6252 3.95057H9.00604L7.23065 11.0502H8.87518C9.12362 11.0503 9.32538 11.2519 9.32538 11.5004C9.32521 11.7487 9.12352 11.9495 8.87518 11.9496H4.37518C4.12676 11.9496 3.92516 11.7488 3.92499 11.5004C3.92499 11.2518 4.12665 11.0502 4.37518 11.0502H5.99432L7.76971 3.95057H6.12518C5.87672 3.95057 5.67509 3.74881 5.67499 3.50037C5.67499 3.25185 5.87665 3.05018 6.12518 3.05018H10.6252Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default FontItalicIcon;
