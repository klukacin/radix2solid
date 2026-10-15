// Ported from recharts 3.8.1 src/chart/FunnelChart.tsx (commit 7a23854).
// `forwardRef` → `ref` prop; thin user-facing wrapper over CartesianChart.
import type { JSX } from "@solidjs/web";

import { arrayTooltipSearcher } from "../state/optionsSlice";
import { CartesianChartProps, TooltipEventType } from "../util/types";
import { CartesianChart } from "./CartesianChart";

const allowedTooltipTypes: ReadonlyArray<TooltipEventType> = ["item"];

export interface FunnelChartProps<
  DataPointType = unknown,
> extends CartesianChartProps<DataPointType> {
  ref?: SVGSVGElement | ((el: SVGSVGElement) => void);
}

export function FunnelChart<DataPointType = unknown>(
  props: FunnelChartProps<DataPointType>,
): JSX.Element {
  return (
    <CartesianChart
      chartName="FunnelChart"
      defaultTooltipEventType="item"
      validateTooltipEventTypes={allowedTooltipTypes}
      tooltipPayloadSearcher={arrayTooltipSearcher}
      categoricalChartProps={props}
      ref={props.ref}
    />
  );
}
