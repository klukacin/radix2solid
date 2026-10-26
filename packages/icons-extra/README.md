# Extra native icons for Solid 2

`@wsagency/radix2solid-icons-extra` adds icons that Radix Icons does not have, drawn for this project. They are not a Radix port and not part of the 332 icons in [`@wsagency/radix2solid-icons`](https://github.com/wsagency/radix2solid/tree/main/packages/icons#readme), but they have the same props and import shapes. It requires `solid-js` and `@solidjs/web` **2.0.0-rc.15** as peers (Node `>=22.12.0`) and has no dependencies, including on the original icons package.

This README describes prerelease `@wsagency/radix2solid-icons-extra@0.1.0-rc.5`. Install the exact version with:

```sh
pnpm add -E @wsagency/radix2solid-icons-extra@0.1.0-rc.5 solid-js@2.0.0-rc.15 @solidjs/web@2.0.0-rc.15
```

For source-checkout development, packing a local tarball is an optional alternative.

## Exports

| Export           | Asset                   |
| ---------------- | ----------------------- |
| `FolderIcon`     | `icons/folder.svg`      |
| `FolderOpenIcon` | `icons/folder-open.svg` |

The root also exports the `IconProps` type.

```tsx
import { FolderIcon, type IconProps } from "@wsagency/radix2solid-icons-extra";
import FolderOpenIcon from "@wsagency/radix2solid-icons-extra/FolderOpenIcon";
import folderSvg from "@wsagency/radix2solid-icons-extra/icons/folder.svg?url";

<FolderIcon
  title="Project files"
  color="tomato"
/>;
<FolderOpenIcon
  size={24}
  ref={(svg) => svg?.getScreenCTM()}
  onClick={() => {}}
/>;
<a
  href={folderSvg}
  download="folder.svg"
>
  Download
</a>;
```

Each deep icon entry supports both the default and the named import (`import { FolderOpenIcon } from '@wsagency/radix2solid-icons-extra/FolderOpenIcon'`). Deep imports are limited to the icon entries and the original SVG subpaths `@wsagency/radix2solid-icons-extra/icons/<asset>.svg`, which are exported unchanged.

## Props and accessibility

- Defaults: 15×15 on a `viewBox="0 0 24 24"` grid, root `fill="none"`, `currentColor` strokes. `size` sets both dimensions; explicit native `width`, `height`, `viewBox`, class/style and other outer props take precedence.
- `color` sets the strokes; inherited CSS color applies when it is omitted.
- Icons without a nonempty `title`, `aria-label` or `aria-labelledby` are decorative (`aria-hidden="true"`). Named icons default to `role="img"`; explicit native role/ARIA props take precedence. `title` creates a real namespaced SVG `<title>`, including fresh client rendering and reactive changes.
- Refs and events reach the native SVG element. Geometry is generated; `children` is not accepted.

No bundle size has been measured for this package.

## Regeneration

```sh
pnpm --filter @wsagency/radix2solid-icons-extra generate
pnpm --filter @wsagency/radix2solid-icons-extra build
```

`icons/*.svg` and the authoritative `icons.json` map are checked in. `generate` runs the original package's build-time generator (`node ../icons/scripts/generate.ts .`), which also writes byte copies of its `IconProps` and title helpers into `src/`. That workspace path is used only at build time; the published files do not refer to the original package.

## Artwork

Both assets (`folder.svg`, `folder-open.svg`) were created for this package by an AI coding agent: Claude by Anthropic (model `anthropic/claude-opus-5-5`, run in the omp coding harness), as hand-written SVG path data during implementation of the next-suite specification. They were not traced or derived from Radix Icons, another icon set, an existing application's inline icons, or brand artwork. No human drew them. They were added in commit `8e8de79ad38c23472bef74f552dc24e8b6484c93`; `git log --diff-filter=A -- packages/icons-extra/icons/folder.svg` returns it.

## License

MIT; see `LICENSE`. The artwork and new code use the project notice (Radix2Solid contributors, 2026). The reused icon component API shape keeps the original Radix Icons MIT notice (WorkOS, 2022); no Radix Icons artwork is included. The license grants no trademark rights, and the package contains no WS Agency marks.
