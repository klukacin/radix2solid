import { merge, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@radix-solid/primitives/internal';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { quotePropDefs } from './quote.props.js';

export type QuoteProps = ComposedProps<Omit<ComponentProps<'q'>, RemovedProps> & GetPropDefTypes<typeof quotePropDefs>>;
export function Quote(props: QuoteProps): Element {
  const parsed = extractProps(props, quotePropDefs);
  const forwarded = merge(parsed, {
    as: 'q' as const,
    get class() { return ['rt-Quote', parsed.class]; }
  });
  return <Primitive {...forwarded as PrimitiveProps<'q'>} />;
}
