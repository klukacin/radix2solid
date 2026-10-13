import { merge, omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@wsagency/radix2solid-primitives/internal';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { codePropDefs } from './code.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';

export type CodeProps = ComposedProps<Omit<ComponentProps<'code'>, RemovedProps> & GetPropDefTypes<typeof codePropDefs> & MarginProps>;
export function Code(props: CodeProps): Element {
  const parsed = extractProps(props, codePropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, 'color'), {
    as: 'code' as const,
    get ['data-accent-color']() { return props.variant === 'ghost' ? parsed.color || undefined : parsed.color; },
    get class() { return ['rt-reset', 'rt-Code', parsed.class]; }
  });
  return <Primitive {...forwarded as PrimitiveProps<'code'>} />;
}
