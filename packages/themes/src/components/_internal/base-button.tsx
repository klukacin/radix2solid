import { merge, omit, Show, untrack, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { Primitive, type PrimitiveProps } from '@radix-solid/primitives/internal';
import { Slottable, type SlotRender } from '@radix-solid/primitives/slot';
import { extractProps } from '../../helpers/extract-props.js';
import { mapButtonSizeToSpinnerSize, mapResponsiveProp } from '../../helpers/map-prop-values.js';
import type { ComposedProps, RemovedProps } from '../../helpers/component-props.js';
import { marginPropDefs, type MarginProps } from '../../props/margin.props.js';
import type { GetPropDefTypes } from '../../props/prop-def.js';
import { baseButtonPropDefs } from './base-button.props.js';
import { Spinner } from '../spinner.js';

export type BaseButtonProps = ComposedProps<Omit<ComponentProps<'button'>, RemovedProps> & MarginProps & GetPropDefTypes<typeof baseButtonPropDefs>>;
export function BaseButton(props: BaseButtonProps): Element {
  const parsed = extractProps(props, baseButtonPropDefs, marginPropDefs);
  const disabled = () => props.disabled === undefined ? props.loading : props.disabled;
  function content(children: Element): Element {
    return <><span class="rt-ButtonContent" style={{ display: 'contents' }}>{children}</span>
      <Show when={props.loading}><span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
        <Spinner size={mapResponsiveProp(props.size ?? baseButtonPropDefs.size.default, mapButtonSizeToSpinnerSize)} />
      </span></Show></>;
  }
  const child = untrack(() => props.asChild) ? Slottable({ child: untrack(() => props.children) as SlotRender, children: content }) : undefined;
  const forwarded = merge(omit(parsed, 'children', 'color', 'radius', 'disabled'), {
    as: 'button' as const,
    get disabled() { return disabled(); }, get ['data-disabled']() { return disabled() ? 'true' : undefined; },
    get ['data-accent-color']() { return parsed.color; }, get ['data-radius']() { return parsed.radius; },
    get class() { return ['rt-reset', 'rt-BaseButton', parsed.class]; },
    get children() { return child ?? content(props.children as Element); }
  });
  return <Primitive {...forwarded as PrimitiveProps<'button'>} />;
}
