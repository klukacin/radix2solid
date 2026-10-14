# Native Radix icons for Solid 2

`@wsagency/radix2solid-icons` provides all 332 original icon names with native Solid 2 SVG props, events and refs. It requires `solid-js` and `@solidjs/web` **2.0.0-rc.13** as peers; no React runtime or cloning API. **Prepared candidate `0.1.0-rc.1` — not yet published**; it will be released under the npm `next` dist-tag. After publication: `pnpm add @wsagency/radix2solid-icons@0.1.0-rc.1`; until then consume a `pnpm pack` tarball.

```tsx
import { CheckIcon } from '@wsagency/radix2solid-icons';
import GitHubLogoIcon from '@wsagency/radix2solid-icons/GitHubLogoIcon';

<CheckIcon size={24} title="Saved" color="tomato" />;
<GitHubLogoIcon aria-label="GitHub" ref={svg => svg?.getScreenCTM()} />;
```

Each public deep icon entry supports both `import GitHubLogoIcon from '@wsagency/radix2solid-icons/GitHubLogoIcon'` and `import { GitHubLogoIcon } from '@wsagency/radix2solid-icons/GitHubLogoIcon'`, matching the original named/default contract. Deep imports are limited to the 332 icon entries and original SVG asset subpaths; title/type/index chunks are implementation details.

Defaults: 15×15, `viewBox="0 0 15 15"`, `currentColor` geometry. `size` sets both dimensions; explicit native `width`, `height`, `viewBox`, class/style and other outer props retain precedence. `color` sets the original currentColor fills; inherited CSS color works when it is omitted. Native SVG stroke props remain available.

Icons without a nonempty `title`, `aria-label` or `aria-labelledby` are decorative (`aria-hidden="true"`). Named icons default to `role="img"`; explicit native role/ARIA props take precedence. `title` creates a real namespaced SVG title, including fresh client rendering and reactive changes. Geometry children are generated, not consumer JSX. Refs receive the native SVG element and the native cleanup notification. Mask IDs are per-instance and SSR/hydration stable.

Original downloadable assets are exported unchanged at `@wsagency/radix2solid-icons/icons/<asset-name>.svg`; e.g. `@wsagency/radix2solid-icons/icons/accessibility.svg`. A Vite consumer can import `...?url` and use a native `<a download="accessibility.svg">`.

## Regeneration

```sh
pnpm --filter @wsagency/radix2solid-icons generate
pnpm --filter @wsagency/radix2solid-icons build
```

`icons/*.svg` and the authoritative `icons.json` name map are checked in. The Node 24 generator uses only local inputs and stdlib; it does not require `upstream/`, Figma, a token, React/Ink or an SVG optimizer. It validates the complete name/asset/generated-file bijection. Edit the assets/map, then regenerate; do not hand-edit wrappers. Compound/logo casing is preserved, including IconJar, GitHub, CodeSandbox and LinkedIn. Client/server ESM and native declarations use real export paths, not upstream's `dist/csj` typo.

## Colors reuse and attribution

The workspace consumes the released **`@radix-ui/colors@3.0.0`** directly, not a Solid Colors fork. JavaScript sRGB/P3/alpha/dark scales and original flat CSS paths such as `@radix-ui/colors/blue.css`, `blue-dark.css`, `blue-alpha.css` and `blue-dark-alpha.css` are available from that released package. Its exports differ from current reference-source publishConfig; do not rebuild the reference source as an equivalent replacement. Native gallery production HTML links extracted CSS under its existing CSP.

Original SVG assets: MIT, copyright © 2022 WorkOS, retained unchanged in `LICENSE` together with the Radix2Solid contributors' 2026 notice. Reused Colors: MIT, copyright © 2021 Radix, as published in `@radix-ui/colors@3.0.0`; the Themes package `LICENSE` reproduces it in full. This project is not an official Radix package and the MIT license grants no trademark rights.
