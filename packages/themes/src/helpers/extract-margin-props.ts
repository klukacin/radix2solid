import { omit } from 'solid-js';
import type { MarginProps } from '../props/margin.props.js';

export function extractMarginProps<T extends MarginProps>(props: T) {
  const rest = omit(props, 'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml');
  return {
    get m() { return props.m; }, get mx() { return props.mx; }, get my() { return props.my; },
    get mt() { return props.mt; }, get mr() { return props.mr; }, get mb() { return props.mb; }, get ml() { return props.ml; },
    rest
  };
}
