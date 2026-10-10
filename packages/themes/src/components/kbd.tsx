import { merge, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@radix-solid/primitives/internal';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { kbdPropDefs } from './kbd.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';

export type KbdProps = ComposedProps<Omit<ComponentProps<'kbd'>, RemovedProps> & GetPropDefTypes<typeof kbdPropDefs> & MarginProps>;
export function Kbd(props: KbdProps): Element {
  const parsed = extractProps(props, kbdPropDefs, marginPropDefs);
  const forwarded = merge(parsed, {
    as: 'kbd' as const,
    get class() { return ['rt-reset', 'rt-Kbd', parsed.class]; }
  });
  return <Primitive {...forwarded as PrimitiveProps<'kbd'>} />;
}
