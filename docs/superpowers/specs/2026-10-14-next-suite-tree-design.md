# Native Tree

Status: **Proposed written specification awaiting user review.** This is an accessibility and state contract, not implemented behavior, test evidence or an implementation plan.

## Purpose and boundary

Provide a genuine composite tree with explicit hierarchy, one tab stop, independent focus/selection/expansion and stable item keys. A disclosure navigation list remains a different valid component; this proposal does not migrate existing sidebars or force tree roles onto ordinary navigation.

Initial scope is single selection or action-only navigation. No multi-selection, checkbox cascade, virtualization, drag/drop, rename, loader, router, persistence or permission engine. Native Solid 2 RC15, existing TS7 producer/TS5.9 consumer floor, no React/Solid 1/new dependency. Styling is an existing-pattern Themes recipe, not another behavior engine.

## Public API

Namespace/subpath: `Tree` / `@wsagency/radix2solid-primitives/tree`; existing long-name/short-alias exports, scoped contexts, refs and native target-factory `asChild` apply.

| Part | Contract |
| --- | --- |
| `Root` | `selectionMode: 'single' \| 'none'` (default single); `value/defaultValue: string \| null` (default null); `onValueChange(value)`; `expandedValues/defaultExpandedValues: readonly string[]` (default empty); `onExpandedValuesChange(values)`; `dir`; explicit accessible label. |
| `Item` | `value: string`, `textValue: string`, `disabled?: boolean`, `hasChildren?: boolean` (default false), cancellable `onActivate(event)`; native `aria-level`, `aria-posinset`, `aria-setsize` for partial-data metadata. Focusable treeitem, not a separate input control. |
| `ItemText` | Visual label and accessible-name reference. textValue is the explicit plain-text typeahead source regardless of rich children. |
| `ItemIndicator` | Presentational expanded/selected affordance; no independent state. |
| `ItemGroup` | Nested group owned by nearest parent Item; renders descendants only while that parent's accepted expansion is true, with existing presence/forceMount convention. |
| `ExpandTrigger` | Optional button, tabIndex -1, explicit accessible name; toggles nearest branch on pointer/assistive activation without selecting or activating that branch. |

Keys are nonempty, unique within Root and stable across reorder. Duplicate detection applies when nodes register; duplicates then are configuration errors, not index-based identities. The primitive cannot certify keys of never-rendered descendants without a forbidden prewalk; authors remain responsible for data-wide uniqueness. Item nesting through ItemGroup supplies parent identity. `hasChildren=true` declares a branch even when its children have not arrived; leaves never receive aria-expanded. Do not discover branch semantics by walking/evaluating child content.

Single selection uses one accepted key; selectionMode none omits aria-selected and ignores selection props/callbacks. Switching to none does not mutate the stored key; switching back reflects the supplied/current key if present. Expansion is a set represented as an array: callbacks contain unique keys, preserving existing order and appending newly expanded keys. No-op changes do not notify. Controlled callbacks propose changes; accepted props alone determine rendered selection/expansion.

## Exact interaction semantics

Focus, selection, activation and expansion are separate:

- Arrow movement/typeahead changes focus only; never selection, navigation or expansion except the explicit branch-arrow rules below.
- Space on an enabled item requests that key in single mode; in none mode it is consumed without an action. It never toggles an already selected key off. Programmatic null clears selection.
- Enter or primary click on the enabled item's own row dispatches one cancellable onActivate event. If not prevented, request its selection in single mode. Root does not navigate or run a second action; application code inside onActivate owns any domain action. Cancellation prevents default selection, not side effects already performed by the caller.
- Enter does not implicitly expand/collapse a branch. ExpandTrigger and branch arrows own expansion; this avoids a branch click simultaneously navigating and toggling.
- ExpandTrigger stops row activation. Events from descendant items do not activate ancestors. Additional embedded interactive controls are not part of this composite-tree contract; use a disclosure list or separate contextual controls when rows require arbitrary tabbable actions.
- An accepted selection change does not move DOM focus. An external expansion change does not steal focus unless it hides the currently focused descendant. A controlled rejection leaves existing state intact; no optimistic checked/expanded attributes or repeated callback loop.

### Keyboard and disabled policy

One tab stop enters the current visible enabled focused item, otherwise the selected visible enabled item, otherwise the first visible enabled item. An empty tree or tree without enabled nodes gives Root the tab stop. Returning focus prefers the prior surviving visible item. Tab leaves the composite normally.

Up/Down traverse visible enabled preorder; Home/End first/last visible enabled item, no wrap. In LTR, Right opens a closed branch or moves to its first visible enabled descendant when already open; Left closes an open branch or moves to the nearest enabled visible ancestor. In RTL, Left/Right reverse these logical open/close operations. A leaf has no open operation. Do not intercept events from ExpandTrigger as item navigation.

Printable characters without Ctrl/Meta/Alt perform case-insensitive prefix typeahead using textValue. The buffer expires 1000ms after the last printable key, the same fixed reset as native Menu and Select typeahead (`packages/primitives/src/menu/menu.tsx`, `packages/primitives/src/select/select.tsx`). It also clears when focus leaves the tree. Repeated same characters cycle matching items. Search begins after the current item and wraps for matching only, without changing expansion. Composition events never perform typeahead or activation. Native event cancellation wins over built-in behavior.

Disabled is per node, not inherited by its subtree: a disabled node cannot focus, select, activate or change expansion through user input. Already expanded descendants remain visible and enabled unless individually disabled. An application can change its expansion programmatically. Traversal skips the node but includes visible enabled descendants; parent navigation skips disabled ancestors. This preserves independent permissions instead of equating a read-only folder with an unusable subtree. There is no separate readOnly prop: navigation/expansion are not editing permissions.

## Dynamic hierarchy and focus repair

Registration uses actual visible DOM order, explicit parent context and stable keys. Reorder preserves focused identity and selected key; navigation order must update even if no item re-registers. Hidden/closing groups are excluded from navigation immediately, even when retained for an exit animation or forceMount. Hidden descendants cannot retain a tab stop.

Before an accepted collapse hides the active descendant, focus its enabled branch item; if that branch is disabled, choose its nearest visible enabled ancestor, then the next enabled item outside the subtree, then previous, then Root. Apply this only if focus is currently inside the collapsing subtree; do not steal focus from outside the tree. A refused collapse does not move focus.

When the focused item is removed, use its surviving visible enabled ancestor, then the next item at the old visible position, previous item, then Root. Changing a focused node to disabled uses the same repair. If focus was already outside, only repair the future tab stop, not activeElement.

Removing a selected item does not select another item. Keep its keyed selection state while it is unmounted or absent: collapsed/lazy data must not erase an application selection. No mounted item shows selected until that key returns, and no hidden selected node is automatically expanded. Applications deliberately clear permanently deleted selection with null. Expansion keys likewise may remain while a branch is absent and apply if it returns; no loader or stale-data cache is implied.

## Accessibility, partial data and SSR

Root has role tree and an accessible name. Items have role treeitem; ItemGroup has role group. Leaves omit aria-expanded. Branches reflect accepted expansion. Selectable enabled items in single mode expose aria-selected; disabled selected items may retain selected state but cannot be newly selected. None mode omits selection semantics. Focus and selection must have distinct visual treatments.

Complete nested DOM permits browser-derived hierarchy positions. Partial sibling rendering requires explicit correct native `aria-level`, `aria-posinset`, `aria-setsize` on each affected Item; unknown total uses aria-setsize=-1. Values are positive integers for level/position and positive integer or -1 for size, with position not exceeding known size. Forward the existing Primitive ARIA attributes without duplicate prop aliases. Authors supply these from data; the primitive must not guess missing siblings from visible DOM. `hasChildren`, `aria-busy` and supplied children support an unloaded branch boundary, but no load callback, request scheduling, retry or cancellation service is introduced.

SSR emits accepted expanded structure, selected state, labels and deterministic IDs from props/context, without client registration or descendant prewalk. Hydration preserves that structure. Client registration may establish focus order but must not rebuild the rendered hierarchy. Cleanup unregisters items and clears typeahead/presence resources. A selected key is not automatically a form field: no name/required/reset contract; application serialization is separate.

## Reuse and alternatives

Within `packages/primitives/src/`, reuse `internal/collection.ts:1–21` for flat registered order, `internal/roving-focus.tsx:28–87` where its real-focus behavior fits, `internal/state.ts:1–28`, `internal/events.ts`, native Slot and ref cleanup. Tree owns hierarchy and visibility, which the collection does not represent. Vertical roving focus leaves Left/Right free for branch navigation. `collapsible/collapsible.tsx:12–48` is an expansion/presence reference, not a separate Tree expansion store.

Disclosure composition using Collapsible plus nested lists/links is preferred for ordinary sidebar navigation. An external native tree implementation becomes credible if actual multi-selection/virtualization requirements justify its larger model; none was consulted, selected or licensed by this design. Merely applying tree roles to disclosure buttons is not an alternative implementation.

## Required acceptance and documentation

- Built root/subpath exports, native asChild/ref/cancellation and TS7/TS5.9 consumer declaration checks.
- Browser fixture with duplicate labels/unique keys, deep branches, single/none mode and distinct focus/selection/activation/expansion callback counts. Assert cancelled activation and parent refusal without optimistic state.
- Visible preorder after reorder without remount, typeahead timeout/repeated characters/IME, Home/End, LTR/RTL branch keys and disabled-parent/enabled-descendant policy.
- Collapse a focused grandchild, rejected collapse, external focus, removal/disable repair, retained hidden selection, empty tree and disposal/remount without stale listeners or IDs.
- Server-expanded HTML and stable node-preserving hydration; correct leaf omission and partial-data positional metadata. Test actual DOM focus, not merely tabindex snapshots.
- Native API page plus styled live example/playground showing callbacks, expansion and focus/selection distinction. Document disclosure alternative and excluded domain features. Follow existing website native-route/navigation/snippet checks and Themes recipe conventions.
- Targeted screen-reader interaction evidence is separate from DOM/axe; do not advertise APG certification from role assertions.

Reference: [WAI-ARIA tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/). This document intentionally chooses a single-selection interaction model; future multi-selection requires separate reviewed semantics.
