# Charts upstream update

Status: **Proposed written specification awaiting user review.** Scope approval permits this document, not implementation. Nothing described here is ported, tested or published.

Evidence was read from GitHub, the npm registry and repository sources on 2026-10-14:
- the Recharts `v3.9.2...v3.10.1` comparison: 45 commits, with per-commit file lists for the source-changing commits;
- the solid-recharts PR #3 diff;
- the Recharts PR pages cited below.

Statements marked **source-only** come from reading code. They have not been reproduced and are not verified behaviour.

## Baseline (unchanged provenance)

| Role | Source | Commit |
| --- | --- | --- |
| Imported source | solid-recharts `2.0.0-beta.1` (`packages/solid-recharts/src`) | `b1f9c6729eefb42caf96d2162ad8c71c2c5520e3` |
| Reference ported by solid-recharts | Recharts `3.9.2` | `b3451050c027a23957ffa50a2665c9119df21e47` |
| Tracked, not ported | Recharts `3.10.1` | `ffb918798051ef040bb7f9922d3850c9c189f39f` |

No baseline is rewritten. In `packages/charts/upstream.json` and `UPSTREAM.md`, the identity and provenance fields of these entries are immutable: `role`, `repository`, `version`, `commit`, `sourceSubtree`, `targetSubtree`, `archive` and `license`.

Two things may change:
- the `note` text of an entry. Only the Recharts `3.10.1` note changes: it names the selected changes ported and the deferred ones. Its `role` stays `tracked-not-ported`, because the release as a whole is not ported.
- the per-change adaptation records in `patches`, where this update adds its entries.

## Target

- **Stable target: Recharts `3.10.1`** at `ffb9187…`, the npm `latest` release and newest stable tag. This update ports the rows **selected** in matrix A, not the whole release.
- **Solid adaptation reference: solid-recharts PR #3**, head `f092454f625effd3826c944ab5803bd5a8bcce72` ("feat: sync Recharts 3.10.1").
  - It is open and unmerged; it is not a release and not a dependency.
  - Its hunks are read as a guide to how each Recharts change maps to Solid. Its tests are reference material only and are not imported.
- **Two fixes merged after 3.10.1**: B1 and B2, the ReduceCSSCalc guards. No other post-3.10.1 change and no canary API is in scope.

## Rules

1. **Port by hand, one change at a time.**
   - Each change is ported onto `packages/charts/src`.
   - No cherry-pick, rebase or merge of PR #3, of the solid-recharts fork, or of Recharts.
   - Files that carry local patches are never replaced wholesale.
2. **The whole local patch ledger is preserved**, with its existing focused tests:

   | Patch | What it guarantees |
   | --- | --- |
   | `packaging` | separate client and server builds, exact rc.15 peers, D3 kept external |
   | `native-ids` | IDs from `createUniqueId` |
   | `chart-initialization` | chart state seeded during the first render on server and client |
   | `cartesian-tick-hydration` | server-compatible initial ticks and grid, then measurement in the apply phase |
   | `zindex-inline-svg` | SVG layers owned inline, not through a DOM Portal |
   | `server-guards` | no `window` access on the server; Brush timer cleanup |
   | `treemap-derived-nest` | Treemap nesting stack derived from the current root |
   | `sync-flush` | no nested `flush()` calls |
   | `cell-ownership` | Cells register through context |
   | `panorama-area` | an Area inside a Brush panorama renders in any chart type |

   Where an upstream hunk conflicts with one of these, the patch wins and the upstream behaviour is re-expressed inside it.
3. **No React, Redux or Recharts runtime dependency**, no D3 version change and no `NOTICE` change.
4. **New public API only with full support.** Each public addition ships with its behaviour, types, SSR and hydration behaviour, README documentation and a live website example. Nothing that isn't ported is documented or claimed.
5. **Record every change.**
   - Each selected row gets an entry in `upstream.json` `patches` and the `UPSTREAM.md` table, following the existing update workflow.
   - Each entry gives: the Recharts commit and PR, the PR #3 hunk used as reference (if any), the local files, the reason, the regression evidence, and status `ported` or `contained`. These are the statuses the ledger already defines.
   - Every Recharts commit in `v3.9.2...v3.10.1` that is not selected is listed with the existing status `not-applicable` or `pending` and the reason given in matrix C.
   - No new tracking format, bot or script.
6. **Provenance.** Changed files lose byte-identity with the imported commit, and the ledger records that. Copied source headers stay unchanged; the existing policy treats them as historical comments.

**Completion rule.** Every behaviour specified for a selected row is required, end to end.
- **`ported`:** the row's source change is ported, and its regression case passes.
- **`contained`:** the behaviour already holds because of an existing local adaptation. The entry records concrete evidence for that: the local file and line that provides it, and the existing or extended case that shows the behaviour. No gratuitous port or new test is added.
- A row whose behaviour or boundary check fails blocks completion. It never becomes `pending`.

## Matrix A — selected Recharts 3.9.2 → 3.10.1 changes

**File attribution.** Recharts files come from each commit's file list. Local files are the solid-recharts equivalents changed by PR #3. Where PR #3's file differs from Recharts' (for example `.ts` instead of `.tsx`, or a different file for the same logic), the PR #3 location is used, and mapping confirms it against our source before porting.

**Regression case.** Each case states the consumer-visible result that must hold.
- The evidence extends the existing behavioural cases (`tests/consumer/charts.test.ts`, `e2e/charts.spec.ts`) wherever they already cover the boundary. There is no mandate for one new test file per row.
- Where PR #3 changed a test for the row, that test is named as a reference; its path is relative to `packages/solid-recharts/` in PR #3. Cases are written in this repository's harness and are not imported.
- A ported row's case fails before the port and passes after it. If the old behaviour cannot be made to fail, that is recorded as observed; the case still guards the behaviour.
- Cases assert rendered output or public results, not store internals.

| ID | Recharts commit (PR) | Behaviour | Local files (`src/`) | Patch overlap | Regression case (consumer-visible) | Boundary check |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | `f2786e83fbd89862e19cb11578f4e1d638b3899c` (#7542); `f2c3ecb92d4cbaf48307c200f154e3e4859aa1d1` (#7530) | Controlled Brush, imported Recharts semantics (see the A1 note below). #7542: when `startIndex`/`endIndex` are controlled and the props do not change during a drag, the slide keeps its dragged position on mouseup instead of snapping back. #7530: controlled indices are kept when `data` updates. | `cartesian/Brush.tsx` | chart-initialization, server-guards, panorama-area | (a) Brush with `startIndex={3} endIndex={6}` and no `onChange`: drag the slide and release; the travellers' `aria-valuenow` values after mouseup equal those during the drag, as in the #7542 upstream test. (b) Replace `data` while the indices stay controlled; the Brush still shows 3–6. | Brush sync and panorama e2e pass; no `window` access on the server. |
| A2 | `2fa048ec943d9b40e404249c78d067a28ffa95cf` (#7547) | Clears stale active-bar layer state. | `cartesian/Bar.tsx` | cell-ownership | With the tooltip active on a bar, when the active index clears (pointer leaves, or data is replaced), no active-bar shape remains rendered. Reference: PR #3 `test/cartesian/Bar/Bar.csstransition.spec.tsx`. | Keyed-Cell reorder and replacement e2e pass. |
| A3 | `82d2bec90c7927ea1e5ce7025fa9adca5de8aea2` (#7546) | `Sankey` supports `accessibilityLayer`, `title` and `desc`. **Public prop addition.** | `chart/Sankey.tsx` | none | A Sankey with `title` and `desc` renders them as the root SVG's accessible name and description; with `accessibilityLayer`, the accessibility attributes asserted by PR #3 `test/chart/Sankey.spec.tsx` are present. | Server HTML equals the hydrated DOM for these attributes. |
| A4 | `082495ac4b05070b745089b2d82db2dc1eb8ccc8` (#7564) | `Legend` `position` and `offset`. **Public API addition** (contract below). | `component/Legend.tsx`, `component/DefaultLegendContent.tsx`, `state/legendSlice.ts`, new `state/selectors/selectLegendArea.ts`, `state/selectors/selectChartOffsetInternal.ts`, `cartesian/getCartesianPosition.ts`, new `cartesian/cartesianPositionToCSSTranslate.ts`, `util/ChartUtils.ts`, `index.ts` (type `CartesianPosition`) | chart-initialization | See A4 contract. | See A4 contract. |
| A5 | `9d9b15d1664dea4c80b97f1fd7dfc25fac518cb1` (#7570) | `XAxis` `height="auto"`. **Public prop addition** (contract below). | `cartesian/XAxis.tsx`, `cartesian/CartesianAxis.tsx`, new `util/XAxisUtils.ts`, `util/Constants.ts`, `state/cartesianAxisSlice.ts`, `state/selectors/axisSelectors.ts`, `state/selectors/selectChartOffsetInternal.ts` | chart-initialization, cartesian-tick-hydration | See A5 contract. | See A5 contract. |
| A6 | `4bb83b5b03c877c49428b13a3a39f229ee856dfc` (#7458) | `Pie` passes its computed `innerRadius`/`outerRadius` to `Label` children through the polar label context. | `polar/Pie.tsx` | cell-ownership | A `Pie` with percentage radii and a `<Label position="center">` child: the label is positioned from the Pie's computed radii, on the server and after hydration. | PR #3 implements this with a new module-level `CellReader` in `component/Cell.tsx`. That conflicts with `cell-ownership`, so the hunk is **not** ported. Pie wraps its children in the polar label context and keeps context-based Cell registration. All Cell tests pass. |
| A7 | `9817ae52fa440105d77bdec1f8393bcb893733e4` (#7566) | `Area` with `connectNulls` connects across stacked points where every series is null. | `cartesian/Area.tsx`, `state/selectors/areaSelectors.ts` | panorama-area | Stacked AreaChart with `connectNulls` and one category null in every series: each area path is continuous across that category. Reference: PR #3 `test/chart/AreaChart.spec.tsx`. | The panorama Area still renders. |
| A8 | `a5d7737d8965702dc14e590658c20bda6ccfb9af` (#7573) | Tooltip payload falls back to an index-based search when the label-based search returns undefined with `allowDuplicatedCategory={false}`. | `state/selectors/combiners/combineTooltipPayload.ts` | none | A chart with `allowDuplicatedCategory={false}` whose active label isn't found by label search: the tooltip payload is not empty and shows the entry at the active index. | — |
| A9 | `2ea9ca02e12867076405595c010343adb1ccca3b` (#7556) | `getBandSizeOfAxis` no longer collapses the band size because of floating-point tick gaps. | `util/ChartUtils.ts` | none | A numeric category axis whose tick values have floating-point gaps: the computed bar width is the expected band width, not a collapsed one. Reference: PR #3 `test/util/ChartUtils/ChartUtils.spec.ts`. | Server tick-ladder tests pass. |
| A10 | `553e77b3b3ab71457c417795c41285fba37b1608` (#7550) | The tooltip finds the active sector in the angle-axis wrap-around gap. | `util/getActiveCoordinate.ts` | none | A polar chart with a pointer angle in the gap between the last and first angle ticks: the tooltip's active index is the wrapping sector, not none. | — |
| A11 | `ca62d1c38d17ab9182fdf78c81cfac3b2b92324c` (#7549) | Custom `Label` content receives the computed position attributes. | `component/Label.tsx` | none | A `Label` with function `content` receives the computed `x`/`y` and the other position attributes asserted by PR #3 `test/component/Label.spec.tsx`, on the server and after hydration. | — |
| A12 | `ccdd02a7609bd36d641d34287e5b35b363b2de90` (#7565) | Rendered ticks are reported only when the tick values change. | `cartesian/RenderedTicksReporter.tsx` (where PR #3 places the equality guard) | cartesian-tick-hydration | The existing `e2e/charts.spec.ts` case "automatic Cartesian ticks hydrate uniquely and stay correct through resize and data replacement" keeps its tick and grid geometry, with no hydration mismatch. No permanent assertion on store writes or subscription counts is added. Any count of recomputations is throwaway evidence for the ledger entry only. | Same existing case. |
| A13 | `411b6f2e6233e617704b3bfb45ebfce16285f0d3` (#7582) | `barGap` stays correct when `maxBarSize` clamps the bar width. | `state/selectors/combiners/combineAllBarPositions.ts` | none | Two bars per category with `maxBarSize` smaller than the band, and a `barGap`: the gap between the two rendered bars equals `barGap`. | — |

**A1 note: Brush control is not the Primitives rule.** This row keeps imported Recharts 3.10.1 Brush behaviour. A Brush whose indices are passed as props, with no `onChange` that updates them, still keeps the dragged slide position after mouseup. This differs on purpose from the strict parent-authoritative controlled-state rule in the suite index, which applies to the new Primitives families only. The Charts README states this behaviour next to the A4 and A5 documentation.

### A4 contract — Legend `position` and `offset`

**API**
- `position?: CartesianPosition`, a newly exported type. It takes the position values accepted by `getCartesianPosition` at Recharts 3.10.1.
- `offset?: number`, default `0`.
- When `position` is set, it overrides `align` and `verticalAlign`, as in Recharts 3.10.1. Both keep working when `position` is not set.
- `layout` additionally accepts `"auto"`, which becomes the default. `"auto"` resolves to `vertical` for `left`, `right`, `insideLeft` and `insideRight`, and to `horizontal` otherwise. With no `position` it is `horizontal`, so legends that don't set `position` render exactly as before.

**Space reservation**
- A legend with no `position`, or with an outside position, reports its measured size to the store, as legends do today.
- A legend with an inside position reserves no space.

**SSR**
- `position` and `offset` are part of the legend settings seeded during the first render (`chart-initialization`).
- The server places the legend from chart width, height and margin, with the measured legend box treated as 0 × 0.

**Hydration and measurement timing**
- The first client render produces the same legend style as the server.
- Measurement then runs in Solid's apply phase. For outside positions, the legend shifts by its measured box plus `offset`. Inside positions use the CSS translate from `cartesianPositionToCSSTranslate` and do not depend on measurement.

**Regression cases (all required)**
1. Each outside position (`top`, `bottom`, `left`, `right`) renders a legend wrapper with the position from the Recharts 3.10.1 Legend tests on the server. After hydration and measurement, it moves to the measured placement with no hydration mismatch.
2. An inside position produces identical wrapper styles on the server and after measurement.
3. A legend without `position` produces the same output as before the port.
4. The type test accepts `position` and `offset` and rejects unknown position strings.

**Documentation.** The README documents the props and the server behaviour: outside positions on the server ignore the legend's own size until the browser measures it.

**Not selected.** The `white-space` style hunks in PR #3's `DefaultLegendContent.tsx` are taken only if they come from #7564's `DefaultLegendContent.tsx` change; mapping confirms this. Recharts #7560 ("Fix Legend type", `14c1a2de…`) is not selected; see matrix C.

### A5 contract — XAxis `height="auto"`

**API**
- `XAxis` `height?: number | "auto"`.
- Numeric heights behave exactly as before.

**SSR**
- An `"auto"` axis uses a fixed fallback height of 30 px (`DEFAULT_X_AXIS_HEIGHT`, as in #7570) for layout and for offset calculation.
- The server HTML uses that fallback. This is an automatic axis size, which the README already lists as outside the server-rendering recipe.

**Hydration and measurement timing**
- The first client render uses the same 30 px fallback, so hydration matches the server.
- In Solid's apply phase, the axis measures its rendered tick labels and its rendered label element. The height becomes `round(tallest tick label + tickSize + tickMargin + label height + 5)`, with the 5 px gap added only when a label element exists. This matches Recharts 3.10.1, where `CartesianAxis` passes `labelRef` to `getCalculatedXAxisHeight`. PR #3 passes `label: undefined` and is not followed on this point.
- No measurement happens when `label` is function content or a JSX element, as in the Recharts 3.10.1 `XAxis` guard.
- A new height is stored only when it differs after rounding. The store keeps #7570's height-history guard against oscillation.

**Regression cases (all required)**
1. Server HTML of a chart with `<XAxis height="auto" />` lays out the axis at 30 px.
2. After hydration, with rotated or multi-line tick labels, the axis height equals the measured formula, and the plot area shrinks by the difference.
3. Repeated renders with unchanged ticks do not oscillate.
4. A numeric `height` produces the same output as before the port.
5. Existing tick-hydration e2e cases pass.
6. An `"auto"` axis with a string `label` grows by the label's height plus 5 px.

**Documentation.** The README documents `height="auto"` as a browser-measured size and keeps the existing statement that automatic axis sizes are not server-final.

## Matrix B — merged Recharts fixes after 3.10.1

### B1: Recharts PR #7610, merge commit `945fc2816b0a8eb824188a57ba393db5ed3c68b5`

**The upstream change.** In `src/util/ReduceCSSCalc.ts`, `calculateParentheses` passes the replacement value to `String.replace` through a function. A replacement string treats `$&`, `` $` ``, `$'`, `$1` and `$$` as substitution patterns. Because `calculateArithmetic` returns operator-free input unchanged, `($&)` expanded back to itself and the loop never advanced.

**Our code (source-only)**
- `packages/charts/src/util/ReduceCSSCalc.ts:156` passes `calculateArithmetic(parentheticalExpression)` as a replacement string.
- The caller is `src/component/Text.tsx` at lines 360, 363-365 and 368, which builds `calc(...)` from the `capHeight` and `lineHeight` props (`number | string`). `Text` is publicly exported (`src/index.ts:115`).
- `safeEvaluateExpression`'s try/catch cannot stop a loop that never ends.

**Status.** Applicable by source reading; not reproduced locally. It is not described as a verified vulnerability.

**Regression case (expected values derived from source, to be proved at implementation)**
1. `reduceCSSCalc('calc((' + p + '))')` returns `p` for each of `$&`, `` $` ``, `$'`, `$1` and `$$`.
2. A server-rendered `Text` with `x={10}`, `y={20}`, `verticalAnchor="start"`, `capHeight="($&)"` and text `Revenue`:
   - renders a `<text>` element with `x="10"` and `y="20"` and one `<tspan>` containing `Revenue`;
   - gives that first `<tspan>` a `dy` attribute that decodes to `$&`.
   - `verticalAnchor="start"` is required. Only the `start` branch (`Text.tsx:359-360`) passes `capHeight` alone to `reduceCSSCalc`, as `calc(($&))`. The default `end` branch (line 368) never reads `capHeight`, so a case without it would miss the bug.

Each case asserts its output; it does not just check that rendering finishes or doesn't throw. The cases run in a child process with a hard external timeout. That timeout only stops a possible hang from blocking the run; it is not a measurement. A timeout before the fix is recorded as observed, not assumed.

### B2: Recharts PR #7620, merge commit `0778d4875fdb5f50bd643e494734dd2a1808116a`

**The upstream change.** `MAX_EXPRESSION_LENGTH = 1000`. `evaluateExpression` returns NaN for longer input, so `reduceCSSCalc` returns `''`. Upstream reports quadratic backtracking in the operand regexes.

**Our code (source-only).** `ReduceCSSCalc.ts` lines 6-7 contain the same operand regexes, used in the loops at lines 123-143. `evaluateExpression` (162-168) has no length guard. The input path is the same as B1.

**Status.** Applicable by source reading; not reproduced locally.

**Regression case (deterministic, no timing assertion).** Upstream checks `expression.length > 1000` on the text inside `calc(...)`, before whitespace is removed.
1. `reduceCSSCalc('calc(' + ' '.repeat(997) + '1+1)')` (a 1000-character expression) returns `'2'`.
2. The same call with `' '.repeat(998)` (1001 characters) returns `''`.
3. The upstream oversized inputs (`'9'` repeated 50,000 times followed by `+`, `*` or `+@`) each return `''`.

These cases share B1's external timeout, which only protects the run against a hang. No duration is asserted; upstream's 1 s budget is not a portable claim and is not adopted.

**Recording B1 and B2.** One ledger entry, `reduce-css-calc-guards`, citing both merge commits.

## Matrix C — not selected, with reasons

**Recharts `v3.9.2...v3.10.1`, source-changing commits not selected**

| Commit (PR) | Status | Reason |
| --- | --- | --- |
| `39ef89019bd85770926837208c2997a5bf679aae` (#7525) "CartesianGrid theme" | `pending` (deferred) | Stable 3.10.1 **does** include this CartesianGrid theme. It adds a public theme API: `src/theme/*`, a theme context, and light, dark and legacy themes exported from `index.ts`. It is not selected for this update. Recharts continues reworking theming in 3.11 canaries, and this package styles charts with CSS colours and optional Themes tokens. The PR #3 hunks for it (`theme/*`, the theme exports in `index.ts`, the theme parts of `CartesianGrid.tsx`) are not ported. |
| `14c1a2dec8542a1f644a97e3a3fbed5b81f36e01` (#7560) "Fix Legend type" | `pending` | Changes `DefaultLegendContent.tsx` and `util/types.ts`. PR #3 has no `util/types.ts` change, so its Solid mapping is not established. Not assessed in this update. |
| `9e8fa4f0053c20b883ccb9f674cd4d39174818a4` (#7545) "Update Tooltip styles comments and labelFormatter type" | `pending` | Comments plus one type change in `Tooltip.tsx` and `DefaultLegendContent.tsx`; not in PR #3. Not assessed. |
| `e9795a1a5313…` (#7567) "Clarify Legend comments and examples" | `not-applicable` | Comments and examples only. |
| `fded3d1022cf…` (#7569) "Omnidoc: group props…" | `not-applicable` | Documentation tooling; its touch of `getCartesianPosition.tsx` is a doc annotation by its title. Confirmed when A4 maps that file. |

The remaining commits in the comparison are version bumps (#7528, #7571, `ffb9187`), dependency bumps, a test-only change (#7554) and agent-skill files (#7531). Their titles say so. Version and dependency commits after #7569 were not inspected file by file; mapping confirms each has no `src/` change before it is recorded `not-applicable`.

**PR #3 hunks not taken**
- `component/Cell.tsx` `CellReader` (+27 lines): replaced by the context approach in A6.
- `cartesian/Line.tsx`, conditional `id` spread: no corresponding Recharts commit. Not taken.
- The theme parts of `index.ts` and `CartesianGrid.tsx`: see #7525 above.

**After 3.10.1, outside this update**

All merged Recharts changes after 3.10.1 other than B1 and B2 are out of scope. That includes:
- 3.11 theming;
- new canary APIs such as Bar `data`, Text `textPath` and `background`, and implicit `dataKey`;
- canary fixes such as large-stack domain overflow, Brush index bounds and attribute `undefined` text.

They are future candidates only. None is recorded in the ledger by this update.

## Documentation and website (required)

Library repository:
- `packages/charts/README.md`:
  - Replace "Recharts `3.10.1` is tracked but not ported" with the selected rows (A1–A13, each `ported` or `contained`), the parser guards (B1, B2), and the CartesianGrid theme API being deferred.
  - Document A3 (`Sankey` `title`, `desc`, `accessibilityLayer`), A4 (`Legend` `position`, `offset`, `layout="auto"`) and A5 (`XAxis` `height="auto"`), with their server behaviour as specified above.
  - Document A1's controlled Brush behaviour as imported Recharts semantics: a dragged slide is kept after mouseup when the index props don't change. This is not the parent-authoritative rule of the new Primitives families.
  - Make no claim of full 3.10.1 parity.
- `UPSTREAM.md`, `upstream.json`:
  - Entries as in rule 5.
  - The Recharts `3.10.1` entry stays, with its note naming the selected and deferred changes.
  - The solid-recharts `b1f9c67…` entry stays as the imported source.
- `CHANGELOG.md`: one entry listing the ported behaviours, the new props and the parser guards.

Website repository:
- `apps/website/src/pages/charts.tsx`: update the status text to match the README.
- `apps/website/src/components/chart-previews.tsx` and `apps/website/src/demos/charts/`: live examples for the A4 legend positions, A5 `XAxis height="auto"` with rotated labels, and A3 Sankey with `title`/`desc`.
- Website pin: updated after the library change merges.

## Acceptance criteria

1. Every A row is `ported` or `contained`, with its ledger entry and evidence; for A4 and A5, every listed case passes. A failing row blocks completion.
2. B1 and B2 are ported, and their output assertions pass. The pre-fix result is recorded as observed.
3. All existing ledger tests still pass, unchanged in intent: `tests/consumer/charts.test.ts`, `e2e/charts.spec.ts` and `tests/consumer/types.tsx`.
4. No theme API is exported, and the `CellReader` and Line `id` hunks are absent.
5. `package.json` dependencies, peers and `NOTICE` are unchanged; no React, Redux or Recharts runtime.
6. The packed consumer distribution check passes. Public exports change only by the `CartesianPosition` type and the new props' types.
7. The README, CHANGELOG, provenance files and website docs match the ported set exactly.
8. Publication is described as intended only.

## Targeted verification (at implementation, not now)

- B1 and B2 output cases in a child process under an external hang timeout.
- The A-row regression cases, extending the existing behavioural cases where they cover the boundary, and the A4 and A5 case lists.
- The existing chart consumer tests and `e2e/charts.spec.ts`, as the ledger regression gate.
- The packed consumer checks for charts.

## Release (intended, not done)

The next suite release candidate. The version is chosen in the release PR and is never `0.1.0-rc.2`, which is already published. This specification makes no release change.
