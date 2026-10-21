import {
  createBrushSlice,
  type BrushActions,
  type BrushSettings,
} from "./brushSlice";
import {
  createCartesianAxisSlice,
  type AxisMapState,
  type CartesianAxisActions,
} from "./cartesianAxisSlice";
// Solid-native replacement for recharts 3.8.1 src/state/store.ts.
//
// recharts uses @reduxjs/toolkit `configureStore` + `combineReducers` over 16
// slices. The Solid-native store has no reducers/dispatch: each slice is a
// factory returning `{ state, actions }` (a Solid store + its setters), and the
// root store composes them — `state` mirrors the slice state proxies, `actions`
// namespaces the slice actions by slice name (symmetric with `state`).
//
import {
  createChartDataSlice,
  type ChartDataActions,
  type ChartDataState,
} from "./chartDataSlice";
import {
  createChartInitializer,
  type ChartStateInitializer,
} from "./createChartState";
import {
  createErrorBarSlice,
  type ErrorBarsActions,
  type ErrorBarsState,
} from "./errorBarSlice";
import {
  createEventSettingsSlice,
  type EventSettingsActions,
  type EventSettingsState,
} from "./eventSettingsSlice";
import {
  createGraphicalItemsSlice,
  type GraphicalItemsActions,
  type GraphicalItemsState,
} from "./graphicalItemsSlice";
import {
  createChartLayoutSlice,
  type ChartLayoutActions,
  type ChartLayoutState,
} from "./layoutSlice";
import {
  createLegendSlice,
  type LegendActions,
  type LegendState,
} from "./legendSlice";
import {
  createOptionsSlice,
  type ChartOptions,
  type OptionsActions,
} from "./optionsSlice";
import {
  createPolarAxisSlice,
  type PolarAxisActions,
  type PolarAxisState,
} from "./polarAxisSlice";
import {
  createPolarOptionsSlice,
  type PolarChartState,
  type PolarOptionsActions,
} from "./polarOptionsSlice";
import {
  createReferenceElementsSlice,
  type ReferenceElementsActions,
  type ReferenceElementState,
} from "./referenceElementsSlice";
import {
  createRenderedTicksSlice,
  type RenderedTicksActions,
  type RenderedTicksState,
} from "./renderedTicksSlice";
import {
  createRootPropsSlice,
  type RootPropsActions,
  type UpdatableChartOptions,
} from "./rootPropsSlice";
import {
  createTooltipSlice,
  type TooltipActions,
  type TooltipState,
} from "./tooltipSlice";
import {
  createZIndexSlice,
  type ZIndexActions,
  type ZIndexState,
} from "./zIndexSlice";

export type RechartsRootState = {
  chartData: ChartDataState;
  layout: ChartLayoutState;
  options: ChartOptions;
  eventSettings: EventSettingsState;
  rootProps: UpdatableChartOptions;
  graphicalItems: GraphicalItemsState;
  cartesianAxis: AxisMapState;
  polarAxis: PolarAxisState;
  renderedTicks: RenderedTicksState;
  zIndex: ZIndexState;
  brush: BrushSettings;
  polarOptions: PolarChartState;
  tooltip: TooltipState;
  legend: LegendState;
  referenceElements: ReferenceElementState;
  errorBars: ErrorBarsState;
};

export type RechartsActions = {
  chartData: ChartDataActions;
  layout: ChartLayoutActions;
  options: OptionsActions;
  eventSettings: EventSettingsActions;
  rootProps: RootPropsActions;
  graphicalItems: GraphicalItemsActions;
  cartesianAxis: CartesianAxisActions;
  polarAxis: PolarAxisActions;
  renderedTicks: RenderedTicksActions;
  zIndex: ZIndexActions;
  brush: BrushActions;
  polarOptions: PolarOptionsActions;
  tooltip: TooltipActions;
  legend: LegendActions;
  referenceElements: ReferenceElementsActions;
  errorBars: ErrorBarsActions;
};

export interface RechartsStore {
  readonly state: RechartsRootState;
  readonly actions: RechartsActions;
  readonly isInitializing: () => boolean;
  readonly createState: ChartStateInitializer;
}

/**
 * Assembles the root store from the slice factories. Equivalent to recharts'
 * `createRechartsStore(preloadedState, chartName)`, minus the Redux runtime:
 * callers run `store.actions.<slice>.<fn>()` directly and read reactive state
 * via `useAppSelector`.
 */
export function createRechartsStore(
  preloadedState?: Partial<RechartsRootState>,
): RechartsStore {
  const { createState, isInitializing } = createChartInitializer();
  const chartData = createChartDataSlice(
    preloadedState?.chartData,
    createState,
  );
  const layout = createChartLayoutSlice(preloadedState?.layout, createState);
  const options = createOptionsSlice(preloadedState?.options, createState);
  const eventSettings = createEventSettingsSlice(
    preloadedState?.eventSettings,
    createState,
  );
  const rootProps = createRootPropsSlice(
    preloadedState?.rootProps,
    createState,
  );
  const graphicalItems = createGraphicalItemsSlice(
    preloadedState?.graphicalItems,
    createState,
  );
  const cartesianAxis = createCartesianAxisSlice(
    preloadedState?.cartesianAxis,
    createState,
  );
  const polarAxis = createPolarAxisSlice(
    preloadedState?.polarAxis,
    createState,
  );
  const renderedTicks = createRenderedTicksSlice(
    preloadedState?.renderedTicks,
    createState,
  );
  const zIndex = createZIndexSlice(preloadedState?.zIndex, createState);
  const brush = createBrushSlice(preloadedState?.brush, createState);
  const polarOptions = createPolarOptionsSlice(
    preloadedState?.polarOptions ?? null,
    createState,
  );
  const tooltip = createTooltipSlice(preloadedState?.tooltip, createState);
  const legend = createLegendSlice(preloadedState?.legend, createState);
  const referenceElements = createReferenceElementsSlice(
    preloadedState?.referenceElements,
    createState,
  );
  const errorBars = createErrorBarSlice(preloadedState?.errorBars, createState);

  return {
    isInitializing,
    createState,
    state: {
      get chartData() {
        return chartData.state;
      },
      get layout() {
        return layout.state;
      },
      get options() {
        return options.state;
      },
      get eventSettings() {
        return eventSettings.state;
      },
      get rootProps() {
        return rootProps.state;
      },
      get graphicalItems() {
        return graphicalItems.state;
      },
      get cartesianAxis() {
        return cartesianAxis.state;
      },
      get polarAxis() {
        return polarAxis.state;
      },
      get renderedTicks() {
        return renderedTicks.state;
      },
      get zIndex() {
        return zIndex.state;
      },
      get brush() {
        return brush.state;
      },
      // Reactive unwrap of the nullable polar-options store (read tracks `current`).
      get polarOptions(): PolarChartState {
        return polarOptions.state.current;
      },
      get tooltip() {
        return tooltip.state;
      },
      get legend() {
        return legend.state;
      },
      get referenceElements() {
        return referenceElements.state;
      },
      get errorBars() {
        return errorBars.state;
      },
    },
    actions: {
      chartData: chartData.actions,
      layout: layout.actions,
      options: options.actions,
      eventSettings: eventSettings.actions,
      rootProps: rootProps.actions,
      graphicalItems: graphicalItems.actions,
      cartesianAxis: cartesianAxis.actions,
      polarAxis: polarAxis.actions,
      renderedTicks: renderedTicks.actions,
      zIndex: zIndex.actions,
      brush: brush.actions,
      polarOptions: polarOptions.actions,
      tooltip: tooltip.actions,
      legend: legend.actions,
      referenceElements: referenceElements.actions,
      errorBars: errorBars.actions,
    },
  };
}
