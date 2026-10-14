# Next Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship native Combobox, Command, Tree and Splitter, two original extra icons, and the selected Charts adaptations, with packed-consumer evidence, truthful public documentation and deployment through existing CI.

**Architecture:** Extend the existing native packages, not Themes behaviour or a second framework. Component owners implement disjoint source/fixtures; one native integration owner owns shared exports, manifests, consumer wiring, Git and all gates. The existing website owner integrates the reviewed library commit through the established pin/deploy flow.

**Tech Stack:** Node 24.21.0 (engine `>=24 <25`), pnpm 11.5.0, Solid 2 RC15, `@solidjs/vite-plugin` 3.0.0-next.50, Vite 8.3.3, TypeScript 7.0.2 producer and TypeScript 5.9.3 consumer, existing node:test and Playwright 1.64.0.

**Spec:** All six `docs/superpowers/specs/2026-10-14-next-suite-*-design.md` documents, including `2026-10-14-next-suite-design.md`; the five family contracts are binding. Focused implementation details are in [UI](2026-10-14-next-suite-ui.md), [icons-extra](2026-10-14-next-suite-icons-extra.md), and [Charts](2026-10-14-next-suite-charts.md).

## Global Constraints

- Exact `solid-js`, `@solidjs/web`, `@solidjs/signals`, `@solidjs/compiler`, `@solidjs/babel-plugin`: **2.0.0-rc.15**; exact Vite plugin **3.0.0-next.50**. Preserve root overrides and the TS7.0.2/TS5.9.3 floor. No React/Solid 1, Redux/Recharts runtime, new UI dependency, or D3 version change.
- Existing isolated native clone, branch `design/next-suite`, initial HEAD `2b28bfe8f371923390bee623fc52ad2f03be5cb1`, native source base `b0cf970aba2f67f4ac5d8a6355e5737b1c29b89c`; exact host path is in private dispatch/ledger only. Initial safety preflight found no working changes. Deliberate isolation does not require another worktree merely because Git reports an ordinary clone. Leave original and web release checkouts alone.
- Every Git operation uses `/usr/bin/git` through Node/Python subprocess, never the harness shell Git builtin; no destructive commands, global configuration or hooks.
- User authorization: “napravi implementacijski plan i onda implementiraj i deployay nemoj me pitati nista do deploymenta. orchestrate workflowz”. Scope and written specs are accepted. Main reviews plans internally, then dispatches execution without a further human workflow pause. This planning stage edits only these plans and the six specification status/gate paragraphs.
- **Ruling:** Latest explicit autonomous authorization supersedes obsolete human review pauses, not technical acceptance or CI. Normal push/merge/site deployment is authorized; npm publication remains “developer prepares PR, DevOps publishes.” No token creation, first-name rights assumption, OIDC bootstrap or approval bypass. Cost if wrong: rework/revert the reviewed deployment; never an unauthorized npm publication.
- Four `0.1.0-rc.2` packages are publicly published and immutable. New source candidate is **0.1.0-rc.3** across five packages, never repacked rc.2. Observed public registry404 responses establish only no public rc.3/extra package seen, not name rights or never-unpublished status; maintainer/DevOps confirms publication eligibility separately.
- Native parent-authoritative state for the four new Primitives families. Callbacks propose; accepted props render. Charts A1 explicitly retains imported Recharts Brush semantics instead.
- Reuse `internal/state.ts`, `collection.ts`, `events.ts`, `primitive.tsx`, contexts, refs, owned cleanup, native layers/Popper and Slot. No descendant prewalk. Only Combobox/Command share a small internal active-descendant navigator. Tree owns hierarchy; Splitter owns two-pane geometry.
- No multi-select, freeform, virtualisation, loaders, drag/drop tree, router, persistence/global shortcut/action engine, N-pane solver, speculative icon catalog, brand art, canary/theme APIs or application migration.
- Component edit workers do not install/build/test/format or use Git, and never spawn nested agents. The **designated native integration/gate worker under Main** owns all serialized native commands, checks, builds, Git and the same private ledger; website has its own designated gate owner. Main is the tool-less director: reviews evidence and dispatches, never executes commands. Changed-path RED/GREEN and actual smoke replace repeated unrelated historical baseline/per-task matrices; mandatory `pnpm check` CI/release gates remain intact.
- Completion requires real packed root/subpath imports, strict declarations, SSR and node-preserving hydration, actual focus/forms/geometry/action evidence, native docs and styled website examples. DOM/axe is not screen-reader proof or APG certification.

## Review Focus

1. Independent controlled key/query acceptance can serialize a stale choice: UI task U2 tests direct FormData, submit/requestSubmit and refusal/late acceptance.
2. DOM reorder or closing retained groups can leave dangling focus/active IDs: U1/U3/U4 test reorder without remount, hidden groups, external focus and cleanup.
3. A drag acknowledged late, resized externally or collapsed can commit a proposal rather than accepted geometry: U5 tests cancellation, async cutoff, geometry invalidation and collapse with zero size commits.
4. Fresh SSR ownership and measurement can produce duplicate nodes or final-server-size claims: U2/U4/U5 and C3/C4 assert pre-JS output, first hydration node identity, then measured updates.
5. First-publication or source-pinned website status can falsely advertise npm availability: Tasks 1/8/9 verify actual package/version identity, new-name rights and deployment evidence separately.

---

## Scope and ownership map

| Owner / task | Exclusive writable surface | Interfaces / review gate |
| --- | --- | --- |
| Inputs / Task 2 (U1–U3) | `packages/primitives/src/internal/active-descendant.ts`; new `combobox` and `command` directories; `apps/gallery/src/inputs.tsx`; `e2e/inputs.spec.ts` | Family namespaces, types and fixture `Inputs(): Element`; no shared index edits. |
| Tree / Task 3 (U4) | `packages/primitives/src/tree`; `apps/gallery/src/tree.tsx`; `e2e/tree.spec.ts` | `Tree` namespace, types and `Trees(): Element`; no shared roving helper edits. |
| Splitter / Task 4 (U5) | `packages/primitives/src/splitter`; `apps/gallery/src/splitter.tsx`; `e2e/splitter.spec.ts`; `tests/splitter.test.ts` | `Splitter` namespace, types, `Splitters(): Element`; pure math remains private. |
| Extra icons / Task 5 (I1–I2) | `packages/icons-extra`; `packages/icons/scripts/generate.ts`; `packages/icons/README.md`; `apps/gallery/src/assets.tsx`; `e2e/assets.spec.ts` | Exactly FolderIcon/FolderOpenIcon, same generator; original generated source byte-identical. |
| Charts / Task 6 (C1–C7) | `packages/charts` except package version; `tests/consumer/charts.test.ts`; `apps/gallery/src/charts.tsx`; `e2e/charts.spec.ts` | A1–A13 + B1/B2; `CartesianPosition` public type; Charts docs/provenance owned here. |
| Native integration / Tasks 1,7,9 | Root/package manifests/lock; primitives root index/Vite/README/CHANGELOG; `tests/consumer/run.ts`, `packed.test.ts`, `types.tsx`, distribution/tree-shaking/coverage; gallery manifest/composition; Playwright config; workflows; root README; Themes/Icons release-status changelogs | Sole shared-file/gate/Git owner. Component docs stay with their source owners; rejected source fixes return to owner. |
| Website / Task 8 | Sibling `radix2solid-web` isolated clone, branch `implement/next-suite`, based on reviewed PR #2 head `f780d5a99e20b95776825d2caddd9cd0b5636cc9` | Website plan owns exact files/commands; sole web integration/Git/gate worker, directed by Main. |

A directory denotes an ownership boundary, not permission to rewrite unrelated code. Main dispatches Inputs, Tree, Splitter, Charts and FAST-icons as disjoint edit owners, at most four live workers; queue the fifth slice. One separate native integration/gate worker owns all shared wiring, tests/builds and Git, serialized after each settled union. Every edit brief has ≤5 explicit target paths plus the plan brief. Charts remains one owner because A4/A5/A9 share geometry/offset and test/docs ledgers. No worker races shared index/manifests/tests/build output.

## Observed reuse and implementation flow

- Primitive files export long names and `Root`/part aliases from family `index.ts`; root exports namespaces and named types. Package conditional exports and `vite.config.ts` entries are explicit. Adding source alone does not create a packed subpath.
- `createControllableState<T>` returns `[Accessor<T>, setter]`, suppresses `Object.is` no-ops and does not synchronously expose controlled callback acceptance. Slider calls `flush()` at event boundaries before comparing accepted values; do not call it from apply effects/nested flushes.
- Collection sorts registered nodes using current `compareDocumentPosition` whenever `items()` runs; registration version alone cannot notify a DOM-only reorder. New navigators own narrowly scoped reorder/visibility reconciliation.
- Select supplies external-form reset/timer cleanup and accepted-value change-event patterns, but its modal DOM-focus listbox and selected-label discovery are not Combobox's implementation. Roving focus supplies real-focus composition, but its selected-before-current entry order and empty-root tab policy cannot override Tree's explicit policy.
- Existing `tests/consumer/run.ts --scope=next-core` packs every package, installs an independent fixture, builds client/server, checks TS7, runs node tests and TS5 declaration distribution checks, then selected browser cases. Extend this existing scope for the new suite; do not invent CLI flags or a generic runner framework. Add targeted tree-shaking coverage to this scope because the existing branch currently skips it.
- Existing check CI runs `pnpm check`; publish CI runs on `v*-rc.*`, requires `environment: npm` and OIDC, validates all package versions against tag, then packs/publishes/reads registry through four currently hardcoded loops. Add icons-extra to all loops without relaxing any guard.

## Task 1: Freeze execution inputs and one integration contract

**Files:** Integration owns root `package.json`, `pnpm-lock.yaml`, four existing package manifests and ledger; I1 owns creation of icons-extra manifest using the fixed suite version. Release-status corrections in original package README/changelog are routed by doc ownership: Primitives/Themes/root to integration, Icons README to FAST-icons, Charts to Charts owner. No product changes until Main dispatch.

**Interfaces:** `suiteVersion = '0.1.0-rc.3'` for all five source packages, read-only observed registry evidence, reviewed source HEAD and owner table. Icons manifest consumes the same literal version; exact peers remain unchanged. No source-candidate decision asserts npm publication rights.

- [ ] Main reviews this plan/subplans and ledger consistency table, records dispatch authorization internally. Preserve the six minimal status updates.
- [ ] Consume sibling `radix2solid-web:docs/superpowers/plans/2026-10-14-next-suite-website.md` (read during planning). Confirmed inventory: web PR #2 OPEN at `f780d5a99e20b95776825d2caddd9cd0b5636cc9`, both CI SUCCESS; web main `dbc353eb3cb2819813e57da627aae51a8e3d6d8d`; native main `b0cf970aba2f67f4ac5d8a6355e5737b1c29b89c`. Keep reviewed PR #2 changes in the new clone. Website authoring may use frozen contracts before native implementation exists; real public implementation SHA is mandatory for final pin, packed proof and CI, not a reason to delay disjoint docs authoring.
- [ ] Record reported registry evidence: four existing rc.3 endpoints404 with no time-map rc.3 entry, extra packument/version404. Use rc.3 as the coherent source candidate; pass it to all package/doc owners and update versions once. Do not infer unused name/rights/never-unpublished or repeat old rc.2 checks. Source-pinned website deployment is confirmed independent of npm; DevOps alone resolves publication eligibility.
- [ ] Only after dispatch, install with `pnpm install --frozen-lockfile` unless a manifest edit requires the one integration-owned lock update (`pnpm install --no-frozen-lockfile`, then a frozen install). Record pre-existing reported failures as ground truth; do not rerun old CI just to reconfirm them.
- [ ] Dispatch test-first rounds separately from implementation. New UI owners first add only their e2e assertions, not imports of absent components/fixtures. The gate worker adds project matches, serves the existing working gallery on 4147 and runs named new cases: expect missing controls/behavior, not compile/import errors. Main receives this RED evidence before dispatching component/fixture implementation. For Charts, new regressions exercise existing APIs before adaptation; already-passing cases may prove contained status. Gate worker runs GREEN/packed smoke after each settled implementation union.

## Task 2: Native editable inputs

**Files/interfaces:** U1–U3 in UI subplan; produce `Combobox`, `Command`, all spec parts/props/scopes, `Inputs` fixture and `e2e/inputs.spec.ts`.

- [ ] Implement U1 navigator then U2/U3 within one owner; selection/forms do not leak into Command.
- [ ] Hand precise root exports/types and fixture wiring to integration owner; include cancelled events, controlled refusal and SSR output, not merely happy-path attributes.
- [ ] Native gate worker runs changed-path input SSR/CSR cases; Main reviews evidence/spec/quality before completion and returns fixes to the same owner. Component edit workers do not execute gates.

## Task 3: Native Tree

**Files/interfaces:** U4 in UI subplan; produce `Tree` parts/props/scope, `Trees` fixture and `e2e/tree.spec.ts`.

- [ ] Implement hierarchy above current collection and focused-item lifecycle; no new general tree engine.
- [ ] Native gate worker runs Tree focus/selection/expansion and node-preserving SSR/CSR cases, including actual activeElement and partial metadata.

## Task 4: Native Splitter

**Files/interfaces:** U5 in UI subplan; produce `Splitter` parts/props/scope, `Splitters` fixture and private constrained math.

- [ ] Implement two-panel layout, measurement, accepted-only commits and independent collapse; preserve rendered children while inert.
- [ ] Native gate worker runs `node --test tests/splitter.test.ts`, then Splitter SSR/CSR rectangle/capture cases; no CSS-variable-only proof.

## Task 5: Extra icons

**Files/interfaces:** I1–I2 in icons subplan; produce self-contained package with exactly two original assets and provenance, shared generator unchanged for 332 originals, updated assets fixture.

- [ ] Implement generator/package/artwork and package documentation, then deliver integration deltas to Task 7 rather than touching its files.
- [ ] Native gate worker runs byte-identity regeneration, package builds, packed distribution/types/tree-shaking and assets SSR/CSR; records 15px visual comparison and actual creation commit.

## Task 6: Selected Charts adaptations

**Files/interfaces:** C1–C7 in Charts subplan; preserve local patch ledger and runtime dependencies; expose only selected new props and `CartesianPosition` type.

- [ ] Map every compared commit and PR #3 hunk before modifying its local counterpart; hand-port selected behaviour, never wholesale replace or cherry-pick.
- [ ] Complete all A1–A13 and B1/B2 cases; `contained` requires observed proof, never a renamed failing/pending row.
- [ ] Native gate worker runs parser timeout/output, existing Charts consumer/e2e and strict type checks; Main reviews every row's evidence and public claim.

## Task 7: Shared native wiring and packed proof

**Files:** `packages/primitives/src/index.ts`, `packages/primitives/vite.config.ts`, `packages/primitives/package.json`, `packages/primitives/README.md`, `packages/primitives/CHANGELOG.md`; root `package.json`/`pnpm-lock.yaml`/`README.md`; `apps/gallery/package.json`, `apps/gallery/src/composition.tsx`; `playwright.config.ts`; `tests/consumer/run.ts`, `packed.test.ts`, `check-distribution.ts`, `check-tree-shaking.ts`, `coverage-manifest.json`, `types.tsx`; `.github/workflows/publish.yml`. Each is integration-owned; no sibling writes.

**Interfaces:** Consume exact family `index.ts` exports and `Inputs/Trees/Splitters` fixtures; `IconProps`, `FolderIcon`, `FolderOpenIcon`; Charts additions. Produce actual client/server/type subpaths and packed fixture `.artifacts/consumer` with all five packages.

- [ ] Add `combobox`, `command`, `tree`, `splitter` to primitive Vite entry map and types/browser/default package exports; root namespace/named exports follow current Select convention. Export public prop types and scope creators, not the internal navigator/math helpers.
- [ ] Add icons-extra workspace devDependency/build after icons. Add only Splitter math to root node tests: `node --test tests/slider.test.ts tests/splitter.test.ts`, retaining consumer/Playwright commands. Parser guards run inside existing Charts consumer test, no extra harness. Wire new gallery fixtures once, no source aliases. Add inputs/tree/splitter to CSR, firefox-ssr/firefox-csr, webkit-ssr/webkit-csr testMatch lists; default SSR already includes them. Local gates select changed paths.
- [ ] Extend `run.ts` pack list to five, copy `packages/icons-extra/icons.json` as `icons-extra.json` alongside original `icons.json`, and retain only accepted flag `--scope=next-core`. That scope additionally runs new UI/asset files and icon tree-shaking. Preserve current selected Chart/Theme/shared-regression cases and full default behavior.
- [ ] Extend installed package/root/deep/SVG checks with `iconsExtra` block and `publicCounts.iconsExtra: 2`, retain icons332 and the existing icons-prefix non-icon declaration exclusion (glyphs add zero non-icon modules/declarations). Derive new UI/Charts totals from actual symbols. Reject collisions and compiled/export/dependency workspace/private/cross-package leaks; exempt intentional repository-only generator script, not actual runtime imports. Never weaken exact checks.
- [ ] Extend `types.tsx`: all family parts via root and subpaths, refs/native target factories, nullable keys, readonly arrays, filter=false/function, command event cancellation, Tree native ARIA metadata, Splitter `%`/`px`; negative cases for unsupported props/unit/modes. Extra icon accepts size/title/color/native overrides, rejects children. Sankey accessibility props, Legend valid/invalid `CartesianPosition`, auto layout and XAxis number/auto compile under both TS versions.
- [ ] Extend tree-shaking check with FolderIcon root/deep entry not retaining FolderOpenIcon, no React runtime and no original-icons dependency; original expectations stay intact.
- [ ] Update primitives README API tables/examples for four families, native composition/controlled semantics/accessibility/SSR limitations and no fictional upstream React links. Add primitives CHANGELOG. Root README lists five packages, labels extra art correctly and preserves truthful npm status; source-only features get source-build instructions until registry evidence exists. Themes exported wrappers remain unchanged.
- [ ] Add icons-extra to publish manifest, pack, inspect, publish and registry-read loops. Do not change npm environment/permissions/tag matching or add first-publish credentials. Package/changelog/install version text uses Task 1's actual candidate, never rc.2.
- [ ] Designated native integration/gate worker verifies the settled union with commands below and attaches logs/checksums; Main dispatches independent spec/quality review before web pin/merge. Component workers never run those commands.

### Native verification commands (designated gate worker under Main)

Working directory is the existing isolated clone; version/artifact paths come from manifests, never hardcoded rc.2.

```sh
# Targeted RED/GREEN during each settled source slice; relevant package only.
pnpm --filter @wsagency/radix2solid-primitives build
pnpm --filter @wsagency/radix2solid-charts build
node --test tests/splitter.test.ts
# Once integration settles, create all real outputs then packed fixture.
pnpm build
pnpm typecheck
node tests/consumer/run.ts --scope=next-core
# Against that actual packed fixture, explicit changed-path browser proof.
GALLERY_PACKED=1 pnpm exec playwright test e2e/inputs.spec.ts e2e/tree.spec.ts e2e/splitter.spec.ts e2e/assets.spec.ts e2e/charts.spec.ts --project=ssr --project=csr
GALLERY_PACKED=1 pnpm exec playwright test e2e/inputs.spec.ts e2e/tree.spec.ts e2e/splitter.spec.ts --project=firefox-ssr --project=webkit-ssr
```

Avoid duplicate execution: the extended targeted runner owns its listed SSR/CSR files; the explicit Playwright command is for a focused rerun after a changed fixture/case or a documented smoke gap, not an obligatory second identical run. The last cross-engine command runs the new cases only. Parser child process timeout is implemented in the named node test, not a shell elapsed-time performance assertion. Each meaningful nontrivial behavior leaves a runnable check; reuse tests covering multiple rows instead of one permanent test per ledger row. Required CI still runs unmodified `pnpm check`; do not repeatedly run that historical matrix locally as a baseline. LSP diagnostics on changed code if available; no imaginary formatter command (none is declared in root scripts).

## Task 8: Website integration and source-pinned deployment

**Plan dependency:** Sibling repository `radix2solid-web`, plan `docs/superpowers/plans/2026-10-14-next-suite-website.md`, read during planning and owned by the website owner. It supplies the exact task/file/command inventory rather than duplicating web implementation here. Its isolated branch `implement/next-suite` retains reviewed PR #2 head `f780d5a99e20b95776825d2caddd9cd0b5636cc9`; host paths live only in private dispatch/ledger.

**Interfaces:** Native integration supplies the actual reviewed/merged implementation commit, five-package candidate version, API/type inventories, Charts row statuses and original-artwork provenance. Website owner produces native API pages and styled live recipes/playgrounds for all four UI families, separate Extra catalogue/install usage, A3/A4/A5 chart demos and matching status, updated routes/navigation/native-route/snippet inventories, real source pin and deployed-site evidence. No new exported Themes behaviour wrappers.

- [ ] Main reads/internal-reviews the website plan before dispatch; verify its full scope against master coverage rows and every family spec's website section. Keep old rc2webPR checkout untouched; retain its reviewed changes in the new clone.
- [ ] Use the confirmed source-pinned/tarball build route, not an npm dependency that does not exist. Pin the actual merged native implementation commit with an unused new candidate version, never modified rc.2 tarballs. Clearly distinguish published npm rc.2 capabilities from new source-build features; extra icons have no npm install claim until publication is observed.
- [ ] Website owner runs its plan's observed route/snippet/native-route/build and styled interactive checks, then existing main-only deployment after full check and remote-HEAD freshness gate. GitHub Cloudflare secret and admin/push access were inventoried as available; use them only through the existing CI path, never create credentials or bypass approvals.
- [ ] Smoke actual deployed URL/commit/pin: all new native routes, form/action/focus/geometry demos, Extra catalogue and Charts measurement/hydration. Record workflow run/environment/URL and findings. Source-pinned deployment does not wait for icons-extra first npm publication.
- [ ] Record real screen-reader interaction separately from DOM/axe; do not claim certification or exercised AT if no AT session occurred. Native test server is port 4147; do not touch user-owned previews on 4149/4150.

## Task 9: Reviewed release PR, authorized site deploy, DevOps publication boundary

**Files:** Existing release manifests/changelogs/root and package READMEs, `.github/workflows/publish.yml`; website pin/status pages through its owner. No new release automation.

**Interfaces:** Consume green mandatory CI, focused evidence, provenance and publication-rights inventory. Produce reviewed source/release PR and deployed website evidence; npm completion only if DevOps actually publishes through existing approved CI.

- [ ] Integration owner stages focused completed changes with actual `/usr/bin/git` via subprocess, commits phase-named changes after green gates, pushes the reviewed branch and opens/merges through existing repository permissions/checks. User authorizes normal repository side effects; never bypass required checks or force-push unrelated branches. If a required gate fails, fix the real current failure before merge; do not reconfirm known old failures without a changed cause.
- [ ] Ensure mandatory `Native distribution checks`/`pnpm check` is green on the actual integration commit and web checks are green on the actual pin. Record run IDs, not inferred status. Focused local smoke does not substitute for CI release gates.
- [ ] Prepare coherent five-package release PR/version/changelog and actual pack manifest/checksums; keep published rc.2 untouched. Finalize extra-icon README creation commit after the artwork commit exists (a subsequent docs commit avoids a self-referential hash).
- [ ] Route first-name publication rights and npm Trusted Publisher/environment approval to maintainer/DevOps through Main. Existing tag workflow is the only publication path; do not create/release a publish-triggering tag on the assumption that site-deploy authorization includes npm authorization.
- [ ] If DevOps publishes, inspect actual registry name/version/integrity/attestations for all five packages and then allow npm install/status copy and registry-pinned website update. If not yet published, report “implementation and source-pinned site deployed; npm publication awaiting DevOps” only if the site truly deployed; otherwise report the exact blocking dependency. Do not call the npm release complete.
- [ ] Final closure checklist: every coverage row below has evidence; shared exports/docs/types agree; no scaffold/throwaway probes remain; independent review findings addressed; deployment URL smoke recorded. No human workflow-review prompt between phases.

## Specification coverage / self-review

| Requirement section | Implementing task / evidence |
| --- | --- |
| Index baseline/isolation/release immutability | Global constraints; 1 and 9 |
| Index cross-family ownership, native tuple/state/exclusions | U1–U5; 7 declarations/distribution; C1 Brush exception |
| Index exports/docs/website/pin/bounded evidence | 7–9; all focused plan assertions |
| Inputs Combobox public parts/data/query/commit | U1/U2; 7 root/subpath/types; 8 API/playground |
| Inputs forms/reset/data replacement/disabled/readOnly | U2 `draft-form`, `reset-data`, `controlled-split-acceptance` cases |
| Inputs accessibility/editing/SSR/lifecycle | U1–U3 `input-editing`, `active-lifecycle`, `ssr-hydration` cases |
| Inputs Command action/inline/Dialog/empty/cancellation | U3 `command-actions`, `command-dialog`, `command-replace` |
| Tree API/state/keys/interaction/typeahead/disabled | U4 `tree-navigation`, `tree-actions`, `tree-keys` |
| Tree hierarchy/focus repair/retained state/partial data/SSR | U4 `tree-repair`, `tree-ssr`; 8 docs |
| Splitter parts/units/config/layout/infeasible/measurement | U5 math + `splitter-geometry`, `splitter-config` |
| Splitter proposals/commits/cancel/stale drag/collapse/focus | U5 `splitter-controlled`, `splitter-gestures`, `splitter-collapse` |
| Splitter keyboard/ARIA/SSR/cleanup/website | U5 `splitter-ssr`, geometry/gesture cases; 8 |
| Icons package/catalog/artwork/generator/public contract | I1/I2; original byte identity + packed/SSR/types |
| Icons all library/website integration/size/release claims | I2; 7–9, no unmeasured size claims |
| Charts immutable provenance/local patches/manual mapping | C1/C7, preservation checks |
| Charts selected A1–A13, B1/B2 and all boundaries | C2–C6 full row matrix and A4/A5 exact assertions |
| Charts matrix C/unselected commits and exclusions | C1/C7 complete comparison inventory; no canary ledger additions |
| Charts public docs/types/examples/release | C3/C4/C7; 7–9 |

Self-review covers all sections of six specs and the concrete sibling website plan. No technical requirement is dropped or claimed exercised. Source-pinned site deployment is independent of maintainer-controlled npm publication. Corrections include the CartesianPosition collision, existing next-core flag, iconsExtra/icons-extra.json naming, one shared-file/gate/Git owner, explicit browser project matches, behavioral RED before implementation and native target default-action checks. Private SDD ledger records task/interface consistency and rulings; no host-specific workspace paths belong in committed plans.
