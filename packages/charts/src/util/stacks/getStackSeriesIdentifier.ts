import { MaybeStackedGraphicalItem } from "../../state/types/StackedGraphicalItem";
// Ported from recharts 3.8.1 src/util/stacks/getStackSeriesIdentifier.ts
// (commit 7a23854).
import { StackSeriesIdentifier } from "./stackTypes";

export function getStackSeriesIdentifier(
  graphicalItem: MaybeStackedGraphicalItem,
): StackSeriesIdentifier;
export function getStackSeriesIdentifier(graphicalItem: undefined): undefined;
export function getStackSeriesIdentifier(
  graphicalItem: MaybeStackedGraphicalItem | undefined,
): StackSeriesIdentifier | undefined;
/**
 * Returns the identifier for a stack series (one graphical item in the stack).
 */
export function getStackSeriesIdentifier(
  graphicalItem: MaybeStackedGraphicalItem | undefined,
): StackSeriesIdentifier | undefined {
  return graphicalItem?.id;
}
