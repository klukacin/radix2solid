import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { renderToString } from "@solidjs/web";
import {
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  FunnelChart,
  Funnel,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianAxis,
  CartesianGrid,
  Brush,
  Cell,
  Rectangle,
  ErrorBar,
} from "@wsagency/radix2solid-charts";
import { Global } from "@wsagency/radix2solid-charts";
import {
  AreaChart,
  Area,
  Legend,
  Label,
  Sankey,
  Text,
} from "@wsagency/radix2solid-charts";
import { createComponent } from "solid-js";

const data = [
  { name: "A", value: 10 },
  { name: "B", value: 30 },
  { name: "C", value: 20 },
];

test("public Text SSR preserves literal dollars and enforces calc expression length limits", () => {
  const childSource = String.raw`
    import assert from 'node:assert/strict';
    import { createComponent } from 'solid-js';
    import { renderToString } from '@solidjs/web';
    import { Text } from '@wsagency/radix2solid-charts';

    const decode = value => value.replace(/&(amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity, name) => {
      const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
      return name[0] === '#'
        ? String.fromCodePoint(name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1)))
        : named[name.toLowerCase()];
    });
    // B1 must finish before B2: the gate first authorizes only the dollar fix.
    const cases = [
      ...['$&', '$\x60', "$'", '$1', '$$'].map(value => ({
        name: 'B1 literal ' + JSON.stringify(value), capHeight: '(' + value + ')', dy: value,
      })),
      { name: 'B2 1000 inner characters', capHeight: ' '.repeat(997) + '1+1', dy: '2' },
      { name: 'B2 1001 inner characters', capHeight: ' '.repeat(998) + '1+1', dy: '' },
      ...['+', '*', '+@'].map(suffix => ({
        name: 'B2 oversized ' + suffix, capHeight: '9'.repeat(50000) + suffix, dy: '',
      })),
    ];
    for (const { name, capHeight, dy } of cases) {
      console.error('Rendering ' + name);
      const html = renderToString(() => createComponent(Text, {
        x: 10, y: 20, verticalAnchor: 'start', capHeight, children: 'Revenue',
      }));
      const texts = [...html.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)];
      assert.equal(texts.length, 1, name + ': one text');
      assert.match(texts[0][1], /\sx="10"/, name + ': x');
      assert.match(texts[0][1], /\sy="20"/, name + ': y');
      const spans = [...texts[0][2].matchAll(/<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/g)];
      assert.equal(spans.length, 1, name + ': one tspan');
      assert.equal(decode(spans[0][2].replace(/<!--[\s\S]*?-->/g, '')), 'Revenue', name + ': text');
      const attribute = spans[0][1].match(/\sdy="([^"]*)"/);
      assert.ok(attribute, name + ': dy attribute');
      assert.equal(decode(attribute[1]), dy, name + ': decoded dy');
      console.error('Passed ' + name + ': dy=' + JSON.stringify(dy));
    }
  `;
  const child = spawnSync(
    process.execPath,
    ["--conditions=development", "--input-type=module", "--eval", childSource],
    {
      timeout: 10000,
      encoding: "utf8",
    },
  );
  assert.equal(
    child.status,
    0,
    `Text SSR child failed: ${child.error?.message ?? child.signal ?? child.status}\n${child.stderr}`,
  );
});

test("fixed size native charts emit actual finite data geometry before JavaScript", () => {
  assert.equal(typeof document, "undefined");
  for (const [Chart, Series, geometry] of [
    [LineChart, Line, /class="[^"]*recharts-line-curve[^"]*"/],
    [BarChart, Bar, /class="[^"]*recharts-rectangle[^"]*"/],
    [PieChart, Pie, /class="[^"]*recharts-sector[^"]*"/],
  ] as const) {
    const html = renderToString(
      () =>
        createComponent(Chart, {
          width: 500,
          height: 300,
          data,
          get children() {
            return [
              ...(Chart === PieChart
                ? []
                : [
                    createComponent(XAxis, { dataKey: "name" }),
                    createComponent(YAxis, {}),
                  ]),
              createComponent(Series, {
                data,
                dataKey: "value",
                isAnimationActive: false,
              }),
              ...(Chart === LineChart
                ? [createComponent(Brush, { dataKey: "name" })]
                : []),
            ];
          },
        }),
      { renderId: "chart-" },
    );
    assert.match(html, /<svg\b[^>]*width="500"[^>]*height="300"/);
    assert.match(html, geometry);
    const paths = [...html.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map(
      (match) => match[1],
    );
    assert.ok(paths.length > 0, html);
    for (const path of paths) {
      assert.match(path, /[MLC]/);
      assert.doesNotMatch(path, /NaN|Infinity|undefined/);
      assert.ok((path.match(/-?\d+(?:\.\d+)?/g) ?? []).length >= 4, path);
    }
  }
});

test("native server chart initialization ignores the mutable measurement hint", () => {
  const previous = Global.isSsr;
  try {
    const render = () =>
      renderToString(
        () =>
          createComponent(PieChart, {
            width: 500,
            height: 300,
            get children() {
              return createComponent(Pie, {
                data,
                dataKey: "value",
                isAnimationActive: false,
              });
            },
          }),
        { renderId: "hint-" },
      );
    Global.isSsr = true;
    const baseline = render();
    Global.isSsr = false;
    const html = render();
    const identities = (markup: string) =>
      [...markup.matchAll(/\b(?:id|data-hk|clip-path)="([^"]*)"/g)].map(
        (match) => match[0],
      );
    assert.ok(identities(baseline).length > 0);
    assert.deepEqual(identities(html), identities(baseline));
    assert.equal(
      [...html.matchAll(/class="[^"]*recharts-sector[^"]*"/g)].length,
      data.length,
    );
    assert.doesNotMatch(html, /NaN|Infinity|undefined/);
  } finally {
    Global.isSsr = previous;
  }
});

test("server Cartesian tick selection preserves numeric intervals and ignores the mutable measurement hint", () => {
  const previous = Global.isSsr;
  const labels = (html: string) =>
    [...html.matchAll(/<tspan\b[^>]*>([^<]*)<\/tspan>/g)].map(
      (match) => match[1],
    );
  try {
    for (const interval of ["preserveEnd", 1] as const) {
      const render = () =>
        renderToString(() =>
          createComponent(CartesianAxis, {
            x: 0,
            y: 0,
            width: 3,
            height: 20,
            interval,
            minTickGap: 5,
            ticks: ["A", "B", "C", "D"].map((value, index) => ({
              value,
              coordinate: index,
              index,
            })),
          }),
        );
      Global.isSsr = true;
      const baseline = labels(render());
      assert.deepEqual(
        baseline,
        interval === 1 ? ["A", "C"] : ["A", "B", "C", "D"],
      );
      Global.isSsr = false;
      assert.deepEqual(labels(render()), baseline);
    }
    const renderGrid = () =>
      renderToString(() =>
        createComponent(LineChart, {
          width: 120,
          height: 60,
          data,
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
          get children() {
            return [
              createComponent(XAxis, { dataKey: "name", height: 30 }),
              createComponent(YAxis, {
                domain: [0, 80],
                allowDataOverflow: true,
                tickCount: 9,
                width: 50,
              }),
              createComponent(CartesianGrid, { syncWithTicks: true }),
              createComponent(Line, {
                dataKey: "value",
                isAnimationActive: false,
              }),
            ];
          },
        }),
      );
    Global.isSsr = true;
    const baseline = renderGrid();
    assert.deepEqual(labels(baseline), [
      "A",
      "B",
      "C",
      "0",
      "10",
      "20",
      "30",
      "40",
      "50",
      "60",
      "70",
      "80",
    ]);
    Global.isSsr = false;
    const html = renderGrid();
    assert.deepEqual(labels(html), labels(baseline));
    const gridLines = (markup: string) =>
      [
        ...markup.matchAll(
          /<g\b[^>]*\bclass="recharts-cartesian-grid-(?:horizontal|vertical)"[^>]*>([\s\S]*?)<\/g>/g,
        ),
      ].flatMap(([, group]) => group.match(/<line\b[^>]*>/g) ?? []);
    assert.equal(gridLines(baseline).length, 12);
    assert.deepEqual(gridLines(html), gridLines(baseline));
  } finally {
    Global.isSsr = previous;
  }
});

test("independent server renders retain their own chart data and registrations", () => {
  const renderBars = (rows: typeof data) =>
    renderToString(() =>
      createComponent(BarChart, {
        width: 500,
        height: 300,
        data: rows,
        get children() {
          return createComponent(Bar, {
            dataKey: "value",
            isAnimationActive: false,
          });
        },
      }),
    );
  const countBars = (html: string) =>
    [...html.matchAll(/class="[^"]*recharts-rectangle[^"]*"/g)].length;
  assert.equal(countBars(renderBars(data)), 3);
  assert.equal(countBars(renderBars(data.slice(0, 1))), 1);
  assert.equal(countBars(renderBars(data)), 3);
});

test("Cell overrides and sibling ErrorBar render real server geometry in their graphical context", () => {
  const html = renderToString(() =>
    createComponent(BarChart, {
      width: 500,
      height: 300,
      data,
      get children() {
        return [
          createComponent(XAxis, { dataKey: "name" }),
          createComponent(YAxis, {}),
          createComponent(Bar, {
            dataKey: "value",
            isAnimationActive: false,
            get children() {
              return [
                createComponent(Cell, { fill: "#123456" }),
                createComponent(Cell, { fill: "#654321" }),
                createComponent(Cell, { fill: "#abcdef" }),
                createComponent(ErrorBar, { dataKey: "value" }),
              ];
            },
          }),
        ];
      },
    }),
  );
  for (const fill of ["#123456", "#654321", "#abcdef"]) {
    assert.match(
      html,
      new RegExp(
        `<path\\b[^>]*fill="${fill}"[^>]*class="[^"]*recharts-rectangle`,
      ),
    );
  }
  assert.equal(
    [...html.matchAll(/class="[^"]*recharts-errorBars"/g)].length,
    1,
  );
});

test("all five Cell consumers apply ordered overrides to their actual server marks", () => {
  const rows = data.map((row, index) => ({
    ...row,
    x: index + 1,
    y: row.value,
  }));
  const colors = ["#123456", "#654321", "#abcdef"];
  for (const [Chart, Series] of [
    [BarChart, Bar],
    [ScatterChart, Scatter],
    [FunnelChart, Funnel],
    [PieChart, Pie],
    [RadialBarChart, RadialBar],
  ] as const) {
    const html = renderToString(() =>
      createComponent(Chart, {
        width: 500,
        height: 300,
        data: rows,
        get children() {
          return [
            ...(Chart === BarChart
              ? [
                  createComponent(XAxis, { dataKey: "name" }),
                  createComponent(YAxis, {}),
                ]
              : []),
            ...(Chart === ScatterChart
              ? [
                  createComponent(XAxis, {
                    dataKey: "x",
                    type: "number" as const,
                  }),
                  createComponent(YAxis, { dataKey: "y" }),
                ]
              : []),
            createComponent(Series, {
              data: rows,
              dataKey: "value",
              isAnimationActive: false,
              get children() {
                return colors.map((fill) => createComponent(Cell, { fill }));
              },
            }),
          ];
        },
      }),
    );
    const paths = html.match(/<path\b[^>]*>/g) ?? [];
    for (const color of colors) {
      assert.equal(
        paths.filter((path) => path.includes(`fill="${color}"`)).length,
        1,
        Series.name + ":" + color,
      );
    }
  }
});
test("Bar, Pie, and Funnel preserve object-valued row data attributes in shapes", () => {
  const probe = { nested: true };
  const rows = [
    {
      name: "Probe",
      value: 10,
      "data-chart-probe": probe,
      "data-chart-label": "retained",
    },
  ];
  let barProbe: unknown;
  let pieProbe: unknown;
  let funnelProbe: unknown;
  const renderBar = (shape?: Parameters<typeof Bar>[0]["shape"]) =>
    renderToString(() =>
      createComponent(BarChart, {
        width: 500,
        height: 300,
        data: rows,
        get children() {
          return [
            createComponent(XAxis, { dataKey: "name" }),
            createComponent(YAxis, {}),
            createComponent(Bar, {
              dataKey: "value",
              isAnimationActive: false,
              shape,
            }),
          ];
        },
      }),
    );
  const renderPie = (shape?: Parameters<typeof Pie>[0]["shape"]) =>
    renderToString(() =>
      createComponent(PieChart, {
        width: 500,
        height: 300,
        data: rows,
        get children() {
          return createComponent(Pie, {
            dataKey: "value",
            isAnimationActive: false,
            shape,
          });
        },
      }),
    );
  const renderFunnel = (shape?: Parameters<typeof Funnel>[0]["shape"]) =>
    renderToString(() =>
      createComponent(FunnelChart, {
        width: 500,
        height: 300,
        data: rows,
        get children() {
          return createComponent(Funnel, {
            dataKey: "value",
            isAnimationActive: false,
            shape,
          });
        },
      }),
    );

  const barCustomHtml = renderBar((props) => {
    barProbe = props["data-chart-probe"];
    return createComponent(Rectangle, {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      "data-custom-shape": "bar",
    });
  });
  const pieCustomHtml = renderPie((props) => {
    pieProbe = props["data-chart-probe"];
    return createComponent(Rectangle, {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      "data-custom-shape": "pie",
    });
  });
  const funnelCustomHtml = renderFunnel((props) => {
    funnelProbe = props["data-chart-probe"];
    return createComponent(Rectangle, {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      "data-custom-shape": "funnel",
    });
  });
  for (const [name, html, value] of [
    ["Bar", barCustomHtml, barProbe],
    ["Pie", pieCustomHtml, pieProbe],
    ["Funnel", funnelCustomHtml, funnelProbe],
  ] as const) {
    assert.ok(html.includes(`data-custom-shape="${name.toLowerCase()}"`), name);
    assert.equal(value, probe, `${name} receives the original row object`);
  }

  for (const [name, html] of [
    ["Bar", renderBar()],
    ["Pie", renderPie()],
    ["Funnel", renderFunnel()],
  ] as const) {
    assert.match(html, /data-chart-probe="\[object Object\]"/, name);
    assert.match(html, /data-chart-label="retained"/, name);
  }
});

test("axes-first bounded-domain stacked SSR emits correct values and the complete numeric tick ladder", () => {
  const html = renderToString(() =>
    createComponent(ComposedChart, {
      width: 500,
      height: 300,
      margin: { top: 5, right: 5, bottom: 35, left: 65 },
      data: [
        { name: "A", low: 10, high: 20 },
        { name: "B", low: 20, high: 30 },
      ],
      get children() {
        return [
          createComponent(XAxis, {
            dataKey: "name",
            scale: "band" as const,
            height: 0,
            interval: 0,
          }),
          createComponent(YAxis, {
            domain: [0, 50],
            allowDataOverflow: true,
            width: 0,
            interval: 0,
          }),
          createComponent(Bar, {
            dataKey: "low",
            stackId: "sum",
            fill: "#123456",
            isAnimationActive: false,
          }),
          createComponent(Bar, {
            dataKey: "high",
            stackId: "sum",
            fill: "#654321",
            isAnimationActive: false,
          }),
        ];
      },
    }),
  );
  assert.deepEqual(
    [...html.matchAll(/<tspan\b[^>]*>([^<]*)<\/tspan>/g)].map(
      (match) => match[1],
    ),
    ["A", "B", "0", "15", "30", "45", "50"],
  );
  const ticks = [
    ...html.matchAll(
      /<text\b[^>]*class="[^"]*recharts-cartesian-axis-tick-value[^"]*"[^>]*>/g,
    ),
  ].map(([tag]) =>
    ["x", "y"].map((attribute) =>
      Number(tag.match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1]),
    ),
  );
  assert.deepEqual(
    ticks.map(([x, y]) => [x, Math.round(y)]),
    [
      [172.5, 273],
      [387.5, 273],
      [57, 265],
      [57, 187],
      [57, 109],
      [57, 31],
      [57, 5],
    ],
  );
  assert.match(
    html,
    /<clipPath\b[^>]*><rect x="65" y="5" height="260" width="430"/,
  );
  const marks = [
    ...html.matchAll(/<path\b[^>]*class="[^"]*recharts-rectangle[^"]*"[^>]*>/g),
  ].map(([tag]) =>
    ["y", "height"].map((attribute) =>
      Number(tag.match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1]),
    ),
  );
  // The 260px plot represents [0,50]; the upper series starts at each lower value.
  assert.deepEqual(marks, [
    [213, 52],
    [161, 104],
    [109, 104],
    [5, 156],
  ]);
});

// Selected upstream cases use only public components and their rendered output.
for (const [position, top, left, transform] of [
  ["top", 5, 250, "translate(-50%, -100%)"],
  ["bottom", 495, 250, "translate(-50%, 0)"],
  ["left", 250, 5, "translate(-100%, -50%)"],
  ["right", 250, 495, "translate(0, -50%)"],
  ["insideBottomRight", 485, 485, "translate(-100%, -100%)"],
] as const) {
  test(`selected Charts SSR legend-placement ${position}`, () => {
    const html = renderToString(() =>
      createComponent(LineChart, {
        width: 500,
        height: 500,
        data,
        get children() {
          return [
            createComponent(Line, {
              dataKey: "value",
              isAnimationActive: false,
            }),
            createComponent(Legend, { position, offset: 10 }),
          ];
        },
      }),
    );
    const wrapper = html.match(
      /<div\b[^>]*class="[^"]*recharts-legend-wrapper[^"]*"[^>]*>/,
    )?.[0];
    assert.ok(wrapper, html);
    for (const [property, expected] of [
      ["top", `${top}px`],
      ["left", `${left}px`],
      ["transform", transform],
    ]) {
      assert.ok(
        wrapper.includes(`${property}:${expected}`) ||
          wrapper.includes(`${property}: ${expected}`),
        wrapper,
      );
    }
  });
}

for (const height of [30, "auto"] as const) {
  test(`selected Charts SSR ${height === "auto" ? "auto-xaxis retains the 30px server fallback" : "numeric xaxis reserves its 30px plot height"}`, () => {
    const html = renderToString(() =>
      createComponent(LineChart, {
        width: 500,
        height: 300,
        data,
        get children() {
          return [
            createComponent(XAxis, {
              dataKey: "name",
              height,
              label: "Revenue categories",
            }),
            createComponent(Line, {
              dataKey: "value",
              isAnimationActive: false,
            }),
          ];
        },
      }),
    );
    const attributes = (tag: string | undefined, names: string[]) =>
      names.map((name) =>
        Number(tag?.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1]),
      );
    const text = (element: string) =>
      [...element.matchAll(/<tspan\b[^>]*>([^<]*)<\/tspan>/g)]
        .map((match) => match[1])
        .join("");
    const tickElements = [
      ...html.matchAll(
        /<text\b[^>]*class="[^"]*\brecharts-cartesian-axis-tick-value\b[^"]*"[^>]*>[\s\S]*?<\/text>/g,
      ),
    ];
    const label = html.match(
      /<text\b[^>]*class="[^"]*\brecharts-label\b[^"]*"[^>]*>[\s\S]*?<\/text>/,
    )?.[0];
    assert.deepEqual(
      {
        plot: attributes(html.match(/<clipPath\b[^>]*><rect\b[^>]*>/)?.[0], [
          "x",
          "y",
          "width",
          "height",
        ]),
        ticks: tickElements.map(([element]) => [
          ...attributes(element, ["x", "y"]),
          text(element),
        ]),
        label: [
          ...attributes(label, ["x", "y"]),
          label == null ? undefined : text(label),
        ],
      },
      {
        plot: [5, 5, 490, 260],
        ticks: [
          [5, 273, "A"],
          [250, 273, "B"],
          [495, 273, "C"],
        ],
        label: [250, 280, "Revenue categories"],
      },
    );
  });
}

test("selected Charts SSR Sankey exposes accessible SVG title and description", () => {
  const html = renderToString(() =>
    createComponent(Sankey, {
      width: 500,
      height: 300,
      title: "Selected flows",
      desc: "Source sends ten units",
      accessibilityLayer: true,
      data: {
        nodes: [{ name: "Source" }, { name: "Target" }],
        links: [{ source: 0, target: 1, value: 10 }],
      },
    }),
  );
  assert.match(html, /<svg\b[^>]*role="application"/);
  assert.match(html, /<svg\b[^>]*tabindex="0"/i);
  assert.match(html, /<title\b[^>]*>Selected flows<\/title>/);
  assert.match(html, /<desc\b[^>]*>Source sends ten units<\/desc>/);
});

test("selected Charts SSR Pie children retain configured geometry for positive and zero data", () => {
  for (const rows of [data, [{ value: 0 }]]) {
    const html = renderToString(() =>
      createComponent(PieChart, {
        width: 400,
        height: 400,
        get children() {
          return createComponent(Pie, {
            data: rows,
            dataKey: "value",
            cx: "25%",
            cy: "40%",
            innerRadius: "40%",
            outerRadius: "80%",
            isAnimationActive: false,
            get children() {
              return [
                createComponent(Label, {
                  position: "center",
                  content: (props) =>
                    createComponent(Text, {
                      get x() {
                        return props.x;
                      },
                      get y() {
                        return props.y;
                      },
                      get children() {
                        const box = props.viewBox as {
                          cx?: number;
                          cy?: number;
                          innerRadius?: number;
                          outerRadius?: number;
                        };
                        return `pie:${box.cx}:${box.cy}:${box.innerRadius}:${box.outerRadius}`;
                      },
                    }),
                }),
                createComponent(Label, { position: "center", value: 0 }),
              ];
            },
          });
        },
      }),
    );
    assert.match(html, /pie:102\.5:161:78:156/);
    const texts = [...html.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)];
    assert.equal(texts.length, 2);
    for (const [, attributes] of texts) {
      assert.match(attributes, /\sx="102\.5"/);
      assert.match(attributes, /\sy="161"/);
    }
    assert.match(texts[1][2], />0</);
  }
});

test("selected Charts SSR stacked connectNulls skips the all-null category", () => {
  const html = renderToString(() =>
    createComponent(AreaChart, {
      width: 100,
      height: 50,
      data: [
        { name: "Page A", uv: 400, pv: 2400, amt: 2400 },
        { name: "Page B" },
        { name: "Page C", uv: 300, pv: 1398, amt: 2400 },
      ],
      get children() {
        return ["uv", "pv", "amt"].map((dataKey) =>
          createComponent(Area, {
            dataKey,
            stackId: "1",
            connectNulls: true,
            type: "monotone",
            isAnimationActive: false,
          }),
        );
      },
    }),
  );
  const paths = [
    ...html.matchAll(
      /<path\b[^>]*class="[^"]*recharts-area-curve[^"]*"[^>]*>/g,
    ),
  ];
  assert.equal(paths.length, 3);
  for (const [tag] of paths) {
    const d = tag.match(/\sd="([^"]*)"/)?.[1];
    assert.ok(d);
    assert.match(d, /^M5,/);
    assert.equal((d.match(/[MLCQ]/g) ?? []).length, 2, d);
  }
});

test("Area dots retain strokeWidth from component props", () => {
  const html = renderToString(() =>
    createComponent(AreaChart, {
      width: 100,
      height: 50,
      data: [
        { name: "Page A", value: 10 },
        { name: "Page B", value: 20 },
      ],
      get children() {
        return createComponent(Area, {
          dataKey: "value",
          dot: true,
          isAnimationActive: false,
          strokeWidth: 4,
        });
      },
    }),
  );
  const dots = [
    ...html.matchAll(
      /<circle\b[^>]*class="[^"]*recharts-area-dot[^"]*"[^>]*>/g,
    ),
  ];
  assert.equal(dots.length, 2);
  for (const [dot] of dots) {
    assert.match(dot, /\sstroke-width="4"/);
  }
});

test("selected Charts SSR numeric floating gaps and clamped bars preserve widths and gaps", () => {
  for (const floating of [true, false]) {
    const html = renderToString(() =>
      createComponent(BarChart, {
        width: floating ? 40 : 400,
        height: 200,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        data: (floating
          ? [0, 10, 20, 30, 30.00008318614652580436]
          : [0, 10]
        ).map((x) => ({ x, value: 10, other: 20 })),
        barGap: floating ? 0 : 7,
        barCategoryGap: 0,
        get children() {
          return [
            createComponent(XAxis, {
              dataKey: "x",
              type: "number" as const,
              domain: [0, floating ? 40 : 20],
              allowDataOverflow: true,
              height: 0,
              ticks: floating
                ? [0, 10, 20, 30, 30.00008318614652580436]
                : [0, 10],
            }),
            createComponent(YAxis, { width: 0 }),
            createComponent(Bar, {
              dataKey: "value",
              maxBarSize: floating ? undefined : 20,
              fill: "#123456",
              isAnimationActive: false,
            }),
            ...(floating
              ? []
              : [
                  createComponent(Bar, {
                    dataKey: "other",
                    maxBarSize: 20,
                    fill: "#654321",
                    isAnimationActive: false,
                  }),
                ]),
          ];
        },
      }),
    );
    const marks = [
      ...html.matchAll(
        /<path\b[^>]*class="[^"]*recharts-rectangle[^"]*"[^>]*>/g,
      ),
    ].map(([tag]) => ({
      x: Number(tag.match(/\sx="([^"]*)"/)?.[1]),
      width: Number(tag.match(/\swidth="([^"]*)"/)?.[1]),
      fill: tag.match(/\sfill="([^"]*)"/)?.[1],
    }));
    assert.equal(marks.length, floating ? 5 : 4);
    if (floating) for (const mark of marks) assert.equal(mark.width, 10);
    else {
      const first = marks.filter((mark) => mark.fill === "#123456");
      const second = marks.filter((mark) => mark.fill === "#654321");
      first.forEach((mark, index) => {
        assert.equal(mark.width, 20);
        assert.equal(second[index].x - mark.x - mark.width, 7);
      });
    }
  }
});

test("selected Charts SSR custom Label computes coordinates without overriding explicit props", () => {
  for (const explicit of [false, true]) {
    const html = renderToString(() =>
      createComponent(Label, {
        viewBox: { x: 50, y: 50, width: 200, height: 200 },
        position: "center",
        ...(explicit
          ? {
              x: 17,
              y: 23,
              textAnchor: "start" as const,
              verticalAnchor: "end" as const,
            }
          : {}),
        content: (props) =>
          createComponent(Text, {
            get x() {
              return props.x;
            },
            get y() {
              return props.y;
            },
            get children() {
              return `label:${props.x}:${props.y}:${props.textAnchor ?? "absent"}:${props.verticalAnchor ?? "absent"}:${props.viewBox && "width" in props.viewBox ? props.viewBox.width : "absent"}`;
            },
          }),
      }),
    );
    assert.ok(
      html.includes(
        explicit
          ? "label:17:23:start:end:200"
          : "label:150:150:absent:absent:200",
      ),
      html,
    );
  }
});
