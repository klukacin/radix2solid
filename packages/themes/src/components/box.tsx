import { merge, omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@wsagency/radix2solid-primitives/internal';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { boxPropDefs } from './box.props.js';
import { layoutPropDefs, type LayoutProps } from '../props/layout.props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';

export type BoxProps = ComposedProps<(({ as?: 'div' } & Omit<ComponentProps<'div'>, RemovedProps>) | ({ as: 'span' } & Omit<ComponentProps<'span'>, RemovedProps>)) & GetPropDefTypes<typeof boxPropDefs> & LayoutProps & MarginProps>;
export function Box(props: BoxProps): Element {
  const parsed = extractProps(props, boxPropDefs, layoutPropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, 'as'), {
    get as() { return parsed.as ?? 'div'; },
    get class() { return ['rt-Box', parsed.class]; }
  });
  return <Primitive {...forwarded as PrimitiveProps<'div' | 'span'>} />;
}
