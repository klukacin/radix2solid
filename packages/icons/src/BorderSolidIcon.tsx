// Generated from icons/border-solid.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function BorderSolidIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M13.3506 7.00977C13.5786 7.05629 13.75 7.25829 13.75 7.5C13.75 7.74171 13.5786 7.94371 13.3506 7.99023L13.25 8H1.75C1.47386 8 1.25 7.77614 1.25 7.5C1.25 7.22386 1.47386 7 1.75 7H13.25L13.3506 7.00977Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default BorderSolidIcon;
