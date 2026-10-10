import { merge, omit, type Element } from 'solid-js';
import type { ComponentProps } from '@solidjs/web';
import { extractProps } from '../helpers/extract-props.js';
import type { RemovedProps } from '../helpers/component-props.js';
import { marginPropDefs, type MarginProps } from '../props/margin.props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { separatorPropDefs } from './separator.props.js';

export type SeparatorProps = Omit<ComponentProps<'span'>, RemovedProps> & MarginProps & GetPropDefTypes<typeof separatorPropDefs>;
export function Separator(props: SeparatorProps): Element {
  const parsed = extractProps(props, separatorPropDefs, marginPropDefs);
  const forwarded = merge({
    get ['data-accent-color']() { return parsed.color; },
    get role() { return parsed.decorative ? undefined : 'separator' as const; }
  }, omit(parsed, 'color', 'decorative'), { get class() { return ['rt-Separator', parsed.class]; } });
  return <span {...forwarded} />;
}
