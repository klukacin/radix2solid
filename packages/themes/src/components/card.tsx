import { merge, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@radix-solid/primitives/internal';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { cardPropDefs } from './card.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';

export type CardProps = ComposedProps<Omit<ComponentProps<'div'>, RemovedProps> & GetPropDefTypes<typeof cardPropDefs> & MarginProps>;
export function Card(props: CardProps): Element {
  const parsed = extractProps(props, cardPropDefs, marginPropDefs);
  const forwarded = merge(parsed, {
    as: 'div' as const,
    get class() { return ['rt-reset', 'rt-BaseCard', 'rt-Card', parsed.class]; }
  });
  return <Primitive {...forwarded as PrimitiveProps<'div'>} />;
}
