# Native Solid 2 Primitives

Native fork, not an official Radix product. This README describes prerelease `@wsagency/radix2solid-primitives@0.1.0-rc.4`, which introduces Calendar, DatePicker and FileDrop; these new APIs are absent from rc.3. Install the exact version with `pnpm add -E @wsagency/radix2solid-primitives@0.1.0-rc.4`. This remains a Solid `2.0.0-rc.15` prerelease. The approved one-time `latest` target for the existing rc.4 publication is `0.1.0-rc.4`. npm dist-tags are mutable: `latest` selects unqualified install resolution, not semver stability. The `-E` command above remains pinned to this exact prerelease regardless of tag changes. Future prerelease publications continue to use `next`. Its `solid-js`/`@solidjs/web` peers are `2.0.0-rc.15`, which require Node `>=22.12.0`; source-checkout packing is an optional development alternative.

Implemented namespaces: all 35 upstream main entries plus standalone `Announce` and `Arrow`: `Slot`, `Toggle`, `Direction`, `Portal`, `VisuallyHidden`, `Arrow`, `Dialog`, `Popover`, `AccessibleIcon`, `AspectRatio`, `Avatar`, `Label`, `Progress`, `Separator`, `Announce`, `Collapsible`, `Accordion`, `Checkbox`, `Switch`, `RadioGroup`, `Tabs`, `ToggleGroup`, `Toolbar`, `AlertDialog`, `HoverCard`, `Tooltip`, `DropdownMenu`, `ContextMenu`, `Menubar`, `NavigationMenu`, `Select`, `unstable_PasswordToggleField`, `unstable_OneTimePasswordField`, `Slider`, `ScrollArea`, `Form` and `Toast`, with corresponding subpaths/parts. Explicit `/internal` exports provide native state/ref/event, scoped context, collection/roving-focus, presence, focus/layer/scroll and Popper helpers; no React hook aliases. Solid/web RC.15 are peers, never bundled copies. ESM export conditions select `dist/client` for browser and `dist/server` by default; declarations are shared.
The `/internal` entry also exports the existing `Primitive`, `PrimitiveProps` and Slot `mergeStyles` for native Themes reuse; this does not introduce another composition or CSS parser.
The published rc.3 release additionally exports `Combobox`, `Command`, `Tree` and `Splitter` namespaces with corresponding `/combobox`, `/command`, `/tree` and `/splitter` parts, props and scope creators. These additions are not new React upstream or Themes wrappers.

Calendar, DatePicker and FileDrop are new project extensions, not official Radix components or ports. They are introduced in rc.4 and absent from rc.3. The versioned API is available at `@wsagency/radix2solid-primitives/calendar`, `@wsagency/radix2solid-primitives/date-picker` and `@wsagency/radix2solid-primitives/file-drop`. For source-checkout development, build and pack Primitives with `pnpm --dir packages/primitives pack`; if using Themes wrappers, pack Themes from the same checkout and resolve its Primitives dependency to the same physical Primitives tarball.

## Calendar

`Calendar` and `@wsagency/radix2solid-primitives/calendar` expose `Root`, `Header`, `Heading`, `PrevTrigger`, `NextTrigger`, `Grid`, `Row`, `HeaderCell`, `Cell` and `Day`, plus long-name/short-alias props and `createCalendarScope`. It is an inline date grid, not a form field. The `asChild` contract remains a single native target factory.

`DateValue` is canonical `YYYY-MM-DD` for a real Gregorian date in years 0001–9999 (no year zero); `MonthValue` is `YYYY-MM`. Empty selection is `null`. Provide `today` explicitly; locale defaults to `en-US`, and `weekStartsOn` defaults to Sunday (`0`). No current date, locale or time zone is inferred from the host. The six-row, seven-column grid uses bounded pure date arithmetic, including adjacent-month days and inert padding at domain edges. Invalid dates and `min > max` are configuration errors, not normalized values.

Selection (`value`/`defaultValue`/`onValueChange`), visible month (`viewMonth`/`defaultViewMonth`/`onViewMonthChange`) and keyboard cursor are separate. Controlled callbacks request changes; the supplied controlled value/month remains authoritative if a request is refused or adopted later. Browsing does not select. `min`, `max` and `isDateUnavailable` constrain activation; unavailable days remain focusable with `aria-disabled`, so they can be inspected. `disabled` removes interactive day/navigation tab stops; `readOnly` preserves browsing but blocks selection. A selected date made unavailable by later bounds/predicate changes is retained and marked invalid rather than silently cleared. Today, selected, focused and outside-month states are distinct (`data-today`, `data-selected`, `data-disabled`, `data-outside-month`). Applications own availability fetching; `onViewMonthChange` reports navigation but does not load data.

Keyboard: Left/Right moves one visual day (reversed in RTL), Up/Down seven days, Home/End to the displayed week's ends, PageUp/PageDown by month, and Shift+PageUp/PageDown by year; short-month and leap-day movement clamps. Enter/Space selects an allowed day. Tab visits the day tab stop and navigation controls, not all dates. Cursor movement never commits selection; unavailable dates may receive focus but cannot activate. `locale` formats dates but does not translate caller-supplied action/error text.

## DatePicker

`DatePicker` and `@wsagency/radix2solid-primitives/date-picker` expose `Root`, `Trigger`, `Value`, `Portal`, `Content`, `Title`, `Description`, `Close`, `Clear`, `Calendar` and `FormControl`, plus prop types and `createDatePickerScope`. Root shares Calendar's date/month/bounds/availability contract, with controlled/uncontrolled `open` and `onOpenChange`, existing Popover `modal` behavior (default nonmodal), and `name`, `form`, `required` for the explicit native bridge.

On opening, focus targets the displayed selected date, otherwise supplied `today` when in bounds and displayed, otherwise an in-bounds day. Browsing and focus do not change selection. A day commit requests the date and then close independently: refused selection preserves the accepted value; refused close leaves the popup open and focus active inside. Escape/Close never select the cursor. Existing Popover positioning, portal, collision and cancellable focus/outside/escape behavior apply. Explicit open SSR markup has no pre-mount focus; the interactive picker settles after hydration. Native `DatePicker.Portal` is client-only and renders no server children. For initially-open SSR content and hydration-stable node identity, render `DatePicker.Content` inline on both server and client without `DatePicker.Portal`; do not use an SSR portal fallback or adaptively switch hosts. Use a native `<input type="date">` with Form when typing, mobile native UI, or distant-date entry is preferable. Editable text parsing, ranges, timestamps, time entry, alternate calendars and month/year grids are out of scope.

For form participation, compose `Form.Control` with `DatePicker.FormControl` via `asChild`—never with Trigger. This bridge is a real, visually hidden `input type="date"` (not `type=hidden`, `display:none` or the `hidden` attribute), `tabIndex=-1`, and is not a second accessible editor. Root `name` alone creates no successful control; pass `name`, optional external `form`, and `required` to Root. The bridge mirrors accepted value, name/form, min/max, required, disabled and actual `readOnly`; it submits one canonical accepted value. Empty enabled named values submit an empty string; disabled controls are omitted. `required` makes empty invalid but does not prevent clearing. `readOnly` permits browsing but prevents selection/clear and has native date-input submission/validation semantics.
Native event notifications follow accepted state, not requests: an accepted native user change synchronizes the accepted value to the bridge before it dispatches bubbling `input`, then bubbling `change`; an accepted programmatic value change dispatches a non-bubbling `change`. Initial projection, a no-op or refused value request, and form reset dispatch neither event. These bridge notifications do not become new selection requests.

The bridge routes actual invalid focus to the visible Trigger. Standalone, it owns unavailable-date custom validity; in Form composition, Form alone is the custom-validity writer and combines native constraints, current baseline validity, matchers and server errors. A `Form.Field` name resolves through `Form.Control`; set DatePicker Root's name to that resolved name and keep any wrapper form association equal to Root's `form`. `Form.Control asChild` preserves input id, ref, handlers and description/error associations. Label Trigger separately with visible text or explicit `aria-labelledby`; its accessible name is not inferred by walking `Form.Label`. Form retains first-invalid focus behavior, including controls outside the form subtree; server errors clear even on prevented submit, and uncancelled reset clears validation after native reset while cancelled reset retains it.

## FileDrop

`FileDrop` and `@wsagency/radix2solid-primitives/file-drop` expose `Root`, `Input`, `Trigger`, `createFileDropScope`, props and `FileDropRejection`. Root is the drop target; one real `Input` is both the browse input and native form projection, always mounted. `Trigger` is an optional type-button browse affordance. Input remains accessible/focusable when visually hidden and may also be targeted by a native `Label`.

`value`/`defaultValue` are readonly `File[]`; accepted controlled state is authoritative. A candidate is proposed once; a controlled parent may adopt it immediately, later or never, and non-adoption is not a local rejection. Picker and drop share whole-batch policy: with `multiple={false}`, more than one file rejects all before accept checks; every file must match at least one comma-separated HTML-style extension, exact MIME or supported `image/*`, `audio/*`, `video/*` token, compared case-insensitively, or the entire batch is rejected. Filtering is UX only—not content inspection, security validation or server policy. A valid changed batch replaces selection; append explicitly in your controlled callback if desired. Use a new accepted array to clear/remove files. A local `onReject` reports only filter failures (`source`, `reason: 'no-files' | 'too-many-files' | 'accept-mismatch'`, `files`), not controlled-parent refusal, delayed approval or upload failure. Async acceptance, pending/error UI, file-list rendering, previews/object URLs, upload and persistence belong to the application.

Native picker `cancel` preserves selection; a real `change` with no files proposes clear. An empty/non-file drop rejects with `no-files` instead. Do not clear the native input just to force same-file reselection; native chooser behavior is browser/OS-owned. Picker-originated `input`/`change` are noncancelable and can expose provisional candidate files to target/capture/bubble listeners before accepted-state reconciliation. `preventDefault` cannot undo them. They are **not** accepted-commit notifications and FileDrop does not promise atomic FormData during those original listeners. After settlement, accepted File references are projected; later parent adoption is a normal projection. Submit from settled accepted state when acceptance matters. Drop acceptance emits one synthetic bubbling `input` then `change`; external accepted changes use a non-bubbling `change`. Reset emits only native reset events.

Set `name`, optional external `form`, `required`, `multiple`, `accept` and `disabled` on Root; the real file input mirrors them. Multiple files serialize as repeated same-name entries (`FormData.getAll`). An enabled named empty file input contributes the browser's empty File sentinel (`name === ""`, `size === 0`, `type === "application/octet-stream"`); do not confuse it with a genuine zero-byte file. `FormData` construction does not validate; `form.submit()` bypasses constraint validation. Uncancelled reset proposes the initial accepted array; controlled refusal restores current accepted files. Cancelled reset preserves state. A currently disabled control suppresses new proposals/rejections and restores its accepted projection; disabled controls are omitted and barred from validation. `readOnly` is unsupported, excluded from Input props and never forwarded; use `disabled`, controlled authority or app-rendered static metadata instead.

For Form, compose `Form.Control asChild` with `FileDrop.Input`, not Root/Trigger. Keep Root `name` equal to Form.Control's resolved name (including Form.Field), and align form associations. Form matchers see the native fakepath string in `control.value`; inspect `FormData.getAll(name)` for files. Shared private coordination gives each input exactly one custom-validity writer, combines accept/count baseline validity with native constraints, matchers and server errors, and revalidates after accepted File-reference sequence changes. Stale async results from provisional files are invalidated even when fakepath is unchanged. Root owns selection/constraints; Form target props must not override them. Preserve the input id/ref/handlers/description associations; provide a visible browse/focus surface and explicit accessible name.

SSR begins empty: do not serialize files or construct browser `File`, `DataTransfer` or DOM objects on the server. Client-only defaults may project after mount without user notifications; file selection before hydration is not guaranteed to become accepted state. Use the native file-input recipe when progressive enhancement is required. No directory traversal, remote URL import, upload service, retry/progress framework or content sniffing is provided.

### Shared-layer migration map

The public `/internal` surface is native and deliberately not a React-hook compatibility layer. `tests/consumer/coverage-manifest.json` pins its actual declarations and maps the primitive/component families to retained consumer checks.

| Reference shared API                                       | Native equivalent / ownership                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Arrow`, `Menu`, `Primitive`                               | Public Arrow namespace; internal Menu namespace and direct Primitive component. No synthetic `Primitive.Root` or React discrete-event helper. Native DOM dispatch handles custom events; explicitly flush native state only where the interaction requires it. |
| `Collection`, `Context`                                    | `createCollection`, `createContextScope`, `Scope` and `CreateScope`; registrations and providers belong to native owners.                                                                                                                                      |
| `RovingFocus`, `Presence`                                  | `RovingFocusGroup`, `RovingFocusGroupItem`, `createRovingFocusGroupScope`; `createPresence` and `Presence` retain/cancel real exit animations.                                                                                                                 |
| `FocusGuards`, `FocusScope`, `DismissableLayer`            | Document-wide layer registry, `createDismissableLayer`, branch registration and native focus traversal/autofocus/restoration; not separate React scope/guard wrappers.                                                                                         |
| `Popper`                                                   | `createPopperContext`, `createPopperScope`, `usePopper` and direct Popper/Anchor/Content/Arrow components; owner-document observers and Floating UI cleanup.                                                                                                   |
| `composeRefs`, `useComposedRefs`                           | `composeRefs` and native ref arrays; no hook alias.                                                                                                                                                                                                            |
| `useControllableState`, `useControllableStateReducer`      | `createControllableState` for parent-authoritative values; domain transitions use owned signals rather than a React reducer shim.                                                                                                                              |
| `composeEventHandlers`, `useCallbackRef`, `useEffectEvent` | Consumer-first `composeEventHandlers` reads the current callback getter; event handlers read current props instead of cached render callbacks.                                                                                                                 |
| `useLayoutEffect`, `useIsHydrated`                         | Solid 2 `createEffect(compute, apply)` with cleanup returned from apply, or `onSettled` for client-settled work; `isServer` gates DOM access. Native Portal owns hydration deferral.                                                                           |
| `useSize`, `useEscapeKeydown`                              | Owned owner-document ResizeObservers in form controls/Slider/ScrollArea/Popper; shared top-layer Escape dispatch with native cancellation. No unowned hook replacement.                                                                                        |

## Combobox and Command

`Combobox.Root` requires a readonly `items` array of unique nonempty `{ value, label, disabled? }` records. Selection (`value: string | null`), text (`query`) and popup (`open`) are independent controlled channels, each with its own initial default and change callback. Filtering defaults to trimmed case-insensitive label matching; `filter={false}` disables it and a function replaces it. Canonical data supplies server labels, not mounted popup rows.

Parts: Root, Input, Trigger, Portal, Content, List, Item, ItemText, ItemIndicator, Group, Label, Empty and Clear. Import the root namespace or `/combobox` long names, aliases, props and `createComboboxScope`. Root owns `name`/`form` and Input text. A draft, disabled/removed key or unresolved label never submits the old key; the unnamed visible Input owns validation and focus after hydration. SSR emits data-derived labels/invalid state and successful-field eligibility, but native Portal options are client-only. Input keeps focus while its active descendant moves; active highlight is not committed selection.

`Combobox.Input` defaults native HTML `autocomplete` to `"off"` so browser form-history suggestions do not intercept the custom popup's Enter activation. An explicit `autocomplete` prop overrides this default and stays reactive; a target-factory child's value retains normal child precedence.

`Command.Root` supplies `search`, `defaultSearch`, `onSearchChange` and `loop`; the caller owns filtering, ranking and remote results. Parts are Root, Input, List, Group, Label, Item and Empty, with matching `/command` exports, props and `createCommandScope`. Items require `value` and `textValue`; `onSelect(event: Event)` is cancellable. Command has no selected value, form field, popup or global-shortcut API. In a dialog recipe, guard the action first, then request close and run the action; controlled refusal to close must not erase an accepted action.

Both families use native target-factory `asChild`, real refs, consumer-first event cancellation and IME-safe input editing. Shift+Up/Down keep native text selection. List, Item and Label retain their component-owned IDs even when a target-factory child supplies an ID, keeping controls, active descendants and group labels connected; unrelated child props retain normal Slot precedence. They do not clone elements. Browser focus/ARIA checks are not screen-reader certification.

`Empty` is client-resolved from mounted, visible rows, including disabled rows. Server rendering does not announce an empty result before client registration, even for an actually empty list. Accepted Command search changes reset to the first enabled result after the caller's rendered update; if results are empty or all disabled, that intent waits for enabled results without requiring another query. Ordinary object replacement and reordering preserve an existing active key; initial results alone do not create one.

Record/filter derivations and shared collection/state accessors remain reactive. Initialization captures, post-render cursor reconciliation and disposal read explicit snapshots; reconciliation still inspects the final registered rows rather than an earlier render-phase snapshot.

Place `Empty` and caller-owned loading/status messages **beside `List`, not inside it**: keep `Command.Empty` within `Command.Root`, and `Combobox.Empty` within the existing `Combobox.Content` (or `Combobox.Root` for an inline list). They retain `role="status"` and resolve from the Root's registered List; listbox descendants must remain options or option groups rather than live-status regions.

## Splitter

`Splitter.Root` contains exactly a primary `Panel`, named `Handle`, then secondary `Panel`. Import the namespace or `/splitter` parts, `SplitterProps`, `SplitterPanelProps`, `SplitterHandleProps` and `createSplitterScope`. Root controls numeric size with `unit="%"` (default) or `"px"`, independent collapsed state, orientation/direction, step and disabled state. Pixel mode requires an initial size. Panels set `minSize`/`maxSize`; only primary supports `collapsible` and `collapsedSize`.

`onSizeChange` proposes constrained size; `onSizeCommit` reports accepted effective size once after a changed completed gesture. Refused proposals, measurement-only reconciliation and cancelled drags do not commit. Collapse requests do not overwrite expanded size. Handle must have `aria-label` or `aria-labelledby`; it supports physical-axis arrows, Shift stepping, Home/End and Enter collapse with native cancellation. Native factory targets and refs retain the normal composition contract.

**SSR sizing has two phases.** Before measurement, percentage tracks use deterministic native fractions and ARIA reports finite own-bound provisional values; infeasible percentage bounds are not promised exact pre-JavaScript pixels. Pixel SSR reserves the supplied own-bound-clamped primary and a bounded native secondary remainder, not the complete cross-panel feasible interval. After positive measurement, available-space conversion, both-panel bounds and overflow/underflow are exact. Measurement can reconcile panel sizing without user proposals or commits, while preserving nodes and Root/Handle structure. For example, primary100/secondary-max700 with available1000 can render100/700 on the server then reconcile to300/700. This is not an N-pane solver or assistive-technology certification.

On the client, Root appends one private measurement node after its three semantic parts so inherited or changed CSS gaps update available space without proposals or commits. It is hidden, inert, `aria-hidden`, unfocusable and removed with Root; it is not a part. Do not count Root children or style the secondary Panel through `:last-child`.

## Tree

Import the `Tree` namespace from `@wsagency/radix2solid-primitives` or parts from `/tree`. Parts are `Root`, `Item`, `ItemText`, `ItemIndicator`, `ItemGroup`, and `ExpandTrigger`; the family also exports their `Tree*` names, props and `createTreeScope`.

Use a named Root with controlled `value`/`onValueChange` and independent `expandedValues`/`onExpandedValuesChange`, or their initial-only defaults. Each Item requires a unique nonempty `value` and explicit `textValue`; declare branches with `hasChildren` and nest descendants inside ItemGroup. Partial trees may supply native `aria-level`, `aria-posinset` and `aria-setsize`. Selection, focus and expansion are independent: Space selects, Enter activates through cancellable `onActivate`, and logical Left/Right navigate or expand branches. `selectionMode="none"` retains the selected key but suppresses selection semantics and requests.

Collapse, removal and disabling repair focus only while focus is inside Root. After an explicit blur or outside focus, they update the tab stop without moving focus. When the tree was empty or fully disabled and Root itself holds focus, restoring an enabled item hands focus to the preferred item.

Style focused Items separately from `[aria-selected="true"]` selection; use native focus-visible styling for keyboard focus. ItemGroup supports `forceMount`, but collapsed retained descendants remain outside navigation. Native target-factory `asChild` and refs follow the shared composition contract. For ordinary sidebar navigation, prefer disclosure lists rather than a tree widget. DOM/browser checks do not constitute screen-reader interoperability certification.

## Toggle

```tsx
import { Toggle } from "@wsagency/radix2solid-primitives";
import { createSignal } from "solid-js";

const [pressed, setPressed] = createSignal(false);
<Toggle.Root
  pressed={pressed()}
  onPressedChange={setPressed}
>
  Bold
</Toggle.Root>;
```

`pressed` is parent-authoritative: refusing a request leaves the host unchanged. An undefined `pressed` selects local state. `defaultPressed` initializes once; subsequent changes do not reset local state. Undefined `type` preserves `button`. Requests use the latest callback and unchanged requests do not notify. Local functional writes compose within a microtask batch; callbacks run synchronously for each distinct request, while reactive DOM updates settle normally. This timing differs from React's uncontrolled post-commit effect notification. Consumer click cancellation prevents internal toggling. Native disabled buttons retain platform semantics; custom targets receive disabled/data-disabled and the internal toggle handler does not change state while disabled.

## Native asChild migration

React cloned an element. This API deliberately does not clone or mutate a DOM node. `asChild` is structural and must be `true` with one render function. The function receives a typed **target factory**, not a snapshot prop bag:

```tsx
<Toggle.Root<HTMLAnchorElement>
  asChild
  class="trigger"
  ref={(host) => console.log(host)}
>
  {(target) =>
    target("a", {
      href: "#details",
      class: "consumer",
      onClick: (event) => event.preventDefault(),
      children: "Details",
    })
  }
</Toggle.Root>
```

Target-specific attributes and required custom-component props are checked at `target(Component, props)`. Toggle's generic identifies the custom target's ref/currentTarget host type when asChild is true; without asChild, the host remains a typed native button regardless of the generic argument. A custom component must forward the supplied native props/ref to its intended host. Use reactive getters in factory prop objects, e.g. `get href() { return destination(); }`; destructuring or snapshot spreading reactive views loses updates.

Exactly one factory target must be requested and returned unchanged. Missing, multiple or substituted targets throw on both server and client. The plan's illustrative `{props => <a {...props}>…</a>}` spelling is not this API: plain JSX introspection cannot enforce the same single-target contract during SSR.

Slot invokes child handlers first, then parent handlers even if the child prevents default. Toggle's internal consumer-first handler still honors defaultPrevented. Bound `[handler, data]` native event forms are supported, not treated as ref arrays. Child ordinary props override parent props. Class tokens combine through the native class-array representation; token order is not a CSS precedence contract. Styles merge with child declarations last, including CSS strings/objects. Describedby/labelledby IDs concatenate child-first, deduplicating shared IDs. Neither input is mutated. Refs use native arrays, preserving both callbacks/directives. Directive setup/cleanup belongs in an owned component scope, not an unowned ref callback; use callback refs rather than plain variables inside ref arrays.

Unchanged nested ref-array consumers initialize once per connected host, including atomic reactive prop objects. Replacing a callback/directive initializes the current native ref array on that same host; native ref invocation and disposal semantics are unchanged.

RC.13 invokes fresh CSR refs before assigning host attributes. Store the received host for later imperative interaction; callback-time attribute presence is not a mount/viewport-identity test. Hydration may already have server attributes.

Native input targets preserve `defaultValue`/`defaultChecked` as actual `value`/`checked` SSR reset baselines, including `asChild` factories. Explicit current values take precedence. Client properties remain owned by the native renderer.

## Loading and leading/trailing content

```tsx
import { Slot, Toggle } from "@wsagency/radix2solid-primitives";

<Toggle.Root
  asChild
  children={Slot.Slottable({
    child: (target) => target("button", { children: "Save" }),
    leading: <span aria-hidden="true">→ </span>,
    trailing: <span aria-hidden="true"> ✓</span>,
    children: (label) => <>{loading() ? "Saving" : label}</>,
  })}
/>;
```

Leading/trailing and transformed loading content stay inside the same target. `createSlot(ownerName)` and `createSlottable(ownerName)` create the same native contracts with owner-specific composition errors; there are no React hook aliases or element-introspection shims.

`Dialog.WarningProvider` is intentionally absent: the reference already marks it deprecated and implements it as a children-only no-op. Remove that wrapper during migration; no compatibility shim or warning suppression is provided.

## Dialog, Popover and portal ownership

```tsx
import { Dialog, Popover } from "@wsagency/radix2solid-primitives";

<Dialog.Root>
  <Dialog.Trigger>Details</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Details</Dialog.Title>
      <Dialog.Description>Account details.</Dialog.Description>
      <Popover.Root>
        <Popover.Trigger>Help</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content sideOffset={8}>
            <Popover.Title>Help</Popover.Title>
            <Popover.Description>Additional guidance.</Popover.Description>
            <Popover.Close>Close help</Popover.Close>
            <Popover.Arrow />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <Dialog.Close>Close details</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>;
```

Dialog defaults to modal; Popover defaults to nonmodal. `open`, `defaultOpen` and `onOpenChange` use the same parent-authoritative/latest-callback contract as Toggle. The shared Overlay Content default sets `aria-modal="true"` only on open modal layers; explicit caller-supplied `aria-modal` values take precedence. `createDialogScope()`/`createPopoverScope()` isolate compound contexts through nested providers; pass the resulting scope props to every associated part.

**rc.2 naming migration (Dialog, Popover and AlertDialog):** Root allocates the default title and description IDs. Content links those IDs directly, and Title/Description use them by default. Relationships no longer depend on registering or inspecting descendants, so native and custom factory targets render children at their normal owned position on both server and client.

- Explicit Content `aria-labelledby` and `aria-describedby` replace their defaults; key presence matters, so `aria-describedby={undefined}` opts out when no Description is rendered. Explicit `aria-labelledby={undefined}` likewise removes the automatic title relationship.
- A nonblank `aria-label` names Content without an automatic title link, unless an explicit `aria-labelledby` was supplied. An undefined, null, empty or whitespace-only label does not suppress the default title relationship.
- Custom Title/Description `id` values remain native overrides. Supply the corresponding explicit Content relationship; IDs are not discovered or concatenated automatically. For example, pair `<Dialog.Content aria-labelledby="account-title" aria-describedby={undefined}>` with `<Dialog.Title id="account-title">Account</Dialog.Title>`.
- When conditionally removing a part or changing its ID, update the Content relationship in the same state transition. Do not leave references to absent elements. An explicitly undefined part `id` removes that native ID; it does not restore the Root default.

These rules also apply through Themes and `asChild`. Slot combines relationship lists only when the parent or target actually supplies that key; it does not manufacture an undefined opt-out or evaluate children to discover labels.

Escape acts on the top layer; each close restores its own trigger. Modal focus/scroll ownership includes descendant portalled branches, custom containers and ShadowRoots, with a shared stack per ownerDocument across independent native render roots. Final-owner disposal restores previous body pointer/overflow/padding and ARIA state. Native portal propagation is not React logical bubbling: capture/bubble interception must use real DOM listeners. Primary outside interactions dismiss after click, not after a scrolling touch gesture; right/control clicks do not dismiss a modal.

Outside pointer/focus dispatch reaches each eligible outside layer, stopping at the highest modal boundary; Escape still acts only on the top layer. Modal scrolling includes the owning overlay and authorized descendant/ancestor scroll containers while the background remains locked. Keyboard navigation reveals offscreen targets; pointer highlights, autofocus and restoration retain their no-jump policy.

Outside callbacks receive cancelable native CustomEvents with `detail.originalEvent`; Escape receives KeyboardEvent, and autofocus callbacks receive cancelable Events targeted at content. `preventDefault()` cancels the relevant dismissal/autofocus. Presence retains real CSS exit animations, handles natural completion and cancellation before animationstart, and preserves the node when reopened before its exit animation completes. Popper geometry updates reactively and cancels listeners/observers/late results on disposal; pass content `dir` explicitly for directional positioning.

`Portal.Root`, `Dialog.Portal` and `Popover.Portal` render **no server content** under RC.13, even with `defaultOpen` or `forceMount`. They mount after client hydration settles. Inline content can render on the server without a DOM. `forceMount` retains closed client content but does not retain focus/scroll ownership; consumers control closed-state CSS. `container` accepts an Element or DocumentFragment/ShadowRoot without server document access.

A nested `render()` needs the parent owner during child creation, not around its imperative flush. RC.13 ignores `render`'s declared `options.owner`: capture `getOwner()` in setup, call `runWithOwner(owner, childFactory)` inside the render callback, defer render outside `onSettled`, and dispose the child root with its host. The executable `NestedRenderLayer` fixture in `apps/gallery/src/layers.tsx` demonstrates this lifecycle; no DOM-parent fallback is added.

## Simple native controls

```tsx
import {
  AccessibleIcon,
  AspectRatio,
  Label,
  Progress,
  Separator,
} from "@wsagency/radix2solid-primitives";
import { createSignal } from "solid-js";

const [completed, setCompleted] = createSignal(0);
<>
  <button type="button">
    <AccessibleIcon.Root label="Close">
      {(target) =>
        target("svg", {
          viewBox: "0 0 32 32",
          children: (
            <path
              d="M2 30 L30 2 M30 30 L2 2"
              stroke="currentColor"
            />
          ),
        })
      }
    </AccessibleIcon.Root>
  </button>
  <AspectRatio.Root ratio={16 / 9}>
    <svg
      viewBox="0 0 160 90"
      width="100%"
      height="100%"
      role="img"
      aria-label="Landscape"
    >
      <path
        d="M0 90 60 20 90 60 110 35 160 90Z"
        fill="currentColor"
      />
    </svg>
  </AspectRatio.Root>
  <Label.Root for="account-name">Account name</Label.Root>
  <input id="account-name" />
  <Progress.Root
    aria-label="Upload"
    value={completed()}
    max={100}
  >
    <Progress.Indicator
      style={{ transform: `translateX(-${100 - completed()}%)` }}
    />
  </Progress.Root>
  <button onClick={() => setCompleted(100)}>Complete upload</button>
  <Separator.Root orientation="vertical" />
</>;
```

AccessibleIcon requires the same single-target factory as Slot and forces the icon's `aria-hidden="true"`/`focusable="false"`; its reactive label remains visually hidden but accessible. AspectRatio retains a responsive containing wrapper and positions the forwarded content inside it. Label uses native `for`/implicit-control activation, skips nested control mousedown interception, and prevents uncancelled double-click text selection.

Progress validates positive max and values between zero and max, falling back to max=100 or indeterminate null with a diagnostic for invalid values. Null/undefined omits value ARIA attributes; zero and completion remain distinct. Indicator shares live value/max through its root, with nested roots isolated and `createProgressScope()` available for explicit scopes. Separator's live orientation controls vertical ARIA semantics; decorative separators use `role="none"`.

```tsx
import { Announce, Avatar } from "@wsagency/radix2solid-primitives";
import { createSignal } from "solid-js";

const [notice, setNotice] = createSignal("Account ready");
const avatar =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="teal"/></svg>',
  );
<>
  <Avatar.Root>
    <Avatar.Image
      src={avatar}
      alt="Account avatar"
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
    <Avatar.Fallback delayMs={200}>AC</Avatar.Fallback>
  </Avatar.Root>
  <Announce.Root
    type="polite"
    aria-atomic="true"
  >
    {notice()}
  </Announce.Root>
  <button onClick={() => setNotice("Account saved")}>Save account</button>
</>;
```

Avatar loads with the root's ownerDocument image constructor, guards stale source completion, removes load/error handlers on disposal, and renders its img only after successful decoding. Missing/broken sources keep the fallback; `delayMs` delays its first appearance and cancels with its mount. Native `crossorigin` and `referrerpolicy` props apply to both loading and displayed images; `onLoadingStatusChange` reads the latest callback. Nested roots and explicit `createAvatarScope()` providers isolate state.

Announce keeps original content in place and mirrors live notification markup into shared ownerDocument regions, including factory-target markup under `asChild`. Text/child/attribute updates do not re-run child components: handlers and refs belong only to the original content, not a second interactive tree. Keep notification markup noninteractive. `type` selects polite/status, assertive/alert or off/none; optional role, string-valued native `aria-atomic`/`aria-relevant`, and regionIdentifier separate configurations. Hidden documents suppress owned announcement roles/live priority; final disposal disconnects observers/listeners, removes library-created regions, and preserves host-owned regions/content and original live attributes.

Manual screen-reader delivery remains an acceptance gate: browser DOM/AX observations are not speech-output verification.

## Collapsible and Accordion

```tsx
import { Accordion, Collapsible } from "@wsagency/radix2solid-primitives";
import { createSignal } from "solid-js";

const [open, setOpen] = createSignal(false);
const [item, setItem] = createSignal("");
<>
  <Collapsible.Root
    open={open()}
    onOpenChange={setOpen}
  >
    <Collapsible.Trigger>Account details</Collapsible.Trigger>
    <Collapsible.Content>Account information</Collapsible.Content>
  </Collapsible.Root>
  <Accordion.Root
    type="single"
    collapsible
    value={item()}
    onValueChange={setItem}
  >
    <Accordion.Item value="account">
      <Accordion.Header>
        <Accordion.Trigger>Account</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content>Account information</Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="settings">
      <Accordion.Header>
        <Accordion.Trigger>Settings</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content>Account settings</Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
</>;
```

Both use parent-authoritative state, latest callbacks and initial-only defaults. Collapsible supplies button expanded/controls semantics, disabled/cancelled click behavior, and full-content height/width CSS variables. Ordinary closed Content retains an empty hidden shell; factory-backed Content removes the entire target. Children survive a real CSS exit animation, including close→reopen. `forceMount` leaves closed content/children mounted and unhidden for consumer-controlled CSS. Inline SSR needs no document.

Accordion `type="single"` uses a string and cannot close its current item unless `collapsible`; `type="multiple"` uses a string array and permits independent closing. Header/Trigger/Content link each region to its trigger and expose orientation/state/disabled attributes plus `--radix-accordion-content-height`/`width` aliases. Home/End and orientation-specific arrows wrap in current DOM order, skip disabled items and use explicit/inherited direction. Nested roots isolate state and navigation. `createCollapsibleScope()`/`createAccordionScope()` support explicit compound scoping; pass the scope props to every associated part.

## Checkbox and Switch

```tsx
import { Checkbox, Label, Switch } from "@wsagency/radix2solid-primitives";
import { createSignal } from "solid-js";

const [permission, setPermission] =
  createSignal<Checkbox.CheckedState>("indeterminate");
<>
  <form id="preferences">
    <Label.Root for="permission">Allow access</Label.Root>
    <Checkbox.Root
      id="permission"
      name="permission"
      value="allowed"
      required
      checked={permission()}
      onCheckedChange={setPermission}
    >
      <Checkbox.Indicator>Selected</Checkbox.Indicator>
    </Checkbox.Root>
    <Switch.Root
      aria-label="Notifications"
      name="notifications"
      defaultChecked
    >
      <Switch.Thumb />
    </Switch.Root>
    <button type="reset">Reset preferences</button>
  </form>
  <Switch.Root
    aria-label="External preference"
    name="external"
    form="preferences"
    defaultChecked
  />
</>;
```

Both retain parent-authoritative checked state, latest callbacks and initial-only defaults. Checkbox accepts `true`, `false` or `'indeterminate'`; Switch accepts booleans. Native button values are strings, not React input-array props. Label activation, Space, disabled state and consumer cancellation use native events; Checkbox prevents Enter activation, while Switch permits it. Indicator follows checked/mixed presence and supports `forceMount`; Thumb remains mounted with live state/disabled attributes.

Inside or explicitly associated with a form, each root owns a real checkbox input for `FormData`, required validation and reset, including mixed state and external form ownership. Inputs remain opacity-hidden, not display/hidden-disabled validation substitutes, and track the actual control dimensions. Changed state notifies native form `change`; only user changes forward a single input-origin click to ancestors. Programmatic updates and rejected user requests do not manufacture ancestor clicks. Cancelled resets do nothing; accepted resets request the initial state and resynchronize the input even if its controlled parent refuses.

`createCheckboxScope()`/`createSwitchScope()` scope every compound part. Upstream `unstable_Provider`, `unstable_Trigger` and `unstable_BubbleInput` aliases, named unstable parts and their Props are available for split composition; a manually rendered BubbleInput may participate independently of Root's automatic form detection. `asChild` uses the same typed single-target factory as the other primitives.

## RadioGroup

```tsx
import { RadioGroup } from "@wsagency/radix2solid-primitives";
import { createSignal } from "solid-js";

const [choice, setChoice] = createSignal<string | null>("one");
<>
  <form id="choices">
    <RadioGroup.Root
      aria-label="Delivery"
      name="delivery"
      value={choice()}
      onValueChange={setChoice}
      required
    >
      <RadioGroup.Item
        value="one"
        aria-label="Standard"
      >
        <RadioGroup.Indicator>Selected</RadioGroup.Indicator>
      </RadioGroup.Item>
      <RadioGroup.Item
        value="two"
        aria-label="Express"
      >
        <RadioGroup.Indicator>Selected</RadioGroup.Indicator>
      </RadioGroup.Item>
    </RadioGroup.Root>
    <button type="reset">Reset delivery</button>
  </form>
  <RadioGroup.Root
    aria-label="External choice"
    name="external"
    form="choices"
    defaultValue="one"
  >
    <RadioGroup.unstable_ItemProvider value="one">
      <RadioGroup.unstable_ItemTrigger aria-label="External standard">
        <RadioGroup.Indicator>Selected</RadioGroup.Indicator>
      </RadioGroup.unstable_ItemTrigger>
      <RadioGroup.unstable_ItemBubbleInput />
    </RadioGroup.unstable_ItemProvider>
  </RadioGroup.Root>
</>;
```

Root preserves controlled string/null state, initial-only defaults and latest value requests. Selecting a checked item cannot uncheck it; controlled null clears every item/indicator. Ordinary focus and Enter do not select. Arrow navigation selects, skips disabled items and follows current DOM order, orientation and explicit/inherited direction; Home/End move focus. Loop defaults true and may be disabled. Nested instances remain independent; `createRadioGroupScope()` composes the native item and roving contexts.

Items use real `type="radio"` inputs with unchanged names and actual form owners, including external forms. Same names in different forms do not interfere. Required validation, FormData and initial-value reset remain native; group reset requests once, honours cancellation and resynchronizes each input after a controlled refusal. Only the newly selected radio notifies the form, with one user-origin ancestor click; programmatic selection notifies `change` without clicks. Unchecking the old radio never activates its ancestor to reselect it.

All upstream unstable ItemProvider/ItemTrigger/ItemBubbleInput aliases, named parts and Props are exported. Factory-backed Item/Trigger/Indicator use the normal single-target contract. The upstream public `onValueChange` callback remains string-typed; resetting a group whose initial selection was null can deliver null at runtime, so use a nullable state setter when that reset is possible.

## Tabs

```tsx
import { Tabs } from "@wsagency/radix2solid-primitives";
import { createSignal } from "solid-js";

const [document, setDocument] = createSignal("draft");
<Tabs.Root
  value={document()}
  onValueChange={setDocument}
  activationMode="manual"
>
  <Tabs.List aria-label="Documents">
    <Tabs.Trigger value="draft">Draft</Tabs.Trigger>
    <Tabs.Trigger value="published">Published</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="draft">
    <input aria-label="Edit draft" />
  </Tabs.Content>
  <Tabs.Content value="published">Published document</Tabs.Content>
</Tabs.Root>;
```

Root uses parent-authoritative `value`, initial-only `defaultValue` and latest requests. Automatic activation selects on focus; manual mode moves focus without selecting until Space/Enter or primary mousedown. Primary mousedown focuses the trigger before removing old content, preserving input blur. Right/control mousedown cannot activate; Space/Enter originating in editable descendants do not select. Consumer cancellation wins.

List uses current DOM order, skips disabled triggers, honours orientation and explicit/inherited direction, supports Home/End and defaults to looping. Trigger/Content IDs link native tab/tabpanel semantics and stay stable across hydration. Nested roots and `createTabsScope()` isolate contexts and the shared roving group. Ordinary inactive Content retains a hidden empty shell; children survive a CSS exit and are disposed afterwards. `forceMount` retains visible content, even when inactive. Factory Content mounts/unmounts its single actual target instead of creating a hidden replacement wrapper. Initial selected content suppresses its mount animation for one owned animation frame.

## ToggleGroup

```tsx
import { ToggleGroup } from "@wsagency/radix2solid-primitives";

<ToggleGroup.Root
  type="multiple"
  aria-label="Text formatting"
  defaultValue={["bold"]}
>
  <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
  <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
</ToggleGroup.Root>;
```

Single mode uses a string and radio semantics; pressing its selected item requests `''`. Multiple mode uses a string array and pressed-button semantics, with functional activation/deactivation preserving synchronous requests. Controlled parents remain authoritative. Item values must be unique. Group/item disabled state, consumer cancellation, latest callbacks and initial-only defaults follow Toggle; these are button toggles, not native radio/form inputs.

Root and Item share scoped roving focus with live DOM ordering, disabled skipping, direction/orientation, Home/End and configurable looping. Set `rovingFocus={false}` to use ordinary button tab stops. Focus alone does not change selection. `createToggleGroupScope()` composes selection and roving contexts. A group used as the first focusable Dialog control receives entry focus rather than being skipped during child registration.

## Toolbar

```tsx
import { Toolbar } from "@wsagency/radix2solid-primitives";

<Toolbar.Root aria-label="Editor">
  <Toolbar.Button>Save</Toolbar.Button>
  <Toolbar.Separator />
  <Toolbar.ToggleGroup
    type="multiple"
    aria-label="Formatting"
  >
    <Toolbar.ToggleItem value="bold">Bold</Toolbar.ToggleItem>
    <Toolbar.ToggleItem value="italic">Italic</Toolbar.ToggleItem>
  </Toolbar.ToggleGroup>
  <Toolbar.Link href="#help">Help</Toolbar.Link>
</Toolbar.Root>;
```

Buttons, links and ToggleItems participate in one outer roving group; Toolbar.ToggleGroup disables its own nested roving wrapper. ToggleItems skip both item-disabled and group-disabled states. Root defaults horizontal/looping and honours live orientation and direction. Separator defaults perpendicular to Root, with consumer orientation/decorative overrides. Space activates a focused Link once, not a focusable descendant's key event.

`createToolbarScope()` composes toolbar, toggle selection and roving contexts. All upstream long-form parts, aliases and native Props are exported for these three families. Use the same single-target factory contract for `asChild`; no cloned JSX or synthetic portal event bubbling is introduced.

## AlertDialog

```tsx
import { AlertDialog } from "@wsagency/radix2solid-primitives";

<AlertDialog.Root>
  <AlertDialog.Trigger>Delete draft</AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Title>Delete the draft?</AlertDialog.Title>
      <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
      <AlertDialog.Action>Delete</AlertDialog.Action>
      <AlertDialog.Cancel>Keep draft</AlertDialog.Cancel>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>;
```

AlertDialog reuses Dialog's native modal ownership and links while forcing modal behavior and role `alertdialog`. Cancel receives initial focus unless the consumer cancels `onOpenAutoFocus`; outside pointer/focus interaction cannot dismiss it. Cancel and Action close through the latest parent-authoritative `onOpenChange`, unless their consumer click is prevented. Escape remains cancellable. `createAlertDialogScope()` composes isolated alert content and Dialog contexts; all nine upstream parts, aliases and native Props use the same single-target factory contract. Portals retain the documented client-only SSR boundary.

## HoverCard

```tsx
import { HoverCard } from "@wsagency/radix2solid-primitives";

<HoverCard.Root
  openDelay={700}
  closeDelay={300}
>
  <HoverCard.Trigger href="/profile">Profile</HoverCard.Trigger>
  <HoverCard.Portal>
    <HoverCard.Content sideOffset={8}>
      <p>Selectable profile preview.</p>
      <HoverCard.Arrow />
    </HoverCard.Content>
  </HoverCard.Portal>
</HoverCard.Root>;
```

HoverCard uses native anchor focus/non-touch hover, cancellable Escape/outside interactions and initial-only or parent-authoritative open state with current callbacks. Content is a preview, not a focus scope: it removes descendant tab stops without autofocus or trigger restoration, and a portalled preview remains a branch of its ancestor modal for programmatic focus and scrolling. Pointer-down contains text selection, restores both ownerDocument body selection styles on release/disposal, and retains selected content after leaving; close timers recheck the selection at expiry. Dismissal cancels queued reopen requests. `createHoverCardScope()` composes HoverCard and Popper contexts; all five parts, aliases and native Props support the existing single-target factory contract. Portal SSR remains client-only.

## Tooltip

```tsx
import { Tooltip } from "@wsagency/radix2solid-primitives";

<Tooltip.Provider
  delayDuration={700}
  skipDelayDuration={300}
>
  <Tooltip.Root>
    <Tooltip.Trigger>Help</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content sideOffset={8}>
        Keyboard and hover description.
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>;
```

Provider coordinates hover delays, warm transitions and pointer transit. Non-touch hover or keyboard focus opens a tooltip; blur, activation, Escape, another tooltip or new ancestor scrolling dismisses it. Keyboard activation waits for native focus scrolling to settle and cancels on blur, pointer activation, Escape or disposal. Hoverable content uses a geometric pointer corridor; `disableHoverableContent` closes on leaving the trigger instead. Controlled roots retain parent authority and current callbacks.

Normal visible Content supplies the trigger's linked description without duplicating children; `aria-label` supplies a hidden alternative description when requested. All six parts, aliases, native Props and `createTooltipScope()` support the single-target factory contract. Portalled tooltips are modal branches, not independent focus scopes: native Tab/Shift+Tab and staged Escape remain owned by the parent dialog. `forceMount` retains closed content; consumers must hide it when closed.

## DropdownMenu, ContextMenu and Menubar

```tsx
import { DropdownMenu } from "@wsagency/radix2solid-primitives";
import { createSignal } from "solid-js";

const [checked, setChecked] = createSignal(false);
<DropdownMenu.Root>
  <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content>
      <DropdownMenu.CheckboxItem
        checked={checked()}
        onCheckedChange={setChecked}
        onSelect={(event) => event.preventDefault()}
      >
        <DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator>
        Keep this menu open
      </DropdownMenu.CheckboxItem>
      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger>More</DropdownMenu.SubTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item>Nested action</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Portal>
      </DropdownMenu.Sub>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>;
```

All three consumers share one internal Menu engine: DOM-ordered disabled-skipping keyboard navigation, repeated-character typeahead, descendant-key isolation, explicit expanded states, cancellable bubbling native `menu.itemSelect`, flipped-side pointer corridors and direction-aware submenus. Cancelling selection prevents closure, not checkbox/radio state notifications. Pointer press ownership belongs to the whole root; releasing on another item selects that item, and native pointer cancellation clears ownership without selecting.

DropdownMenu supports initial-only `defaultOpen`, parent-authoritative `open`, current `onOpenChange`, modal/nonmodal content and trigger restoration. ContextMenu opens at the current native context-menu point or after a 700ms touch/pen press; moving, releasing, cancellation, disabling or disposal cancels the pending timer. It supports parent-authoritative `open`/`onOpenChange`, but not `defaultOpen`. Reopening updates both the virtual anchor and existing content focus. Menubar uses `value`/initial-only `defaultValue`/`onValueChange`, nonmodal menus, disabled-skipping horizontal navigation and menu switching, with `dir` and `loop`.

DropdownMenu and ContextMenu expose all 16 parts; Menubar adds its `Menu` part for 17. Their corresponding subpaths, native Props and scope factories compose the same Menu contexts. All parts use the native single-target factory contract; portals retain the documented client-only SSR boundary. `forceMount` consumers own closed-state hiding. These headless components do not disable native text selection; apply consumer `user-select: none` when menu items should not select or drag text.

## NavigationMenu

```tsx
import { NavigationMenu } from "@wsagency/radix2solid-primitives";

<NavigationMenu.Root aria-label="Site">
  <NavigationMenu.List>
    <NavigationMenu.Item value="docs">
      <NavigationMenu.Trigger type="button">
        Documentation
      </NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link href="/docs">Getting started</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
    <NavigationMenu.Indicator />
  </NavigationMenu.List>
  <NavigationMenu.Viewport
    style={{
      width: "var(--radix-navigation-menu-viewport-width)",
      height: "var(--radix-navigation-menu-viewport-height)",
    }}
  />
</NavigationMenu.Root>;
```

Root uses a selected string (`''` closes), parent-authoritative `value`, initial-only `defaultValue` and current `onValueChange`. Automatic mouse activation uses `delayDuration`/`skipDelayDuration`; content transit cancels the 150ms leave timer. `activationMode="manual"` requires activation instead of hover. Sub inherits direction/activation, owns its selection and keeps a selected trigger open by default; `disableToggle={false}` enables toggling.

Sub renders a native div and accepts native attributes, ref and the single-target `asChild` factory, plus its own orientation and activationMode override. Set `disableToggle` on Sub, not Trigger; no obsolete Trigger alias remains.

The root List owns DOM-ordered, disabled-skipping arrow/Home/End focus without wrapping. An open trigger enters content with ArrowDown (horizontal) or the logical forward arrow (vertical). Native focus proxies let Tab/Shift+Tab enter and leave content rather than trapping it. Link dispatches bubbling, cancelable `navigationMenu.linkSelect`; cancelling it retains the root, not the anchor's native navigation. Consumer `onClick` cancellation does not suppress the selection event. Selected-link dismissal and Escape restore the trigger only when content owned focus; outside interactions do not steal it.

All nine parts, native Props, long-form aliases and `createNavigationMenuScope()` are available at the namespace and `/navigation-menu` subpath. Content stays inline without a Viewport; with one, native portals preserve the original Item scope and append content inside the actual Viewport target, including `asChild` decoration. Viewport dimensions use active content layout size, not transformed bounds. Indicator follows the active trigger's layout offsets; viewport width/height and indicator translation CSS variables support consumer styling. Inline content renders without a DOM; Indicator is client-only. Consumers own closed `forceMount` CSS and exit animations.

## Select

```tsx
import { Select } from "@wsagency/radix2solid-primitives";

<Select.Root
  name="fruit"
  form="order"
  required
  defaultValue="apple"
>
  <Select.Trigger aria-label="Fruit">
    <Select.Value placeholder="Choose fruit" />
    <Select.Icon />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.ScrollUpButton>▲</Select.ScrollUpButton>
      <Select.Viewport>
        <Select.Item value="apple">
          <Select.ItemText>
            <strong>Apple</strong>
          </Select.ItemText>
          <Select.ItemIndicator>✓</Select.ItemIndicator>
        </Select.Item>
        <Select.Item value="">
          <Select.ItemText>Clear fruit</Select.ItemText>
        </Select.Item>
      </Select.Viewport>
      <Select.ScrollDownButton>▼</Select.ScrollDownButton>
    </Select.Content>
  </Select.Portal>
</Select.Root>;
```

Select owns its collection and placement independently of Menu. Root supports parent-authoritative `value`/`open`, initial-only defaults and current change callbacks. Empty/undefined value displays Value's placeholder; an explicit empty Item can clear the selection. Closed children remain registered in a detached client fragment: typeahead, rich selected ItemText and native options work without opening.

Content defaults to selected-item-aligned placement with viewport bounds and scroll expansion; `position="popper"` uses Floating UI and enables Arrow plus the five `--radix-select-*` placement variables. Scroll buttons own their repeated scrolling timers. Opening focuses the selected enabled item or first enabled item; arrows/Home/End/typeahead move focus without changing value, Tab stays blocked, and Enter/Space commit. Descendant input keys remain native. Mouse opens on left pointerdown and suppresses selection on the initial stationary release; touch/pen open on click and select on item click. Escape/outside/autofocus callbacks retain cancellation.

Root creates a visually hidden native select when associated with a form, including external `form=`. It preserves name, required validation, disabled options, FormData, initial-value reset and cancellation; rejected reset/native change requests resynchronize to the parent's value. Programmatic value changes dispatch nonbubbling change; accepted user changes bubble unless the selection event's propagation was stopped. Same-value/rejected interaction markers cannot leak into later programmatic updates. Rich ItemText is rendered under its original owner into Value; custom Value children override it. Value and ItemText intentionally ignore consumer class/style like upstream.

All 18 public parts, native Props, long-form aliases and `createSelectScope()` are exported at `/select` and the namespace. `unstable_Provider` and `unstable_BubbleInput` support explicit split native-input ownership. Native single-target `asChild` factories work for Value, ItemText, Content and BubbleInput; provide reactive rich content through a child-props getter. Portals remain client-only on the server; inline default-open content renders its linked listbox/options without accessing a document.

## Unstable PasswordToggleField

```tsx
import { unstable_PasswordToggleField as Password } from "@wsagency/radix2solid-primitives";

<Password.Root>
  <Password.Input
    aria-label="Password"
    name="password"
    autoComplete="current-password"
  />
  <Password.Toggle>
    <Password.Slot
      visible="Hide password"
      hidden="Show password"
    />
  </Password.Toggle>
</Password.Root>;
```

Root's reactive `visible`, initial-only `defaultVisible` and current `onVisibilityChange` use parent authority. No misspelled callback shim is exported. Input retains the native value and form association while switching password/text; it disables spellchecking/capitalization and accepts current-password/new-password/off autocomplete. A reactive Root `id` supplies the default Input ID; an explicit Input/factory ID takes precedence and Toggle observes the actual native ID. Toggle keeps its own distinct ID.

Mouse reveal restores input focus and its remembered caret/selection/direction after the committed type change; keyboard activation keeps button focus. Cancelled clicks and pointer cancellation clear pointer ownership, so a later keyboard click cannot steal focus. Associated submission requests masking even when prevented or stopped; reset waits for native cancellation and current external form association. A controlled parent can reject either visibility request.

Toggle stays aria-hidden and outside tab order until settlement, then links the actual Input ID. Visible button text supplies its accessible name; an empty Toggle receives Show password/Hide password unless explicitly labelled. Slot accepts visible/hidden content or `render={({ visible }) => ...}`. Icon accepts visible/hidden native SVG target factories, not cloned SVG elements; supply desired SVG dimensions. Input and Toggle use the standard native single-target `asChild` contract.

All five public parts, long-form aliases and Props are available through the unstable aggregate namespace and `/password-toggle-field`; no public scope factory is added.

## Unstable OneTimePasswordField

```tsx
import { unstable_OneTimePasswordField as OTP } from "@wsagency/radix2solid-primitives";

<form
  id="verification"
  onSubmit={(event) => {
    event.preventDefault();
    console.log(new FormData(event.currentTarget).get("code"));
  }}
/>;
<OTP.Root
  aria-label="Verification code"
  name="code"
  form="verification"
  autoSubmit
>
  <OTP.Input
    index={0}
    aria-label="Digit 1"
  />
  <OTP.Input
    index={1}
    aria-label="Digit 2"
  />
  <OTP.Input
    index={2}
    aria-label="Digit 3"
  />
  <OTP.Input
    index={3}
    aria-label="Digit 4"
  />
  <OTP.HiddenInput />
</OTP.Root>;
```

Root owns a sanitized aggregate string, initial-only `defaultValue`, controlled parent authority and current `onValueChange`. Validation is numeric by default, or alpha/alphanumeric/none; whitespace is removed, and `sanitizeValue` supplies custom processing only in none mode. Paste replaces the entire code, truncates to the current DOM-ordered input count and focuses the last accepted position. Rejected controlled requests restore the actual native input.

Use one HiddenInput for the named native form value, including external `form=`; disabled roots exclude it from FormData. Accepted reset clears the code rather than restoring its initial value, and respects late cancellation/current form association. Complete changed values call `onAutoSubmit(code)` before native `requestSubmit`, after the hidden value commits. Enter also requests the associated native form.

Inputs allow filled positions plus the first empty position. Shared roving focus follows orientation/RTL and keeps composing key events out of navigation. Backspace removes and shifts a character then focuses the previous position; Delete/cut keep the current position; modified Backspace/Clear clear the code. IME ignores intermediate input and owns completion until native constraints settle; input/change/composition delivery cannot duplicate a request. Read-only/disabled guards cover editing channels.

Editing focus/selection advances immediately, including rapid repeated digits. One owned, cancellable animation frame reveals the focused input after the native editor's pending caret scroll; it never delays focus or steals a later consumer focus transfer.

The current roving tab stop receives one-time-code autocomplete and full-code maxLength; inactive fields opt out of four password managers. Explicit `index` provides initial SSR character/placeholder metadata; mounted ordering follows the DOM. Root and Input accept native single-target factories. All three parts, long-form aliases, Props and `InputValidationType` are exported through the unstable namespace and `/one-time-password-field`, with no added public scope factory.

## Slider

```tsx
import { Slider } from "@wsagency/radix2solid-primitives";

<Slider.Root
  defaultValue={[20, 80]}
  name="levels"
  minStepsBetweenThumbs={1}
  step={10}
>
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb aria-label="Minimum level" />
  <Slider.Thumb aria-label="Maximum level" />
</Slider.Root>;
```

Supply track/root/thumb dimensions and `touch-action: none` for drag surfaces. Root supports horizontal/vertical orientation, RTL and inversion. Range and measured thumb wrappers follow the same logical axis; `--radix-slider-thumb-transform` supplies the horizontal/vertical transform without double-reversing RTL/inverted positions.

Values use controlled parent authority, initial-only defaults and current callbacks. Offset-grid steps include scientific notation; arrows step once, Shift/arrows and Page keys ten steps, Home targets the first minimum and End the last maximum. Thumbs cross and sort by default; `preserveThumbOrder` constrains each thumb to its neighbors. `minStepsBetweenThumbs` enforces the gap. Native descendant key events and composition do not navigate the root.

Pointer capture owns dragging, cancellation and disposal. Change notifications follow accepted values; commit notifications occur only after a changed keyboard action or completed drag. Named hidden inputs submit one value per thumb (`name[]` for multiple thumbs), support external `form=`, exclude disabled values and restore initial values only after an uncancelled reset. Rejected controlled resets restore the current native values.

Root, Track, Range, Thumb, their long aliases/Props and `createSliderScope` are exported through `Slider` and `/slider`. The upstream unstable ThumbProvider/ThumbTrigger/BubbleInput split composition and corresponding Props are also available; all DOM parts accept native single-target factories.

## ScrollArea

```tsx
import { ScrollArea } from "@wsagency/radix2solid-primitives";

<ScrollArea.Root
  type="auto"
  style={{ position: "relative", width: "240px", height: "160px" }}
>
  <ScrollArea.Viewport style={{ width: "100%", height: "100%" }}>
    <div>Scrollable content</div>
  </ScrollArea.Viewport>
  <ScrollArea.Scrollbar
    orientation="vertical"
    style={{ width: "12px" }}
  >
    <ScrollArea.Thumb style={{ background: "gray" }} />
  </ScrollArea.Scrollbar>
</ScrollArea.Root>;
```

Native Viewport scrolling remains the source of truth. Mounted Scrollbar components enable their axes, independently of visibility; disabled axes use hidden overflow. Viewport hides native bars with its nonce-capable style element. Its native target factory owns the actual viewport, not the inner measurement wrapper. For explicit measurement, set `disableImplicitContentElement` and render Content directly inside Viewport.

Visibility modes are hover (default), scroll, auto and always. Hover remains active anywhere inside the root, then uses `scrollHideDelay` (600ms by default). Scroll hides after scrolling becomes idle and the delay expires, pausing while the scrollbar is hovered. Auto responds to current native overflow; Scrollbar/Thumb `forceMount` retain their shells for consumer-controlled animation.

Measured padding and content/viewport ratios determine thumb size and position, with an 18px minimum. RTL horizontal scrolling uses the native negative scrollLeft range; wheel handling over bars prevents page scrolling only when the viewport can move. Pointer capture preserves the grab offset and restores the exact prior body selection/viewport scroll behavior on release, cancellation or disposal.

Resize geometry commits outside ResizeObserver delivery. Deferred viewport, scrollbar and corner measurements run in an imperative native scope, not an ambient pure render scope; observers, measurement frames, scroll-position frames and hide/idle timers retain their existing owner-bound teardown. Corner needs both visible bars and is absent in scroll mode. Root exposes corner width/height variables; bars expose thumb width/height variables. All six parts, long aliases/Props and `createScrollAreaScope` are available through `ScrollArea` and `/scroll-area`, with native single-target factories.

## Form

```tsx
import { Form } from "@wsagency/radix2solid-primitives";

<Form.Root onSubmit={(event) => event.preventDefault()}>
  <Form.Field name="email">
    <Form.Label>Email</Form.Label>
    <Form.Control
      type="email"
      required
      defaultValue="reader@example.test"
    />
    <Form.Message match="valueMissing">Enter an email.</Form.Message>
    <Form.Message match="typeMismatch">Enter a valid email.</Form.Message>
    <Form.Message match={(value) => value.endsWith("@example.invalid")}>
      Use an available domain.
    </Form.Message>
    <Form.ValidityState>
      {(validity) => (validity?.valid ? "Valid" : undefined)}
    </Form.ValidityState>
  </Form.Field>
  <Form.Submit>Submit</Form.Submit>
</Form.Root>;
```

Native input constraints run before custom matchers. Validation runs on native change/invalid events; input clears previous custom validity and messages. A function matcher receives the current string value and native FormData, returning a boolean or Promise of boolean. Each registered matcher is invoked once per validation; synchronous errors publish first, and pending results cannot overwrite later edits, resets, matcher changes or disposed controls.

Field `serverInvalid` controls invalid styling and native `aria-invalid`; Root calls the latest `onClearServerErrors` even when its submit consumer prevents submission. An uncancelled reset clears validation after native reset completes; late cancellation preserves values/errors. Focus goes to the first associated invalid native control, including controls outside the form subtree. Mounted message IDs merge with consumer description IDs without duplicates and are removed on disposal.

An asynchronously asserted server error focuses and reveals only the first invalid associated field after its ARIA state updates. Clearing server errors during resubmission keeps the submit control's focus. Adding/removing a function matcher retains already published field validity; native invalid UI is suppressed without skipping managed Control validation.
`Form.ValidityState` memoizes the registered validity snapshot before invoking its render callback, so nested `Form.Message` loops remain valid under native Solid 2 tracking.
On accepted selection or clear, the bridge synchronizes before native form observers: user-originated accepted changes dispatch bubbling `input` then `change`; programmatic accepted changes dispatch a non-bubbling `change`. Initial projection, no-op and refused requests notify no events; notifications never represent cursor movement. An accepted date outside subsequently changed bounds remains in state and direct `FormData` while ordinary validated submission is blocked. `FormData` does not validate, and `form.submit()` bypasses validation; server validation remains necessary. Uncancelled form reset requests the initial accepted/default date and reprojects the current accepted value after the browser reset; controlled refusal wins. Cancelled reset does nothing, and reset emits no synthetic input/change. Standalone `checkValidity()` does not steal focus; `reportValidity()`, `requestSubmit()` and submit-button validation may focus the bridge, which redirects to the visible Trigger. Form's existing first-invalid focus policy is preserved.

Message without `match` is unconditional: conditionally render server messages with `Show`. Builtin matches include `valid`, but not `customError`; custom errors use function matchers. `forceMatch` keeps a message visible without disabling its matcher registration. Label/Control/Message/ValidityState may use an explicit name outside Field; use native `for`/`id` for independently composed labels. Root is a native form, Control a native input and Submit a native button; all seven parts, long aliases/Props, `createFormScope` and `/form` retain the single-target factory contract.

## Toast

```tsx
import { Toast } from "@wsagency/radix2solid-primitives";

<Toast.Provider
  duration={5000}
  swipeDirection="right"
>
  <Toast.Root>
    <Toast.Title>Saved</Toast.Title>
    <Toast.Description>Your changes are available.</Toast.Description>
    <Toast.Action altText="Undo from history">Undo</Toast.Action>
    <Toast.Close aria-label="Dismiss notification">Close</Toast.Close>
  </Toast.Root>
  <Toast.Viewport label="Notifications ({hotkey})" />
</Toast.Provider>;
```

Root opens by default and portals a native list item into the current native ordered-list Viewport; notification content is client-only during SSR. `forceMount` retains closed shells for consumer animations: consumers own closed-state hiding. Controlled `open` remains parent-authoritative. Provider defaults are label `Notification`, 5000ms, right swipe and a 50px threshold; Root duration zero falls back to Provider, while Provider zero or Infinity disables automatic dismissal.

F8 focuses Viewport; `hotkey` accepts native event codes and modifier-property names. Native Tab visits newest notifications first, then their tabbable descendants; Shift+Tab reverses that order. Focused Escape closes only that notification, otherwise only the top layer; `onEscapeKeyDown` can cancel dismissal. Viewport is a document-wide modal branch, so independently owned dialogs neither hide, block nor dismiss on notification interaction.

Pointer hover, focus within Viewport and window blur pause the monotonic remaining timer. Leaving/resuming focus restarts only the remaining duration; changing Infinity to finite while paused resets that remainder. Swipe events are cancellable native CustomEvents with currentTarget, originalEvent and delta. Mouse/touch start buffers are 2/10px; direction and threshold govern dismissal. `data-swipe` and move/end CSS variables support consumer animations; the post-swipe native click is intercepted before actions or consumer click handlers.

Each opening owns a two-frame-delayed, one-second status announcement, independently of standalone Announce. Foreground uses assertive priority; background uses polite. Hidden content and Close are excluded; Action contributes required nonblank `altText` instead of button text. `announcerContainer` may provide a custom element or fragment; regions, listeners, timers and pointer capture dispose with their owners. DOM/priority checks are not a screen-reader speech certification.

All seven parts, long aliases/Props, `createToastScope` and `/toast` are available. Viewport, Root, Title, Description, Action and Close retain the typed single-target native factory contract; Provider owns context, not a DOM wrapper.

## Verification

From the workspace, `pnpm check`, or the individual `pnpm build`, `pnpm typecheck`, `pnpm test:consumer`, and `pnpm exec playwright test e2e/composition.spec.ts e2e/layers.spec.ts e2e/hydration.spec.ts`. The packed consumer installs a real tarball in its own workspace, builds both environments, checks declarations/runtime graph and no-DOM inline/portal behavior, then exercises fresh client render and SSR hydration under nonce CSP with two renderIds. Layer scenarios cover keyboard, trusted Chromium touch input, custom/shadow containers, independent/nested render roots, animation interruption and disposal. `pnpm test` also runs the development gallery checks. Physical-device/mobile, manual screen-reader and final whole-scope release gates are not implied by these checks.

Layer/menu suites also run CSR/SSR projects in Firefox and WebKit. Trusted taps run in each engine; the trusted swipe test explicitly requires Chromium's CDP input protocol. The independent tarball runner executes the whole configured suite, not a stale file list. WebKit may need system libraries compatible with the installed Playwright build.

Upstream behavior adapted from `radix-ui/primitives` snapshot `c71610373b6aa17de24f5c7484ced5108160f12b`. MIT license, Copyright (c) 2022 WorkOS, retained in `LICENSE`, alongside the Radix2Solid contributors' 2026 notice.
