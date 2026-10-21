// Generated from icons/align-left.svg; run pnpm generate, do not edit.
import { omit, type Element } from 'solid-js';
import type { IconProps } from './types.js';

import { IconTitle } from './title.js';

export function AlignLeftIcon(props: IconProps): Element {
  const svgProps = omit(props, 'children', 'title', 'size');
  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}
    {...svgProps}>
    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}
    <path d="M-5.46388e-07 1.49999C1.19309e-06 1.22385 0.223856 0.999992 0.499995 0.999992C0.776135 0.999992 0.99999 1.22385 0.999991 1.49999L0.999992 5.99995L11.9999 5.99995C12.5522 5.99995 12.9999 6.44766 12.9999 6.99994L12.9999 7.99993C12.9999 8.55221 12.5522 8.99993 11.9999 8.99993L0.999992 8.99993L0.999992 13.4999C0.999992 13.776 0.776136 13.9999 0.499996 13.9999C0.223856 13.9999 -2.18555e-08 13.776 -2.18555e-08 13.4999L-5.46388e-07 1.49999Z" fill={props.color ?? 'currentColor'}/>
  </svg>;
}

export default AlignLeftIcon;
