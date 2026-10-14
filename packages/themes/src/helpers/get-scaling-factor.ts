import type { ThemeScaling } from '../components/theme.props.js';

export function getScalingFactor(value: ThemeScaling): number {
  const percentage = typeof value === 'string' && /^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?%$/i.test(value)
    ? Number(value.slice(0, -1)) : NaN;
  const factor = percentage / 100;
  if (!Number.isFinite(percentage) || !Number.isFinite(factor) || factor <= 0) {
    throw new Error(`Invalid Theme scaling: ${String(value)}. Expected a positive finite percentage.`);
  }
  return factor;
}
