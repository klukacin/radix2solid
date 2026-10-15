# Next Suite Native UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete native Combobox, Command, Tree and two-pane Splitter contracts.

**Architecture:** Inputs share only an internal active-descendant cursor; their state and form/action semantics remain separate. Tree adds parent/visibility context over registered DOM order; Splitter uses one local measurement boundary and pure two-pane constraints. All families use current scoped contexts, Primitive/Slot target factories, events, refs and cleanup.

**Tech Stack:** Exact Solid RC15 tuple, TS7.0.2 producer/TS5.9.3 consumer, existing Vite/node:test/Playwright; no additional dependency.

**Spec:** `../specs/2026-10-14-next-suite-combobox-command-design.md`, `../specs/2026-10-14-next-suite-tree-design.md`, `../specs/2026-10-14-next-suite-splitter-design.md`, and suite index. [Master plan](2026-10-14-next-suite.md) owns shared integration, gates and release.

## Global Constraints

- All master global constraints apply, particularly native parent-authoritative controlled state and no descendant prewalk. Default query/selection/form state must be meaningful on the server, before registration.
- Public namespace/subpath: `Combobox`/`combobox`, `Command`/`command`, `Tree`/`tree`, `Splitter`/`splitter` under `@wsagency/radix2solid-primitives`. Functions return native `Element`. Each family index exports long-name functions, short aliases, `create<Family>Scope` and named public props; root function is `<Family>` aliased as `Root`.
- Each owner changes only its listed files. Integration owner alone updates package/root exports, Vite entry map, shared type/distribution inventories, gallery composition, README/changelog and Playwright project matches.
- Component owners edit tests/source only, never run checks/formatters/Git/builds or spawn agents. The designated native integration/gate worker under tool-less Main runs commands and records evidence in the shared private ledger. Main dispatches implementation only after receiving behavioral RED; it never executes gates itself.
- Four UI families get native API docs and styled live website examples in master Task 8; no new exported Themes behaviour wrappers or fictional upstream React links.

## Review Focus

- U2: rejected/late independent key/query updates must never submit an old key.
- U1/U3: removing/reordering rendered results without remount must preserve identity or repair to a live option.
- U4: accepted collapse/disable/removal repairs focus only when focus was in the affected tree, not elsewhere.
- U5: layout/axis/constraints changing during capture must terminate without a commit or stale baseline.
- U2/U4/U5: SSR first structure and node identities survive hydration before registration/measurement.

---

## Mandatory test-first dispatch rounds

1. **RED authoring:** Inputs owner creates only `e2e/inputs.spec.ts`; Tree owner only `e2e/tree.spec.ts`; Splitter owner only `e2e/splitter.spec.ts`. Each imports Playwright only, visits existing `/` or `/csr` using `info.project.name.endsWith('csr')`, and asserts the absent named controls and public outcomes below. Do not yet add new gallery imports, package exports, product files or fixtures.
2. **RED gate:** Integration/gate worker updates only intended Playwright project matches and runs `pnpm exec playwright test e2e/inputs.spec.ts e2e/tree.spec.ts e2e/splitter.spec.ts --project=ssr --project=csr` against the existing buildable gallery on 4147. Record missing-control assertion failures. A module/compile error is not accepted behavioral RED; fix test wiring, not product behavior.
3. **Implementation dispatch:** Main receives RED evidence, then separately releases U1–U5 source/fixture work. “Author/implement” steps below describe test and code obligations within that dispatched slice, not permission to implement before the RED round.
4. **GREEN gate:** After the owners finish edits, integration worker wires/builds/packs once, then runs the listed real state/focus/form/geometry/hydration assertions. Pure Splitter math test is added with implementation and run by the gate worker; missing-module failure is not substituted for behavioral RED. No mock exports or fake fixtures.

## Task U1: Small internal input active-descendant navigator

**Files:** Create `packages/primitives/src/internal/active-descendant.ts`. Behavior checks live in U2/U3 `e2e/inputs.spec.ts`; do not publish this helper or add a general state engine.

**Interfaces:** Export only to the two input source files:

```ts
type ActiveDescendantItem = { key: string; id: string; node: HTMLElement; disabled: boolean };
createActiveDescendant(options: {
  items: () => readonly ActiveDescendantItem[];
  loop: () => boolean;
}): {
  active: Accessor<string | null>;
  activeId: Accessor<string | undefined>;
  setActive(key: string | null): void;
  move(intent: 'first' | 'last' | 'next' | 'previous'): void;
  reconcile(reset?: boolean): void;
};
```

`items()` supplies actual mounted visible DOM order from existing collection, not Root data order; the helper never reads selection/form/action state. Caller owns list DOM observer and calls reconcile on membership, visibility, search-result replacement and DOM-only reorder. The helper stores previous enabled order/position only as needed for next-at-old-position then previous fallback, and scrolls active nodes without moving focus. Disabled rendered options count toward Empty but cannot become active.

- [ ] Write the shared `active-lifecycle` case in U2's fixture: preserve key through DOM-only reorder; remove/filter active result and assert next at old position, else previous, else no `aria-activedescendant`; every nonempty ID resolves to a visible live option. No dangling ID after disposal/remount.
- [ ] Implement cursor identity and clamped/loop movement with no extra filtering or selection. Clear reference before unregister/hide; own observer cleanup at List boundary rather than a document-wide observer. Composition/native editing is handled by Input, not this helper.
- [ ] Hand helper to U2/U3 in the same owner. Designated gate worker executes cases through input integration; no standalone helper export/test framework.

## Task U2: Combobox data, interaction and native form correctness

**Files:** Create `packages/primitives/src/combobox/combobox.tsx`, `packages/primitives/src/combobox/index.ts`, `apps/gallery/src/inputs.tsx`, `e2e/inputs.spec.ts` (also owned by U3).

**Interfaces:** Public `ComboboxItem = { value: string; label: string; disabled?: boolean }`; `ComboboxProps` has `items: readonly ComboboxItem[]`, `value/defaultValue?: string | null`, `onValueChange?: (value: string | null) => void`, `query/defaultQuery?: string`, `onQueryChange?: (query: string) => void`, `open/defaultOpen?: boolean`, `onOpenChange?: (open: boolean) => void`, `filter?: false | ((item: ComboboxItem, query: string) => boolean)`, `disabled/readOnly/required?: boolean`, `name/form?: string`, `dir?: Direction`, children/scope.

Parts/types: `ComboboxInput`, `Trigger`, `Portal`, `Content`, `List`, `Item`, `ItemText`, `ItemIndicator`, `Group`, `Label`, `Empty`, `Clear`, each corresponding `<long-name>Props`. Input native props exclude conflicting owned text value/name/form; Root owns submission association. Item requires `value: string`; Root supplies label/disabled/matching. Content extends current PopperContent positioning props plus applicable nonmodal layer cancellation and `forceMount?: true`; Portal follows native container/forceMount convention. Trigger/Clear are named native buttons with `type=button`, `tabIndex=-1`, input focus restoration. No separate published BubbleInput/Provider API.

**Reuse:** `createControllableState`, `createContextScope`, `createCollection`, `composeEventHandlers`, `dispatchCancelableEvent` only where needed, `composeRefs`, `createPresence`, `createLayer`, Popper/Input anchor, native portal; Select's reset/native-event flow without its modal trap/DOM-focused option implementation.

- [ ] Author `draft-form` fixture/case with real form, submit button, requestSubmit and direct FormData. Initial selected label renders from Root data without mounted options. With key `alpha`, label `Alpha`: query `draft`, empty draft and query/key rejection all assert `FormData.has(name) === false`; ordinary submission blocked and visible Input receives invalid focus. Accepted exact `Alpha` submits `alpha`. Null/empty optional resolves; required null fails; disabled omits; readOnly resolved submits/copies but cannot mutate and does not claim required native validation.
- [ ] Author `controlled-split-acceptance`: independently accept/refuse/query/key/open proposals, and accept asynchronously after callback. Assert accepted props determine text/indicator/open; divergent acceptance stays invalid with no successful field. No repeated reconciliation callbacks per render or no-op callbacks; late accepted key requests the correct label once. Accepted record removed/disabled requests null once per transition, never chooses neighbor; refused clear stays invalid; matching data reappearing resolves only when accepted query matches.
- [ ] Implement data validation (unique nonempty stable keys), three independent controllable states and exact resolved predicate. Default query is captured explicit default or accepted initial item label/empty. Default filter is case-insensitive `label` substring of trimmed query in original order, function replaces it, false bypasses it. Item presentation never becomes data. Missing/nonmatching rows do not participate in navigation; Empty counts rendered matching rows, including disabled ones.
- [ ] Implement focus-preserving Input/List/Item semantics: Down/Up opens at first/last enabled result, subsequent arrows clamp; Trigger opens current matches without implicit selection. Enter with active result requests key/label/close once and consumes form submit; without active result normal valid form attempt remains. Click/tap shares one commit path (not pointerup plus click); blur to a row does not preempt its activation, while blur leaving input/popup surface closes and requests accepted label. Escape resolves label without clearing key; Clear requests null/empty and close. ReadOnly/disabled prevent edit/open/clear/selection.
- [ ] Implement Root-owned successful key field only for resolved enabled nonnull key, with visible unnamed validation Input and custom validity/aria-invalid client sync. Both fields use Root `form`; do not use required hidden input. Preserve accepted-key change-event semantics without duplicating native input/change. On controlled refusal restore actual native value at normal flush/render boundary, not optimistic immediate-read state.
- [ ] Author/implement `reset-data`: external form association, conflicting Input association cannot redirect submission, normal/prevented reset, captured initial key/query, controlled reset refusal, unavailable initial key remains invalid, reset after unmount cannot fire stale callbacks. Reset closes/clears active; programmatic value changes request label; missing initial key derives no invented label.
- [ ] Author/implement `input-editing` and `active-lifecycle`: IME Enter/arrows do not select/navigate, Home/End/Left/Right/native selection and Ctrl/Meta editing in LTR/RTL remain native, Tab exits normally, active scroll does not move input focus, touch scrolling is not selection, rich labels/duplicate labels use unique data keys, all-disabled and zero rows behave distinctly. List observer reconciles DOM-only reorder and owns cleanup.
- [ ] Add `input-native-targets` to the behavior checks: use native target-factory `asChild` button/anchor Items and button Trigger/Clear, forwarded refs and consumer preventDefault. Input Enter plus browser-synthesized click must not double-commit; direct pointer/assistive activation emits once. Command Item button/anchor default activation cannot double onSelect or accidentally submit/navigate after cancellation; preserve native text-input Space/editing. Observe callbacks and actual default behavior, not only emitted props.
- [ ] Author/implement `ssr-hydration`: server selected label/IDs/invalid state/key omission before JS, native portal contract (no claimed server portal options), input identity/text preserved during hydration, nonmodal popup inside Dialog/outside interaction. `aria-selected` means active suggestion; distinct `data-state`/indicator means committed key. Labels/descriptions are forwarded; every interactive demo has an explicit accessible name.
- [ ] Deliver namespace/types and fixture `export function Inputs(): Element` for Task 7. Designated gate worker runs built/packed `GALLERY_PACKED=1 pnpm exec playwright test e2e/inputs.spec.ts --project=ssr --project=csr` and master targeted FF/WK. Passing requires actual validity/focus/submitted keys and native-target cancellation, not callback-only checks.

## Task U3: Action-only Command with inline/Dialog recipes

**Files:** Create `packages/primitives/src/command/command.tsx`, `packages/primitives/src/command/index.ts`; extend the same `apps/gallery/src/inputs.tsx` and `e2e/inputs.spec.ts`. Consume U1; same owner as U2 avoids same-file races.

**Interfaces:** `CommandProps` has `search/defaultSearch?: string`, `onSearchChange?: (search: string) => void`, `loop?: boolean` default true, children/scope. Parts/types: `CommandInput`, `List`, `Group`, `Label`, `Item`, `Empty`. `CommandItemProps` has `value: string`, `textValue: string`, `disabled?: boolean`, `onSelect?: (event: Event) => void` over native Primitive row props. Root has no value, form name, open, readOnly or global shortcut contract. Item identity is not stored selection. Input is native unnamed text input with Root-owned search; explicit accessible names on Input/List.

- [ ] Author `command-actions`: Up/Down wraps by default and clamps with loop=false; Enter dispatches exactly one cancellable item selection, consumes form submission even without active result, IME does nothing. Primary click/tap dispatches once, repeated deliberate activation can act again; disabled never activates. Assert no persistent selected command; active-only aria-selected.
- [ ] Implement caller-owned results/ranking/filtering and accepted search state. Search change resets cursor to first enabled result after corresponding child update; ordinary reorder preserves identity and removal repairs next/previous. No automatic substring filter, query persistence engine or async action scheduler. Empty shows only with zero rendered results, not an all-disabled list; loading status remains caller content.
- [ ] Author/implement `command-replace`: controlled search rejection, remote-style replacement, reorder without remount, disabled results, empty→results and disposal. Input retains focus/native editing, groups/labels/status never register as options, active ID names live result.
- [ ] Implement one consumer-first cancellable native event path using `dispatchCancelableEvent`; inline Root never closes anything. Event cancellation prevents recipe completion, not already executed consumer side effects.
- [ ] Author/implement `command-dialog` recipe: guard(event), if prevented return, request Dialog close, invoke action once. Refused controlled Dialog close still permits accepted action. On open focus Command.Input and explicitly reset search; Escape/return focus follows Dialog. Action opening another modal/navigation can cancel close restoration so it does not steal focus. No global Ctrl/Cmd+K listener. This recipe is fixture/docs code, not another public primitive.
- [ ] Designated gate worker uses U2's command/browser suite; Task 8 docs expose search/action output and selection-versus-command distinction. Types reject Combobox-like value/form/open props.

## Task U4: Hierarchical Tree with deliberate focus repair

**Files:** Create `packages/primitives/src/tree/tree.tsx`, `packages/primitives/src/tree/index.ts`, `apps/gallery/src/tree.tsx`, `e2e/tree.spec.ts`.

**Interfaces:** `TreeProps` extends native root div props with `selectionMode?: 'single' | 'none'` default single, `value/defaultValue?: string | null`, `onValueChange?: (value: string | null) => void`, `expandedValues/defaultExpandedValues?: readonly string[]`, `onExpandedValuesChange?: (values: readonly string[]) => void`, `dir?: Direction`, scope. Parts/types: `TreeItem` (`value`, `textValue`, `disabled?`, `hasChildren?` default false, `onActivate?: (event: Event) => void`, native positional ARIA), `TreeItemText`, `TreeItemIndicator`, `TreeItemGroup` (`forceMount?: true`), `TreeExpandTrigger`. Fixture `Trees(): Element`.

Root context owns accepted key/expansion, collection and current focus key. Item context supplies stable key, parent identity and ancestor-visible state; no child walk, load service or inferred branch. Use `createCollection` DOM order and existing `focus`, context, events, refs and presence. Do not change generic RovingFocus entry ordering/empty-tab policy to fit Tree: implement only the tree-specific tab policy locally (current then selected then first, Root if none); vertical navigation leaves logical branch arrows to Tree.

- [ ] Author `tree-keys`/`tree-actions`: duplicate/empty registered keys error, duplicate labels allowed, true branch versus leaf aria-expanded; selectionMode none omits aria-selected/ignores selection callbacks without clearing retained key; switching back restores it. Expansion arrays de-duplicate preserving order/appending keys and suppress no-ops; refused callbacks produce no optimistic state or repeated loop.
- [ ] Implement explicit parent registration, visibility, state and parts; selected key/expanded keys survive absent/collapsed/lazy nodes. Native metadata (`aria-level`, `aria-posinset`, `aria-setsize`) forwards without aliases/guessing; docs constrain positive level/position, positive or -1 size and position≤known size. ItemText labels and explicit textValue drives typeahead regardless of rich content.
- [ ] Implement row action: Space requests selection only in single mode (none consumes), never toggles off; Enter/primary own-row click dispatches once cancellably then defaults to selection, no implicit expansion/navigation. ExpandTrigger `tabIndex=-1` only toggles its branch and cannot activate row/ancestor. Descendant events never activate ancestors; consumer preventDefault wins; IME never activates/typeaheads.
- [ ] Extend `tree-actions` with native target-factory button and anchor Item rows: Enter's native click cannot produce a second activation/selection; Space selects without synthesizing an unwanted row action or anchor scroll, and ExpandTrigger button Enter/Space cannot also activate its row. Consumer cancellation suppresses primitive default selection and relevant default native action without duplicate callbacks; refs reach the real target.
- [ ] Author/implement `tree-navigation`: visible enabled preorder; arrows/Home/End no wrap; LTR Right opens or enters first enabled descendant, Left closes or finds nearest enabled ancestor, reversed logically in RTL. Disabled parent cannot user-focus/select/activate/expand, but its accepted expanded enabled descendants remain traversable. Printable prefix typeahead ignores Ctrl/Meta/Alt, fixed 1000ms expiry/blur reset, repeated same chars cycle from after current and wrap matches only. No expansion from ordinary focus/typeahead. Assert actual focused node and distinct callback counts.
- [ ] Author/implement `tree-repair`: DOM-only reorder preserves focused identity; hidden/exit/forceMount descendants leave navigation/tab order immediately. On accepted collapse with focus inside, focus enabled branch, enabled ancestor, next outside subtree, previous, then Root; rejected collapse does nothing. Removal/disable prefers surviving ancestor then old-position next/previous/Root. External focus never gets stolen (only future tab stop changes). Empty/all-disabled Root is tabbable; Tab exits normally; reentry prefers surviving prior item before selected item. Retained selected key returns without auto-expanding ancestors.
- [ ] Author/implement `tree-ssr`: accepted expanded hierarchy/labels/selected state/IDs exist on server without registration; leaves omit expanded, partial metadata includes -1 unknown size; hydration preserves hierarchy and original node references. Cleanup removes registration/typeahead/presence/observer resources; remount has no stale listeners/IDs.
- [ ] Deliver root/part/type inventory and fixture. Designated gate worker runs `GALLERY_PACKED=1 pnpm exec playwright test e2e/tree.spec.ts --project=ssr --project=csr` plus master targeted FF/WK. Website shows independent focus/selection/activation/expansion and disclosure-list alternative, not tree roles painted over navigation.

## Task U5: Two-pane Splitter constraints and accepted commits

**Files:** Create `packages/primitives/src/splitter/splitter.tsx`, `packages/primitives/src/splitter/math.ts`, `packages/primitives/src/splitter/index.ts`, `apps/gallery/src/splitter.tsx`, `e2e/splitter.spec.ts`, `tests/splitter.test.ts`.

**Interfaces:** `SplitterProps` extends native root div props with `orientation?: 'horizontal' | 'vertical'` default horizontal, `dir?: Direction`, `unit?: '%' | 'px'` default %, `size/defaultSize?: number`, `onSizeChange?: (proposal: number) => void`, `onSizeCommit?: (acceptedSize: number) => void`, `step?: number`, `disabled?: boolean`, `collapsed/defaultCollapsed?: boolean` default false, `onCollapsedChange?: (proposal: boolean) => void`, scope. Parts: `SplitterPanel`/props (`side: 'primary' | 'secondary'`, `minSize/maxSize?: number`, primary-only `collapsible?: boolean`, `collapsedSize?: number` default 0); `SplitterHandle`/props (native separator with explicit accessible name). Fixture `Splitters(): Element`.

Private math consumes pixels only after validated unit conversion:

```ts
type SplitterBounds = { min: number; max: number };
constrainPanels(available: number, requested: number,
  primary: SplitterBounds, secondary: SplitterBounds): {
  primary: number; secondary: number; min: number; max: number;
  state: 'satisfied' | 'overflow' | 'underflow';
};
```

`available` is nonnegative finite inner axis size minus handle/gaps. Bounds permit omitted px max internally represented as infinity, never exposed in ARIA. Collapse feeds its fixed primary rail into the same two-panel feasibility policy without overwriting expanded size. Math is not a public export. Follow Slider's event-boundary flush/accepted comparison and pointer capture cleanup, not its absolute-pointer positioning or step rounding.

- [ ] Author `tests/splitter.test.ts` with exact constraints: A=1000, primary [100,800], secondary [300,700] gives feasible primary [300,700], request=900→(700,300); minima 600+500 on A=1000→overflow, both minima preserved; maxima 200+300→underflow with trailing space; zero available never NaN/negative. Fractional request survives and keyboard step is added before clamp. Cover equivalent px/% conversions through fixture rectangles, not a second generic unit framework.
- [ ] Implement validated Root/Panel/Handle: exactly primary/handle/secondary direct logical order, duplicates/missing/order errors, nested Roots excluded. Finite numbers, nonnegative size/bounds, positive step, max≥min, % in 0..100; default50 only for %, px requires size/defaultSize. Default step1% or10px and Shift×10. Primary collapsedSize≤primary min; collapse props on secondary are invalid, and true supplied collapsed/defaultCollapsed on noncollapsible primary is an error (false is valid). Unit changes require coherent caller values, never automatic conversion.
- [ ] Implement deterministic SSR CSS using native grid/flex remaining-space math; reserve handle/gaps and panel bounds without measuring or unmounting children. SSR Handle disabled until positive measurement; provisional current is own-bound clamped expanded size or collapsedSize, min includes current/min, max explicit including collapsed current, otherwise 100% or max(current,min) px. All values finite ordered.
- [ ] Implement one owner-scoped root/handle geometry observer boundary with computed gaps/content size. Feasible interval `[max(primaryMin,A-secondaryMax), min(primaryMax,A-secondaryMin)]` bounded 0..A. Infeasible layout independently clamps primary and secondary to stated own bounds, exposes overflow/underflow, and disables all Handle action including Enter while remaining focusable. Zero/unmeasurable area likewise. Measurement/constraint changes never emit proposal/commit; controlled request can regain its size when space returns.
- [ ] Author/implement `splitter-geometry`: actual bounding rectangles for px/%/horizontal/vertical/RTL, handle/gaps, parent resize, zero area and both infeasible directions. Assert each stated bound, finite ordered ARIA, actual effective primary size, no measurement callbacks; horizontal flow means vertical separator and vice versa. Handle name/aria-controls point to primary; unit-qualified aria-valuetext can be overridden.
- [ ] Author/implement `splitter-controlled`: constrained onSizeChange proposal, no jump on refusal, accepted effective commit once at completed changed pointer/key boundary after native flush. Suppress no-op proposals; repeated identical refusal may dedupe only within gesture, later gesture can request again. Async acceptance after completion produces no retroactive commit. External accepted size during drag terminates unless acknowledgement of current drag proposal at normal boundary; no shared state-helper changes.
- [ ] Author/implement `splitter-gestures`: primary pointer/button only, capture ID, movement relative to start accepted geometry (thick handle no jump), other pointers ignored; up commits once if changed, cancel/lostcapture/disable/unmount ends without commit or rollback. Container/axis/direction/unit/bounds change terminates stale drag without commit. Nested handle events cannot resize ancestors; scope touch-action and selection suppression to handle/gesture; panel scrolling works, no permanent document cursor override.
- [ ] Implement physical arrows (Left/Right physically move horizontal divider even RTL; Up/Down for vertical); other axis and Ctrl/Meta/Alt/composition untouched; Home/End feasible min/max. Consumer cancellation wins. Disabled Root tabIndex=-1; infeasible/zero-area separator stays focusable but aria-disabled.
- [ ] Author/implement `splitter-collapse`: Enter proposes primary collapse only when actionable; separate onCollapsedChange, never size-change/commit. Accepted collapse preserves expanded size, hides/inerts descendants while retaining panel element/rail and mounted state, evacuates actual focused primary content to Handle only on accepted collapse, including disabled programmatic collapse. Refusal leaves focus/layout unchanged. External expanded-size updates while collapsed affect restore; restore clamps retained request to new bounds. Arrow/Home/End/drag inactive collapsed; Enter restore remains possible only actionable; external controlled restore works despite infeasible/zero/disabled Handle. No snap/drag-to-collapse/doubleclick extras.
- [ ] Author/implement `splitter-ssr`: original Root/Panel/Handle nodes and initial CSS survive hydration, then measured ARIA/layout reconciles with zero user callbacks. Dispose nested root independently; no observer/capture leaks.
- [ ] Designated gate worker runs `node --test tests/splitter.test.ts`, built/packed `GALLERY_PACKED=1 pnpm exec playwright test e2e/splitter.spec.ts --project=ssr --project=csr`, plus targeted FF/WK. Website recipe includes usable touch target, visible focus/forced-colors and proposal/accepted/collapse output for both units/nesting.

## Shared documentation and acceptance handoff

Owners provide exact family index/type inventories and evidence-to-spec mapping. Task 7 owns shared native README/changelog/exports/strict type/asChild/ref contracts; sibling website plan owns pages/recipes/navigation/snippets/native-route checks. Actual AT interaction is separate from DOM/axe; no unsupported certification. Designated gate worker proves real form/focus/geometry/SSR behavior on actual packed outputs before Main marks a slice complete.
