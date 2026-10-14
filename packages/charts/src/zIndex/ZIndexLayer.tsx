// Ported from recharts 3.8.1 src/zIndex/ZIndexLayer.tsx (commit 7a23854).
// Keep one owned SVG subtree through SSR/hydration, then move its actual nodes
// into the ordered layer. A DOM-only Portal cannot emit initial server geometry.
import { createEffect, createSignal, onCleanup } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useAppSelector, useAppStore } from "../state/hooks";
import { unregisterOnCleanup } from "../state/unregisterOnCleanup";
import { selectZIndexPortalElement } from "./zIndexSelectors";
import { useIsInChartContext } from "../context/chartLayoutContext";
import { useIsPanorama } from "../context/PanoramaContext";

export interface ZIndexable {
  /**
   * Z-Index of this component and its children. The higher the value,
   * the more on top it will be rendered.
   */
  zIndex?: number;
}

export function ZIndexLayer(props: {
  zIndex: number | undefined;
  children?: JSX.Element;
}): JSX.Element {
  const isInChartContext = useIsInChartContext();
  const isPanorama = useIsPanorama();
  const actions = useAppStore()?.actions.zIndex;
  const [home, setHome] = createSignal<SVGGElement>();
  const [content, setContent] = createSignal<SVGGElement>();
  const portalElement = useAppSelector(state =>
    selectZIndexPortalElement(state, props.zIndex, isPanorama),
  );
  let registered: number | undefined;

  createEffect(
    () => isInChartContext() ? props.zIndex : undefined,
    zIndex => {
      if (registered !== undefined) actions?.unregisterZIndexPortal({ zIndex: registered });
      registered = zIndex === 0 ? undefined : zIndex;
      if (registered !== undefined) actions?.registerZIndexPortal({ zIndex: registered });
    },
  );
  createEffect(
    () => ({ node: content(), parent: home(), target: portalElement(), zIndex: props.zIndex }),
    ({ node, parent, target, zIndex }) => {
      const mount = zIndex && target ? target : parent;
      if (node && mount && node.parentNode !== mount) mount.appendChild(node);
    },
  );
  unregisterOnCleanup(() => {
    if (registered !== undefined) actions?.unregisterZIndexPortal({ zIndex: registered });
  });
  onCleanup(() => {
    const node = content();
    if (node && node.parentNode !== home()) node.remove();
  });

  return <g ref={setHome}><g ref={setContent}>{props.children}</g></g>;
}
