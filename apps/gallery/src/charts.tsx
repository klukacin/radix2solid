import { createContext, createSignal, For, Show, useContext } from 'solid-js';
import { ResponsiveContainer, ComposedChart, LineChart, AreaChart, BarChart, ScatterChart, FunnelChart, PieChart, RadarChart, RadialBarChart, Treemap, Sankey, SunburstChart, Line, Area, Bar, Scatter, Funnel, Pie, Radar, RadialBar, XAxis, YAxis, ZAxis, PolarAngleAxis, PolarRadiusAxis, PolarGrid, CartesianGrid, Tooltip, Legend, Brush, ReferenceLine, ReferenceDot, ReferenceArea, ErrorBar, LabelList, Cell, Rectangle } from '@wsagency/radix2solid-charts';
import { Label, type ImplicitLabelType } from '@wsagency/radix2solid-charts';

const SelectedLegendOwner = createContext('missing');
const selectedLegendFormatter = (value: string | undefined) =>
  <span data-legend-owner={useContext(SelectedLegendOwner)}>{value}</span>;

export function Charts() {
  const [revision, setRevision] = createSignal(0);
  const [mounted, setMounted] = createSignal(true);
  const [width, setWidth] = createSignal(500);
  const [resizes, setResizes] = createSignal('');
  const [range, setRange] = createSignal('0:4');
  const [rangeEvents, setRangeEvents] = createSignal(0);
  const [valueSync, setValueSync] = createSignal(false);
  const [animate, setAnimate] = createSignal(false);
  const [animationStarts, setAnimationStarts] = createSignal(0);
  const [animationEnds, setAnimationEnds] = createSignal(0);
  const [target, setTarget] = createSignal<HTMLDivElement>();
  const data = () => ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map((name, index) => ({ name, value: [10, 30, 20, 45, 25][index] + (index === 1 ? revision() * 15 : 0), other: 8 + index * 4, x: index + 1, y: 10 + index * 9 + revision() * index, z: 50 + index * 20, error: 2 }));
  const hierarchy = () => ({ name: 'Total', value: 80 + revision() * 20, children: [{ name: 'First', value: 30 + revision() * 20, fill: '#52725e' }, { name: 'Second', value: 50, fill: '#8b65ae' }] });
  const originalCellRows = [
    { name: 'Red', value: 12, color: '#cc3333' },
    { name: 'Green', value: 35, color: '#339944' },
    { name: 'Blue', value: 22, color: '#3355cc' },
  ];
  const [cellRows, setCellRows] = createSignal(originalCellRows);
  const [cellEvent, setCellEvent] = createSignal('');
  let cellEvents = 0;
  const [selectedRevision, setSelectedRevision] = createSignal(0);
  const [selectedLegends, setSelectedLegends] = createSignal(true);
  const [selectedExtraLegend, setSelectedExtraLegend] = createSignal(true);
  const selectedRows = () => Array.from({ length: 10 }, (_, index) => ({ name: `Category ${index}`, value: 10 + index + selectedRevision() }));
  return <section aria-label="Native Charts" id="native-charts">
    <button onClick={() => setRevision(value => value + 1)}>Update chart data</button>
    <button onClick={() => setMounted(value => !value)}>Toggle chart mounting</button>
    <button onClick={() => setWidth(value => value === 500 ? 650 : 500)}>Resize chart parent</button>
    <button onClick={() => setAnimate(true)}>Enable chart animation</button>
    <button onClick={() => setRevision(value => value + 1)}>Animate chart update</button>
    <output id="chart-resizes">{resizes()}</output><output id="chart-range">{range()}</output>
    <output id="chart-range-events">{rangeEvents()}</output>
    <button onClick={() => setValueSync(true)}>Use value synchronization</button>
    <output id="chart-animation-events">{animationStarts()}:{animationEnds()}</output>
    <button onClick={() => setCellRows(rows => [rows[2], rows[0], rows[1]])}>Reorder keyed Cells</button>
    <button onClick={() => setCellRows(rows => [rows[0], rows[2], { name: 'Purple', value: 28, color: '#9933cc' }])}>Replace keyed Cell</button>
    <output id="chart-cell-event">{cellEvent()}</output>
    <div id="chart-tooltip-target" ref={setTarget} />
    <button onClick={() => setSelectedRevision(value => value + 1)}>Replace selected chart data</button>
    <button onClick={() => setSelectedLegends(value => !value)}>Toggle selected Legends</button>
    <button onClick={() => setSelectedExtraLegend(value => !value)}>Toggle additional Legend</button>
    <Show when={mounted()}>
    <div id="chart-selected-brush"><LineChart width={500} height={300} data={selectedRows()}>
      <XAxis dataKey="name" /><Line dataKey="value" isAnimationActive={false} />
      <Brush startIndex={3} endIndex={6} dataKey="name" />
    </LineChart></div>
    <div id="chart-selected-active"><BarChart width={500} height={300} data={selectedRevision() ? [] : selectedRows()}>
      <XAxis dataKey="name" /><Bar dataKey="value" isAnimationActive={false}
        activeBar={shape => <Rectangle {...shape} class="selected-active-bar" />} />
      <Tooltip />
    </BarChart></div>
    <div id="chart-selected-sankey"><Sankey width={500} height={300} title="Selected flows" desc="Source sends ten units" accessibilityLayer
      data={{ nodes: [{ name: 'Source' }, { name: 'Target' }], links: [{ source: 0, target: 1, value: 10 }] }} /></div>
    <For each={['top', 'bottom', 'left', 'right', 'insideBottomRight', 'legacy'] as const}>{position =>
      <div id={`chart-selected-legend-${position}`}><LineChart width={500} height={500} data={data()}>
        <Line dataKey="value" isAnimationActive={false} />
        <SelectedLegendOwner value={`primary:${position}`}>
          <Show when={position === 'legacy' || selectedLegends()}>
            <Legend {...(position === 'legacy' ? {} : { position, offset: 10, align: 'left' as const, verticalAlign: 'middle' as const, formatter: selectedLegendFormatter })} />
          </Show>
        </SelectedLegendOwner>
        <SelectedLegendOwner value="secondary:insideTopLeft">
          <Show when={position === 'insideBottomRight' && selectedExtraLegend()}>
            <Legend position="insideTopLeft" offset={10} formatter={selectedLegendFormatter} />
          </Show>
        </SelectedLegendOwner>
      </LineChart></div>
    }</For>
    <For each={['plain', 'string', 'multiline', 'function', 'jsx', 'numeric'] as const}>{kind => {
      let unsupportedJsxLabel: ImplicitLabelType | undefined;
      if (kind === 'jsx') {
        // @ts-expect-error Raw JSX is unsupported; exercise the defensive JavaScript-consumer boundary.
        unsupportedJsxLabel = <text>JSX categories</text>;
      }
      return <div id={`chart-selected-axis-${kind}`}><LineChart width={500} height={300} data={selectedRows()}>
        <XAxis dataKey="name" interval={0} angle={-45} tickSize={6} tickMargin={2}
          height={kind === 'numeric' ? 30 : 'auto'}
          tick={kind === 'multiline' ? props => <text class="recharts-cartesian-axis-tick-value" x={props.x} y={props.y}>
            <tspan x={props.x}>Category</tspan><tspan x={props.x} dy={24}>{props.index}</tspan>
          </text> : undefined}
          label={kind === 'string' ? 'Revenue categories' : kind === 'function' ? () => <text>Custom categories</text> : unsupportedJsxLabel} />
        <Line dataKey="value" isAnimationActive={false} />
      </LineChart></div>;
    }}</For>
    <div id="chart-selected-pie"><PieChart width={400} height={400}>
      <Pie data={data()} dataKey="value" cx="25%" cy="40%" innerRadius="40%" outerRadius="80%" isAnimationActive={false}>
        <Label position="center" content={props => {
          const box = props.viewBox as { cx?: number; cy?: number; innerRadius?: number; outerRadius?: number };
          return <text class="selected-pie-label" x={props.x} y={props.y}>{`pie:${box.cx}:${box.cy}:${box.innerRadius}:${box.outerRadius}`}</text>;
        }} />
      </Pie>
    </PieChart></div>
    <div id="chart-selected-null"><AreaChart width={100} height={50}
      data={[{ name: 'Page A', uv: 400, pv: 2400, amt: 2400 }, { name: 'Page B' }, { name: 'Page C', uv: 300, pv: 1398, amt: 2400 }]}>
      <For each={['uv', 'pv', 'amt']}>{dataKey => <Area dataKey={dataKey} stackId="1" connectNulls type="monotone" isAnimationActive={false} />}</For>
    </AreaChart></div>
    <div id="chart-selected-tooltip"><LineChart width={500} height={300}>
      <XAxis dataKey="name" allowDuplicatedCategory={false} interval={0} />
      <Line dataKey="uv" data={[{ name: 'Page A', uv: 10 }, { name: 'NonExistent', uv: 20 }, { name: 'Page C', uv: 30 }]} isAnimationActive={false} />
      <Line dataKey="pv" data={[{ name: 'Page A', pv: 100 }, { name: 'Page B', pv: 200 }, { name: 'Page A', pv: 300 }]} isAnimationActive={false} />
      <Tooltip defaultIndex={1} content={props => <div id="selected-tooltip-payload" data-label={props.label}>
        <For each={props.payload}>{entry => <span data-series={String(entry.dataKey)}>{entry.value}</span>}</For>
      </div>} />
    </LineChart></div>
    {/* Four 90° bands apply a -90° tick offset: this public range yields -4°,86°,176°,266°. */}
    <div id="chart-selected-wrap"><RadarChart width={400} height={400} startAngle={86} endAngle={446}
      data={['a', 'b', 'c', 'd'].map(name => ({ name, value: 10 }))}>
      <PolarAngleAxis dataKey="name" /><Radar dataKey="value" isAnimationActive={false} />
      <Tooltip content={props => <div id="selected-wrap-payload" data-x={props.coordinate?.x} data-y={props.coordinate?.y}>{props.active ? props.label : ''}</div>} />
    </RadarChart></div>
    <For each={[false, true]}>{explicit =>
      <svg id={`chart-selected-label-${explicit}`} width={400} height={400}>
        <Label viewBox={{ x: 50, y: 50, width: 200, height: 200 }} position="center"
          {...(explicit ? { x: 17, y: 23, textAnchor: 'start' as const, verticalAnchor: 'end' as const } : {})}
          content={props => <g>
            <text class="selected-custom-label" x={props.x} y={props.y}>{`label:${props.x}:${props.y}:${props.textAnchor ?? 'absent'}:${props.verticalAnchor ?? 'absent'}`}</text>
            <Label {...props} content={undefined} value="Nested label" />
          </g>} />
      </svg>
    }</For>
    <For each={[true, false]}>{floating =>
      <div id={`chart-selected-bars-${floating}`}><BarChart width={floating ? 40 : 400} height={200}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={0} barGap={floating ? 0 : 7}
        data={(floating ? [0, 10, 20, 30, 30.00008318614652580436] : [0, 10]).map(x => ({ x, value: 10, other: 20 }))}>
        <XAxis dataKey="x" type="number" domain={[0, floating ? 40 : 20]} allowDataOverflow height={0}
          ticks={floating ? [0, 10, 20, 30, 30.00008318614652580436] : [0, 10]} /><YAxis width={0} />
        <Bar dataKey="value" maxBarSize={floating ? undefined : 20} fill="#123456" isAnimationActive={false} />
        <Show when={!floating}><Bar dataKey="other" maxBarSize={20} fill="#654321" isAnimationActive={false} /></Show>
      </BarChart></div>
    }</For>
      <div id="chart-axis-hydration" style={{ width: '500px', height: '120px' }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 240, height: 120 }}>
          <LineChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            data={(revision() ? ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']).map((month, index) => ({ month, value: (revision() ? [65, 25, 45, 15, 55, 35] : [10, 30, 20, 60, 40, 70])[index] }))}>
            <XAxis dataKey="month" height={30} />
            <YAxis width={50} domain={[0, 80]} allowDataOverflow tickCount={9} />
            <CartesianGrid syncWithTicks />
            <Line dataKey="value" isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div id="chart-responsive" style={{ width: width() + 'px', height: '300px', 'max-width': '100%' }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: 300 }} onResize={(w, h) => setResizes(w + ':' + h)}>
          <ComposedChart data={data()} title="Revenue overview" desc="Five categories of revenue" accessibilityLayer>
            <CartesianGrid /><XAxis dataKey="name" /><YAxis /><ReferenceArea x1="Beta" x2="Delta" /><ReferenceLine y={25} /><ReferenceDot x="Gamma" y={20} r={4} />
            <Area dataKey="other" stackId="total" fill="#a6c9b0" isAnimationActive={false} />
            <Bar dataKey="value" stackId="total" name="Revenue" fill="#52725e" isAnimationActive={false}><ErrorBar dataKey="error" /><LabelList dataKey="value" /></Bar>
            <Line dataKey="value" name="Trend" stroke="#704f95" isAnimationActive={animate() ? 'auto' : false} animationDuration={400}
              onAnimationStart={() => setAnimationStarts(value => value + 1)} onAnimationEnd={() => setAnimationEnds(value => value + 1)} />
            <Tooltip portal={target()} content={props => <div id="chart-custom-tooltip">{props.active ? String(props.label) + ':' + props.payload.map(item => item.value).join(',') : ''}</div>} />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div id="chart-line"><LineChart width={500} height={300} data={data()} syncId="native-sync" syncMethod={valueSync() ? 'value' : 'index'}>
        <XAxis dataKey="name" /><YAxis /><Line dataKey="value" isAnimationActive={false} />
        <Tooltip content={props => <div id="chart-source-tooltip">{props.active ? String(props.label) + ':' + props.payload.map(item => item.value).join(',') : ''}</div>} />
        <Brush dataKey="name" onChange={next => { setRange(next.startIndex + ':' + next.endIndex); setRangeEvents(value => value + 1); }}><AreaChart><Area dataKey="value" isAnimationActive={false} /></AreaChart></Brush>
      </LineChart></div>
      <div id="chart-bar"><BarChart width={500} height={300} data={valueSync() ? data().toReversed() : data()} syncId="native-sync" syncMethod={valueSync() ? 'value' : 'index'}>
        <XAxis dataKey="name" /><YAxis /><Bar dataKey="value" fill="#52725e" isAnimationActive={false} />
        <Tooltip content={props => <div id="chart-peer-tooltip">{props.active ? String(props.label) + ':' + props.payload.map(item => item.value).join(',') : ''}</div>} /><Brush dataKey="name" />
      </BarChart></div>
      <div id="chart-area"><AreaChart width={500} height={300} data={data()} syncId="isolated"><XAxis dataKey="name" /><YAxis /><Area dataKey="value" isAnimationActive={false} />
        <Tooltip content={props => <div id="chart-isolated-tooltip">{props.active ? String(props.label) : ''}</div>} />
      </AreaChart></div>
      <div id="chart-scatter"><ScatterChart width={500} height={300}><XAxis dataKey="x" type="number" /><YAxis dataKey="y" /><ZAxis dataKey="z" /><Scatter data={data()} isAnimationActive={false} /></ScatterChart></div>
      <div id="chart-funnel"><FunnelChart width={500} height={300}><Funnel data={data()} dataKey="value" isAnimationActive={false}><LabelList dataKey="name" /></Funnel></FunnelChart></div>
      <div id="chart-pie"><PieChart width={500} height={300}><Pie data={data()} dataKey="value" nameKey="name" label isAnimationActive={false} /></PieChart></div>
      <div id="chart-radar"><RadarChart width={500} height={300} data={data()}><PolarGrid /><PolarAngleAxis dataKey="name" /><PolarRadiusAxis /><Radar dataKey="value" isAnimationActive={false} /></RadarChart></div>
      <div id="chart-radial"><RadialBarChart width={500} height={300} data={data()}><RadialBar dataKey="value" isAnimationActive={false} /></RadialBarChart></div>
      <div id="chart-treemap"><Treemap width={500} height={300} data={hierarchy().children} dataKey="value" nameKey="name" isAnimationActive={false} /></div>
      <div id="chart-sankey"><Sankey width={500} height={300} data={{ nodes: [{ name: 'Source' }, { name: 'Target' }, { name: 'Other' }], links: [{ source: 0, target: 1, value: 10 + revision() * 10 }, { source: 0, target: 2, value: 20 }] }} /></div>
      <div id="chart-sunburst"><SunburstChart width={500} height={300} data={hierarchy()} /></div>
      <div id="chart-ssr-recipe"><ComposedChart width={500} height={300} margin={{ top: 5, right: 5, bottom: 35, left: 65 }}
        data={[{ name: 'A', low: 10, high: 20 }, { name: 'B', low: 20, high: 30 }]}>
        <XAxis dataKey="name" scale="band" height={0} interval={0} /><YAxis domain={[0, 50]} allowDataOverflow width={0} interval={0} />
        <Bar dataKey="low" stackId="sum" fill="#123456" isAnimationActive={false} />
        <Bar dataKey="high" stackId="sum" fill="#654321" isAnimationActive={false} />
      </ComposedChart></div>
      <div id="chart-measured" style={{ width: width() + 'px', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data()}><Line dataKey="value" isAnimationActive={false} /></LineChart>
        </ResponsiveContainer>
      </div>
      <div id="chart-cells"><BarChart width={500} height={300} data={cellRows()}>
        <XAxis dataKey="name" /><YAxis />
        <Bar dataKey="value" isAnimationActive={false}
          shape={shape => <g data-cell-row={(shape.payload as typeof originalCellRows[number]).name}><Rectangle {...shape} /></g>}
          onClick={(entry, index) => setCellEvent((entry.payload as typeof originalCellRows[number]).name + ':' + index + ':' + ++cellEvents)}>
          <For each={cellRows()}>{row => <Cell fill={row.color} />}</For>
          <ErrorBar dataKey="value" isAnimationActive={false} />
        </Bar>
      </BarChart></div>
    </Show>
  </section>;
}
