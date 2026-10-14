// Generated from icons/sewing-pin-filled.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function SewingPinFilledIcon(props: IconProps): Element {
  const svgProps = omit(props, 'children', 'title', 'size');
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...svgProps}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M7.5 1C8.88071 1 10 2.11929 10 3.5C10 4.70943 9.14105 5.71753 8 5.94922V13.5C8 13.7761 7.77614 14 7.5 14C7.22386 14 7 13.7761 7 13.5V5.94922C5.85895 5.71753 5 4.70943 5 3.5C5 2.11929 6.11929 1 7.5 1Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default SewingPinFilledIcon;
