import { AxisId } from "../cartesianAxisSlice";
// Ported from recharts 3.8.1 src/state/selectors/selectTooltipAxisId.ts (commit 7a23854).
import { RechartsRootState } from "../store";

export const selectTooltipAxisId = (state: RechartsRootState): AxisId =>
  state.tooltip.settings.axisId;
