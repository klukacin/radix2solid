import type { JSX } from "@solidjs/web";
// Ported from recharts 3.8.1 src/chart/RadarChart.tsx (commit 7a23854).
// `forwardRef`→`ref` prop; `resolveDefaultProps`→`merge` (lazy proxy, see PieChart).
// RadarChart-specific defaults: layout "centric", startAngle 90, endAngle -270.
import { merge, omit } from "solid-js";

import { arrayTooltipSearcher } from "../state/optionsSlice";
import { PolarChartProps, TooltipEventType } from "../util/types";
import { PolarChart } from "./PolarChart";

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ["axis"];

const defaultRadarChartProps = {
  layout: "centric",
  startAngle: 90,
  endAngle: -270,
} as const satisfies Partial<PolarChartProps>;

export interface RadarChartProps<
  DataPointType = unknown,
> extends PolarChartProps<DataPointType> {
  ref?: SVGSVGElement | ((el: SVGSVGElement) => void);
}

export function RadarChart<DataPointType = unknown>(
  props: RadarChartProps<DataPointType>,
): JSX.Element {
  const categoricalChartProps = merge(
    defaultRadarChartProps,
    omit(props, "ref"),
  );

  return (
    <PolarChart
      chartName="RadarChart"
      defaultTooltipEventType="axis"
      validateTooltipEventTypes={allowedTooltipTypes}
      tooltipPayloadSearcher={arrayTooltipSearcher}
      categoricalChartProps={categoricalChartProps}
      ref={props.ref}
    />
  );
}
