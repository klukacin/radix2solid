# Changelog

## 0.1.0-rc.2 — prepared candidate, not yet published

- First release. Source copy of solid-recharts `2.0.0-beta.1` (`b1f9c67`), which ports Recharts `3.9.2` (`b345105`), with the whole inherited root export surface: twelve chart families, series, axes, grids, reference elements, `Brush`, `Tooltip`, `Legend`, `ResponsiveContainer`, `Cell`, labels, shapes, hooks and animation helpers. Recharts `3.10.1` is tracked but not ported. See `UPSTREAM.md`.
- Requires exactly `solid-js` and `@solidjs/web` `2.0.0-rc.15` as peers; `solid-js` rc.15 declares Node `>=22.12.0`. Compiled client and server ESM with shared declarations; `d3-scale` `4.0.2` and `d3-shape` `3.2.0` are external dependencies. Until publication, install a packed tarball as described in the README (exact Solid overrides, `@solidjs/vite-plugin` `3.0.0-next.50`, Solid JSX compiler settings).
- Fixed-size charts and `ResponsiveContainer` with `initialDimension` render real SVG on the server; the root SVG of a tested fixed-size chart hydrates in place. The bounded Cartesian recipe in the README (axes before series, gutters in `margin` with zero-size axes, a `band` category scale, an explicit value `domain` with `allowDataOverflow`, `interval={0}` on both axes) is regression-tested to keep identical tick positions and series geometry across hydration. Automatic domains and axis sizes are not supported on the server.
- `Cell` overrides apply in order on the server and after reorder or replacement for `Bar`, `Scatter`, `Funnel`, `Pie` and `RadialBar`. Generated IDs are hydration-stable and clip paths are unique across charts. An `Area` inside a `Brush` panorama renders in any chart type.
- `Treemap` has entry animation only. Its unused `isUpdateAnimationActive` prop is removed; Recharts' Treemap update animation is not ported.
- `LICENSE` keeps the solid-recharts and Recharts MIT notices; `NOTICE` reproduces the ISC licenses of the ten D3 packages that `d3-scale` and `d3-shape` resolve to.
- Declarations are emitted by TypeScript 7.0.2; the packed consumer checks use TypeScript 5.9.3.
