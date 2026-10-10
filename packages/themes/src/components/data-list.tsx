import { merge, omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Text } from './text.js';
import { dataListRootPropDefs, dataListItemPropDefs, dataListLabelPropDefs } from './data-list.props.js';
import { extractProps } from '../helpers/extract-props.js';
import type { RemovedProps } from '../helpers/component-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

export type RootProps = Omit<ComponentProps<'dl'>, RemovedProps> & MarginProps & GetPropDefTypes<typeof dataListRootPropDefs>;
export function Root(props: RootProps): Element {
  const parsed = extractProps(props, dataListRootPropDefs, marginPropDefs);
  const forwarded = merge(parsed, { get class() { return ['rt-DataListRoot', parsed.class]; } });
  return <Text asChild>{target => target('dl', forwarded)}</Text>;
}
export type ItemProps = Omit<ComponentProps<'div'>, RemovedProps> & GetPropDefTypes<typeof dataListItemPropDefs>;
export function Item(props: ItemProps): Element {
  const parsed = extractProps(props, dataListItemPropDefs);
  return <div {...parsed} class={['rt-DataListItem', parsed.class]} />;
}
export type LabelProps = Omit<ComponentProps<'dt'>, RemovedProps> & GetPropDefTypes<typeof dataListLabelPropDefs>;
export function Label(props: LabelProps): Element {
  const parsed = extractProps(props, dataListLabelPropDefs);
  const forwarded = merge(omit(parsed, 'color'), { get ['data-accent-color']() { return parsed.color; },
    get class() { return ['rt-DataListLabel', parsed.class]; } });
  return <dt {...forwarded} />;
}
export type ValueProps = Omit<ComponentProps<'dd'>, RemovedProps>;
export function Value(props: ValueProps): Element {
  return <dd {...props} class={[props.class, 'rt-DataListValue']} />;
}
