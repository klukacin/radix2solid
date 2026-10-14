# Native extra icons package

Status: **Proposed written specification awaiting user review.** Scope approval permits this document, not implementation. Nothing described here is implemented, drawn or published.

## Goal

A second icon package in the existing native monorepo. It ships icons that the Radix Icons set does not have, starting with a closed and an open folder. It has the same public contract as `@wsagency/radix2solid-icons` and is produced by the same build-time generator.

## Non-goals

- Changing `@wsagency/radix2solid-icons`. Its 332 Radix Icons, names, assets, exports, defaults and generated output stay byte-identical.
- A new repository, a second generator, a runtime icon factory, an SVG optimizer or any new toolchain dependency.
- A large or speculative catalog. Additions after the first two icons need their own approval.
- Brand artwork. WS Agency logos, signs, badges, favicons and app icons are excluded. They are brand artwork with no open-source licence.
- Replacing inline icons in any downstream application.

## Package

| Field | Value |
| --- | --- |
| Directory | `packages/icons-extra` (the publish workflow derives `@wsagency/radix2solid-<dir>` from the directory name) |
| Name | `@wsagency/radix2solid-icons-extra` |
| Version | the suite release version shared by all packages, chosen in the release PR |
| `private`, `publishConfig`, `repository`, `type`, `sideEffects` | same values as `packages/icons/package.json`, with `repository.directory: packages/icons-extra` |
| Peers | `solid-js` and `@solidjs/web` exactly `2.0.0-rc.15`, matching the suite |
| Dependencies | none; in particular no dependency or peer on `@wsagency/radix2solid-icons` |
| `files` | `dist`, `icons`, `LICENSE`, `README.md`, `CHANGELOG.md` |
| `exports` | the same three shapes as icons: `.` (types/browser/default), `./*Icon` (types/browser/default), `./icons/*.svg` |
| Build | `generate`, then client and SSR Vite builds, then `tsc` declarations. Same steps as icons; `vite.config.ts` and `tsconfig.json` copied from icons. |
| Licence | MIT (see Artwork) |

The published tarball is self-contained. Nothing in it refers to the icons package, a workspace path or a private path.

## Initial catalog

| Export | Asset |
| --- | --- |
| `FolderIcon` | `icons/folder.svg` |
| `FolderOpenIcon` | `icons/folder-open.svg` |

`icons.json` holds the authoritative name→asset map, as it does in the icons package. Export names must not collide with any name in `packages/icons/icons.json`. The distribution check asserts this.

## Artwork

**Origin**
- Both assets are new original artwork, created during implementation of this specification. This specification draws nothing, and the user does not supply artwork.
- Inline folder paths that already exist in a downstream application are **not** a source. Their authorship has not been established.
- Nothing may be traced from or derived from another icon set (Radix Icons, Lucide, Feather, Heroicons or others), or from brand artwork. If an asset cannot be shown to be created for this package, it is not shipped.

**Grid and style**
- `viewBox="0 0 24 24"`. The root `<svg>` has `fill="none"`.
- Each `<path>` carries `stroke="currentColor"`, `stroke-width="1.6"`, `stroke-linecap="round"` and `stroke-linejoin="round"`.
- At the default 15 px size, a 1.6 stroke renders at 1.6 × 15/24 = 1.0 px. Before merge, both icons are reviewed next to existing icons in the gallery at 15 px; if the line weight is visibly heavier or lighter, the stroke width is adjusted.
- Asset syntax stays within what the generator accepts: no comments, processing instructions, entities or braces, and unique IDs. Masks are allowed only if needed.

**Provenance record (merge gate)**
- Copyright default: new artwork and new code written for this package use the project's existing MIT notice, `Copyright (c) 2026 Radix2Solid contributors`. This is the same notice as the root `LICENSE` and `packages/icons/LICENSE`.
- `packages/icons-extra/LICENSE` starts with that notice. Reused code keeps whatever notices apply to it: the generator's wrapper template and the `src/types.ts`/`src/title.ts` helpers copied from `packages/icons`, and any external code an implementation brings in. Each notice is carried over unchanged.
  - New artwork is not a reason to drop a notice from reused code.
  - The WorkOS notice in `packages/icons/LICENSE` covers the Radix Icons SVG assets. It is not added for the new artwork, since no Radix Icons asset is included. It is kept if any reused content turns out to be covered by it.
- For each asset, the package README's Artwork section records what actually happened at creation:
  - who or what created it, including any tool or AI assistance
  - the commit that added it
  - a statement that it was created for this package without tracing or deriving from other icon sets
- The record never names a human creator who did not create the asset, and never states a legal clearance or copyright assurance beyond that factual record.

**Licence vs. trademark**
- The MIT licence covers the artwork as package content. It grants no trademark rights.
- The package contains no WS Agency marks. "wsagency" appears only as the npm scope and in repository metadata.

## Generator change (build-time only)

`packages/icons/scripts/generate.ts` stays the only generator. The change is limited to three points:

1. **Target root.** An optional command-line argument selects the package root; without it, the default stays the icons package. The extra package's `generate` script runs `node ../icons/scripts/generate.ts .`. This workspace path is used only at build time and is not in the published files.
2. **viewBox.** The generator reads `viewBox` from each asset instead of asserting `0 0 15 15`. It asserts that every asset in one package has the same viewBox, from the set {`0 0 15 15`, `0 0 24 24`}, and writes that value into the wrappers. The default size stays `props.size ?? 15` for both packages.
3. **Helpers.** The generator writes `src/types.ts` (`IconProps`) and `src/title.ts` (`IconTitle`) into the target package, with their current content, so each package is self-contained. It does not import across packages.

Nothing else changes:
- Stroke attributes live on the child elements, and the existing `(fill|stroke)="currentColor"` rewrite already maps them to the `color` prop. Root attributes are therefore not passed through.
- The mask ID handling, accessibility attributes, prop spreading and the name/asset bijection checks stay as they are.

The generator stays in `packages/icons` under that package's existing licence. Code it writes into the extra package, and any external code the implementation brings in, keeps its applicable notices as described under Artwork.

## Public contract (identical to the icons package)

**Props and rendering**
- `IconProps` is the native SVG element props plus `color`, `size` and `title`, and `children?: never`. It is exported from the package root.
- `size` sets width and height; the default is 15. The viewBox stays `0 0 24 24`. Explicit native `width`, `height`, `viewBox`, class, style and other props take precedence.
- `color` sets the `currentColor` strokes. When it's omitted, inherited CSS `color` applies.

**Accessibility**
- An icon with no nonempty `title`, `aria-label` or `aria-labelledby` is decorative and gets `aria-hidden="true"`.
- A named icon gets `role="img"`. Explicit role and ARIA props take precedence.
- `title` renders a real namespaced SVG `<title>`, including during fresh client rendering and reactive updates.

**Behaviour**
- Refs and events reach the native SVG element.
- Any mask IDs are per instance and stable across SSR and hydration.
- Client ESM, server ESM and shared declarations.

**Imports**
- Root named imports and per-icon deep imports, both named and default (`@wsagency/radix2solid-icons-extra/FolderIcon`).
- The original SVG files are exported unchanged at `@wsagency/radix2solid-icons-extra/icons/<asset>.svg`.

## Integration (all required when implemented)

Library repository:
- `packages/icons-extra/`: `package.json`, `icons.json`, `icons/*.svg`, generated `src/`, `vite.config.ts`, `tsconfig.json`, `README.md`, `CHANGELOG.md`, `LICENSE`.
- Root `package.json`: add the package to the build script and as a `workspace:*` devDependency.
- `tests/consumer/run.ts`: add the package to the packed-package list and copy its `icons.json`.
- `tests/consumer/check-distribution.ts` and `coverage-manifest.json`:
  - root and per-icon module contracts, and SVG subpaths
  - an exact extra-icon count, kept separate from the 332
  - the name-collision assertion against `packages/icons/icons.json`
- `tests/consumer/check-tree-shaking.ts`: importing `FolderIcon` does not bundle `FolderOpenIcon`.
- `tests/consumer/types.tsx`: accepts `size`, `title` and `color`; rejects `children`.
- `e2e`: one SSR and hydration check for one extra icon with `title` and `color`.
- `apps/gallery/src/assets.tsx`: shows both icons and one SVG download.
- `.github/workflows/publish.yml`: add `icons-extra` to the manifest, pack, publish and registry-read loops.
- `packages/icons/README.md`:
  - Replace the sentence saying there is "no icon factory or extension package, and folder or brand icons stay in your app" with a pointer to the extra package.
  - Keep the statement that brand icons are not shipped.
  - Keep "no icon factory".
- Root `README.md`:
  - Opening paragraph: after the list of ports, add that the suite also includes a small set of extra icons drawn for this project, which are not a Radix port.
  - "The four packages" becomes "The five packages". Add a bullet after the icons bullet for `@wsagency/radix2solid-icons-extra`, linking `packages/icons-extra/README.md`: folder icons drawn for this project, outside the 332 Radix Icons, with the same props and import shapes.
  - The release-status paragraph and the `pnpm add` command still describe the already-prepared four-package `0.1.0-rc.2`. They gain the extra package in the release PR that chooses the next suite version. Until then, the new bullet states that the package is not yet published.
  - In the License paragraph, state that the extra icons are the project's own artwork under its MIT notice. State that reused generator or helper code keeps its applicable notices, as recorded in the package `LICENSE`. Make no wider legal claim.
- `packages/primitives/README.md`: no change, for this reason:
  - It mentions icons only as parts: `AccessibleIcon`, `Select.Icon` and the password toggle field's `Icon`. Their examples use inline native SVG target factories.
  - It names neither icon package, and Primitives depends on neither.
  - The extra package adds no new way of composing with Primitives. Its components are native SVG components, like those of the icons package, so the existing guidance covers both.

Website repository (documentation is part of this deliverable, not optional):
- Icon catalogue (`apps/website/src/components/icons/all-icons.tsx`, `search-results.tsx`): a separate "Extra" group imported from the extra package. It is never counted in or mixed into the 332 Radix icons.
- `apps/website/src/components/icons/icons-panel.tsx`: install command and a usage example for the extra package.
- Website pin (`library-source.json`): updated after the library change merges, following the existing pin process.

## Size claims

The bundle figures in the existing icons README were measured for `0.1.0-rc.1` with Solid `2.0.0-rc.13`. They are not projections for the extra package. The extra package's documentation makes no size claim until one is measured, with the same method, on a built release of that package.

## Release (intended, not done)

- The version is the suite release version, chosen in the release PR. It is never `0.1.0-rc.2`, which is already published for the four existing packages.
- The first publication of a new npm package name needs a maintainer. The maintainer must arrange publication rights for the name and the Trusted Publisher setup the existing OIDC workflow relies on. The workflow change alone does not do this.

## Acceptance criteria

1. Regenerating `packages/icons` with the changed generator produces no diff anywhere in its `src/`: all 332 wrappers, `index.ts`, `types.ts` and `title.ts`.
2. `packages/icons-extra` builds from its two assets: exactly `FolderIcon` and `FolderOpenIcon`, viewBox `0 0 24 24`, default size 15.
3. The packed extra tarball passes the distribution contract: exports, declarations, deep named and default imports, SVG subpaths, exact count, no collision, and no workspace or private references.
4. The SSR output of a titled, colored extra icon hydrates without a mismatch. It keeps the namespaced `<title>` and `role="img"`; an untitled icon is `aria-hidden`.
5. The provenance record (actual creator and assistance, commit, creation statement), the project MIT notice, and any notices that apply to reused code are present. No brand artwork is in the package.
6. The gallery, the root README, the icons README, the extra README, the CHANGELOG, and the website catalogue and install docs are updated as listed above.
7. The publish workflow includes the package. Publication status is stated as intended until a maintainer publishes it.

## Targeted verification (at implementation, not now)

- Byte-identity regeneration of `packages/icons` (criterion 1).
- Generator run on `packages/icons-extra` (bijection and viewBox assertions).
- Consumer packed checks, distribution, tree-shaking and type tests, extended for the extra package.
- One e2e SSR and hydration check for an extra icon.
- Website build showing the Extra group.

## Decisions

- Name: `@wsagency/radix2solid-icons-extra`, directory `packages/icons-extra`.
- Grid: 24, stroked. Default size: 15, matching the existing icons.
- Copyright: the project MIT notice (Radix2Solid contributors) for new artwork and code; reused code keeps its applicable notices. Authorship and tool assistance are recorded as they actually happened.
- Catalog: `FolderIcon` and `FolderOpenIcon` only.
- Generator: the existing build-time generator, extended at the three points above.
