# Radix2Solid

Native Solid 2 port of Radix Primitives, Radix Icons and Radix Themes, with released Radix Colors 3.0.0 reused unchanged. This is an independent, unofficial project: it is not affiliated with or endorsed by Radix, WorkOS or Modulz. The MIT license covers the code only and grants no rights to their names, logos or trademarks.

The three workspace packages keep their `@radix-solid/*` names and API:

- `@radix-solid/primitives` — native API and migration notes: [`packages/primitives/README.md`](packages/primitives/README.md)
- `@radix-solid/icons` — all 332 generated icons, SVG download subpaths and Colors 3.0.0 reuse: [`packages/icons/README.md`](packages/icons/README.md)
- `@radix-solid/themes` — all native Themes families, themed portals, ThemePanel, responsive styling and all 40 CSS outputs: [`packages/themes/README.md`](packages/themes/README.md)

All three are private workspace packages at version `0.0.0-local`. Nothing is published to npm and no package namespace is claimed; use `pnpm pack` tarballs to consume them. The documentation website lives in the separate repository [`klukacin/radix2solid-web`](https://github.com/klukacin/radix2solid-web), which builds against a pinned commit of this repository.

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

Report problems in [issues](https://github.com/klukacin/radix2solid/issues) and propose changes in [pull requests](https://github.com/klukacin/radix2solid/pulls). Credit follows the actual commit author (GitHub lists authors of commits on the default branch whose email is linked to their account). Add a `Co-authored-by: Name <email>` trailer only for a real person who contributed to that commit, with the email they want used. Collaborator access is a repository permission, not authorship credit.

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

Exact current pins: `solid-js`, `@solidjs/web`, `@solidjs/signals`, `@solidjs/compiler` and `@solidjs/babel-plugin` **2.0.0-rc.13**; `@solidjs/vite-plugin` **3.0.0-next.35**; Vite **8.3.3**; TypeScript **6.0.2**; Playwright **1.64.0**; Radix Colors **3.0.0**. The runtime/compiler/Babel versions are pinned through workspace overrides. This is an RC port, not a Solid-stable compatibility promise.

`pnpm check` builds producers before consumers, compiles workspace types, runs the slider unit test, then independent packed and development browser scenarios in Chromium, Firefox and WebKit. `tests/consumer/coverage-manifest.json` maps public declarations/parts to retained family checks. Packed validation covers public declaration and runtime availability, CSS/plugin/SVG resolution and real selective-import bundle inspection. Family checks are not certification of every exported symbol or of actual assistive-technology speech.

Use native `class`, `for`, lowercase DOM attributes and `@solidjs/web` JSX types. Controlled props remain parent-authoritative. `asChild` takes a single-target factory, not a React element or a snapshot prop spread; native portals render no RC.13 server content and settle on the client. See the package migration notes for event cancellation, refs, owned effects, portal propagation and removed React-only helpers. Themes CSS is imported explicitly:

```tsx
import { Theme, Button } from '@radix-solid/themes';
import '@radix-solid/themes/styles.css';

export default function App() {
  return <Theme><Button>Save</Button></Theme>;
}
```

Actual Announce and Toast/layer speech was exercised with isolated Orca/AT-SPI/Speech Dispatcher/eSpeak NG, not substituted with DOM/AX/axe output. This is not every-reader/platform or physical-device certification. Package namespace, domain and account ownership plus explicit release authorization are required before any npm publication; a Solid stable-version decision and a rerun of the same checks are required before any stable release.

## License

MIT, Copyright (c) 2026 Radix2Solid contributors. Adapted and reused upstream software keeps its original MIT copyright notices and full license texts (Radix Primitives, Icons and Themes: WorkOS; Radix Colors: Modulz, WorkOS and Radix); see [`LICENSE`](LICENSE) and each package's `LICENSE`.
