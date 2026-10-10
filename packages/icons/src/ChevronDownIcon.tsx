// Generated from icons/chevron-down.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function ChevronDownIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M11.1581 6.13499C11.3595 5.94644 11.6763 5.95708 11.8651 6.15843C12.0536 6.3599 12.043 6.67669 11.8416 6.86546L7.84165 10.6155C7.64941 10.7954 7.35029 10.7954 7.15805 10.6155L3.15805 6.86546L3.09165 6.78831C2.95746 6.59859 2.96967 6.33468 3.13461 6.15843C3.29985 5.98217 3.56347 5.95169 3.76157 6.07347L3.84165 6.13499L7.49985 9.5637L11.1581 6.13499Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default ChevronDownIcon;
