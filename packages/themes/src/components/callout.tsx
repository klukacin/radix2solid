import { createContext, merge, omit, useContext, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@wsagency/radix2solid-primitives/internal';
import { Text } from './text.js';
import { calloutRootPropDefs } from './callout.props.js';
import { extractProps } from '../helpers/extract-props.js';
import { mapResponsiveProp, mapCalloutSizeToTextSize } from '../helpers/map-prop-values.js';
import type { ComposedProps, ComponentPropsAs, RemovedProps } from '../helpers/component-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

type CalloutOwnProps = GetPropDefTypes<typeof calloutRootPropDefs>;
const CalloutContext = createContext<{ size?: CalloutOwnProps['size'] }>({});
export type RootProps = ComposedProps<Omit<ComponentProps<'div'>, RemovedProps> & MarginProps & CalloutOwnProps>;
export function Root(props: RootProps): Element {
  const parsed = extractProps(props, calloutRootPropDefs, marginPropDefs);
  const context = { get size() { return props.size ?? calloutRootPropDefs.size.default; } };
  const forwarded = merge({ as: 'div' as const, get ['data-accent-color']() { return parsed.color; } }, omit(parsed, 'color'), {
    get class() { return ['rt-CalloutRoot', parsed.class]; }
  });
  return <CalloutContext value={context}><Primitive {...forwarded as PrimitiveProps<'div'>} /></CalloutContext>;
}
export type IconProps = Omit<ComponentProps<'div'>, RemovedProps>;
export function Icon(props: IconProps): Element {
  return <div {...props} class={['rt-CalloutIcon', props.class]} />;
}
export type TextProps = ComponentPropsAs<typeof Text, 'p'>;
function CalloutText(props: TextProps): Element {
  const context = useContext(CalloutContext);
  const forwarded = merge({ get size() { return mapResponsiveProp(context.size, mapCalloutSizeToTextSize); } }, props, {
    get class() { return ['rt-CalloutText', props.class]; }
  });
  return <Text {...forwarded} as="p" asChild={false} />;
}
export { CalloutText as Text };
