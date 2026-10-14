import { merge, omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@wsagency/radix2solid-primitives/internal';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { linkPropDefs } from './link.props.js';
import { textPropDefs } from './text.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';

export type LinkProps = ComposedProps<Omit<ComponentProps<'a'>, RemovedProps> & GetPropDefTypes<typeof linkPropDefs> & MarginProps>;
export function Link(props: LinkProps): Element {
  const parsed = extractProps(props, textPropDefs, linkPropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, 'color'), {
    as: 'a' as const,
    get ['data-accent-color']() { return parsed.color; },
    get class() { return ['rt-Text', 'rt-reset', 'rt-Link', parsed.class]; }
  });
  return <Primitive {...forwarded as PrimitiveProps<'a'>} />;
}
