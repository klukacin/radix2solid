# Native Solid 2 Charts

Native fork, not an official Recharts or solid-recharts product. **Prepared candidate `@wsagency/radix2solid-charts@0.1.0-rc.2` — not yet published.** It will be released under the npm `next` dist-tag because its Solid peers are release candidates. After publication: `pnpm add @wsagency/radix2solid-charts@0.1.0-rc.2`; until then consume `pnpm pack` tarballs.

Charts is a source copy of [solid-recharts](https://github.com/yumemi-thomas/solid-recharts) `2.0.0-beta.1`, a Solid port of the [Recharts](https://github.com/recharts/recharts) `3.9.2` component model, adapted to Solid `2.0.0-rc.15` and to server rendering. See `UPSTREAM.md` for the exact commits and every local change.

Solid `2.0.0-rc.15` and `@solidjs/web` `2.0.0-rc.15` are peers; `solid-js` rc.15 declares Node `>=22.12.0`. This repository's checks run on Node 24; a server-rendering smoke test of the packed tarballs also passes on Node 22.12.0. Browser export conditions select native client ESM; the default selects native server ESM. Declarations are shared. `d3-scale` and `d3-shape` are ordinary dependencies, installed with the package and not bundled into it. No React, Redux or Recharts runtime.

## Installing the candidate tarball

Charts has no dependency on the other Radix2Solid packages. Build and pack it from a checkout of this repository (Node 24.21.0 and pnpm 11.5.0, as in the root README):

```sh
pnpm install --frozen-lockfile
pnpm --filter @wsagency/radix2solid-charts build
pnpm --dir packages/charts pack --pack-destination /path/to/my-app/vendor
```

First pin the whole Solid tuple in the application's `pnpm-workspace.yaml`, so no transitive package resolves a different release candidate:

```yaml
overrides:
  solid-js: 2.0.0-rc.15
  "@solidjs/web": 2.0.0-rc.15
  "@solidjs/signals": 2.0.0-rc.15
  "@solidjs/compiler": 2.0.0-rc.15
  "@solidjs/babel-plugin": 2.0.0-rc.15
```

If your pnpm configuration sets `minimumReleaseAge`, also add exact-version `minimumReleaseAgeExclude` entries for these releases until they age, as this repository's `pnpm-workspace.yaml` does. Configure both before the first install.

In the application, install the tarball with the exact Solid peers and the matching toolchain:

```sh
pnpm add ./vendor/wsagency-radix2solid-charts-0.1.0-rc.2.tgz solid-js@2.0.0-rc.15 @solidjs/web@2.0.0-rc.15
pnpm add -D vite@8.3.3 @solidjs/vite-plugin@3.0.0-next.50 typescript@7.0.2
```

Use `@solidjs/vite-plugin` with `solid({ ssr: true })` for server rendering, and keep one Solid runtime with `resolve: { dedupe: ['solid-js', '@solidjs/web', '@solidjs/signals'] }`. In `tsconfig.json` set `"jsx": "preserve"`, `"jsxImportSource": "@solidjs/web"` and `"moduleResolution": "Bundler"`. The declarations are emitted by TypeScript 7.0.2. This repository's packed consumer checks also compile them with the TypeScript 5.9.3 compiler API, for tools that still load TypeScript 5. `pnpm test:consumer` (in this repository) exercises this packed-tarball path in an independent install.

## Usage

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "@wsagency/radix2solid-charts";

const data = [
  { month: "Jan", visitors: 4000 },
  { month: "Feb", visitors: 3000 },
  { month: "Mar", visitors: 5000 },
];

function Visitors() {
  return (
    <LineChart
      width={500}
      height={300}
      data={data}
      title="Visitors by month"
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="var(--gray-a6, #ccc)"
      />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="visitors"
        stroke="var(--accent-9, royalblue)"
      />
    </LineChart>
  );
}
```

The root export keeps the whole inherited solid-recharts surface: the twelve chart families (`LineChart`, `AreaChart`, `BarChart`, `ComposedChart`, `ScatterChart`, `FunnelChart`, `PieChart`, `RadarChart`, `RadialBarChart`, `Treemap`, `Sankey`, `SunburstChart`), their series, axes, grids, reference elements, `ErrorBar`, `Brush`, `Tooltip`, `Legend`, `ResponsiveContainer`, `Cell`, labels, shapes, hooks and animation helpers. Component and prop names follow Recharts.

Series accept any CSS color. Charts does not depend on Themes. The examples use Themes tokens with a plain fallback (`var(--accent-9, royalblue)`): without Themes they draw in the fallback color, and inside a Themes `Theme` they follow the nearest theme.

Custom ticks, shapes, labels and tooltip content are render functions. React element forms that Recharts clones (for example an element passed as `tick` or `shape`) are not supported, because Solid has no element cloning. `Customized` is not exported.

## Server rendering

A chart with a fixed `width` and `height`, or a `ResponsiveContainer` with `initialDimension`, renders real SVG on the server. The tests confirm that the root SVG of a fixed-size chart hydrates in place; animated series may still replace their own paths in the browser. Server geometry is final only under the recipe below. A `ResponsiveContainer` without `initialDimension` renders an empty measurement state on the server and draws in the browser; the package does not invent dimensions.

The server renders a chart in one pass, before axes and series have registered with each other. The following bounded Cartesian recipe is regression-tested to give identical tick positions and series geometry before and after hydration:

1. Declare the axes before the series, the category axis first.
2. Reserve the axis gutters in the chart's `margin`, and set the axes' own size to zero (`height={0}` on `XAxis`, `width={0}` on `YAxis`).
3. Give the category axis `scale="band"`.
4. Give the value axis an explicit `domain` and `allowDataOverflow`. The domain stays fixed: values outside it are clipped to the plot area instead of widening the axis. Choosing a domain that covers your data, including stacked totals, is up to you.
5. Set `interval={0}` on both axes. The browser measures label text and drops labels that would overlap; the server cannot, so without `interval={0}` the two disagree. Make sure your labels fit.

```tsx
import { ComposedChart, XAxis, YAxis, Bar } from "@wsagency/radix2solid-charts";

const data = [
  { name: "A", low: 10, high: 20 },
  { name: "B", low: 20, high: 30 },
];

function StackedTotals() {
  return (
    <ComposedChart
      width={500}
      height={300}
      margin={{ top: 5, right: 5, bottom: 35, left: 65 }}
      data={data}
    >
      <XAxis
        dataKey="name"
        scale="band"
        height={0}
        interval={0}
      />
      <YAxis
        domain={[0, 50]}
        allowDataOverflow
        width={0}
        interval={0}
      />
      <Bar
        dataKey="low"
        stackId="sum"
        fill="var(--accent-9, royalblue)"
        isAnimationActive={false}
      />
      <Bar
        dataKey="high"
        stackId="sum"
        fill="var(--teal-9, teal)"
        isAnimationActive={false}
      />
    </ComposedChart>
  );
}
```

Charts that rely on automatic domains or automatic axis sizes, including stacked series, are not supported on the server: their client render is correct, but their server HTML is not until the client redraws it.

## Known limits

- `Treemap` has entry animation only. It has no `isUpdateAnimationActive` prop: Recharts' Treemap update animation is not ported.
- Some copied source comments (for example `DEFERRED` notes or file headers that list unported paths) are historical solid-recharts comments and may be stale. They are not evidence of what works; this README, `UPSTREAM.md` and the tests are.
- Recharts `3.10.1` is tracked but not ported.

## Attribution

MIT. `LICENSE` keeps the solid-recharts notice (Copyright (c) 2026 Thomas Guehenneux) and adds the Recharts notice (Copyright (c) 2015-present recharts). `NOTICE` reproduces the ISC license of each D3 package in the resolved dependency graph of `d3-scale` and `d3-shape`. If your bundler inlines D3 into your application, carry those notices with it.
