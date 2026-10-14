// Generated from icons/divider-vertical.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function DividerVerticalIcon(props: IconProps): Element {
  const svgProps = omit(props, 'children', 'title', 'size');
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...svgProps}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M7.5 2C7.77614 2 8 2.22386 8 2.5V12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5V2.5C7 2.22386 7.22386 2 7.5 2Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default DividerVerticalIcon;
