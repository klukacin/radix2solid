import { merge, omit, Show, untrack, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Slot, type SlotProps } from '@radix-solid/primitives/slot';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { skeletonPropDefs } from './skeleton.props.js';

export type SkeletonProps = ComposedProps<Omit<ComponentProps<'span'>, RemovedProps> & MarginProps & GetPropDefTypes<typeof skeletonPropDefs>>;
export function Skeleton(props: SkeletonProps): Element {
  const parsed = extractProps(props, skeletonPropDefs, marginPropDefs);
  const loading = () => parsed.loading ?? true;
  const rest = omit(parsed, 'children', 'asChild', 'loading');
  const attributes: Partial<ComponentProps<'span'>> = {};
  for (const key of untrack(() => Object.keys(rest))) {
    Object.defineProperty(attributes, key, { enumerable: true, get: () => loading() ? Reflect.get(rest, key) : undefined });
  }
  const forwarded = merge(attributes, {
    get class() { return loading() ? ['rt-Skeleton', parsed.class] : undefined; },
    get ['aria-hidden']() { return loading() ? 'true' as const : undefined; },
    get tabindex() { return loading() ? -1 : undefined; },
    get inert() { return loading() ? true : undefined; }
  });
  if (untrack(() => props.asChild)) return <Slot {...forwarded as Omit<SlotProps, 'children'>}>{props.children as SlotProps['children']}</Slot>;
  return <Show when={loading()} fallback={props.children as Element}>
    <span {...forwarded} data-inline-skeleton>{props.children as Element}</span>
  </Show>;
}
