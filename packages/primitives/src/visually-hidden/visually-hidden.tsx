import { merge, type Element } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { mergeStyles } from '../slot/slot.js';

export const VISUALLY_HIDDEN_STYLES = Object.freeze({
  position: 'absolute', border: 0, width: '1px', height: '1px', padding: 0, margin: '-1px',
  overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', 'white-space': 'nowrap', 'word-wrap': 'normal'
}) satisfies JSX.CSSProperties;
export type VisuallyHiddenProps = PrimitiveProps<'span'>;
export function VisuallyHidden(props: VisuallyHiddenProps): Element {
  const forwarded = merge(props, { get style() { return mergeStyles(VISUALLY_HIDDEN_STYLES, props.style); } });
  return <Primitive as="span" {...forwarded} />;
}
