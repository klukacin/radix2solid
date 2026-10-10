import { merge, omit, untrack, type Element } from 'solid-js';
import { createContextScope, type Scope } from '@radix-solid/primitives/internal';
import * as CheckboxGroupPrimitive from './checkbox-group.primitive.js';
import { checkboxCardsRootPropDefs } from './checkbox-cards.props.js';
import { baseCheckboxPropDefs } from './_internal/base-checkbox.props.js';
import { Grid } from './grid.js';
import { ThickCheckIcon } from './icons.js';
import { extractProps } from '../helpers/extract-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { ComposedProps, RemovedProps } from '../helpers/component-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';

const [createContext] = createContextScope('CheckboxCards', [CheckboxGroupPrimitive.createCheckboxGroupScope]);
const useScope = CheckboxGroupPrimitive.createCheckboxGroupScope();
type Settings = Pick<GetPropDefTypes<typeof checkboxCardsRootPropDefs>, 'size' | 'highContrast'>;
const [Provider, useCards] = createContext<Settings>('CheckboxCards');
type CheckboxCardsRootProps = ComposedProps<Omit<CheckboxGroupPrimitive.CheckboxGroupProps, 'color' | 'defaultChecked'> & MarginProps & GetPropDefTypes<typeof checkboxCardsRootPropDefs> & { __scopeCheckboxCards?: Scope }>;
type CheckboxCardsItemProps = Omit<CheckboxGroupPrimitive.CheckboxGroupItemProps, RemovedProps | 'children'> & MarginProps & { __scopeCheckboxCards?: Scope; children?: Element };
function CheckboxCardsRoot(props: CheckboxCardsRootProps): Element {
  const scope = untrack(() => props.__scopeCheckboxCards), primitiveScope = useScope(scope);
  const parsed = extractProps(props, checkboxCardsRootPropDefs, marginPropDefs);
  const context = { get size() { return props.size; }, get highContrast() { return props.highContrast; } };
  return <Provider scope={scope} value={context}><Grid asChild>{target => target(CheckboxGroupPrimitive.Root,
    merge(omit(parsed, '__scopeCheckboxCards', 'class', 'color'), primitiveScope, {
      get ['data-accent-color']() { return parsed.color; }, get class() { return ['rt-CheckboxCardsRoot', parsed.class]; } }) as CheckboxGroupPrimitive.CheckboxGroupProps)}
  </Grid></Provider>;
}
function CheckboxCardsItem(props: CheckboxCardsItemProps): Element {
  const scope = untrack(() => props.__scopeCheckboxCards), context = useCards('CheckboxCardsItem', scope), primitiveScope = useScope(scope);
  const parsed = extractProps({ get size() { return context.size; }, variant: 'surface', get highContrast() { return context.highContrast; } }, baseCheckboxPropDefs);
  return <label class={['rt-BaseCard', 'rt-CheckboxCardsItem', props.class]} style={props.style}>{props.children}
    <CheckboxGroupPrimitive.Item {...omit(props, '__scopeCheckboxCards', 'children', 'class', 'style')} {...primitiveScope} asChild={false}
      class={['rt-reset', 'rt-BaseCheckboxRoot', 'rt-CheckboxCardCheckbox', parsed.class]}>
      <CheckboxGroupPrimitive.Indicator {...primitiveScope} asChild class="rt-BaseCheckboxIndicator">{target => target(ThickCheckIcon, {})}</CheckboxGroupPrimitive.Indicator>
    </CheckboxGroupPrimitive.Item>
  </label>;
}
export { CheckboxCardsRoot as Root, CheckboxCardsItem as Item };
export type { CheckboxCardsRootProps as RootProps, CheckboxCardsItemProps as ItemProps };
