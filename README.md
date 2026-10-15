# Radix2Solid

Native Solid 2 port of Radix Primitives, Radix Icons and Radix Themes, with released Radix Colors 3.0.0 reused unchanged, plus Charts, a Solid 2 port of the Recharts component model derived from solid-recharts, and Icons Extra, a separate package of original artwork. This is an independent, unofficial project: it is not affiliated with or endorsed by Radix, WorkOS, Modulz, Recharts or solid-recharts. The MIT license covers the project's code and its original package artwork; it grants no rights to those projects' names, logos or trademarks.

The five packages keep their native API under the `@wsagency` npm scope:

- `@wsagency/radix2solid-primitives` — native API and migration notes: [`packages/primitives/README.md`](packages/primitives/README.md)
- `@wsagency/radix2solid-icons` — all 332 generated icons, SVG download subpaths and Colors 3.0.0 reuse: [`packages/icons/README.md`](packages/icons/README.md)
- `@wsagency/radix2solid-icons-extra` — separate original 24-grid folder artwork, not part of the 332 upstream icons: [`packages/icons-extra/README.md`](packages/icons-extra/README.md)
- `@wsagency/radix2solid-themes` — all native Themes families, themed portals, ThemePanel, responsive styling, custom accents, percentage scaling, per-component and cascade-layer CSS: [`packages/themes/README.md`](packages/themes/README.md)
- `@wsagency/radix2solid-charts` — SVG charts that read Themes tokens, with `d3-scale` and `d3-shape` as external dependencies: [`packages/charts`](packages/charts)

**Source candidate `0.1.0-rc.3` — not yet published.** All five source packages share this version. Published `0.1.0-rc.2` remains unchanged and does not provide the new Combobox, Command, Tree, Splitter or extra-icons APIs. Consume builds from the implementation source and `pnpm pack` tarballs until DevOps publishes through the existing npm workflow; source availability is not npm availability. No implementation commit is claimed here before review/merge.

```sh
# From the reviewed source checkout, with pinned Node 24 and pnpm 11:
pnpm install --frozen-lockfile
pnpm build
pnpm --dir packages/primitives pack
pnpm --dir packages/icons-extra pack
```

Pack the other needed packages in the same way; install the resulting tarballs in your application and override Themes' primitives dependency to the same primitives tarball. Source-pinned website deployment is independent of npm publication. The eventual five-package release uses the `next` dist-tag, subject to release-maintainer authorization; first publication and Trusted Publisher configuration for icons-extra remain DevOps-owned.

Consumers need Node `>=22.12.0` (required by Solid rc.15). If you use the Themes PostCSS plugins, also install `postcss@^8.5.9`; it is an optional peer.

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

## Native distribution and release gates

Exact current pins: `solid-js`, `@solidjs/web`, `@solidjs/signals`, `@solidjs/compiler` and `@solidjs/babel-plugin` **2.0.0-rc.15**; `@solidjs/vite-plugin` **3.0.0-next.50**; Vite **8.3.3**; TypeScript **7.0.2** for type checks and declaration emit, with `typescript5` (TypeScript **5.9.3**) for the consumer checks that use the compiler API; Playwright **1.64.0**; Radix Colors **3.0.0**. The runtime/compiler/Babel versions are pinned through workspace overrides. The workspace keeps pnpm's 24-hour `minimumReleaseAge` and excepts only these exact rc.15/next.50 releases until they age. This is an RC port, not a Solid-stable compatibility promise.

`pnpm check` builds producers before consumers, compiles workspace types, runs the slider unit test, then independent packed and development browser scenarios in Chromium, Firefox and WebKit. `tests/consumer/coverage-manifest.json` maps public declarations/parts to retained family checks. Packed validation covers public declaration and runtime availability, CSS/plugin/SVG resolution and real selective-import bundle inspection. Family checks are not certification of every exported symbol or of actual assistive-technology speech.

The gallery is a static fixture: its animatable chart marks set `isAnimationActive={false}`, and only the `#chart-responsive` Trend line is the dedicated motion fixture for animation and reduced-motion checks. Otherwise, an incidental animation started before a test installs Playwright's fake clock keeps a real-time start and spins fake animation frames until fake time catches up, and each fake frame is slow in WebKit. Browser checks that need a scroll to finish wait for the native `scrollend` event (Chromium, Firefox and WebKit) instead of sampling positions, because WebKit animates keyboard scrolling. Hydration checks that hold client scripts first wait for the gallery's `#refs` output to read `same host` after release. Client bootstrap (loading and evaluating the scripts, then hydrating) can take several seconds on a loaded runner, so that wait uses the test's existing budget. Only later steps such as `ResizeObserver` measurement are held to the normal 5s assertion timeout.

Use native `class`, `for`, lowercase DOM attributes and `@solidjs/web` JSX types. Controlled props remain parent-authoritative. `asChild` takes a single-target factory, not a React element or a snapshot prop spread; native portals render no RC.13 server content and settle on the client. See the package migration notes for event cancellation, refs, owned effects, portal propagation and removed React-only helpers. Themes CSS is imported explicitly:

```tsx
import { Theme, Button } from '@wsagency/radix2solid-themes';
import '@wsagency/radix2solid-themes/styles.css';

export default function App() {
  return <Theme><Button>Save</Button></Theme>;
}
```

Actual Announce and Toast/layer speech was exercised with isolated Orca/AT-SPI/Speech Dispatcher/eSpeak NG, not substituted with DOM/AX/axe output. This is not every-reader/platform or physical-device certification. Package namespace, domain and account ownership plus explicit release authorization are required before any npm publication; a Solid stable-version decision and a rerun of the same checks are required before any stable release.

## License

MIT, Copyright (c) 2026 Radix2Solid contributors, covering the project's code and the original `@wsagency/radix2solid-icons-extra` SVG artwork. Adapted and reused upstream software, including generator and helper code, keeps its original MIT copyright notices and full license texts (Radix Primitives, Icons and Themes: WorkOS; Radix Colors: Modulz, WorkOS and Radix; Charts: solid-recharts, Thomas Guehenneux, and Recharts); see [`LICENSE`](LICENSE) and each package's `LICENSE`. The Charts package's `NOTICE` reproduces the ISC licenses of its resolved D3 dependencies. No license grants rights to any trademark.
