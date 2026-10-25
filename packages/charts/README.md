# Native Solid 2 Charts

Native fork, not an official Recharts or solid-recharts product. This README describes prerelease `@wsagency/radix2solid-charts@0.1.0-rc.4`; the Charts API is unchanged from rc.3. Install the exact version with `pnpm add -E @wsagency/radix2solid-charts@0.1.0-rc.4`. This remains a Solid `2.0.0-rc.15` prerelease. The approved one-time `latest` target for the existing rc.4 publication is `0.1.0-rc.4`. npm dist-tags are mutable: `latest` selects unqualified install resolution, not semver stability. The `-E` command above remains pinned to this exact prerelease regardless of tag changes. Future prerelease publications continue to use `next`; source-checkout packing is an optional development alternative.

Charts is a source copy of [solid-recharts](https://github.com/yumemi-thomas/solid-recharts) `2.0.0-beta.1`, a Solid port of the [Recharts](https://github.com/recharts/recharts) `3.9.2` component model, adapted to Solid `2.0.0-rc.15` and to server rendering. See `UPSTREAM.md` for the exact commits and every local change.

Solid `2.0.0-rc.15` and `@solidjs/web` `2.0.0-rc.15` are peers; `solid-js` rc.15 declares Node `>=22.12.0`. This repository's checks run on Node 24; a server-rendering smoke test of the packed tarballs also passes on Node 22.12.0. Browser export conditions select native client ESM; the default selects native server ESM. Declarations are shared. `d3-scale` and `d3-shape` are ordinary dependencies, installed with the package and not bundled into it. No React, Redux or Recharts runtime.

## Optional source-checkout development

Charts has no dependency on the other Radix2Solid packages. To build and pack from a source checkout, use Node 24.21.0 and pnpm 11.5.0 as in the root README:

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
pnpm add ./vendor/wsagency-radix2solid-charts-0.1.0-rc.4.tgz solid-js@2.0.0-rc.15 @solidjs/web@2.0.0-rc.15
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

Custom ticks, shapes, labels and tooltip content are render functions. Create custom label JSX inside its render function (for example, `label={props => <text x={props.x} y={props.y}>Categories</text>}`), so it is rendered and hydrated with the chart; do not eagerly create a JSX node and pass it as a label prop. React element forms that Recharts clones (for example an element passed as `tick` or `shape`) are not supported, because Solid has no element cloning. `Customized` is not exported.

### Selected upstream additions

The rc.3 release ports the selected A1–A13 changes and B1/B2 guards, with bounded local public Node SSR, cross-engine SSR/CSR and packed-consumer evidence recorded in `UPSTREAM.md` and `upstream.json`. This is not a complete Recharts 3.10.1 port. The rc.4 package keeps the Charts API unchanged from rc.3; the retained local evidence concerns the same Charts implementation.

- `Legend` accepts `position` and `offset` (default `0`). The exported `CartesianPosition` type includes `top`, `bottom`, `left`, `right`, `center`, the Cartesian `inside*` positions, and `{ x, y }` with numbers or percentages. A supplied position overrides `align`/`verticalAlign`; without it, existing alignment remains unchanged. `layout="auto"` is the default: left/right/insideLeft/insideRight resolve to vertical, other positions to horizontal. Explicit horizontal/vertical layouts still win.
- Outside positioned legends reserve their measured width/height plus offset; inside legends overlay the plot without reserving space. Default-mount positioned legends render in the chart wrapper's HTML outlet on the server and hydrate that element before measurement. Server placement uses a zero-sized legend box, not the final measured dimensions. No-position and explicit custom-portal legends retain the legacy DOM-portal boundary; this does not add their HTML to server output. A custom portal uses only `wrapperStyle` for positioning.
- `XAxis height="auto"` starts at `30px` on the server and for the initial hydration claim. In the browser it measures the tallest rendered tick-label wrapper, tick size/margin and an actual string-label element (including the `5px` label gap), rounded to a pixel. Changes to `fontSize`/`letterSpacing` and native web-font completion invalidate that measurement; font subscriptions are disposed with the axis. Function labels skip automatic measurement. JSX element/cloning label props remain unsupported and are not interpreted as Label settings. Numeric heights remain declared heights. Rotated ticks can increase the measured height; this is not server-final sizing.
- `Sankey` accepts `title`, `desc`, `accessibilityLayer`, `role` and `tabIndex`. The accessibility layer defaults to true, supplying `role="application"` and `tabindex="0"` unless explicitly overridden. Title and description belong to the root SVG.
- Pie child labels use the Pie's computed center/radii, including percentage radii. Zero-valued data that produces no sectors retains the configured center/radii for child labels, including `value={0}`. Function Label content receives computed `x`/`y`, followed by explicit props and the viewBox; computed anchors are not injected into custom content. Explicit coordinates/anchors keep precedence for nested labels.
- Controlled `Brush` keeps the exact dragged traveller positions on release, even without `onChange`, and reapplies unchanged controlled indices when chart data is replaced. Keyboard and synchronized selection changes still update the travellers. This deliberately follows Charts' retained-drag behavior, not parent-authoritative refusal semantics of other controlled inputs.
- Selected fixes cover all-null stacked Area gaps, missing-label tooltip index fallback, floating tick-gap band sizing, configured gaps between max-size-clamped bars, polar tooltip wrap-around, and unchanged rendered-tick reports. Text's CSS calculation evaluator treats replacement tokens literally and rejects inputs longer than 1,000 characters before whitespace normalization.

Local verification includes all 20 public Charts Node SSR tests, the selected browser cases across Chromium/Firefox/WebKit, and every Charts case in the packed Chromium core suite. Review follow-ups passed font/spacing changes and positive-to-zero Pie geometry in packed Chromium, plus controlled real-font completion and axis disposal in all three engines. TS7 and TS5.9 packed declarations passed, including the selected public prop types. Server-only claim cases intentionally skip CSR; these local results are not a claim that the full CI workflow has run.

```tsx
import { Legend } from "@wsagency/radix2solid-charts";

<LineChart
  width={500}
  height={300}
  data={data}
>
  <XAxis
    dataKey="month"
    height="auto"
    angle={-45}
    interval={0}
    label="Month"
  />
  <Line dataKey="visitors" />
  <Legend
    position="bottom"
    offset={10}
  />
</LineChart>;
```

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

Automatic domains are not server-final. Automatic axis sizing is likewise not server-final: `XAxis height="auto"` has the documented 30px fallback and measures only in the browser. The shared root clip now reads the plot after ordinary children register their axes, including declared numeric heights. Its `<defs>` follows those children; a 500×300 chart with 5px margins and a 30px X axis therefore clips to height260 instead of the old erroneous margin-only290. This corrects clipping, not tick geometry, and does not promise byte-identical server markup.

## Known limits

- `Treemap` has entry animation only. It has no `isUpdateAnimationActive` prop: Recharts' Treemap update animation is not ported.
- Some copied source comments (for example `DEFERRED` notes or file headers that list unported paths) are historical solid-recharts comments and may be stale. They are not evidence of what works; this README, `UPSTREAM.md` and the tests are.
- The Recharts 3.10.1 comparison is selectively adapted, not a complete version upgrade. The new upstream theme API, unrelated Legend/Tooltip type changes and canary packaging remain excluded; CSS colors and existing Themes tokens continue to work.

## Attribution

MIT. `LICENSE` keeps the solid-recharts notice (Copyright (c) 2026 Thomas Guehenneux) and adds the Recharts notice (Copyright (c) 2015-present recharts). `NOTICE` reproduces the ISC license of each D3 package in the resolved dependency graph of `d3-scale` and `d3-shape`. If your bundler inlines D3 into your application, carry those notices with it.
