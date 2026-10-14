// Generated from icons/blending-mode.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function BlendingModeIcon(props: IconProps): Element {
  const svgProps = omit(props, 'children', 'title', 'size');
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...svgProps}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M7.5 1.5C10.5 4.25 12 6.5 12 9L11.9941 9.23145C11.8737 11.6092 9.90766 13.5 7.5 13.5C5.01472 13.5 3 11.4853 3 9C3 6.5 4.5 4.25 7.5 1.5ZM7.5 2.87598C5.02773 5.27379 4 7.11234 4 9C4 9.28259 4.03443 9.55712 4.09766 9.82031C5.96219 10.2476 8.63227 7.42971 10.9521 8.30371C10.7246 6.65104 9.6678 4.97848 7.5 2.87598Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default BlendingModeIcon;
