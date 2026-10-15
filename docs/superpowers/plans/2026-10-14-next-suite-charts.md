# Next Suite Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver every selected A1–A13 Recharts 3.10.1 behavior and B1/B2 parser guard without losing native local adaptations.

**Architecture:** One Charts source/fixture/ledger owner hand-adapts upstream changes onto existing native initialization, apply-phase measurement, inline SVG and context-owned Cells. Extend existing consumer/browser cases, keeping public assertions rather than store-write tests. Shared root types/distribution wiring remains with native integration owner.

**Tech Stack:** Exact Solid RC15 + TS7.0.2/TS5.9.3, current external D3 versions, existing node:test/Playwright; no React/Redux/Recharts runtime or new dependency.

**Spec:** `../specs/2026-10-14-next-suite-charts-upstream-design.md` and suite index; [master plan](2026-10-14-next-suite.md) owns package/version/website/release gates.

## Global Constraints

- Imported solid-recharts `b1f9c6729eefb42caf96d2162ad8c71c2c5520e3` (`2.0.0-beta.1`), ported-reference Recharts `b3451050c027a23957ffa50a2665c9119df21e47` (`3.9.2`), tracked-not-ported Recharts `ffb918798051ef040bb7f9922d3850c9c189f39f` (`3.10.1`) provenance identity fields remain unchanged. Only tracked-entry note and per-change patches change.
- PR #3 head `f092454f625effd3826c944ab5803bd5a8bcce72` is an unmerged adaptation reference, not a dependency. No cherry-pick/rebase/merge or wholesale replacement. Keep original source origins/notices, but correct stale “byte-identical”/“ported verbatim” assertions when selected adaptations make them false.
- Preserve all existing patches and their tests: packaging, native-ids, chart-initialization, cartesian-tick-hydration, zindex-inline-svg, server-guards, treemap-derived-nest, sync-flush, cell-ownership, panorama-area.
- No D3/dependency/peer/NOTICE changes. Package version is integration-owned. No CellReader, Line conditional-id hunk, CartesianGrid theme or other canary API/fix. A3/A4/A5 public additions require behavior/types/SSR/hydration/docs/live examples, not just types.
- `ported` requires actual source adaptation and passing case. `contained` requires concrete local file/line plus passing existing/extended consumer-visible evidence. A failing selected behavior cannot become pending. No new permanent test merely to create one per row; A12 counters are private throwaway evidence only.
- Charts edit owner never builds/tests/formats/uses Git or spawns agents. The designated native integration/gate worker under tool-less Main executes serialized RED/GREEN, packed checks, smoke and Git. Main reviews delivered evidence and dispatches, never executes commands. Existing unrelated reported failures are ground truth, not rerun targets.

## Review Focus

- C2: parser literal-dollar inputs can hang despite try/catch; all output cases run under external child timeout.
- C3: local `CartesianPosition` currently means calculated result, not the new public input union; migrate all internal references before export.
- C3/C4: SSR initial settings and apply-only measurement must preserve node/style identity before final layout.
- C5: controlled Brush intentionally differs from new primitive acceptance semantics; do not “fix” it into parent-authoritative behavior.
- C5/C6: Cells and panorama use owner-local context; port behavior, not upstream module-level collection or React lifecycle machinery.

---

## Task C1: Exact per-change mapping and preserved baseline

**Files:** Read existing `packages/charts/upstream.json`, `packages/charts/UPSTREAM.md`, source files enumerated below, `tests/consumer/charts.test.ts`, `e2e/charts.spec.ts`. Record mapping in the plan's existing private ledger; final public ledger written in C7.

**Interfaces:** Produce one mapping for each A1–A13/B1/B2 and every one of the 45 compared commits; fields are commit/PR, PR #3 source hunk (or none), actual local files, overlapping local patch, selected/not-selected reason and exact public test. No new tracking script/format.

- [ ] No complete retained45-commit/PR3 raw artifact exists (FAST confirmed; old temporary source was deleted). Capture the authoritative comparison `https://api.github.com/repos/recharts/recharts/compare/v3.9.2...v3.10.1` and pinned PR #3 once into ignored evidence; fill per-commit file/hunk omissions from exact commit endpoints, no sampling. Reuse that immutable capture for all local mapping and cite exact commit URLs; the derived spec alone is not raw hunk proof.
- [ ] Map every selected row to the local files below before editing it; source-only applicability is not a passing result. For unselected version/dependency commits after #7569, confirm no `src/` changes before marking not-applicable. No sampling/top-N omissions.
- [ ] Keep matrix C source commits with specified statuses/reasons: `39ef89019bd85770926837208c2997a5bf679aae` #7525 theme pending; `14c1a2dec8542a1f644a97e3a3fbed5b81f36e01` #7560 Legend type pending; `9e8fa4f0053c20b883ccb9f674cd4d39174818a4` #7545 comments/labelFormatter type pending; resolve full hashes for #7567 `e9795a1a5313…` and #7569 `fded3d1022cf…`, record not-applicable only after confirming comment/doc-only change. Remaining comparison entries get their own not-applicable reason; no post-3.10.1 entries beyond B1/B2.
- [ ] Before changing exported internals, use available LSP references for rename/callsite inventory. Author regressions/fixtures against existing exported APIs first; do not import a missing new type and call its compile failure behavioral RED. Designated gate worker records actual pre-port output/failure/pass; Main dispatches adaptation only after receiving that record. No baseline historical rerun.

## Task C2: ReduceCSSCalc B1/B2 guards with bounded output evidence

**Files:** Modify `packages/charts/src/util/ReduceCSSCalc.ts`, `tests/consumer/charts.test.ts`, and stale adaptation wording in `packages/charts/src/component/Text.tsx`. No new test file, private runtime export, source loader or build harness.

**Interfaces:** Preserve `safeEvaluateExpression(expression: string): string` and `reduceCSSCalc(expression: string): string`. Private `MAX_EXPRESSION_LENGTH = 1000` checks the inner expression before removing whitespace: safeEvaluateExpression returns `'NaN'` for oversize, reduceCSSCalc maps it to `''`. Parentheses replacement uses a function, not an interpreted replacement string.

- [ ] Add **one timeout-bounded public Text SSR child batch** to existing `tests/consumer/charts.test.ts`: define childSource as the ESM rendering/assertion batch below and call `spawnSync(process.execPath, ['--conditions=development', '--input-type=module', '--eval', childSource], { timeout: 10000 })`. Assert clean child exit and expose stderr on failure. Import actual built/packed public Text, not raw TypeScript/private utility. For every case render x=10, y=20, verticalAnchor=`start`, text `Revenue`; assert one text with x/y, one tspan with Revenue and exact decoded dy. The start branch passes capHeight verbatim into `calc(...)`.
- [ ] Use capHeight=`(${p})` for each literal `$&`, dollar+backtick, `$'`, `$1`, `$$`; dy equals p. Use capHeight=`' '.repeat(997) + '1+1'` (1000 inner chars), dy=`'2'`; 998 spaces (1001 chars), dy=`''`. Use capHeight=50,000 `'9'` followed by each `+`, `*`, `+@`, dy=`''`. Assertions exercise the exact reducer boundary through its real consumer, not merely no-throw.
- [ ] Gate worker records actual pre-fix batch result under external10s timeout, never a loader error as parserRED. Main then dispatches [#7610](https://github.com/recharts/recharts/commit/945fc2816b0a8eb824188a57ba393db5ed3c68b5) and [#7620](https://github.com/recharts/recharts/commit/0778d4875fdb5f50bd643e494734dd2a1808116a); gate worker rebuilds and proves exact post-fix outputs. No elapsed-time performance/vulnerability claim. Correct ReduceCSSCalc's byte-identical and Text's verbatim wording while retaining origins and selected-patch attribution.
- [ ] C7 records one `reduce-css-calc-guards` entry with both commits and this public batch. **Ruling:** Public consumer proof replaces isolated helper harness — no loader/private export/new build — cost if wrong: less isolated helper diagnosis, while real consumer regression still fails; no product contract weakened.

## Task C3: A4 Legend positions/offset and Cartesian type migration

**Files:** Modify `packages/charts/src/component/Legend.tsx`, `component/DefaultLegendContent.tsx`, `state/legendSlice.ts`, `state/selectors/selectChartOffsetInternal.ts`, `cartesian/getCartesianPosition.ts`, `util/ChartUtils.ts`, `index.ts`; create `state/selectors/selectLegendArea.ts`, `cartesian/cartesianPositionToCSSTranslate.ts`. Tests/fixture: existing `tests/consumer/charts.test.ts`, `apps/gallery/src/charts.tsx`, `e2e/charts.spec.ts`. Root paths in this task are relative to `packages/charts/src` unless fully qualified.

**Interfaces:** Add exported public input `CartesianPosition` exactly as [#7564](https://github.com/recharts/recharts/commit/082495ac4b05070b745089b2d82db2dc1eb8ccc8):

```ts
type CartesianPosition = 'top' | 'left' | 'right' | 'bottom' | 'center'
  | 'insideLeft' | 'insideRight' | 'insideTop' | 'insideBottom'
  | 'insideTopLeft' | 'insideBottomLeft' | 'insideTopRight' | 'insideBottomRight'
  | { x: number | Percent; y: number | Percent };
```

Keep existing broad `CartesianLabelPosition` for labels. Rename existing calculated-result shape from `CartesianPosition` to `CalculatedCartesianPosition` (x/y/anchors/optional width/height) and migrate all LSP references; only the new position input type is newly public at package root. `LegendProps.position?: CartesianPosition`, `offset?: number` default 0, `layout` gains `auto` default. `auto` resolves vertical for left/right/insideLeft/insideRight, horizontal otherwise/no position. Expose resolved layout to content/store; position wins over align/verticalAlign only when supplied.

- [ ] Author shared table-driven `legend-placement` SSR/browser cases for outside top/bottom/left/right with exact expected wrapper styles copied from pinned upstream tests for the fixed fixture dimensions. Assert zero-box server placement, identical first hydration styles/node, then measured box plus offset placement without mismatch. No-position fixture matches previous output; inside placement retains identical style after measurement and does not shrink plot area. Public types accept valid union/object percentages/offset and reject unknown strings via integration's `types.tsx`.
- [ ] Implement type migration and pure translation helper from mapped #7564. Preserve local native first-render `createChartEffect` initialization when seeding position/offset/settings; measured size stays apply-phase. Outside/no-position legends reserve measured space; inside reserve none. Do not mutate chart width/margin to mimic a measurement or import React layout hooks.
- [ ] Adapt legend area/offset calculation using existing store/selector conventions; C4 shares `selectChartOffsetInternal.ts` under same owner. Only take DefaultLegendContent white-space hunks attributable to #7564, not unselected #7560 changes.
- [ ] Designated gate worker runs packed Charts SSR/browser plus strict root types; C7 README documents props/defaults/override and outside server placement ignoring unmeasured own size. Website owner receives exact live Legend example contract.

## Task C4: A5 XAxis automatic height and A12 stable rendered ticks

**Files:** Modify `packages/charts/src/cartesian/XAxis.tsx`, `CartesianAxis.tsx`, `RenderedTicksReporter.tsx`, `util/Constants.ts`, `state/cartesianAxisSlice.ts`, `state/selectors/axisSelectors.ts`, `state/selectors/selectChartOffsetInternal.ts`; create `packages/charts/src/util/XAxisUtils.ts`; extend existing fixture/tests. Trace labelRef to actual SVG node; if existing `component/Text.tsx` defers ref forwarding, minimally fix native forwarding here to satisfy measured string-label case, never a website workaround.

**Interfaces:** `XAxisProps.height?: number | 'auto'`, `DEFAULT_X_AXIS_HEIGHT = 30`. Adapt private `getCalculatedXAxisHeight` and height-history state directly from [#7570](https://github.com/recharts/recharts/commit/9d9b15d1664dea4c80b97f1fd7dfc25fac518cb1) after mapping native refs/settings; CartesianAxis forwards its rendered `labelRef` rather than PR #3's undefined label. Existing numeric axis interfaces/callers keep numeric behavior; selectors resolve auto to fallback/current measured height, never propagate a string into numeric offset math.

- [ ] Author `auto-xaxis` cases: SSR auto layout uses 30px; first hydration nodes/styles equal server; measured rotated/multiline ticks yield `round(tallest tick label + tickSize + tickMargin + label height + (labelElement ? 5 : 0))`; plot area shrinks by measured height minus 30. String label contributes actual height+5. Unchanged repeated renders do not oscillate; numeric height output unchanged. Function/JSX label skips automatic measurement per upstream guard. Assert rectangles/plot geometry, not private store values.
- [ ] Implement first-render fallback and apply-phase measurement with real tick/label refs, equality after rounding and upstream height-history guard. Preserve server-compatible initial tick/grid lists before apply; never measure while claiming hydration nodes.
- [ ] Map current RenderedTicksReporter and renderedTicksSlice reducer; port A12 [#7565](https://github.com/recharts/recharts/commit/ccdd02a7609bd36d641d34287e5b35b363b2de90) unless actual contained proof is established. Current reporter dispatches and reducer assigns unconditionally; no existing equality guard is assumed. Preserve axis/store identity and cleanup registration while comparing tick values. Verify real public geometry, not permanent store-write/subscription counters. LSP-unavailable bounded grep fallback is accepted for mapping.
- [ ] Designated gate worker runs existing `automatic Cartesian ticks hydrate uniquely and stay correct through resize and data replacement`, new auto-height case, server tick-ladder and strict types. C7 documents measured auto height/server30px fallback, not server-final sizing; website receives exact rotated-label contract.

## Task C5: A1/A2/A3/A6/A7 native lifecycle and accessible geometry

**Files:** Modify only mapped source as needed: `packages/charts/src/cartesian/Brush.tsx`, `Bar.tsx`, `Area.tsx`, `chart/Sankey.tsx`, `polar/Pie.tsx`, `state/selectors/areaSelectors.ts`; extend existing chart tests/fixture. `component/Cell.tsx` stays context-owned; do not add CellReader.

**Interfaces and exact public acceptance:**

| Row / commit | Implementation seam | Required public assertion / preserved boundary |
| --- | --- | --- |
| A1 `f2786e83fbd89862e19cb11578f4e1d638b3899c` #7542; `f2c3ecb92d4cbaf48307c200f154e3e4859aa1d1` #7530 | Brush controlled-index/data-update paths while retaining native first-render seed and server/timer guard | startIndex=3/endIndex=6 without onChange: drag slide, record traveller aria-valuenow while dragging, release and assert equal; separate unchanged controlled 3–6 survives data replacement. Existing Brush sync + Area panorama pass; SSR has no window access. Deliberately not new Primitives refusal semantics. |
| A2 `2fa048ec943d9b40e404249c78d067a28ffa95cf` #7547 | Bar active-layer reset | Active tooltip bar loses active shape after index clears/pointer leave or data replacement; keyed Cell reorder/replacement paint/payload/once-event cases remain green. |
| A3 `82d2bec90c7927ea1e5ce7025fa9adca5de8aea2` #7546 | Sankey native SVG surface | Public title/desc/accessibilityLayer reach root SVG accessible name/description and exact upstream accessibility attributes. Assert server and hydrated attributes equal with node preservation; types and live docs example required. |
| A6 `4bb83b5b03c877c49428b13a3a39f229ee856dfc` #7458 | Pie children wrapped in existing polar label context with computed radii | Percentage inner/outer radii + child Label position=center gets position from computed Pie radii on server and hydrated DOM. All five context-owned Cell consumer cases remain green; no module-level registrar. |
| A7 `9817ae52fa440105d77bdec1f8393bcb893733e4` #7566 | Area/area selector null-stack handling | Stacked AreaChart connectNulls across a category where all series are null has continuous rendered area paths for each series; panorama Area still renders. |

- [ ] Author bounded existing public cases for all five rows; designated gate worker records RED or concrete contained evidence before Main dispatches source adaptation. Reuse fixture data replacement for multiple lifecycle assertions where practical; no per-row permanent file.
- [ ] Hand-port mapped behavior preserving local patches; native callbacks/owners/store application replace React assumptions. Designated gate worker tests settled C5 union; no arbitrary public props beyond A3.
- [ ] C7 records row status/evidence individually, retaining both A1 commits. README explains controlled Brush retained drag and new Sankey props/SSR; website Sankey example includes title/desc and actual accessibility attributes.

## Task C6: A8/A9/A10/A11/A13 selectors and geometry

**Files:** Modify `packages/charts/src/state/selectors/combiners/combineTooltipPayload.ts`, `combineAllBarPositions.ts`, `util/ChartUtils.ts`, `util/getActiveCoordinate.ts`, `component/Label.tsx`; extend existing chart tests/fixture. ChartUtils remains single-owner with C3.

| Row / commit | Required behavior and assertion |
| --- | --- |
| A8 `a5d7737d8965702dc14e590658c20bda6ccfb9af` #7573 | allowDuplicatedCategory=false label lookup returns undefined: rendered tooltip payload falls back to active index's entry instead of empty. |
| A9 `2ea9ca02e12867076405595c010343adb1ccca3b` #7556 | Floating numeric category tick gaps do not collapse band size: rendered bar width equals pinned upstream fixture's expected band width; server tick-ladder stays correct. |
| A10 `553e77b3b3ab71457c417795c41285fba37b1608` #7550 | Pointer in final/first angular tick gap selects wrapping sector's active index/tooltip, not no sector. |
| A11 `ca62d1c38d17ab9182fdf78c81cfac3b2b92324c` #7549 | Function Label content receives exact upstream computed x/y plus explicit props/viewBox on server and after hydration; no invented computed anchors, which upstream excludes to avoid nested Label overrides. Expose these values in rendered custom-label output for assertions, not internal state probes. |
| A13 `411b6f2e6233e617704b3bfb45ebfce16285f0d3` #7582 | Two bars per category, maxBarSize smaller than band, configured barGap: actual gap between rendered bar rectangles equals barGap. |

- [ ] Read pinned upstream cases for fixed fixture coordinates/data; copy assertions, not the test framework. Extend smallest existing server/browser public-result cases; designated gate worker records pre-port behavior before adaptation dispatch.
- [ ] Adapt only selected calculation, preserving existing context/state/type boundaries and fractional finite geometry. No new runtime exports or benchmark framework.
- [ ] Designated gate worker runs affected public cases and C7 local-patch boundaries. Record observed statuses, never contained by source plausibility alone.

## Task C7: Provenance, docs and integrated Charts gate

**Files:** Modify `packages/charts/upstream.json`, `packages/charts/UPSTREAM.md`, `packages/charts/README.md`, `packages/charts/CHANGELOG.md`; integration owner receives `tests/consumer/types.tsx`/distribution/root script deltas. Website owner receives its existing Charts page/previews/demo tasks through website plan.

**Interfaces:** Existing patches format, extended with selected per-change commit/PR, pinned PR #3 hunk or none, local files, reason, evidence and status. Preserve all upstream identity/license/archive/source-target fields and original local patches; note exact files no longer byte-identical. One B1/B2 patch; A1 records both commits; every unselected compared commit receives not-applicable/pending reason from C1.

- [ ] Write final observed ledger records and table; failing selected behavior blocks completion. No “full 3.10.1 port” or changed imported baseline. Tracked release role remains tracked-not-ported, note names selected set/deferred theme. Preserve NOTICE and dependency graph byte content except integration-owned suite version.
- [ ] Update README selected A1–A13 status, B1/B2 guards, A3/A4/A5 props/server behavior and A1 Brush exception; keep automatic server-final size exclusion and no theme/canary claims. Add CHANGELOG entry listing actual behaviors/props/parser guards and intended candidate version.
- [ ] Pass only new public root type CartesianPosition and existing component-prop extensions to strict TS7/TS5.9/distribution integration; no helper/theme/CellReader exports. Existing types rejection tests stay meaningful.
- [ ] Designated native gate worker builds Charts, then runs `node tests/consumer/run.ts --scope=next-core` after complete root outputs/integration exist. Existing charts.test.ts owns the timeout-bounded public Text batch; no separate parser test or root script change. Runner owns Charts e2e once; focused rerun is `GALLERY_PACKED=1 pnpm exec playwright test e2e/charts.spec.ts --project=ssr --project=csr`, not obligatory duplication.
- [ ] Review existing ledger tests unchanged in intent: fixed actual finite SSR geometry, independent server ownership, native IDs, automatic tick/grid hydration/resize/data replacement, inline SVG, reduced motion/server guards, Treemap replacement, no nested flush, all Cell contexts/keyed replacement, Brush sync and panorama. Native distribution/strict consumer remains green; no React/Redux/Recharts runtime, D3 change, NOTICE change or excluded APIs/hunks.
- [ ] C3/C4/C5 live website examples and pin/status must ship through master Task 8 before this suite is called delivered. Publish remains DevOps-controlled; source-pinned deployment can precede npm and must say so.

## Self-review coverage

C1+C7 cover every provenance/mapping/exclusion requirement and matrix C entry. C2 covers B1/B2 exact outputs/timeouts. C3 includes all four A4 regressions; C4 includes all six A5 regressions, custom-label guard and A12 without store-count tests. C5 owns A1/A2/A3/A6/A7 and their boundaries; C6 owns A8/A9/A10/A11/A13. C7 preserves all ten original patches, packed/types/docs/website evidence. No row is dropped/downgraded; statuses remain unassigned until the gate worker reports observations for Main's review.
