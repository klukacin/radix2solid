import { merge, omit, type Element } from 'solid-js';
import * as RadioGroupPrimitive from '@wsagency/radix2solid-primitives/radio-group';
import { radioCardsRootPropDefs } from './radio-cards.props.js';
import { Grid } from './grid.js';
import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

type RadioCardsRootProps = ComposedProps<Omit<RadioGroupPrimitive.RadioGroupProps, 'color' | 'defaultChecked'> & MarginProps & GetPropDefTypes<typeof radioCardsRootPropDefs>>;
type RadioCardsItemProps = Omit<RadioGroupPrimitive.RadioGroupItemProps, RemovedProps | 'children'> & MarginProps & { children?: Element };
function RadioCardsRoot(props: RadioCardsRootProps): Element {
  const parsed = extractProps(props, radioCardsRootPropDefs, marginPropDefs);
  const forwarded = merge(omit(parsed, 'color', 'class'), { get ['data-accent-color']() { return parsed.color; }, get class() { return ['rt-RadioCardsRoot', parsed.class]; } });
  return <Grid asChild>{target => target(RadioGroupPrimitive.Root, forwarded as RadioGroupPrimitive.RadioGroupProps)}</Grid>;
}
function RadioCardsItem(props: RadioCardsItemProps): Element {
  const itemProps = omit(props, 'class');
  return <RadioGroupPrimitive.Item {...itemProps} asChild={false} class={['rt-reset', 'rt-BaseCard', 'rt-RadioCardsItem', props.class]} />;
}
export { RadioCardsRoot as Root, RadioCardsItem as Item };
export type { RadioCardsRootProps as RootProps, RadioCardsItemProps as ItemProps };
