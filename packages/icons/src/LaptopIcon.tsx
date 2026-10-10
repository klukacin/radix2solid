// Generated from icons/laptop.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function LaptopIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M12.75 3C13.4404 3 14 3.55964 14 4.25V12H15V12.5C15 12.7761 14.7761 13 14.5 13H0.5C0.223858 13 0 12.7761 0 12.5V12H1V4.25C1 3.55964 1.55964 3 2.25 3H12.75ZM2.25 4C2.11193 4 2 4.11193 2 4.25V11.5H13V4.25C13 4.11193 12.8881 4 12.75 4H2.25Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default LaptopIcon;
