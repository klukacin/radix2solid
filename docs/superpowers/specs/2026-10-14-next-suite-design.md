# Next suite: written specifications

Status: **Proposed written specifications awaiting user review.** The user approved the presented scope and isolation, not these completed written contracts or an implementation plan. No feature here is claimed implemented, tested, published or deployable. Approval of these documents permits a separate implementation-plan stage; implementation waits for plan review and execution-method approval.

## Baseline and isolation

Design base: public native `main`, commit `b0cf970aba2f67f4ac5d8a6355e5737b1c29b89c`. Specifications are isolated on `design/next-suite` in a tracked-source independent clone, not in release checkouts. No ignored dependencies, artifacts or consumer repositories were copied. The deployment/publication website workstream is separate.

All four existing `0.1.0-rc.2` packages are already published. That release is immutable: no reuse/repacking/overwriting of its version or release artifacts. This design stage makes no package version bump, registry publication, tag, PR, deployment or dependency change.

## Reviewed-scope decomposition

| Written contract | Scope |
| --- | --- |
| [Combobox and Command](2026-10-14-next-suite-combobox-command-design.md) | Editable single selected key plus independent query/form validity; distinct action-only input/listbox, usable inline or with existing Dialog. |
| [Tree](2026-10-14-next-suite-tree-design.md) | True hierarchical composite; single or no selection, explicit activation/expansion, focus repair. Disclosure navigation remains a separate valid choice. |
| [Splitter](2026-10-14-next-suite-splitter-design.md) | Two panels, nestable roots, explicit px/% bounds, proposal versus accepted commit, primary collapse. No N-pane solver. |
| [Extra icons](2026-10-14-next-suite-icons-extra-design.md) | Small separate original-artwork package and its provenance/public API contract, beginning with folder glyphs. No brand marks or claim that extensions are upstream Radix artwork. |
| [Charts upstream work](2026-10-14-next-suite-charts-upstream-design.md) | Explicitly selected and mapped native/upstream adaptations and their acceptance boundaries, not blanket Recharts parity or all canary fixes. |

All UI behavior belongs in Primitives. Existing website Themes recipes supply styled live examples/playgrounds; no second behavior engine or automatic expansion of exported Themes wrappers. Each of the four UI families receives a native API page and a styled interactive example using existing website conventions. Library/public examples change only after the implementation is actually available in a pinned build.

## Cross-family contracts

Retain the exact Solid 2 RC15 runtime/compiler tuple, TS7 producer tooling and TS5.9 declaration-consumer compatibility floor. No React runtime/adapters, Solid 1 compatibility layer or new dependency is needed for the UI scope.

Reuse parent-authoritative `packages/primitives/src/internal/state.ts`, collection, roving focus where real focus is appropriate, native layers/Popper, events, Slot and owned cleanup. No descendant prewalk for naming or selected labels. Only Combobox and Command justify sharing a small internal input-active-descendant navigator; selection/forms and action dispatch remain separate. Tree adds hierarchy above flat collection; Splitter owns its own geometry, not a generic layout framework.

For the new Primitives families (Combobox, Command, Tree, Splitter), a callback proposing a controlled state change never proves acceptance. Combobox must not submit an old key while unmatched draft text is visible. Splitter onSizeChange carries a constrained proposal; onSizeCommit carries effective accepted rendered size only for completed size-resize actions. Collapse/restore belongs to onCollapsedChange and never emits a size commit. Observe accepted updates through existing native flush/render conventions, not immediate-read assumptions. Docs and examples must not hide rejected/async parent updates with optimistic state. This rule does not redefine imported Charts semantics: the Charts specification keeps Recharts 3.10.1 controlled Brush behaviour, documented there as a Charts exception.

No default freeform or multiple selection, virtualization, data-loader, drag/drop, router, persistence, global shortcut or action-execution engine. Existing application command palettes and sidebar domain behavior are not migration targets. These exclusions preserve the approved scope; expanding them requires a separately reviewed change, not a hidden implementation shortcut.

## Dependencies and integration boundaries

The UI families can use existing lower-level helpers; none requires the new icon package or Charts work to function. Extra icons are optional presentation, not a Primitives dependency. Charts upstream changes remain in Charts and its existing dependencies, with source/provenance records and targeted evidence required by its own specification. Do not claim a newer upstream version merely because selected patches were adapted.

Library root/subpath exports, declarations, packed consumer inventories and affected README/changelog/API surfaces must agree when implementation ships. Website examples use the actual package API and native target-factory composition, not React examples with renamed imports. New native families must not receive fictional links to upstream Radix React implementations.

Website route/navigation/native-route inventories, code-snippet checks and styled interactive checks follow current conventions in the separate website repository. Its eventual library pin must refer to the actual reviewed implementation commit, independently of the already-running publication-status cutover. No permission to modify that workstream is implied here.

## Bounded evidence required later

The family documents name concrete acceptance behavior. Shared gates are affected built/packed root and subpath imports, strict TS7/TS5.9 declaration consumers, no unexpected runtime dependency, SSR and node-preserving hydration. Browser evidence must inspect actual focus, form submission/state and panel geometry, not just emitted props or CSS variables.

Combobox/Command require IME and native editing preservation, active-descendant lifecycle, exactly-once action/cancellation, native form validation/reset/external ownership and controlled refusal. Tree requires visible-order navigation, explicit selection/activation/expansion, disabled hierarchy policy and focus repair. Splitter requires both-panel constraints, pointer capture cleanup, RTL physical motion, collapse/focus and accepted-only commit evidence. The icons and Charts documents define their own bounded source/type/render/provenance checks.

Styled examples/playgrounds must demonstrate these behaviors with observable output and current Themes tokens, focus/forced-colors treatment and accessible names. DOM/axe results are not actual screen-reader interaction proof or blanket APG certification. Do not rerun the unrelated historical full matrix merely to make this design look verified. No tests, builds or runtime probes were executed in this specification stage.

## Release guard

The four existing packages' publication/release prerequisites remain in force; shipping affected changes requires a new reviewed version and the existing authorized release process, never reusing `0.1.0-rc.2`. The new icons package additionally requires maintainer-controlled first-publication setup and authorization when it actually ships. No first publish, version assignment, tag or registry operation is approved by these specifications.

The suite is not a promise of complete Recharts 3.10.1 parity, an automatic PR import or a 3.11 canary upgrade. Only the selected, explicitly documented adaptations are in scope. Experimental or deferred work in the Charts document remains excluded until separately approved; do not silently include it or call it complete conditionally.

## Specification self-review and next gate

Each document is reviewed for placeholders, contradictory defaults, ambiguous state transitions and accidental scope expansion. The chosen defaults are concrete contracts for user review, not assertions that existing code already fulfills them. Source references are static evidence only. No implementation pseudocode, task schedule or implementation plan is part of this set.

Next gate: user reviews these six written documents. If accepted, prepare a separate bounded implementation plan and obtain its approval before product code, dependencies, build/test execution or consumer changes. The docs-only commit itself is separately controlled by the parent review; it does not advance the implementation gate.
