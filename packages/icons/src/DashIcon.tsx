// Generated from icons/dash.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function DashIcon(props: IconProps): Element {
  const svgProps = omit(props, 'children', 'title', 'size');
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...svgProps}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M9.60059 7.00977C9.82855 7.05629 10 7.25829 10 7.5C10 7.74171 9.82855 7.94371 9.60059 7.99023L9.5 8H5.5C5.22386 8 5 7.77614 5 7.5C5 7.22386 5.22386 7 5.5 7H9.5L9.60059 7.00977Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default DashIcon;
