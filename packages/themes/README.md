# Native Solid 2 Themes

Local-only native fork. Not an official Radix product. This private `0.0.0-local` package must not be published without the separate ownership/review/release gates.

Solid `2.0.0-rc.13` and `@solidjs/web` `2.0.0-rc.13` are peers. Browser export conditions select native client ESM; the default selects native server ESM. Declarations are shared. No React runtime, React types or element-cloning compatibility layer.
CSS imports use the application's bundler declarations, e.g. `vite/client` with Vite; TypeScript alone does not define stylesheet modules.


## Usage

```tsx
import { createSignal } from 'solid-js';
import { Theme, Button, Box, Heading, Text, Skeleton } from '@radix-solid/themes';
import '@radix-solid/themes/styles.css';

function Example() {
  const [loading, setLoading] = createSignal(false);
  const size = Object.freeze({ md: '3' as const });
  return <Theme appearance="light" accentColor="indigo" radius="medium">
    <Heading>Native theme</Heading>
    <Text as="p">Responsive CSS and live props.</Text>
    <Button size={size} loading={loading()} onClick={() => setLoading(true)}>Save</Button>
    <Button onClick={() => setLoading(false)}>Finish</Button>
    <Box asChild width={{ initial: '160px', md: '240px' }}>
      {target => target('article', { children: 'One native host' })}
    </Box>
    <Skeleton asChild loading={loading()}>
      {target => target('button', { children: 'Pending action' })}
    </Skeleton>
  </Theme>;
}
```

Responsive objects are never mutated, including when an enum needs its initial default. Existing class/data contracts, negative spacing classes and arbitrary-value CSS variables are retained. Native `class` can be an array; use `class`, not React `className`. Consumer styles override generated responsive variables. Thresholds remain `xs=520px`, `sm=768px`, `md=1024px`, `lg=1280px`, `xl=1640px`.

`asChild` takes one **target factory**, not an already-created JSX element or a prop-bag spread. Request and return exactly one target. For live factory attributes use getters, e.g. `get href() { return destination(); }`; snapshot spreading/destructuring reactive views loses updates. Custom components must forward native props/ref to their intended host. `Slot`/`Slottable` use the same contract as `@radix-solid/primitives`; see its migration guide.

## Theme settings and rendering

`useThemeContext()` must run inside Theme. Its live appearance/accent/gray/panel/radius/scaling values and change handlers are available to child components. Root handlers change root settings; incoming reactive props remain synchronized. Nested Theme inherits the parent's **resolved** gray even when its own accent changes, unless it explicitly requests `grayColor="auto"`. Nested change handlers are read-only, as upstream; settings controls must capture the root context rather than a nested presentation Theme. An explicit nested light/dark appearance creates its own background.

Server rendering uses initial Theme metadata without allocating client synchronization effects. Initial SSR and client props must agree; browser-only preferences should settle after hydration. Server memos describe one render, not subsequent client reactivity.

The public `Portal` preserves native portal lifecycle: no server children; client mounting after hydration settles. It does **not** copy ancestor Theme CSS attributes onto physically relocated DOM. Wrap relocated presentation in Theme when needed.

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
  <Dialog.Trigger>{target => target(Button, { children: 'Open dialog' })}</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Settings</Dialog.Title>
    <Dialog.Description>Update your preferences.</Dialog.Description>
    <Dialog.Close>{target => target(Button, { children: 'Close' })}</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
```

Import `Dialog` alongside `Theme` and `Button`; render the example inside Theme. Tooltip is a flat component with required `content` and a target factory child, not a React element.

Themed overlay content recreates Theme on its physical portal root, including custom containers, submenus and live settings. Changing nested accent alone inherits resolved gray; explicitly request `grayColor="auto"` for a new match. Responsive submenu alignment reads actual CSS padding and follows viewport width and scaling; it does not numerically coerce responsive objects.

ThemePanel controls the captured root settings despite its own medium-radius/100% preview. `T` toggles it and restores focus; modifier keys, editable targets, non-radio/checkbox text inputs, select/textarea and menu/listbox/combobox targets are excluded. Inherited appearance observes html/body light/dark classes; an `onAppearanceChange` callback can own that switch. Copy Theme writes the non-default configuration to the clipboard and reports failures. Standalone content/type remain exported as `unstable_ThemePanelContent`/`unstable_ThemePanelContentProps` at the package root and `ThemePanelContent`/`ThemePanelContentProps` from `components/theme-panel`.

Keyless document events are ignored. Native `inert` reflects whether panel interaction is disabled, and inherited factory refs keep their child-first precedence. Panel spacing uses the original layout gap; modal scrollbar removal retains the upstream fixed-edge placement.


## CSS, props and plugins

All 40 upstream CSS outputs are emitted: `styles.css`, `components.css`, `utilities.css`, `tokens.css`, `tokens/base.css`, 31 `tokens/colors/*.css` files, and `layout.css`, `layout/tokens.css`, `layout/components.css`, `layout/utilities.css`. CSS is marked as a package side effect. Released `@radix-ui/colors@3.0.0` is reused unchanged.

Intentional accessibility CSS differences: Select placeholders use step-11 foregrounds without reduced opacity. Forced-color mode uses system-color control boundaries, selected markers and keyboard focus outlines instead of shadows or fixed palette backgrounds; native colors are not disabled globally. Original classes, sizing, layout and palette data remain unchanged outside these corrections.

Loading labels remain accessible but visually transparent even in forced colors; Spinner leaves use native `CanvasText` so both light and dark system palettes remain visible. These corrections do not change ordinary palette geometry or animation.

Public `components/*`, `helpers` and `props` subpaths select the same native browser/server conditions and declarations. All 50 component prop modules are available as `components/<name>.props`; pure metadata sources use `.ts` internally, with unchanged `.js` public imports. React-only subtree/element-inspection helpers are intentionally removed.

Compound component subpaths expose their upstream short parts and Props, not accidental long-form implementation exports. `components/index`, `components/checkbox-group.primitive`, `components/_internal/*` and private icon implementation paths are not public APIs. The public props `breakpoints` value retains the upstream ordered readonly-array contract; internal extraction continues using its existing Set.

`postcss-breakpoints` and `postcss-whitespace` support both ESM imports and CommonJS requires, including explicit `.js`/`.cjs` subpaths. Breakpoint assets resolve relative to the installed plugin, not caller cwd. The original import/nesting/breakpoint/custom-media/selector-combination/empty-rule/whitespace/autoprefixer processing order is retained.

For separate private tarball consumers, override `@radix-solid/primitives` to the same packed primitives file used by the direct dependency. The unpublished `0.0.0-local` version cannot be fetched from npm. The repository's independent consumer runner pins content-addressed tarballs, not workspace source aliases.

## Attribution

Adapted from the read-only Radix Themes snapshot. Visual comparisons use that actual React source, not an older released package's differing ThemePanel markup, with the retained CSS pipeline and documented accessibility corrections. Original geometry and MIT attribution are retained; Copyright (c) 2023 WorkOS. See `LICENSE`.
