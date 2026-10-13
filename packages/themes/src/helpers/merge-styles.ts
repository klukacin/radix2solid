import { mergeStyles as mergeNativeStyles } from '@wsagency/radix2solid-primitives/internal';
import type { JSX } from '@solidjs/web';

export function mergeStyles(...styles: (JSX.HTMLAttributes<HTMLElement>['style'] | null)[]): JSX.CSSProperties | string | undefined {
  let result: JSX.CSSProperties | string | undefined;
  for (const style of styles) if (style != null && style !== false) result = result === undefined ? style : mergeNativeStyles(result, style);
  return result;
}
