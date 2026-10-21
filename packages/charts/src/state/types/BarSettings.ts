// Ported from recharts 3.8.1 src/state/types/BarSettings.ts (commit 7a23854).
import { MinPointSize } from "../../util/BarUtils";
import { BaseCartesianGraphicalItemSettings } from "../graphicalItemsSlice";
import { MaybeStackedGraphicalItem } from "./StackedGraphicalItem";

export type BarSettings = BaseCartesianGraphicalItemSettings &
  MaybeStackedGraphicalItem & {
    type: "bar";
    maxBarSize: number | undefined;
    minPointSize: MinPointSize;
    /**
     * When true, zero-dimension bars are not filtered out because the custom
     * shape may still render something visible.
     */
    hasCustomShape: boolean;
  };
