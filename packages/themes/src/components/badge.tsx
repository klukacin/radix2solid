import { merge, omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@radix-solid/primitives/internal';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { badgePropDefs } from './badge.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';

export type BadgeProps = ComposedProps<Omit<ComponentProps<'span'>, RemovedProps> & GetPropDefTypes<typeof badgePropDefs> & MarginProps>;
export function Badge(props: BadgeProps): Element {
  const parsed = extractProps(props, badgePropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, 'color'), {
    as: 'span' as const,
    get ['data-accent-color']() { return parsed.color; },
    get class() { return ['rt-Badge', parsed.class]; }
  });
  return <Primitive {...forwarded as PrimitiveProps<'span'>} />;
}
