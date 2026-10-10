import { merge, type Element } from 'solid-js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';

export type ArrowProps = PrimitiveProps<'svg'>;
export function Arrow(props: ArrowProps): Element {
  const forwarded = merge(props, {
    get width() { return props.width ?? 10; },
    get height() { return props.height ?? 5; },
    viewBox: '0 0 30 10', preserveAspectRatio: 'none' as const,
    get children() { return props.asChild ? props.children : <polygon points="0,0 30,0 15,10" />; }
  }) as ArrowProps;
  return <Primitive as="svg" {...forwarded} />;
}
