import { render } from "@solidjs/web";
import {
  Bar,
  BarChart,
  Funnel,
  FunnelChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "@wsagency/radix2solid-charts";
import { createSignal } from "solid-js";

type ProbeValue = {
  nested: boolean;
  [Symbol.toPrimitive](hint: "string" | "number" | "default"): string;
};
type ProbeRow = {
  name: string;
  value: number;
  "data-chart-probe"?: ProbeValue;
  "data-chart-label"?: string;
};
let lastDataAttributeHint: string | undefined;

function probeValue(nested: boolean): ProbeValue {
  return {
    nested,
    [Symbol.toPrimitive](hint: "string" | "number" | "default") {
      lastDataAttributeHint = hint;
      return "[object Object]";
    },
  };
}
type DefaultRow = ProbeRow;

const initialRows: ProbeRow[] = [
  {
    name: "Probe",
    value: 10,
    "data-chart-probe": probeValue(true),
    "data-chart-label": "retained",
  },
  { name: "Reference", value: 20 },
];
const updatedRows: ProbeRow[] = [
  {
    name: "Probe",
    value: 5,
    "data-chart-probe": probeValue(false),
    "data-chart-label": "updated",
  },
  { name: "Reference", value: 20 },
];
const initialDefaultRows: DefaultRow[] = [
  {
    name: "Probe",
    value: 10,
    "data-chart-probe": probeValue(true),
    "data-chart-label": "retained",
  },
  { name: "Reference", value: 20 },
];
const updatedDefaultRows: DefaultRow[] = [
  {
    name: "Probe",
    value: 5,
    "data-chart-probe": probeValue(false),
    "data-chart-label": "updated",
  },
  { name: "Reference", value: 20 },
];

function probeState(value: unknown): "true" | "false" | "missing" {
  if (typeof value !== "object" || value === null || !("nested" in value)) {
    return "missing";
  }
  return value.nested === true ? "true" : "false";
}

export function mountChartShapeDataAttrs(target: HTMLElement): () => void {
  const [rows, setRows] = createSignal(initialRows);
  const [defaultRows, setDefaultRows] = createSignal(initialDefaultRows);
  const updateRows = () => {
    setRows(updatedRows);
    setDefaultRows(updatedDefaultRows);
  };
  const dispose = render(
    () => (
      <div
        id="chart-shape-data-attrs"
        aria-hidden="true"
      >
        <output id="chart-shape-data-attrs-coercion-hint">
          {lastDataAttributeHint ?? ""}
        </output>
        <button
          id="chart-shape-data-attrs-update"
          type="button"
          onClick={updateRows}
        >
          Update
        </button>
        <div id="chart-shape-data-attrs-bar-custom">
          <BarChart
            width={180}
            height={140}
            data={rows()}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Bar
              dataKey="value"
              isAnimationActive={false}
              shape={(props) => (
                <path
                  data-shape-probe={probeState(props["data-chart-probe"])}
                />
              )}
            />
          </BarChart>
        </div>
        <div id="chart-shape-data-attrs-bar-default">
          <BarChart
            width={180}
            height={140}
            data={defaultRows()}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Bar
              dataKey="value"
              isAnimationActive={false}
            />
          </BarChart>
        </div>
        <div id="chart-shape-data-attrs-pie-custom">
          <PieChart
            width={180}
            height={140}
            data={rows()}
          >
            <Pie
              dataKey="value"
              isAnimationActive={false}
              shape={(props) => (
                <path
                  data-shape-probe={probeState(props["data-chart-probe"])}
                />
              )}
            />
          </PieChart>
        </div>
        <div id="chart-shape-data-attrs-pie-default">
          <PieChart
            width={180}
            height={140}
            data={defaultRows()}
          >
            <Pie
              dataKey="value"
              isAnimationActive={false}
            />
          </PieChart>
        </div>
        <div id="chart-shape-data-attrs-funnel-custom">
          <FunnelChart
            width={180}
            height={140}
            data={rows()}
          >
            <Funnel
              dataKey="value"
              isAnimationActive={false}
              shape={(props) => (
                <path
                  data-shape-probe={probeState(props["data-chart-probe"])}
                />
              )}
            />
          </FunnelChart>
        </div>
        <div id="chart-shape-data-attrs-funnel-default">
          <FunnelChart
            width={180}
            height={140}
            data={defaultRows()}
          >
            <Funnel
              dataKey="value"
              isAnimationActive={false}
            />
          </FunnelChart>
        </div>
      </div>
    ),
    target,
  );
  const coercionHint = target.querySelector(
    "#chart-shape-data-attrs-coercion-hint",
  );
  if (!coercionHint) {
    dispose();
    throw new Error("Chart shape fixture did not render its coercion hint.");
  }
  coercionHint.textContent = lastDataAttributeHint ?? "";
  return dispose;
}
