# Radix2Solid

Native Solid 2 port of Radix Primitives, Radix Icons and Radix Themes, with released Radix Colors 3.0.0 reused unchanged, plus Charts, a Solid 2 port of the Recharts component model derived from solid-recharts, and Icons Extra, a separate package of original artwork. This is an independent, unofficial project: it is not affiliated with or endorsed by Radix, WorkOS, Modulz, Recharts or solid-recharts. The MIT license covers the project's code and its original package artwork; it grants no rights to those projects' names, logos or trademarks.

The five packages keep their native API under the `@wsagency` npm scope:

- `@wsagency/radix2solid-primitives` — native API and migration notes: [`packages/primitives/README.md`](packages/primitives/README.md)
- `@wsagency/radix2solid-icons` — all 332 generated icons, SVG download subpaths and Colors 3.0.0 reuse: [`packages/icons/README.md`](packages/icons/README.md)
- `@wsagency/radix2solid-icons-extra` — separate original 24-grid folder artwork, not part of the 332 upstream icons: [`packages/icons-extra/README.md`](packages/icons-extra/README.md)
- `@wsagency/radix2solid-themes` — all native Themes families, themed portals, ThemePanel, responsive styling, custom accents, percentage scaling, per-component and cascade-layer CSS: [`packages/themes/README.md`](packages/themes/README.md)
- `@wsagency/radix2solid-charts` — SVG charts that read Themes tokens, with `d3-scale` and `d3-shape` as external dependencies: [`packages/charts`](packages/charts)

This README describes the five packages' local source candidate `0.1.0-rc.5`, which is unpublished and unavailable from the npm registry. The compatibility target in this branch is Solid rc.19 with Vite plugin next.52; that does not turn rc.5 into a published rc.19 release. The published rc.4 packages use the npm `next` dist-tag while Solid is prerelease. Calendar, DatePicker and FileDrop are introduced in rc.4 in Primitives and Themes; these new APIs are absent from rc.3. Do not install rc.5 from npm; use the source-checkout workflow below for local testing.


```sh
# From the reviewed source checkout, with pinned Node 24 and pnpm 11:
pnpm install --frozen-lockfile
pnpm build
pnpm --dir packages/primitives pack
pnpm --dir packages/icons-extra pack
```

For a source-pinned consumer, pack each package locally; when using Themes, override its Primitives dependency to the same Primitives tarball. Source-pinned website deployment remains independent of npm publication. The five source manifests retain `0.1.0-rc.5` as the separate unpublished local candidate.

Calendar, DatePicker and FileDrop are new project extensions, not official Radix components or ports. They are introduced in the rc.4 prerelease and absent from rc.3. For source-checkout development, build and pack Primitives; if using Themes, pack it from the same checkout and resolve its transitive Primitives dependency to the **same physical Primitives tarball**:

```sh
pnpm --dir packages/primitives pack
pnpm --dir packages/themes pack
```

These source-checkout packs are optional local development artifacts. Public npm installs should use the published rc.4 packages (the `next` dist-tag) until a later package release is published; rc.5 remains local-only.

Consumers need Node `>=22.12.0` (required by Solid rc.19). If you use the Themes PostCSS plugins, also install `postcss@^8.5.9`; it is an optional peer.

The documentation website lives in the separate repository [`wsagency/radix2solid-web`](https://github.com/wsagency/radix2solid-web), which builds against a pinned commit of this repository.

## Created for WS Agency

<a href="https://ws.agency">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://ws.agency/brand/ws-vertical-white.svg">
    <img alt="WS Agency" src="https://ws.agency/brand/ws-vertical-color.svg" width="160">
  </picture>
</a>

This native Solid 2 port was created by [Kristijan Lukačin](https://github.com/klukacin) (@klukacin) for [WS Agency](https://ws.agency), the firm behind this project. The original Radix software remains the work of its upstream authors (see License). We love open source, enterprise development and AI. Have a project in mind? [Let’s build it together](https://ws.agency/contact).

The WS Agency name and logo are brand artwork excluded from the MIT license; see the [usage and license notes](https://design.ws.agency/docs/usage-and-licenses.md).

## Contributing

Report problems in [issues](https://github.com/wsagency/radix2solid/issues) and propose changes in [pull requests](https://github.com/wsagency/radix2solid/pulls). Credit follows the actual commit author (GitHub lists authors of commits on the default branch whose email is linked to their account). Add a `Co-authored-by: Name <email>` trailer only for a real person who contributed to that commit, with the email they want used. Collaborator access is a repository permission, not authorship credit.

## Local development

Use Node **24.21.0** and pnpm **11.5.0** (`.node-version`, `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
pnpm check
pnpm dev
```

Gallery: `http://127.0.0.1:4147/` for SSR/hydration, `/csr` for fresh client rendering. `pnpm --filter @radix-solid/gallery preview` serves the built production fixture, including extracted CSS. `pnpm test:consumer` packs the real native libraries, installs them under ignored `.artifacts/consumer` with independent node_modules and exact overrides, and runs server/type/graph/CSR/hydration checks. No workspace source alias is used there.

`pnpm lint` runs Oxlint with `eslint-plugin-solid` as a JS plugin, configured in `oxlint.config.ts` from the plugin's `v2-strict` preset (Solid 2.0 settings and rules). Any error or warning fails it. `pnpm format` rewrites files with Oxfmt using `.oxfmtrc.json`, and `pnpm format:check` only reports unformatted files. Generated icon sources are excluded.

## Native distribution and release gates

Exact current toolchain pins: `solid-js`, `@solidjs/web`, `@solidjs/signals`, `@solidjs/compiler` and `@solidjs/babel-plugin` **2.0.0-rc.19**; `@solidjs/vite-plugin` **3.0.0-next.52**; Vite **8.3.3**; TypeScript **7.0.2** for type checks and declaration emit, with `typescript5` (TypeScript **5.9.3**) for the consumer checks that use the compiler API; Playwright **1.64.0**; Radix Colors **3.0.0**. The runtime/compiler/Babel versions are pinned through workspace overrides. The workspace keeps pnpm's 24-hour `minimumReleaseAge` and exact-version exceptions for this rc.19/next.52 tuple until it ages. Source package version `0.1.0-rc.5` remains a separate, unpublished local candidate; these compatibility pins do not announce a package release.

`pnpm test:unit` runs the slider, splitter, calendar and file-drop unit tests. `pnpm test` runs those tests, the complete packed `pnpm test:consumer` suite and the full development Playwright suite; `pnpm check` runs `pnpm lint`, `pnpm format:check`, the build and typecheck before that complete test contract. CI runs the complete modes independently: `pnpm check:packed` lints, checks formatting, builds, typechecks, runs all four unit-test files and the unscoped all-package packed consumer checks; `pnpm check:dev` lints, checks formatting, builds, typechecks, runs those same unit tests and the full six-project Playwright suite, preserving existing skips. Both local `test` and `check:dev` use the shared `test:dev` command with empty `GALLERY_PACKED` and `GALLERY_PRODUCTION` values. `tests/consumer/coverage-manifest.json` maps public declarations/parts to retained family checks. Packed validation covers public declaration and runtime availability, CSS/plugin/SVG resolution and real selective-import bundle inspection. Family checks are not certification of every exported symbol or of actual assistive-technology speech.

The gallery is a static fixture: its animatable chart marks set `isAnimationActive={false}`, and only the `#chart-responsive` Trend line is the dedicated motion fixture for animation and reduced-motion checks. Otherwise, an incidental animation started before a test installs Playwright's fake clock keeps a real-time start and spins fake animation frames until fake time catches up, and each fake frame is slow in WebKit. Browser checks that need a scroll to finish wait for the native `scrollend` event (Chromium, Firefox and WebKit) instead of sampling positions, because WebKit animates keyboard scrolling. Hydration checks that hold client scripts first release them, wait for normal document load within the existing navigation/test budget, then wait for the gallery's `#refs` output to read `same host`. Module loading and evaluation use the existing navigation/test budget; the host-ref identity assertion and later checks such as `ResizeObserver` measurement retain the normal 5s assertion timeout.

Use native `class`, `for`, lowercase DOM attributes and `@solidjs/web` JSX types. Controlled props remain parent-authoritative. `asChild` takes a single-target factory, not a React element or a snapshot prop spread; native portals render no RC.13 server content and settle on the client. See the package migration notes for event cancellation, refs, owned effects, portal propagation and removed React-only helpers. Themes CSS is imported explicitly:

```tsx
import { Theme, Button } from "@wsagency/radix2solid-themes";

import "@wsagency/radix2solid-themes/styles.css";

export default function App() {
  return (
    <Theme>
      <Button>Save</Button>
    </Theme>
  );
}
```

Actual Announce and Toast/layer speech was exercised with isolated Orca/AT-SPI/Speech Dispatcher/eSpeak NG, not substituted with DOM/AX/axe output. This is not every-reader/platform or physical-device certification. Package namespace, domain and account ownership plus explicit release authorization are required before any npm publication; a Solid stable-version decision and a rerun of the same checks are required before any stable release.

## License

MIT, Copyright (c) 2026 Radix2Solid contributors, covering the project's code and the original `@wsagency/radix2solid-icons-extra` SVG artwork. Adapted and reused upstream software, including generator and helper code, keeps its original MIT copyright notices and full license texts (Radix Primitives, Icons and Themes: WorkOS; Radix Colors: Modulz, WorkOS and Radix; Charts: solid-recharts, Thomas Guehenneux, and Recharts); see [`LICENSE`](LICENSE) and each package's `LICENSE`. The Charts package's `NOTICE` reproduces the ISC licenses of its resolved D3 dependencies. No license grants rights to any trademark.
