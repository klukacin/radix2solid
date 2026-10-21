// Generated from icons/border-bottom.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function BorderBottomIcon(props: IconProps): Element {
  const svgProps = omit(props, 'children', 'title', 'size');
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...svgProps}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path fill-rule="evenodd" clip-rule="evenodd" d="M1 13.25L14 13.25V14.75L1 14.75V13.25Z" fill={props.color ?? 'currentColor'}/><rect x="7" y="5" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="13" y="5" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="7" y="3" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="13" y="3" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="7" y="7" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="7" y="1" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="13" y="7" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="13" y="1" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="5" y="7" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="5" y="1" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="3" y="7" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="3" y="1" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="9" y="7" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="9" y="1" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="11" y="7" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="11" y="1" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="7" y="9" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="13" y="9" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="7" y="11" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="13" y="11" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="1" y="5" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="1" y="3" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="1" y="7" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="1" y="1" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="1" y="9" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/><rect x="1" y="11" width="1" height="1" rx=".5" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default BorderBottomIcon;
