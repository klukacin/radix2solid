// Adapted from recharts #7570 (9d9b15d1664dea4c80b97f1fd7dfc25fac518cb1).
type MeasurableElement = Pick<Element, "getBoundingClientRect">;

export function getCalculatedXAxisHeight({
  ticks, label, labelGapWithTick = 5, tickSize = 0, tickMargin = 0,
}: {
  ticks: ArrayLike<MeasurableElement> | null;
  label: MeasurableElement | null | undefined;
  labelGapWithTick?: number;
  tickSize?: number;
  tickMargin?: number;
}): number {
  if (ticks == null) return 0;
  let maxTickHeight = 0;
  for (let index = 0; index < ticks.length; index++) {
    const tick = ticks[index];
    if (tick) maxTickHeight = Math.max(maxTickHeight, tick.getBoundingClientRect().height);
  }
  return Math.round(maxTickHeight + tickSize + tickMargin +
    (label ? label.getBoundingClientRect().height + labelGapWithTick : 0));
}
