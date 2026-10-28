# Changelog

Registry status before rc.5 publication (2026-10-26): `0.1.0-rc.4` is published under the `next` dist-tag. The versioned rc.5 prerelease notes follow; earlier entries retain their historical preparation-time wording.

## Local compatibility note — 2026-10-28 (unpublished; not a package release)

- The source tree targets Solid rc.19 and Vite plugin next.52; package version `0.1.0-rc.5` remains a separate unpublished local candidate. This note does not change the rc.5 release record or establish npm availability.


## 0.1.0-rc.5

- Make the folder icon package's generated source lint-clean without changing the icon assets or public API.
- Add oxlint/oxfmt checks; no runtime/API change.

## 0.1.0-rc.4

- No icon, API or asset changes from rc.3; advance the package version with the five-package prerelease.

## 0.1.0-rc.3 — prepared candidate, not yet published

- First release: native Solid 2 `FolderIcon` and `FolderOpenIcon`. The `@wsagency/radix2solid-icons` build-time generator produces them from two original 24-unit stroked SVG assets made for this package (see README "Artwork" for who created them). Same props, accessibility, ref/event, root/deep import and raw SVG subpath contract as `@wsagency/radix2solid-icons`; default size 15. Exact `solid-js`/`@solidjs/web` `2.0.0-rc.15` peers and no dependencies.
