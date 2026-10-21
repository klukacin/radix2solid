import {
  LegendItemSorter,
  LegendPayload,
} from "../../component/DefaultLegendContent";
// Ported from recharts 3.8.1 src/state/selectors/legendSelectors.ts (commit 7a23854).
// Deviation: payload is stored as `{ id, items }[]` (proxy-safe ids) so the flat
// selector flatMaps `items` rather than `flat(1)`-ing a 2D array.
import { sortBy } from "../../util/collectionUtils";
import { Size } from "../../util/types";
import { LegendSettings } from "../legendSlice";
import { RechartsRootState } from "../store";

export const selectLegendSettings = (
  state: RechartsRootState,
): LegendSettings => state.legend.settings;

export const selectLegendSize = (state: RechartsRootState): Size =>
  state.legend.size;

export const selectLegendPayload = (
  state: RechartsRootState,
): ReadonlyArray<LegendPayload> => {
  const flat = state.legend.payload.flatMap((entry) => entry.items);
  const { itemSorter } = selectLegendSettings(state);
  return sortByLegendItemSorter(flat, itemSorter);
};

function sortByLegendItemSorter(
  items: ReadonlyArray<LegendPayload>,
  itemSorter: LegendItemSorter | null,
): ReadonlyArray<LegendPayload> {
  if (itemSorter == null) {
    return items;
  }
  return sortBy(items, [itemSorter]);
}
