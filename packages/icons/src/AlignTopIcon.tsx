// Generated from icons/align-top.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function AlignTopIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M13.5 7.62939e-06C13.7761 7.82267e-06 14 0.223865 14 0.500008C14 0.77615 13.7761 1.00001 13.5 1.00001H9V12C9 12.5523 8.55228 13 8 13H7C6.44772 13 6 12.5523 6 12V1.00001H1.5C1.22386 1.00001 1 0.77615 1 0.500008C1 0.223865 1.22386 7.63946e-06 1.5 7.62939e-06H13.5Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default AlignTopIcon;
