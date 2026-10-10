import { omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import * as ToggleGroup from '@radix-solid/primitives/toggle-group';
import { createControllableState } from '@radix-solid/primitives/internal';
import { segmentedControlRootPropDefs } from './segmented-control.props.js';
import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

type SegmentedControlRootProps = Omit<ComponentProps<'div'>, RemovedProps | 'dir'> & GetPropDefTypes<typeof segmentedControlRootPropDefs> & MarginProps & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void };
type SegmentedControlItemProps = Omit<ToggleGroup.ToggleGroupItemProps, RemovedProps | 'children' | 'disabled' | 'type' | 'value'> & { value: string; children?: Element };
function SegmentedControlRoot(props: SegmentedControlRootProps): Element {
  const parsed = extractProps(props, segmentedControlRootPropDefs, marginPropDefs);
  const [value, setValue] = createControllableState<string>({ value: () => props.value, get defaultValue() { return props.defaultValue ?? ''; }, get onChange() { return props.onValueChange; } });
  return <ToggleGroup.Root {...omit(parsed, 'children', 'class', 'radius', 'value', 'defaultValue', 'onValueChange')}
    type="single" value={value()} disabled={!!props.disabled} data-disabled={props.disabled ? '' : undefined} data-radius={parsed.radius}
    class={['rt-SegmentedControlRoot', parsed.class]} onValueChange={next => { if (next) setValue(next); }}>
    {props.children}<div class="rt-SegmentedControlIndicator" />
  </ToggleGroup.Root>;
}
function SegmentedControlItem(props: SegmentedControlItemProps): Element {
  return <ToggleGroup.Item {...omit(props, 'children', 'class')} asChild={false} disabled={false} class={['rt-reset', 'rt-SegmentedControlItem', props.class]}>
    <span class="rt-SegmentedControlItemSeparator" /><span class="rt-SegmentedControlItemLabel">
      <span class="rt-SegmentedControlItemLabelActive">{props.children}</span>
      <span class="rt-SegmentedControlItemLabelInactive" aria-hidden="true">{props.children}</span>
    </span>
  </ToggleGroup.Item>;
}
export { SegmentedControlRoot as Root, SegmentedControlItem as Item };
export type { SegmentedControlRootProps as RootProps, SegmentedControlItemProps as ItemProps };
