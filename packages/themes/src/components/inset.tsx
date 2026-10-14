import { merge, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@wsagency/radix2solid-primitives/internal';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { insetPropDefs } from './inset.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';

export type InsetProps = ComposedProps<Omit<ComponentProps<'div'>, RemovedProps> & GetPropDefTypes<typeof insetPropDefs> & MarginProps>;
export function Inset(props: InsetProps): Element {
  const parsed = extractProps(props, insetPropDefs, marginPropDefs);
  const forwarded = merge(parsed, {
    as: 'div' as const,
    get class() { return ['rt-Inset', parsed.class]; }
  });
  return <Primitive {...forwarded as PrimitiveProps<'div'>} />;
}
