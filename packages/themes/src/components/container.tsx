import { merge, omit, untrack, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@radix-solid/primitives/internal';
import { Slottable, type SlotRender } from '@radix-solid/primitives/slot';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import { layoutPropDefs, type LayoutProps } from '../props/layout.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import { widthPropDefs } from '../props/width.props.js';
import { heightPropDefs } from '../props/height.props.js';
import { containerPropDefs, type ContainerOwnProps } from './container.props.js';

export type ContainerProps = ComposedProps<Omit<ComponentProps<'div'>, RemovedProps> & MarginProps & LayoutProps & ContainerOwnProps>;
export function Container(props: ContainerProps): Element {
  const outer = extractProps(omit(props, 'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight'), containerPropDefs, layoutPropDefs, marginPropDefs);
  const inner = extractProps({
    get width() { return props.width; }, get minWidth() { return props.minWidth; }, get maxWidth() { return props.maxWidth; },
    get height() { return props.height; }, get minHeight() { return props.minHeight; }, get maxHeight() { return props.maxHeight; }
  }, widthPropDefs, heightPropDefs);
  const wrap = (content: Element): Element => <div class={['rt-ContainerInner', inner.class]} style={inner.style}>{content}</div>;
  const child = untrack(() => props.asChild) ? Slottable({ child: untrack(() => props.children) as SlotRender, children: wrap }) : undefined;
  const forwarded = merge(omit(outer, 'children'), {
    as: 'div' as const, get class() { return ['rt-Container', outer.class]; },
    get children() { return child ?? wrap(props.children as Element); }
  });
  return <Primitive {...forwarded as PrimitiveProps<'div'>} />;
}
