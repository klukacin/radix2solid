# Changelog

## 0.1.0-rc.2 — prepared candidate, not yet published

- Require exactly `solid-js` and `@solidjs/web` `2.0.0-rc.15` as peers (was `2.0.0-rc.13`); Solid rc.15 requires Node `>=22.12.0`. Icons, deep entries and SVG subpaths are unchanged.
- Declarations are emitted by TypeScript 7.0.2; the packed consumer checks use TypeScript 5.9.3.

## 0.1.0-rc.1 — prepared candidate, not yet published

- Rename the package from `@radix-solid/icons` to `@wsagency/radix2solid-icons`; deep icon entries and `icons/*.svg` subpaths are unchanged under the new name.
- Prepare public npm metadata for release under the `next` dist-tag; the Solid `2.0.0-rc.13` peers are unchanged.

## 0.0.0-local

- Generate all 332 original icons from checked-in SVG assets and authoritative names, without network/Figma/React/Ink or geometry optimization.
- Native reactive SVG size/color/outer props/events/refs, labeled or decorative accessibility, namespaced titles and per-instance SSR-stable mask references.
- Client/server ESM, complete declarations/deep icon entries and original SVG download subpaths; MIT/WorkOS attribution retained.
- Reuse released Radix Colors 3.0.0 JS/CSS directly; gallery production includes extracted stylesheets without weakening nonce-based script CSP.
- Restrict component deep imports to the 332 authoritative icon names while preserving each original named and default export; private title/type/index chunks remain inaccessible.
- Publish source in the public repository with a Radix2Solid contributors MIT notice; original Radix MIT copyright notices and texts are retained in the distributed `LICENSE`.
