# Native Solid 2 Themes

Native fork, not an official Radix product. This README describes prerelease `@wsagency/radix2solid-themes@0.1.0-rc.4`, which introduces the Calendar, DatePicker and FileDrop Themes families. Install the exact version with `pnpm add -E @wsagency/radix2solid-themes@0.1.0-rc.4`. This remains a Solid `2.0.0-rc.15` prerelease. The approved one-time `latest` target for the existing rc.4 publication is `0.1.0-rc.4`. npm dist-tags are mutable: `latest` selects unqualified install resolution, not semver stability. The `-E` command above remains pinned to this exact prerelease regardless of tag changes. Future prerelease publications continue to use `next`. Combobox, Command, Tree and Splitter remain native primitive APIs, not Themes exports; source-checkout packing is an optional development alternative.

Solid `2.0.0-rc.15` and `@solidjs/web` `2.0.0-rc.15` are peers; they require Node `>=22.12.0`. Browser export conditions select native client ESM; the default selects native server ESM. Declarations are shared. No React runtime, React types or element-cloning compatibility layer.
CSS imports use the application's bundler declarations, e.g. `vite/client` with Vite; TypeScript alone does not define stylesheet modules.

Calendar, DatePicker and FileDrop are new project extensions introduced in the rc.4 release and absent from rc.3. The rc.4 API exports the `Calendar`, `DatePicker` and `FileDrop` namespaces from the package root and `@wsagency/radix2solid-themes/components/{calendar,date-picker,file-drop}`. Their roots accept responsive `size: '1' | '2' | '3'`; Calendar and DatePicker variants are `surface | classic | soft`, while FileDrop variants are `surface | soft | outline`. They also follow existing color, radius, Theme propagation (including portals), dark mode, RTL, custom accent and local scaling patterns. For source-checkout development, pack Primitives and Themes from the same checkout and configure Themes' transitive Primitives dependency to the same physical Primitives tarball.

For the full CSS entry, import `@wsagency/radix2solid-themes/styles.css`. Selective CSS uses the same pipeline as existing components: tokens (`tokens/base.css` plus the palettes used, or `tokens.css`), `css/common.css`, the component stylesheet(s), then `css/utilities.css`. The rc.4 release provides `css/calendar.css`, `css/date-picker.css` and `css/file-drop.css`, each with a `.layer.css` sibling; these paths were introduced in rc.4 and are absent from rc.3. Calendar-only styling needs only `css/calendar.css`; DatePicker's stylesheet closure includes Calendar and Popover but not Button; FileDrop needs only `css/file-drop.css`. Use layered or unlayered copies consistently and never import both.

The rc.4 release exports Calendar parts `Root`, `Header`, `Heading`, `PrevTrigger`, `NextTrigger`, `Grid`, `Row`, `HeaderCell`, `Cell` and `Day`; DatePicker parts `Root`, `Trigger`, `Value`, `Portal`, `Content`, `Title`, `Description`, `Close`, `Clear`, `Calendar` and `FormControl`; and FileDrop parts `Root`, `Input` and `Trigger`. Each namespace also exports its scope creator and public part-prop types. These are real themed component exports with native Solid parts/props, not CSS-only recipes. The themed `DatePicker.Portal` is client-only and renders no server children; SSR content guidance follows below.

## Usage

```tsx
import {
  Theme,
  Button,
  Box,
  Heading,
  Text,
  Skeleton,
} from "@wsagency/radix2solid-themes";
import { createSignal } from "solid-js";

import "@wsagency/radix2solid-themes/styles.css";

function Example() {
  const [loading, setLoading] = createSignal(false);
  const size = Object.freeze({ md: "3" as const });
  return (
    <Theme
      appearance="light"
      accentColor="indigo"
      radius="medium"
    >
      <Heading>Native theme</Heading>
      <Text as="p">Responsive CSS and live props.</Text>
      <Button
        size={size}
        loading={loading()}
        onClick={() => setLoading(true)}
      >
        Save
      </Button>
      <Button onClick={() => setLoading(false)}>Finish</Button>
      <Box
        asChild
        width={{ initial: "160px", md: "240px" }}
      >
        {(target) => target("article", { children: "One native host" })}
      </Box>
      <Skeleton
        asChild
        loading={loading()}
      >
        {(target) => target("button", { children: "Pending action" })}
      </Skeleton>
    </Theme>
  );
}
```

Responsive objects are never mutated, including when an enum needs its initial default. Existing class/data contracts, negative spacing classes and arbitrary-value CSS variables are retained. Native `class` can be an array; use `class`, not React `className`. Consumer styles override generated responsive variables. Thresholds remain `xs=520px`, `sm=768px`, `md=1024px`, `lg=1280px`, `xl=1640px`.

`asChild` takes one **target factory**, not an already-created JSX element or a prop-bag spread. Request and return exactly one target. For live factory attributes use getters, e.g. `get href() { return destination(); }`; snapshot spreading/destructuring reactive views loses updates. Custom components must forward native props/ref to their intended host. `Slot`/`Slottable` use the same contract as `@wsagency/radix2solid-primitives`; see its migration guide.

## Theme settings and rendering

`useThemeContext()` must run inside Theme. Its live appearance/accent/gray/panel/radius/scaling values and change handlers are available to child components. Root handlers change root settings; incoming reactive props remain synchronized. Nested Theme inherits the parent's **resolved** gray even when its own accent changes, unless it explicitly requests `grayColor="auto"`. Nested change handlers are read-only, as upstream; settings controls must capture the root context rather than a nested presentation Theme. An explicit nested light/dark appearance creates its own background.

Server rendering uses initial Theme metadata without allocating client synchronization effects. Initial SSR and client props must agree; browser-only preferences should settle after hydration. Server memos describe one render, not subsequent client reactivity.

### Custom accents and percentage scaling

`accentColor="custom"` with `customAccent="<id>"` (a letter, then letters, digits, `_` or `-`) uses a palette you supply. Every physical Theme root, including themed portal roots, carries `data-custom-accent="<id>"`. Define the complete light and dark sets of the 28 tokens (`--custom-1`…`--custom-12`, `--custom-a1`…`--custom-a12`, `--custom-contrast`, `--custom-surface`, `--custom-indicator`, `--custom-track`) yourself, generated ahead of time rather than during render:

```css
.radix-themes[data-custom-accent="calm"] {
  /* light tokens */
}
.radix-themes[data-custom-accent="calm"]:is(.dark, .dark-theme),
:is(.dark, .dark-theme)
  .radix-themes[data-custom-accent="calm"]:not(.light, .light-theme) {
  /* dark tokens */
}
```

Color props accept `"custom"`. With `grayColor="auto"`, a custom accent resolves to `gray`; an omitted nested gray still inherits the parent's resolved gray.

`scaling` accepts the preset values or any positive finite `` `${number}%` `` (for example `"115%"`). Nested scaling is absolute, not multiplied: `<Theme scaling="90%">` inside `<Theme scaling="120%">` renders at 90%. Unitless numbers are rejected and values are not clamped. A caller `style` may override `--scaling` locally, but that does not propagate as a Theme setting.

The public `Portal` preserves native portal lifecycle: no server children; client mounting after hydration settles. It does **not** copy ancestor Theme CSS attributes onto physically relocated DOM. Wrap relocated presentation in Theme when needed. For initially-open `DatePicker` content that must be present in SSR with stable hydration node identity, render `DatePicker.Content` inline on both server and client without `DatePicker.Portal`; do not use an SSR portal fallback or adaptively switch between inline and portal hosts.

## Presentational components

Exports include all 58 component entry modules and 18 compound namespaces. Presentational families retain Theme/context; Slot/Slottable; AccessibleIcon, AspectRatio, Portal, VisuallyHidden and four Themes icons; Box, Container, Flex, Grid, Inset, Section, Reset; Text, Heading, Link, Blockquote, Code, Em, Kbd, Quote, Strong; Avatar, Badge, Button, IconButton, Card, Callout, DataList, Progress, Separator, Skeleton, Spinner and Table. ScrollArea is also available and backs Table.

- Button/IconButton keep one child tree and host while loading. Visual content hides without removing the accessible name or dimensions; loading supplies disabled unless explicitly overridden. Spinner is decorative inside a loading button.
- Skeleton can pass ordinary content through when not loading. Its explicit factory composition keeps one host, applies inert/ARIA/tabindex/loading styles only while active, and removes them on completion.
- Avatar image attributes/ref target the actual image; class/style target the root. Failed images fall back and can recover on a new source.
- ScrollArea ref targets the viewport; class/style target the outer root. Its native direction and both-axis scrolling are retained. Viewports are keyboard-focusable by default; an explicit `tabindex` overrides that default.
- Callout has Root/Icon/Text; DataList has Root/Item/Label/Value; Table has Root/Header/Body/Row/Cell/ColumnHeaderCell/RowHeaderCell. Table keeps real table semantics and header scopes. Callout.Text uses a paragraph host.
- Native attribute spellings apply, including label `for` and lowercase input attributes.

## Interactive components and ThemePanel

Inputs/collections include Checkbox, CheckboxGroup, CheckboxCards, Radio, RadioGroup, RadioCards, SegmentedControl, Select, Slider, Switch, TextArea, TextField, Tabs and TabNav. CheckboxCards shares CheckboxGroup's array-selection engine; controlled requests do not bypass parent refusal. Native Radio retains browser same-name/form behavior. TextField ref targets its input while class/style decorate the outer root; slots preserve caret placement without intercepting interactive descendants. Slider thumb identity follows index when values change. Tabs and menu items accept rich native content.

Give Select triggers and single-thumb Sliders a meaningful accessible name. Native Slider applies `aria-label`/`aria-labelledby` to its interactive thumbs rather than its decorative root; unlabeled multiple thumbs retain the primitive's minimum/maximum names. This corrects the reference wrapper's missing thumb-label forwarding.

Dialog, AlertDialog, Popover, HoverCard, Tooltip, Select, DropdownMenu and ContextMenu consume native primitives. Dialog and AlertDialog remain always modal; no `modal={false}` extension. Trigger/close/anchor composition uses the native target factory:

```tsx
<Dialog.Root>
  <Dialog.Trigger>
    {(target) => target(Button, { children: "Open dialog" })}
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Settings</Dialog.Title>
    <Dialog.Description>Update your preferences.</Dialog.Description>
    <Dialog.Close>
      {(target) => target(Button, { children: "Close" })}
    </Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
```

Dialog and AlertDialog use the primitives' Root-allocated title/description links. Custom part IDs require matching explicit Content `aria-labelledby`/`aria-describedby`; omit an optional Description with `aria-describedby={undefined}`. A nonblank Content `aria-label` replaces the automatic title link; explicit relationship keys, including undefined opt-outs, take precedence. Themes Popover has no Title/Description parts and defaults both relationships to undefined: provide a meaningful `aria-label` or explicit `aria-labelledby`, and an explicit `aria-describedby` when appropriate. Caller relationships override those wrapper defaults. If composing primitive Title/Description parts inside Themes Popover, give them custom IDs and matching explicit Content relationships. See the primitives README's rc.2 naming migration for conditional parts and ID changes.

Import `Dialog` alongside `Theme` and `Button`; render the example inside Theme. Tooltip is a flat component with required `content` and a target factory child, not a React element.

Themed overlay content recreates Theme on its physical portal root, including custom containers, submenus and live settings. Changing nested accent alone inherits resolved gray; explicitly request `grayColor="auto"` for a new match. Responsive submenu alignment reads actual CSS padding and follows viewport width and scaling; it does not numerically coerce responsive objects.

ThemePanel controls the captured root settings despite its own medium-radius/100% preview. `T` toggles it and restores focus; modifier keys, editable targets, non-radio/checkbox text inputs, select/textarea and menu/listbox/combobox targets are excluded. Inherited appearance observes html/body light/dark classes; an `onAppearanceChange` callback can own that switch. Copy Theme writes the non-default configuration to the clipboard and reports failures. Standalone content/type remain exported as `unstable_ThemePanelContent`/`unstable_ThemePanelContentProps` at the package root and `ThemePanelContent`/`ThemePanelContentProps` from `components/theme-panel`.

Keyless document events are ignored. Native `inert` reflects whether panel interaction is disabled, and inherited factory refs keep their child-first precedence. Panel spacing uses the original layout gap; modal scrollbar removal retains the upstream fixed-edge placement.

## CSS, props and plugins

All 40 upstream CSS outputs are emitted: `styles.css`, `components.css`, `utilities.css`, `tokens.css`, `tokens/base.css`, 31 `tokens/colors/*.css` files, and `layout.css`, `layout/tokens.css`, `layout/components.css`, `layout/utilities.css`. CSS is marked as a package side effect. Released `@radix-ui/colors@3.0.0` is reused unchanged.

Per-component CSS replaces `styles.css` with four groups, imported in this order: tokens (`tokens/base.css` plus every palette file you use, or `tokens.css`), then `css/common.css` (reset, animations, layout, Skeleton and Text rules), then `css/<component>.css` for each component you use, then `css/utilities.css` (Theme root and forced-colors rules plus the responsive utility classes). A component file holds only its own rules and those of the components it renders (a loading Button includes Spinner; menus include ScrollArea). `common.css` and `utilities.css` are required. Leaving one out raises no error, but the page loses the reset, layout and typography rules, or the forced-colors and responsive styles. `css/theme.css` is not needed when `css/utilities.css` is imported. For eight components measured with Lightning CSS 1.33.0, using the gray/jade/sage palettes, the per-component imports came to 369,971 B minified (39,862 B gzip, 23,273 B Brotli) against 608,460 B (58,063 B gzip, 34,658 B Brotli) for the same palettes with `components.css` and `utilities.css`. `styles.css` with all tokens is 702,487 B (82,822 B gzip, 50,321 B Brotli). Every CSS file also has a `.layer.css` sibling wrapped in `@layer radix` (`styles.layer.css`, `tokens/base.layer.css`, `css/common.layer.css`, `css/button.layer.css`, …); the layered imports measure within 1% of these sizes. Use one mode consistently and never import both copies of a file. All files are compiled; none needs PostCSS.

Intentional accessibility CSS differences: Select placeholders use step-11 foregrounds without reduced opacity. Forced-color mode uses system-color control boundaries, selected markers and keyboard focus outlines instead of shadows or fixed palette backgrounds; native colors are not disabled globally. Original classes, sizing, layout and palette data remain unchanged outside these corrections.

Loading labels remain accessible but visually transparent even in forced colors; Spinner leaves use native `CanvasText` so both light and dark system palettes remain visible. These corrections do not change ordinary palette geometry or animation.

Public `components/*`, `helpers` and `props` subpaths select the same native browser/server conditions and declarations. All 50 component prop modules are available as `components/<name>.props`; pure metadata sources use `.ts` internally, with unchanged `.js` public imports. React-only subtree/element-inspection helpers are intentionally removed.

Compound component subpaths expose their upstream short parts and Props, not accidental long-form implementation exports. `components/index`, `components/checkbox-group.primitive`, `components/_internal/*` and private icon implementation paths are not public APIs. The public props `breakpoints` value retains the upstream ordered readonly-array contract; internal extraction continues using its existing Set.

`postcss-breakpoints` and `postcss-whitespace` support both ESM imports and CommonJS requires, including explicit `.js`/`.cjs` subpaths. Breakpoint assets resolve relative to the installed plugin, not caller cwd. The original import/nesting/breakpoint/custom-media/selector-combination/empty-rule/whitespace/autoprefixer processing order is retained. `postcss` is an optional peer (`^8.5.9`): install it (`pnpm add -D postcss@^8.5.9`) only if you use these plugins.

The rc.4 packed Themes manifest resolves `@wsagency/radix2solid-primitives` to exactly `0.1.0-rc.4`. In a source workspace, the manifest remains `workspace:*`; for local source-checkout tarballs only, override Themes' transitive Primitives dependency to the same packed primitives file used by the direct dependency. The repository's independent consumer runner pins content-addressed tarballs, not workspace source aliases. Published rc.2 remains untouched.

## Attribution

Adapted from the read-only Radix Themes snapshot. Visual comparisons use that actual React source, not an older released package's differing ThemePanel markup, with the retained CSS pipeline and documented accessibility corrections. Original geometry and MIT attribution are retained; Copyright (c) 2023 WorkOS. See `LICENSE`.
