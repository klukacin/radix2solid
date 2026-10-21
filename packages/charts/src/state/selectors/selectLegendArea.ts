import type { CartesianViewBoxRequired } from "../../util/types";
// Adapted from recharts #7564 (082495ac4b05070b745089b2d82db2dc1eb8ccc8).
import type { RechartsRootState } from "../store";
import {
  selectChartHeight,
  selectChartWidth,
  selectMargin,
} from "./containerSelectors";

export function selectLegendArea(
  state: RechartsRootState,
): CartesianViewBoxRequired {
  const margin = selectMargin(state);
  return {
    x: margin.left || 0,
    y: margin.top || 0,
    width: Math.max(
      selectChartWidth(state) - (margin.left || 0) - (margin.right || 0),
      0,
    ),
    height: Math.max(
      selectChartHeight(state) - (margin.top || 0) - (margin.bottom || 0),
      0,
    ),
  };
}
