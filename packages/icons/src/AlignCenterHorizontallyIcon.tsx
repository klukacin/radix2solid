// Generated from icons/align-center-horizontally.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function AlignCenterHorizontallyIcon(props: IconProps): Element {
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...omit(props, 'children', 'title', 'size')}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M13.9999 8.00001C13.9999 8.55229 13.5522 9.00001 12.9999 9.00001L7.99988 9.00001L7.99988 13.5C7.99988 13.7761 7.77602 14 7.49988 14C7.22374 14 6.99988 13.7761 6.99988 13.5L6.99988 9.00001L1.99988 9.00001C1.44759 9.00001 0.999878 8.55229 0.999878 8.00001L0.999878 7.00001C0.999878 6.44772 1.44759 6.00001 1.99988 6.00001L6.99988 6.00001L6.99988 1.50001C6.99988 1.22387 7.22374 1.00001 7.49988 1.00001C7.77602 1.00001 7.99988 1.22387 7.99988 1.50001L7.99988 6.00001L12.9999 6.00001C13.5522 6.00001 13.9999 6.44772 13.9999 7.00001L13.9999 8.00001Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default AlignCenterHorizontallyIcon;
