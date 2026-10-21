import type { JSX } from "@solidjs/web";
// Ported from recharts 3.8.1 src/cartesian/CartesianAxis.tsx RenderedTicksReporter
// (commit 7a23854).
//
// Reports an axis's rendered ticks into the renderedTicks slice so the public
// useXAxisTicks/useYAxisTicks hooks (and the tick-snap inverse scale) can read
// them. Solid deviation: useEffect add + cleanup remove → createEffect + onCleanup
// (the same effect-dispatch idiom the other Report* components use).
import { createEffect } from "solid-js";

import type { AxisId } from "../state/cartesianAxisSlice";
import { useAppStore } from "../state/hooks";
import { unregisterOnCleanup } from "../state/unregisterOnCleanup";
import type { CartesianTickItem, TickItem } from "../util/types";

export function RenderedTicksReporter(props: {
  axisType: "xAxis" | "yAxis";
  axisId: AxisId;
  ticks: ReadonlyArray<CartesianTickItem>;
}): JSX.Element {
  const store = useAppStore();
  let prev: {
    axisType: "xAxis" | "yAxis";
    axisId: AxisId;
    ticks: ReadonlyArray<TickItem>;
  } | null = null;

  createEffect(
    (): {
      axisType: "xAxis" | "yAxis";
      axisId: AxisId;
      ticks: ReadonlyArray<TickItem>;
    } => ({
      axisType: props.axisType,
      axisId: props.axisId,
      // Expose only the external tick shape (drop internal props).
      ticks: props.ticks.map((t) => ({
        value: t.value,
        coordinate: t.coordinate,
        offset: t.offset,
        index: t.index,
      })),
    }),
    (payload) => {
      if (prev != null) {
        if (
          prev.axisType !== payload.axisType ||
          prev.axisId !== payload.axisId
        ) {
          store?.actions.renderedTicks.removeRenderedTicks(prev);
        } else if (
          prev.ticks.length === payload.ticks.length &&
          payload.ticks.every((tick, index) => {
            const last = prev!.ticks[index];
            return (
              last != null &&
              Object.is(last.value, tick.value) &&
              last.coordinate === tick.coordinate &&
              last.offset === tick.offset &&
              last.index === tick.index
            );
          })
        ) {
          return;
        }
      }
      store?.actions.renderedTicks.setRenderedTicks(payload);
      prev = payload;
    },
  );

  unregisterOnCleanup(() => {
    if (prev != null) {
      store?.actions.renderedTicks.removeRenderedTicks(prev);
      prev = null;
    }
  });

  return null;
}
