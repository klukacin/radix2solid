# Changelog

## Unreleased

- Add Calendar, DatePicker and FileDrop source namespaces and component-specific CSS (including cascade-layer variants). They remain unpublished project extensions and are not available from registry `0.1.0-rc.3`.

## 0.1.0-rc.3 — source candidate, not yet published

- Align the packed primitives dependency with the five-package rc.3 source suite. Existing Themes wrappers and public behavior remain unchanged; new UI families are primitive APIs styled by consumers.
- Publication remains release-maintainer controlled; source-pinned use does not imply npm availability.

## 0.1.0-rc.2 — prepared candidate, not yet published

- Require exactly `solid-js` and `@solidjs/web` `2.0.0-rc.15` as peers (was `2.0.0-rc.13`); Solid rc.15 requires Node `>=22.12.0`. Depend on `@wsagency/radix2solid-primitives` packed as exactly `0.1.0-rc.2`.
- Follow the primitives' breaking root-owned Dialog/AlertDialog naming contract: explicit Content ARIA replaces default links, custom part IDs require matching relationships, and optional descriptions use an explicit undefined opt-out. Themes Popover exposes no Title/Description parts, so its shared Content wrapper defaults both relationships to undefined while preserving caller labels and explicit links; ThemePanel's help popover supplies its own meaningful label.
- Custom accents: `accentColor="custom"` with `customAccent="<id>"` (letters, digits, `_` and `-`, starting with a letter). Every physical Theme root, including portals, emits `data-custom-accent`; you supply the complete light and dark `--custom-*` palette under `.radix-themes[data-custom-accent='<id>']`. Color props accept `"custom"`. With `grayColor="auto"` a custom accent resolves to `gray`.
- Percentage scaling: `scaling` also accepts any positive finite `` `${number}%` ``. Each nested Theme's scaling is absolute, not multiplied by its parent's. Preset values are unchanged.
- Per-component CSS: import the tokens (`tokens/base.css` plus the palette files you use, or `tokens.css`), then `css/common.css` (reset, animations, layout, Skeleton and Text), then `css/<component>.css` for each component you use, then `css/utilities.css` (Theme root and forced-colors rules plus responsive utilities). Component files hold only their own and composed components' rules. `common.css` and `utilities.css` are required; leaving one out raises no error but drops those styles.
- Cascade layers: every CSS file has a `.layer.css` sibling that wraps it in `@layer radix` (`styles.layer.css`, `tokens/base.layer.css`, `css/common.layer.css`, `css/button.layer.css`, …). Use one mode consistently and never import both copies of a file. The existing unlayered paths are unchanged.
- **Migration:** `postcss` is now an optional peer (`^8.5.9`) instead of a dependency. If you use the `postcss-breakpoints` or `postcss-whitespace` plugins, run `pnpm add -D postcss@^8.5.9`. JS and compiled CSS consumers need nothing.
- Declarations are emitted by TypeScript 7.0.2; the packed consumer checks use TypeScript 5.9.3.

## 0.1.0-rc.1 — prepared candidate, not yet published

- Rename the package from `@radix-solid/themes` to `@wsagency/radix2solid-themes`; component, helpers, props, CSS and PostCSS plugin subpaths are unchanged under the new name.
- Depend on `@wsagency/radix2solid-primitives` (packed as exactly `0.1.0-rc.1`) instead of `@radix-solid/primitives`, keeping it external in the build.
- Prepare public npm metadata for release under the `next` dist-tag; the Solid `2.0.0-rc.13` peers are unchanged.

## 0.0.0-local

- Native Solid 2 Theme/context, Foundation/Layout/Typography/Visual families, all compound presentational parts, four Themes icons and viewport-ref ScrollArea; no React runtime or type bridge.
- Live responsive helpers preserve enum/default/negative/arbitrary-value behavior without mutating frozen inputs. Native factory composition, consumer-style precedence and resolved-gray inheritance retained.
- Single-host loading buttons preserve accessible names/dimensions and explicit disabled overrides; Skeleton releases inert/hidden/tabindex attributes, Avatar recovers image errors and Table preserves semantic header scopes.
- Native browser/server ESM and declarations, all 50 component prop modules, all 40 original CSS outputs, CSS side effects and cwd-independent ESM/CJS PostCSS plugins.
- SSR-safe optional Theme context and client-only synchronization avoid server owner allocation/hydration-key drift. Isolated consumers resolve the unpublished native dependency from the exact primitives tarball.
- Complete native interactive inputs/collections, shared CheckboxGroup/CheckboxCards selection, all themed overlays/compound parts and ThemePanel including root settings, keyboard/focus, inherited appearance and clipboard behavior.
- Physical themed portals retain live settings and explicit nested light/dark/auto-gray behavior; CSS-driven responsive submenu alignment follows breakpoints and scaling.
- Shared native Popper coalesces geometry updates into owned animation frames; state change callbacks use untracked notification scope. Kbd retains the upstream reset on composed button hosts.
- Retain WorkOS MIT attribution and reuse released Radix Colors 3.0.0 without rewriting its neutral package.
- Restore `Root` on Slot and VisuallyHidden component subpaths by reusing the native primitive exports.
- Apply Slider accessible labels to its interactive thumbs, retaining index-stable keyboard interaction and primitive fallback names.
- Use readable step-11 Select placeholder foregrounds rather than muted/translucent reference colors.
- Preserve forced-color input/selection boundaries, checkbox/radio marks, slider ranges and keyboard focus with system colors, without a global forced-color opt-out.
- Restore ordered public breakpoint-array semantics and exact upstream compound exports; block private implementation subpaths without compatibility shims.
- Preserve ThemePanel keyless-event handling, native inert state, original gap and child-first inherited ref precedence.
- Keep loading labels visually hidden and accessible in forced colors; paint Spinner leaves with CanvasText in light/dark system palettes.
- Include the complete reused Radix Colors MIT notice in the distributed Themes license.
- Publish source in the public repository with a Radix2Solid contributors MIT notice; original Radix MIT copyright notices and texts are retained in the distributed `LICENSE`.
