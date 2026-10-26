# Changelog

Registry status before rc.5 publication (2026-10-26): `0.1.0-rc.4` is published under the `next` dist-tag. The versioned rc.5 prerelease notes follow; earlier entries retain their historical preparation-time wording.

## 0.1.0-rc.5

- Correct chart label positioning and Pie layout, and stabilize reactive state-hook reads by moving setup-time reads outside tracked computations.
- Add oxlint/oxfmt checks; no public API change.

## 0.1.0-rc.4

- No Charts API or runtime changes from rc.3; advance the package version with the five-package prerelease.

## 0.1.0-rc.3 — prepared candidate, not yet published

- Port selected Recharts A1–A13 changes and B1/B2 guards, with per-change source mapping and passing local public-consumer evidence in `upstream.json`; the imported solid-recharts baseline and license/dependency notices are unchanged. This is not a complete Recharts 3.10.1 port or a theme API update.
- Add positioned Legends, `offset`, automatic horizontal/vertical layout and the public `CartesianPosition` input type. Positioned default-mount legends use an owner-preserving HTML outlet for SSR/hydration, measuring only after the initial claim; legacy no-position and custom portals keep their previous server boundary.
- Add `XAxis height="auto"` with a 30px initial server/hydration fallback, actual tick/string-label measurement and bounded height-history stabilization. Remeasure on `fontSize`/`letterSpacing` changes and native font completion, with owner-bound subscription cleanup. Forward native text refs and axis rotation. Do not interpret unsupported JSX label nodes as settings objects or stringify their DOM children.
- Correct the shared root clip producer: serialize the same-ID defs after ordinary child registration and reread plot geometry. Declared numeric axis heights now affect the server clip too (500×300, 5px margins, height30 X axis: clip260, formerly290). Tick geometry is preserved; defs order and server clip markup intentionally change.
- Add Sankey root SVG accessibility/title/description props; use computed Pie radii for child labels and retain configured center/radii when zero-valued data has no sectors; pass computed x/y to custom Label content without injecting anchors.
- Keep controlled Brush drag pixels on release and controlled indices across chart data replacement; keyboard changes move the selected traveller without resetting the other retained handle.
- Reset stale active Bar layer state when another bar becomes active, retaining native Cell ownership and transition cleanup.
- Defer the positioned Legend outlet and initial Bar geometry until ordinary child registrations exist; isolate Brush data-replacement synchronization from keyboard/index updates.
- Adapt all-null stacked Area connectivity, floating-gap band widths, configured gaps after bar-size clamping, missing-label tooltip index fallback, polar tick wrapping and value-stable rendered-tick reporting. Polar wrapping corrects the actual Tooltip anchor as well as selection; a clamped visible label alone did not prove a valid anchor.
- Harden Text CSS calculations against replacement-token interpretation and inputs over 1,000 characters before normalization.
- Mark Text/Label ref attachment and Brush index-change drag guards as intentional imperative snapshots for Solid's strict-read diagnostics, without untracking rendered geometry or content. Gallery custom JSX labels use the supported render-function lifecycle; unsupported DOM-node input is exercised by an explicit post-mount user action.
- Observed local verification passed public Charts Node SSR20/20, selected cross-engine SSR/CSR cases, TS7/TS5.9 packed declarations and all Charts cases in the rebuilt packed Chromium core suite. Review follow-ups cover zero-data Pie SSR, positive-to-zero and font/spacing changes in packed Chromium, explicit public position/offset/auto-height/Sankey types, and real-font completion plus disposal in Chromium/Firefox/WebKit. Full CI and npm publication remain pending.

## 0.1.0-rc.2 — prepared candidate, not yet published

- First release. Source copy of solid-recharts `2.0.0-beta.1` (`b1f9c67`), which ports Recharts `3.9.2` (`b345105`), with the whole inherited root export surface: twelve chart families, series, axes, grids, reference elements, `Brush`, `Tooltip`, `Legend`, `ResponsiveContainer`, `Cell`, labels, shapes, hooks and animation helpers. Recharts `3.10.1` is tracked but not ported. See `UPSTREAM.md`.
- Requires exactly `solid-js` and `@solidjs/web` `2.0.0-rc.15` as peers; `solid-js` rc.15 declares Node `>=22.12.0`. Compiled client and server ESM with shared declarations; `d3-scale` `4.0.2` and `d3-shape` `3.2.0` are external dependencies. Until publication, install a packed tarball as described in the README (exact Solid overrides, `@solidjs/vite-plugin` `3.0.0-next.50`, Solid JSX compiler settings).
- Fixed-size charts and `ResponsiveContainer` with `initialDimension` render real SVG on the server; the root SVG of a tested fixed-size chart hydrates in place. The bounded Cartesian recipe in the README (axes before series, gutters in `margin` with zero-size axes, a `band` category scale, an explicit value `domain` with `allowDataOverflow`, `interval={0}` on both axes) is regression-tested to keep identical tick positions and series geometry across hydration. Automatic domains and axis sizes are not supported on the server.
- Cartesian axes and default grid generators claim their complete server tick lists before enabling browser-only automatic thinning. Responsive charts no longer retain orphaned or duplicate ticks after hydration, resizing or data replacement; explicit numeric intervals and custom grid generators retain their behavior.
- `Cell` overrides apply in order on the server and after reorder or replacement for `Bar`, `Scatter`, `Funnel`, `Pie` and `RadialBar`. Generated IDs are hydration-stable and clip paths are unique across charts. An `Area` inside a `Brush` panorama renders in any chart type.
- `Treemap` has entry animation only. Its unused `isUpdateAnimationActive` prop is removed; Recharts' Treemap update animation is not ported.
- `LICENSE` keeps the solid-recharts and Recharts MIT notices; `NOTICE` reproduces the ISC licenses of the ten D3 packages that `d3-scale` and `d3-shape` resolve to.
- Declarations are emitted by TypeScript 7.0.2; the packed consumer checks use TypeScript 5.9.3.
