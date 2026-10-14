import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createComponent } from 'solid-js';
import { renderToString } from '@solidjs/web';
import { ComposedChart, LineChart, Line, BarChart, Bar, PieChart, Pie, ScatterChart, Scatter, FunnelChart, Funnel, RadialBarChart, RadialBar, XAxis, YAxis, Brush, Cell, ErrorBar } from '@wsagency/radix2solid-charts';
import { Global } from '@wsagency/radix2solid-charts';

const data = [{ name: 'A', value: 10 }, { name: 'B', value: 30 }, { name: 'C', value: 20 }];

test('fixed size native charts emit actual finite data geometry before JavaScript', () => {
  assert.equal(typeof document, 'undefined');
  for (const [Chart, Series, geometry] of [
    [LineChart, Line, /class="[^"]*recharts-line-curve[^"]*"/],
    [BarChart, Bar, /class="[^"]*recharts-rectangle[^"]*"/],
    [PieChart, Pie, /class="[^"]*recharts-sector[^"]*"/]
  ] as const) {
    const html = renderToString(() => createComponent(Chart, {
      width: 500, height: 300, data,
      get children() { return [
        ...(Chart === PieChart ? [] : [createComponent(XAxis, { dataKey: 'name' }), createComponent(YAxis, {})]),
        createComponent(Series, { data, dataKey: 'value', isAnimationActive: false }),
        ...(Chart === LineChart ? [createComponent(Brush, { dataKey: 'name' })] : [])
      ]; }
    }), { renderId: 'chart-' });
    assert.match(html, /<svg\b[^>]*width="500"[^>]*height="300"/);
    assert.match(html, geometry);
    const paths = [...html.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map(match => match[1]);
    assert.ok(paths.length > 0, html);
    for (const path of paths) {
      assert.match(path, /[MLC]/);
      assert.doesNotMatch(path, /NaN|Infinity|undefined/);
      assert.ok((path.match(/-?\d+(?:\.\d+)?/g) ?? []).length >= 4, path);
    }
  }
});

test('native server chart initialization ignores the mutable measurement hint', () => {
  const previous = Global.isSsr;
  try {
    const render = () => renderToString(() => createComponent(PieChart, {
      width: 500, height: 300,
      get children() { return createComponent(Pie, { data, dataKey: 'value', isAnimationActive: false }); }
    }), { renderId: 'hint-' });
    Global.isSsr = true;
    const baseline = render();
    Global.isSsr = false;
    const html = render();
    const identities = (markup: string) => [...markup.matchAll(/\b(?:id|data-hk|clip-path)="([^"]*)"/g)].map(match => match[0]);
    assert.ok(identities(baseline).length > 0);
    assert.deepEqual(identities(html), identities(baseline));
    assert.equal([...html.matchAll(/class="[^"]*recharts-sector[^"]*"/g)].length, data.length);
    assert.doesNotMatch(html, /NaN|Infinity|undefined/);
  } finally {
    Global.isSsr = previous;
  }
});

test('independent server renders retain their own chart data and registrations', () => {
  const renderBars = (rows: typeof data) => renderToString(() => createComponent(BarChart, {
    width: 500, height: 300, data: rows,
    get children() { return createComponent(Bar, { dataKey: 'value', isAnimationActive: false }); }
  }));
  const countBars = (html: string) => [...html.matchAll(/class="[^"]*recharts-rectangle[^"]*"/g)].length;
  assert.equal(countBars(renderBars(data)), 3);
  assert.equal(countBars(renderBars(data.slice(0, 1))), 1);
  assert.equal(countBars(renderBars(data)), 3);
});

test('Cell overrides and sibling ErrorBar render real server geometry in their graphical context', () => {
  const html = renderToString(() => createComponent(BarChart, {
    width: 500, height: 300, data,
    get children() { return [
      createComponent(XAxis, { dataKey: 'name' }), createComponent(YAxis, {}),
      createComponent(Bar, {
        dataKey: 'value', isAnimationActive: false,
        get children() {
          return [
            createComponent(Cell, { fill: '#123456' }),
            createComponent(Cell, { fill: '#654321' }),
            createComponent(Cell, { fill: '#abcdef' }),
            createComponent(ErrorBar, { dataKey: 'value' }),
          ];
        },
      }),
    ]; },
  }));
  for (const fill of ['#123456', '#654321', '#abcdef']) {
    assert.match(html, new RegExp(`<path\\b[^>]*fill="${fill}"[^>]*class="[^"]*recharts-rectangle`));
  }
  assert.equal([...html.matchAll(/class="[^"]*recharts-errorBars"/g)].length, 1);
});

test('all five Cell consumers apply ordered overrides to their actual server marks', () => {
  const rows = data.map((row, index) => ({ ...row, x: index + 1, y: row.value }));
  const colors = ['#123456', '#654321', '#abcdef'];
  for (const [Chart, Series] of [[BarChart, Bar], [ScatterChart, Scatter], [FunnelChart, Funnel], [PieChart, Pie], [RadialBarChart, RadialBar]] as const) {
    const html = renderToString(() => createComponent(Chart, {
      width: 500, height: 300, data: rows,
      get children() { return [
        ...(Chart === BarChart ? [createComponent(XAxis, { dataKey: 'name' }), createComponent(YAxis, {})] : []),
        ...(Chart === ScatterChart ? [createComponent(XAxis, { dataKey: 'x', type: 'number' as const }), createComponent(YAxis, { dataKey: 'y' })] : []),
        createComponent(Series, {
          data: rows, dataKey: 'value', isAnimationActive: false,
          get children() { return colors.map(fill => createComponent(Cell, { fill })); },
        }),
      ]; },
    }));
    const paths = html.match(/<path\b[^>]*>/g) ?? [];
    for (const color of colors) {
      assert.equal(paths.filter(path => path.includes(`fill="${color}"`)).length, 1, Series.name + ':' + color);
    }
  }
});

test('axes-first bounded-domain stacked SSR emits correct values and the complete numeric tick ladder', () => {
  const html = renderToString(() => createComponent(ComposedChart, {
    width: 500, height: 300,
    margin: { top: 5, right: 5, bottom: 35, left: 65 },
    data: [{ name: 'A', low: 10, high: 20 }, { name: 'B', low: 20, high: 30 }],
    get children() { return [
      createComponent(XAxis, { dataKey: 'name', scale: 'band' as const, height: 0, interval: 0 }),
      createComponent(YAxis, { domain: [0, 50], allowDataOverflow: true, width: 0, interval: 0 }),
      createComponent(Bar, { dataKey: 'low', stackId: 'sum', fill: '#123456', isAnimationActive: false }),
      createComponent(Bar, { dataKey: 'high', stackId: 'sum', fill: '#654321', isAnimationActive: false }),
    ]; },
  }));
  assert.deepEqual([...html.matchAll(/<tspan\b[^>]*>([^<]*)<\/tspan>/g)].map(match => match[1]), ['A', 'B', '0', '15', '30', '45', '50']);
  const ticks = [...html.matchAll(/<text\b[^>]*class="[^"]*recharts-cartesian-axis-tick-value[^"]*"[^>]*>/g)].map(([tag]) =>
    ['x', 'y'].map(attribute => Number(tag.match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1])));
  assert.deepEqual(ticks.map(([x, y]) => [x, Math.round(y)]), [[172.5, 273], [387.5, 273], [57, 265], [57, 187], [57, 109], [57, 31], [57, 5]]);
  assert.match(html, /<clipPath\b[^>]*><rect x="65" y="5" height="260" width="430"/);
  const marks = [...html.matchAll(/<path\b[^>]*class="[^"]*recharts-rectangle[^"]*"[^>]*>/g)].map(([tag]) =>
    ['y', 'height'].map(attribute => Number(tag.match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1])));
  // The 260px plot represents [0,50]; the upper series starts at each lower value.
  assert.deepEqual(marks, [[213, 52], [161, 104], [109, 104], [5, 156]]);
});
