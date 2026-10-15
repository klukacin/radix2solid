import type { JSX } from "@solidjs/web";

// Ported from recharts 3.8.1 src/state/ReportChartProps.tsx (commit 7a23854).
// useAppDispatch → useAppStore().actions; render-phase registration includes SSR.
import { createChartEffect } from "./createChartState";
import { useAppStore } from "./hooks";
import { UpdatableChartOptions } from "./rootPropsSlice";

export const ReportChartProps = (props: UpdatableChartOptions): JSX.Element => {
  const store = useAppStore();

  createChartEffect(
    () => ({ ...props }),
    (options) => {
      store?.actions.rootProps.updateOptions(options);
    },
  );

  return null;
};
