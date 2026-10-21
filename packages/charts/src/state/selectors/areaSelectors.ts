import { computeArea, ComputedArea } from "../../cartesian/Area";
import { selectChartLayout } from "../../context/chartLayoutContext";
import { getBandSizeOfAxis, isCategoricalAxis } from "../../util/ChartUtils";
import { isNotNil } from "../../util/DataUtils";
import { AllStackGroups, StackDataPoint } from "../../util/stacks/stackTypes";
import { ChartData } from "../chartDataSlice";
import { GraphicalItemId } from "../graphicalItemsSlice";
// Ported from recharts 3.8.1 src/state/selectors/areaSelectors.ts (commit 7a23854).
// Solid-native plain selectors (no reselect). Stacked areas are wired:
// The area's numeric-axis stack group supplies both its series and all stack keys.
import { RechartsRootState } from "../store";
import { AreaSettings } from "../types/AreaSettings";
import {
  selectStackGroups,
  selectUnfilteredCartesianItems,
} from "./axisSelectors";
import { combineStackedData } from "./combiners/combineStackedData";
import { selectChartDataWithIndexesIfNotInPanoramaPosition3 } from "./dataSelectors";
import {
  selectXAxisIdFromGraphicalItemId,
  selectYAxisIdFromGraphicalItemId,
} from "./graphicalItemSelectors";
import { selectChartBaseValue } from "./rootPropsSelectors";
import {
  selectAxisWithScaleForGraphicalItem,
  selectTicksForGraphicalItem,
} from "./selectAxisForGraphicalItem";

const selectBandSize = (
  state: RechartsRootState,
  id: GraphicalItemId,
  isPanorama: boolean,
): number | undefined => {
  const layout = selectChartLayout(state);
  if (isCategoricalAxis(layout, "xAxis")) {
    return getBandSizeOfAxis(
      selectAxisWithScaleForGraphicalItem(state, "xAxis", id, isPanorama),
      selectTicksForGraphicalItem(state, "xAxis", id, isPanorama),
      false,
    );
  }
  return getBandSizeOfAxis(
    selectAxisWithScaleForGraphicalItem(state, "yAxis", id, isPanorama),
    selectTicksForGraphicalItem(state, "yAxis", id, isPanorama),
    false,
  );
};

const selectSynchronisedAreaSettings = (
  state: RechartsRootState,
  id: GraphicalItemId,
): AreaSettings | undefined => {
  const item = selectUnfilteredCartesianItems(state).find((it) => it.id === id);
  return item != null && item.type === "area" ? item : undefined;
};

// The numeric axis stacks against (the non-categorical axis): yAxis for a
// horizontal layout, xAxis for a vertical one.
const selectAreaStackGroups = (
  state: RechartsRootState,
  id: GraphicalItemId,
  isPanorama: boolean,
): AllStackGroups | undefined => {
  const layout = selectChartLayout(state);
  if (isCategoricalAxis(layout, "xAxis")) {
    return selectStackGroups(
      state,
      "yAxis",
      selectYAxisIdFromGraphicalItemId(state, id),
      isPanorama,
    );
  }
  return selectStackGroups(
    state,
    "xAxis",
    selectXAxisIdFromGraphicalItemId(state, id),
    isPanorama,
  );
};

export const selectArea = (
  state: RechartsRootState,
  id: GraphicalItemId,
  isPanorama: boolean,
): ComputedArea | undefined => {
  const layout = selectChartLayout(state);
  const xAxis = selectAxisWithScaleForGraphicalItem(
    state,
    "xAxis",
    id,
    isPanorama,
  );
  const yAxis = selectAxisWithScaleForGraphicalItem(
    state,
    "yAxis",
    id,
    isPanorama,
  );
  const xAxisTicks = selectTicksForGraphicalItem(
    state,
    "xAxis",
    id,
    isPanorama,
  );
  const yAxisTicks = selectTicksForGraphicalItem(
    state,
    "yAxis",
    id,
    isPanorama,
  );
  const { chartData, dataStartIndex, dataEndIndex } =
    selectChartDataWithIndexesIfNotInPanoramaPosition3(state, id, isPanorama);
  const bandSize = selectBandSize(state, id, isPanorama);
  const areaSettings = selectSynchronisedAreaSettings(state, id);
  const chartBaseValue = selectChartBaseValue(state);
  const stackGroups = selectAreaStackGroups(state, id, isPanorama);
  const stackedData = combineStackedData(stackGroups, areaSettings)?.map(
    (item): StackDataPoint => [item[0], item[1]],
  );
  const stackDataKeys =
    areaSettings?.stackId == null
      ? undefined
      : stackGroups?.[areaSettings.stackId]?.graphicalItems
          .map((item) => item.dataKey)
          .filter(isNotNil);

  if (
    areaSettings == null ||
    (layout !== "horizontal" && layout !== "vertical") ||
    xAxis == null ||
    yAxis == null ||
    xAxisTicks == null ||
    yAxisTicks == null ||
    xAxisTicks.length === 0 ||
    yAxisTicks.length === 0 ||
    bandSize == null
  ) {
    return undefined;
  }

  const { data } = areaSettings;
  let displayedData: ChartData | undefined;
  if (data && data.length > 0) {
    displayedData = data;
  } else {
    displayedData = chartData?.slice(dataStartIndex, dataEndIndex + 1);
  }

  if (displayedData == null) {
    return undefined;
  }

  return computeArea({
    layout,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    areaSettings,
    displayedData,
    stackedData,
    dataStartIndex,
    chartBaseValue,
    bandSize,
    stackDataKeys,
  });
};
