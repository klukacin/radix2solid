# Native Combobox and Command

Status: **Scope and written specification accepted by explicit user authorization on 2026-10-14.** Plan and internal review precede implementation and deployment, without another human workflow-review pause; the suite index records the publication boundary. No behavior or acceptance check below is claimed implemented or tested.

## Purpose and boundaries

Provide an editable, single-key chooser and an action-search list as separate native Solid primitives. Reuse native state, collection, layers, Popper, events and Slot. Styling belongs in existing website Themes recipes. Select remains a noneditable chooser; Command does not become a value-selection control.

No freeform values, multiple selection/tokens, virtualization, loader, fuzzy-search dependency, routing, global shortcut registry or persistence engine. No consumer migration. Keep the exact Solid 2 RC15 tuple and TS7 producer/TS5.9 declaration-consumer floor; no React, Solid 1 or new dependency.

## Combobox public contract

Public namespace/subpath: `Combobox` / `@wsagency/radix2solid-primitives/combobox`. Parts follow existing long-name and short-alias conventions and native target-factory `asChild`.

| Part                        | Contract                                                                                                                                                                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Root`                      | `items: readonly ComboboxItem[]`; `value/defaultValue: string \| null`; `onValueChange(value)`; `query/defaultQuery: string`; `onQueryChange(query)`; `open/defaultOpen: boolean`; `onOpenChange(open)`; `filter`; `disabled`, `readOnly`, `required`, `name`, `form`, `dir`. Defaults: null selection, closed, enabled, editable, optional. |
| `Input`                     | Native text input, role combobox and aria-autocomplete=list, forwarded input/ref/description attributes; consumer must supply an accessible name through a label or ARIA. Sole text-editing and normal tab target; Root owns value/form wiring.                                                                                              |
| `Trigger`                   | Optional `type=button`, outside the tab sequence; consumer supplies its accessible name. Toggles popup without taking input focus. Disabled/read-only prevents toggling.                                                                                                                                                                     |
| `Portal`, `Content`         | Existing native portal and nonmodal layer/Popper conventions; content anchored to Input. Content supports explicit labels/descriptions and position props consistent with existing Popper consumers.                                                                                                                                         |
| `List`                      | Listbox with Root-owned ID; holds rendered options/groups.                                                                                                                                                                                                                                                                                   |
| `Item`                      | Required `value` key into Root items; optional consumer events/ref/asChild. Root supplies label, disabled and matching state. Nonmatching items do not participate in DOM navigation.                                                                                                                                                        |
| `ItemText`, `ItemIndicator` | Label presentation and committed-selection indicator; neither owns state. ItemText can contain rich presentation without changing the data label.                                                                                                                                                                                            |
| `Group`, `Label`, `Empty`   | Named option grouping and a non-option empty status. Empty is shown when there are no rendered matching options.                                                                                                                                                                                                                             |
| `Clear`                     | Optional named `type=button` (consumer supplies accessible name) requesting null value and empty query, closing popup and restoring input focus. No mutation when disabled/read-only.                                                                                                                                                        |

`ComboboxItem` is `{ value: string; label: string; disabled?: boolean }`. Keys must be unique, nonempty and stable. Invalid duplicate/empty keys are configuration errors, not silently merged options. Labels are plain text and may repeat. Root data, not Item mounting or descendant traversal, supplies the selected label on the server. Rich item children are presentation only.

### Query, filtering and commitment

`query` is the visible input text, not the submitted key. Omitting `defaultQuery` initializes it from the accepted selected item's label, otherwise from the empty string. An explicit query is allowed to differ, including on first render; that is an unresolved draft. Programmatic accepted-value changes request the corresponding label through `onQueryChange`, but controlled query remains parent-authoritative.

Default filtering is case-insensitive substring matching of `label` against trimmed query, with original item order and no ranking. `filter(item, query): boolean` replaces it; `filter={false}` disables built-in filtering. An application obtains query through `query/onQueryChange` (or observes uncontrolled changes with the callback), and can render a subset of Item keys while retaining complete selected-label data in `items`. There is no hidden search service or requirement to mount unfiltered rows. Filtering changes never select a value.

Typing requests query changes and opens suggestions when editable; it does not change the committed key. Opening by Trigger shows matches for the current query. Up/Down activate the next/previous enabled visible option, without wrapping; opening via Down chooses the first and via Up the last. Merely opening with Trigger does not commit or select the first match. Active suggestion and committed selection are separate visual states.

Enter with an active option requests its key and label and closes the popup. That Enter is consumed and cannot also submit the surrounding form. Without an active option, Enter remains a normal form submission attempt, subject to validity below. Pointer activation follows the same commit path once. Escape closes and requests the accepted label, without clearing an already accepted value. Blur leaving the entire input/popup surface closes and requests that label; it never accepts a suggestion automatically. Blur to an option must not preempt its pointer activation.

`Clear` requests null/empty even when a selection exists. Typing an empty draft does not implicitly clear a committed key: it remains unresolved until Clear, selection, or blur/Escape resolution. With null selection, empty query is resolved. This distinction prevents clearing text from silently submitting an old choice.

All controlled props remain authoritative. Callbacks carry proposals, not proof of acceptance. Item commit requests key, matching query and close; it does not assume updated controlled props are synchronously readable after a callback. Reconcile the label from accepted key state once that state becomes observable. If key/query acceptance diverges, the visible mismatch stays invalid with no successful submitted key; blur/Escape requests the currently accepted label. Suppress no-op callbacks and do not repeatedly re-request rejected reconciliation on every render. An asynchronously accepted key follows the same label-reconciliation path; query remains independently parent-authoritative.

### Form correctness and data replacement

A resolved value means either (a) null key plus empty query, or (b) an existing enabled item key whose label exactly equals the visible query. Nonempty unmatched text, a missing/disabled accepted key, and an empty draft over a nonnull key are unresolved.

Only a resolved nonnull key produces a successful named form field. Unresolved drafts must omit/disable that field, so even direct `FormData` construction or validation-bypassing `form.submit()` cannot accidentally serialize a stale choice. The visible input has no submission name; native input validity blocks ordinary submit/requestSubmit for unresolved drafts and for required null selection. Use a focusable visible input for invalid focus, not an unfocusable required hidden input. Propagate `aria-invalid` consistently. Client validation is not server authorization.

Form synchronization follows the existing Select value/reset/native-event patterns. The checked-state-specific form helper is not assumed to support text keys. Native user input/change events and accepted selected-key changes must not double-dispatch synthetic change events. Both visible validation input and successful key field use Root `form`, including external ownership. Root owns `name`/`form` for submission; conflicting Input values are not a second association.

Reset restores the captured initial key and query, closes the popup and clears active suggestion. Controlled reset requests those values, then reflects accepted props even when the parent refuses. Prevented reset does nothing; pending reset callbacks are disposed on unmount. If the initial key is no longer available, reset is invalid rather than inventing a replacement.

Removing/disabling the accepted item requests null once per removal transition; it never selects a neighboring item. Uncontrolled state accepts the clear and requests empty query. Controlled refusal retains the key but marks the field unresolved, with no successful submitted value. When a known record disappears, its last data label may remain as the visible draft until reconciliation; initial unknown keys start without a derived label and are invalid. Supplying the matching data later resolves only when its label equals accepted query. Keeping a selected record in Root data while filtering its row avoids this case.

`disabled` removes interaction and successful submission. `readOnly` keeps focus, copying and submission of a resolved key but prevents edit/open/clear/selection. Native read-only inputs are barred from constraint validation: do not claim required validation in this mode; unresolved keys still never submit. Required is meaningful only when editable and enabled.

### Accessibility, SSR and lifecycle

Input retains DOM focus with `aria-activedescendant` only while its active option is mounted and visible. List/option IDs come from native owner-scoped generation. `aria-selected` identifies the active suggestion; a distinct `data-state`/indicator identifies the committed value. Accessible names are explicit; generated IDs do not require child prewalks. Content is nonmodal, with no Select focus trap or automatic option focus.

Do not intercept IME composition Enter/navigation. Preserve native Home/End, Left/Right, selection and Ctrl/Meta editing shortcuts, including RTL. Tab follows normal page navigation and resolves blur; options/trigger are not additional tab stops. Scrolling the active option into view must not move DOM focus. Touch activation must not break list scrolling.

Removal, filtering and reorder reconcile active identity against actual visible DOM order; clear dangling active-descendant references before unmount. Choose the next enabled visible option at the previous position, then the previous one, or none. Do not depend solely on collection registration-version changes to detect reorder. Cleanup registration, observers, timers and positioning on disposal.

SSR emits data-defined selected text, deterministic IDs, initial aria-invalid and successful-field participation without DOM measurements. Browser custom-validity synchronization starts during hydration; no custom-validation-before-JavaScript guarantee is made. Even server HTML omits a stale successful key. Follow the existing native portal server/client contract rather than claiming server-rendered portal options. Hydration preserves the input node and text before client registration/positioning.

## Command public contract

Namespace/subpath: `Command` / `@wsagency/radix2solid-primitives/command`.

| Part             | Contract                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Root`           | `search/defaultSearch: string`, `onSearchChange(search)`, `loop: boolean` (default true). No selected value, open state, form name or global shortcuts.                                                                           |
| `Input`          | Native text input with combobox/listbox active-descendant semantics and aria-autocomplete=list; consumer supplies an accessible name. Value owned by search state.                                                                |
| `List`           | Results listbox, Root-owned ID, accessible name.                                                                                                                                                                                  |
| `Group`, `Label` | Named result grouping without an independent cursor.                                                                                                                                                                              |
| `Item`           | `value: string`, `textValue: string`, `disabled?: boolean`, cancellable `onSelect(event)`. Identity is not persisted selection.                                                                                                   |
| `Empty`          | Non-option status when zero matching result options are rendered; callers can provide a separate loading status. Visible disabled options still count as results: an all-disabled list has no active suggestion but is not empty. |

Caller owns filtering, ranking and rendering. Command performs no automatic string filtering: this avoids overriding domain ranking and makes remote results ordinary child updates. Search changes request the string and reset active suggestion to the first enabled rendered result after the resulting item update. Otherwise preserve active identity across reorder; removal chooses the next/previous visible enabled item or none. Root cleanup removes cursor registrations; no async action scheduler is added.

Input focus remains in place; Up/Down wrap by default, optional `loop=false` clamps. Enter dispatches one cancellable selection event for the active enabled item and prevents surrounding form submit, including when there is no active result. Pointer click/tap uses the same once-per-gesture path. Composition Enter never selects. Native editing keys remain native. Disabled items cannot activate; there is no separate readOnly value-field contract.

`onSelect` follows existing consumer-first cancellable event conventions. It is an action notification, not a value update; primitive state never records a selected command. A single gesture emits once, not on both pointerup and click or keydown plus synthetic click. Later deliberate activations may execute again. Cancellation prevents recipe default close/completion, not consumer code already executed; consumers must cancel before side effects they intend to suppress.

Inline Command has no implicit close behavior. The Dialog recipe supplies an item handler: invoke the application's optional cancellable guard, return if prevented, request Dialog close, then invoke the action exactly once. A controlled Dialog refusing close does not suppress an otherwise accepted action. Exactly-once notification follows the single gesture/event path and cancellation contract; no action-recursion or async execution machinery is introduced. Root itself installs no global Ctrl/Cmd+K listener.

Dialog owns title/description, modal containment and restoration. Recipe focuses Command.Input on opening and resets search explicitly; inline Root does not reset on arbitrary rerender. Actions opening another modal or navigating may cancel Dialog restoration to avoid stealing focus. Transient `aria-selected` denotes the active suggestion only. Group labels and empty status do not become options.

## Shared boundaries and alternatives

Within `packages/primitives/src/`, reuse `internal/state.ts`, `internal/collection.ts`, `internal/events.ts`, `internal/focus-scope.ts`, `internal/dismissable-layer.ts`, `internal/popper.tsx`, `internal/primitive.tsx`, and `slot/slot.tsx`. A small internal active-descendant navigator is justified by these two consumers; do not publish a generic selection/state-machine engine. Select's DOM-focus/modal behavior and Menu's roving-focus behavior are not reusable wholesale.

Composition-only native select or app-owned input/listbox remains cheaper for a single isolated need. An external native port is a credible alternative if future requirements exceed these contracts, but requires exact provenance/license and RC15 ownership evaluation; none was selected or consulted here.

Source evidence, all relative to `packages/primitives/src/`: `select/select.tsx:68–105,154–242,296–319,362–388`; `internal/form-control.ts:1–104`; `menu/menu.tsx:183–217`; `hover-card/hover-card.tsx:86–140`; `internal/overlay.tsx:30–164`. These are static observations, not runtime proof.

## Required acceptance and public documentation

- Built root/subpath exports and strict TS7/TS5.9 consumer types, native asChild/ref/event cancellation; no React or extra dependency graph.
- Combobox actual submit-button/requestSubmit, invalid focus, FormData, empty draft, selected-data removal, required/optional, disabled/readOnly, controlled refusal, prevented reset and external forms. Explicitly assert no stale key while draft differs.
- Input cursor/selection, IME, arrows, RTL, touch scrolling/commit, empty results, filtering/reorder/removal and cleanup. Verify active-descendant always names a live option.
- Inline and Dialog Command: exactly-once action/cancellation, query replacement, disabled results, no accidental form submit, Escape/return focus and action opening another Dialog.
- SSR selected label before JavaScript, stable IDs, input node-preserving hydration; popup inside Dialog and outside interaction. Observe actual focus/state, not only attributes.
- Native API documentation plus styled live example/playground for each family using existing website recipe, navigation, snippet-check and native-route conventions. Examples expose key/query/action output and a real form; distinguish selection from commands. Screen-reader interaction checks are separate evidence from DOM/axe, not blanket APG certification.

Accessibility reference: [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). These acceptance requirements are bounded future work, not a full old-matrix rerun or an implementation plan.
