import type { JSX } from "@solidjs/web";
// Ported from recharts 3.8.1 src/component/Cell.tsx (commit 7a23854).
import {
  children,
  createContext,
  createMemo,
  untrack,
  useContext,
} from "solid-js";

import {
  createChartEffect,
  createChartInitializer,
} from "../state/createChartState";
import { useAppStore } from "../state/hooks";
import type { CamelSvgProps } from "../util/svgPropertiesNoEvents";

export interface CellProps extends CamelSvgProps<
  JSX.SVGAttributes<SVGElement>
> {
  fill?: string;
  stroke?: string;
}

const cellMarker = Symbol("Cell");
type CellMarker = { [cellMarker]: CellProps };
const CellContext = createContext<((props: CellProps) => CellMarker) | null>(
  null,
);
const isCell = (child: unknown): child is CellMarker =>
  typeof child === "object" && child !== null && cellMarker in child;

/**
 * Per-item presentation overrides. Like native Match, this returns a private
 * child record consumed by its parent, never a DOM node or public descriptor.
 * Outside a series it renders nothing.
 * @deprecated Prefer the series shape/content prop, as in Recharts 4.
 */
export const Cell = (props: CellProps): JSX.Element =>
  useContext(CellContext)?.(props);

/** Resolve children once under their real providers, retaining native For order. */
export function createCellReader() {
  let resolved: ReturnType<typeof children> | undefined;
  const { createState, isInitializing } =
    useAppStore() ?? createChartInitializer();
  const [state, update] = createState<{ cells: readonly CellProps[] }>({
    cells: [],
  });
  const collected = createMemo<readonly CellProps[]>(
    () =>
      resolved!
        .toArray()
        .filter(isCell)
        .map((child) => child[cellMarker]),
    {
      lazy: true,
      equals: (previous, next) =>
        previous.length === next.length &&
        previous.every((cell, index) => cell === next[index]),
    },
  );
  const marker = (props: CellProps): CellMarker => ({ [cellMarker]: props });
  function resolve(source: () => JSX.Element) {
    resolved = children(() => (
      <CellContext value={marker}>{source()}</CellContext>
    ));
    const initial = untrack(collected);
    if (isInitializing())
      update((state) => {
        state.cells = initial;
      });
    // Flattened non-Cell children can read series geometry. Publish Cell changes
    // in apply, rather than forming a computed cycle back through that geometry.
    createChartEffect(collected, (cells) =>
      update((state) => {
        state.cells = cells;
      }),
    );
    const rendered = children(() =>
      resolved!.toArray().filter((child) => !isCell(child)),
    );
    return rendered;
  }
  return { cells: () => state().cells, resolve };
}
