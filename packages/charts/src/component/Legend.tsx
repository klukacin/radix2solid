import { JSX, Portal } from "@solidjs/web";
// Ported from recharts 3.8.1 src/component/Legend.tsx (commit 7a23854).
//
// Native portals remain the legacy/custom-portal path. Position-based legends
// register the same body in the wrapper's HTML outlet for SSR and hydration.
// Measurement runs after claiming that body; content retains the Legend owner.
import {
  createEffect,
  createMemo,
  createRoot,
  getOwner,
  merge,
  onCleanup,
  runWithOwner,
  Show,
} from "solid-js";

import { cartesianPositionToCSSTranslate } from "../cartesian/cartesianPositionToCSSTranslate";
import {
  type CartesianPosition,
  getCartesianPosition,
  isOutsidePosition,
} from "../cartesian/getCartesianPosition";
import {
  useChartHeight,
  useChartWidth,
  useMargin,
} from "../context/chartLayoutContext";
import { useLegendPayload } from "../context/legendPayloadContext";
import {
  useLegendOutlet,
  useLegendPortal,
} from "../context/legendPortalContext";
import { createChartEffect } from "../state/createChartState";
import { useAppSelector, useAppStore } from "../state/hooks";
import { initialLegendState } from "../state/legendSlice";
import { selectChartViewBox } from "../state/selectors/selectChartOffsetInternal";
import { selectLegendArea } from "../state/selectors/selectLegendArea";
import { unregisterCleanup } from "../state/unregisterOnCleanup";
import { getUniqPayload, UniqueOption } from "../util/payload/getUniqPayload";
import type { CartesianLayout, LayoutType, Margin } from "../util/types";
import { ElementOffset, useElementOffset } from "../util/useElementOffset";
import {
  ContentType,
  DefaultLegendContent,
  HorizontalAlignmentType,
  LegendItemSorter,
  LegendPayload,
  Props as DefaultLegendContentProps,
  VerticalAlignmentType,
} from "./DefaultLegendContent";

function defaultUniqBy(entry: LegendPayload): string | undefined {
  return entry.value;
}

/** number → "<n>px", string → as-is, undefined → "auto". */
function toCssLength(value: number | string | undefined): string {
  if (value == null) {
    return "auto";
  }
  return typeof value === "number" ? `${value}px` : value;
}

export type LegendProps = Omit<
  DefaultLegendContentProps,
  "payload" | "layout"
> & {
  content?: ContentType;
  wrapperStyle?: JSX.CSSProperties;
  width?: number | string;
  height?: number | string;
  payloadUniqBy?: UniqueOption<LegendPayload>;
  portal?: HTMLElement | null;
  itemSorter?: LegendItemSorter | null;
  layout?: CartesianLayout | "auto";
  position?: CartesianPosition;
  offset?: number;
};

export const legendDefaultProps = {
  align: "center",
  iconSize: 14,
  inactiveColor: "#ccc",
  itemSorter: "value",
  labelStyle: {},
  layout: "auto",
  verticalAlign: "bottom",
  offset: 0,
} as const satisfies Partial<LegendProps>;

// Props passed to a function-form `content`. Mirrors recharts' ContentProps: the
// legend props plus chart-derived margin/dimensions and the final (sorted) payload.
type LegendContentProps = Omit<LegendProps, "layout"> & {
  layout: CartesianLayout;
  margin?: Margin;
  chartWidth?: number;
  chartHeight?: number;
  payload?: ReadonlyArray<LegendPayload>;
};

// Port of recharts' getWidthOrHeight: a horizontal legend takes an explicit width
// or falls back to the available chart width; a vertical legend takes an explicit height.
function getWidthOrHeight(
  layout: LayoutType | undefined,
  height: number | string | undefined,
  width: number | string | undefined,
  maxWidth: number,
): { height?: number | string; width?: number | string } | null {
  if (layout === "vertical" && height != null) {
    return { height };
  }
  if (layout === "horizontal") {
    return { width: width || maxWidth };
  }
  return null;
}

function getDefaultPosition(
  style: JSX.CSSProperties | undefined,
  props: {
    layout: LayoutType;
    align: HorizontalAlignmentType;
    verticalAlign: VerticalAlignmentType;
  },
  margin: Margin | undefined,
  chartWidth: number,
  chartHeight: number,
  box: ElementOffset,
): JSX.CSSProperties {
  const { layout, align, verticalAlign } = props;
  let hPos: JSX.CSSProperties = {};
  let vPos: JSX.CSSProperties = {};

  // When the user's wrapperStyle already pins a horizontal/vertical edge, the
  // computed position for that axis is skipped (recharts parity).
  if (style == null || (style.left == null && style.right == null)) {
    if (align === "center" && layout === "vertical") {
      hPos = { left: `${((chartWidth || 0) - box.width) / 2}px` };
    } else {
      hPos =
        align === "right"
          ? { right: `${margin?.right || 0}px` }
          : { left: `${margin?.left || 0}px` };
    }
  }

  if (style == null || (style.top == null && style.bottom == null)) {
    if (verticalAlign === "middle") {
      vPos = { top: `${((chartHeight || 0) - box.height) / 2}px` };
    } else {
      vPos =
        verticalAlign === "bottom"
          ? { bottom: `${margin?.bottom || 0}px` }
          : { top: `${margin?.top || 0}px` };
    }
  }

  return { ...hPos, ...vPos };
}

export const Legend = (props: LegendProps): JSX.Element => {
  const merged = merge(legendDefaultProps, props);
  const store = useAppStore();
  const contextPayload = useLegendPayload();
  const legendPortalFromContext = useLegendPortal();
  const margin = useMargin();
  const chartWidth = useChartWidth();
  const chartHeight = useChartHeight();
  const [lastBoundingBox, updateBoundingBox] = useElementOffset();
  const owner = getOwner();
  const outlet = useLegendOutlet();
  const useOutlet = () =>
    outlet != null && merged.position != null && props.portal == null;
  const layout = (): CartesianLayout => {
    if (merged.layout !== "auto") return merged.layout;
    const position = merged.position;
    return position === "left" ||
      position === "right" ||
      position === "insideLeft" ||
      position === "insideRight"
      ? "vertical"
      : "horizontal";
  };
  const positionViewBox = useAppSelector((state) =>
    merged.position == null
      ? undefined
      : isOutsidePosition(merged.position)
        ? selectLegendArea(state)
        : selectChartViewBox(state),
  );

  // Push the legend settings into the store (drives the offset's legend space).
  createChartEffect(
    () => ({
      align: merged.align,
      layout: layout(),
      verticalAlign: merged.verticalAlign,
      itemSorter: merged.itemSorter,
      position: merged.position,
      offset: merged.offset,
    }),
    (settings) => {
      store?.actions.legend.setLegendSettings(settings);
      return unregisterCleanup(() =>
        store?.actions.legend.setLegendSettings(initialLegendState.settings),
      );
    },
  );

  // Only outside/default legends reserve measured plot space.
  createEffect(
    () => ({
      report:
        props.portal == null &&
        (merged.position == null || isOutsidePosition(merged.position)),
      width: lastBoundingBox().width,
      height: lastBoundingBox().height,
    }),
    (size) => {
      if (size.report) {
        store?.actions.legend.setLegendSize({
          width: size.width,
          height: size.height,
        });
        return unregisterCleanup(() =>
          store?.actions.legend.setLegendSize({ width: 0, height: 0 }),
        );
      }
    },
  );

  const portal = (): HTMLElement | null =>
    props.portal ?? legendPortalFromContext();

  const finalPayload = createMemo<ReadonlyArray<LegendPayload>>(() =>
    getUniqPayload(contextPayload() ?? [], merged.payloadUniqBy, defaultUniqBy),
  );

  // Props handed to a function-form `content`. Built as a plain object (spreading
  // the Solid `merge()` proxy leaks a MERGE_SOURCE symbol and doesn't materialize
  // keys); reads finalPayload()/chart dims so the enclosing reactive insert re-runs
  // when the payload populates.
  const buildContentProps = (): LegendContentProps => {
    const w = chartWidth() ?? 0;
    const h = chartHeight() ?? 0;
    const m = margin();
    const maxWidth = w - (m?.left ?? 0) - (m?.right ?? 0);
    const widthOrHeight = getWidthOrHeight(
      layout(),
      merged.height,
      merged.width,
      maxWidth,
    );
    return {
      align: merged.align,
      iconSize: merged.iconSize,
      iconType: merged.iconType,
      inactiveColor: merged.inactiveColor,
      itemSorter: merged.itemSorter,
      labelStyle: merged.labelStyle,
      layout: layout(),
      verticalAlign: merged.verticalAlign,
      formatter: merged.formatter,
      content: merged.content,
      onClick: merged.onClick,
      onMouseEnter: merged.onMouseEnter,
      onMouseLeave: merged.onMouseLeave,
      wrapperStyle: merged.wrapperStyle,
      width: merged.width,
      height: merged.height,
      payloadUniqBy: merged.payloadUniqBy,
      portal: merged.portal,
      position: merged.position,
      offset: merged.offset,
      ...widthOrHeight,
      margin: m,
      chartWidth: w,
      chartHeight: h,
      payload: finalPayload(),
    };
  };

  const outerStyle = (): JSX.CSSProperties => {
    if (props.portal != null) {
      return merged.wrapperStyle ?? {};
    }
    const w = chartWidth();
    const h = chartHeight();
    const m = margin();
    const maxWidth = (w ?? 0) - (m?.left ?? 0) - (m?.right ?? 0);
    const widthOrHeight = getWidthOrHeight(
      layout(),
      merged.height,
      merged.width,
      maxWidth,
    );
    const viewBox = positionViewBox();
    let positionStyle: JSX.CSSProperties;
    if (merged.position != null && viewBox != null) {
      const result = getCartesianPosition({
        viewBox,
        position: merged.position,
        offset: merged.offset,
      });
      const box = lastBoundingBox();
      const position = merged.position;
      positionStyle = {
        width: "max-content",
        height: "max-content",
        "max-width": `${layout() === "vertical" ? viewBox.width / 2 : viewBox.width}px`,
        "max-height": `${layout() === "horizontal" ? viewBox.height / 2 : viewBox.height}px`,
        "overflow-y": "auto",
        top: `${result.y + (position === "top" ? box.height + merged.offset : position === "bottom" ? -box.height - merged.offset : 0)}px`,
        left: `${result.x + (position === "left" ? box.width + merged.offset : position === "right" ? -box.width - merged.offset : 0)}px`,
        transform: cartesianPositionToCSSTranslate(
          result.horizontalAnchor,
          result.verticalAnchor,
        ),
      };
    } else {
      positionStyle = getDefaultPosition(
        merged.wrapperStyle,
        {
          layout: layout(),
          align: merged.align,
          verticalAlign: merged.verticalAlign,
        },
        m,
        w ?? 0,
        h ?? 0,
        lastBoundingBox(),
      );
    }
    return {
      position: "absolute",
      // Matches recharts: a horizontal legend without an explicit width fills the
      // available chart width (maxWidth) via getWidthOrHeight; otherwise "auto".
      width: toCssLength(widthOrHeight?.width ?? merged.width),
      height: toCssLength(widthOrHeight?.height ?? merged.height),
      ...positionStyle,
      ...merged.wrapperStyle,
    };
  };

  const renderLegend = (): JSX.Element => {
    const initialPositioned = useOutlet();
    let element: HTMLDivElement | null = null;
    if (initialPositioned) {
      createEffect(
        () => undefined,
        () => {
          updateBoundingBox(element);
          return () => updateBoundingBox(null);
        },
      );
    }
    return (
      <div
        class="recharts-legend-wrapper"
        style={outerStyle()}
        ref={(node) => {
          if (initialPositioned) element = node;
          else updateBoundingBox(node);
        }}
      >
        <Show
          when={typeof merged.content === "function" ? merged.content : null}
          fallback={
            <DefaultLegendContent
              payload={finalPayload()}
              iconSize={merged.iconSize}
              iconType={merged.iconType}
              layout={layout()}
              align={merged.align}
              verticalAlign={merged.verticalAlign}
              inactiveColor={merged.inactiveColor}
              formatter={merged.formatter}
              labelStyle={merged.labelStyle}
              onClick={merged.onClick}
              onMouseEnter={merged.onMouseEnter}
              onMouseLeave={merged.onMouseLeave}
            />
          }
        >
          {(contentFn) => <>{contentFn()(buildContentProps())}</>}
        </Show>
      </div>
    );
  };
  const ready = () =>
    contextPayload() != null && chartWidth() != null && chartHeight() != null;
  const renderInOutlet = (): JSX.Element => {
    let dispose: (() => void) | undefined;
    const content = runWithOwner(owner, () =>
      createRoot((cleanup) => {
        dispose = cleanup;
        return <Show when={ready()}>{(_ready) => renderLegend()}</Show>;
      }),
    );
    onCleanup(() => dispose?.());
    return content;
  };
  createChartEffect(useOutlet, (enabled) =>
    enabled ? outlet?.(renderInOutlet) : undefined,
  );

  return (
    <Show when={!useOutlet() && ready() ? portal() : null}>
      {(mount) => <Portal mount={mount()}>{renderLegend()}</Portal>}
    </Show>
  );
};
