# Native two-pane Splitter

Status: **Proposed written specification awaiting user review.** No implementation, runtime behavior or passing checks are claimed. This is not an implementation plan.

## Purpose and boundaries

Provide a constrained two-pane layout with an accessible resize handle, px or percentage sizing, optional primary-pane collapse and nested independent roots. It is not an arbitrary N-pane redistribution solver. Ordinary application CSS remains responsible for responsive layout and appearance; applications retain storage and route preferences.

Reuse native layout, state, event/ref cleanup and existing Slider math/pointer patterns. Do not disguise Slider or static Separator as this widget. Exact Solid 2 RC15 and TS7 producer/TS5.9 consumer floor remain; no React/Solid 1/new dependency.

## Exact public API

Namespace/subpath: `Splitter` / `@wsagency/radix2solid-primitives/splitter`, with standard long-name/short-alias exports and native target-factory asChild.

| Part | Contract |
| --- | --- |
| `Root` | `orientation: 'horizontal' \| 'vertical'` (default horizontal); `dir`; `unit: '%' \| 'px'` (default %); `size/defaultSize: number`; `onSizeChange(proposal: number)`; `onSizeCommit(acceptedSize: number)`; `step?: number`; `disabled?: boolean`; `collapsed/defaultCollapsed: boolean` (default false); `onCollapsedChange(proposal: boolean)`. |
| `Panel` | Required `side: 'primary' \| 'secondary'`; `minSize?: number`, `maxSize?: number`; primary only: `collapsible?: boolean`, `collapsedSize?: number` (default 0). Standard id/ref/attributes. |
| `Handle` | One focusable separator between the panels. Required accessible name matching the primary pane, via aria-label or aria-labelledby. Generated aria-controls refers to primary Panel; standard ref/events/asChild. |

Exactly one primary Panel, Handle and secondary Panel belong directly to each Root, in that logical order. Nested Roots live inside Panels and do not join the parent's registration. Missing/duplicate/wrong-order parts are configuration errors; no implicit third panel. Root `orientation` describes pane flow; horizontal flow has a vertical separator, vertical flow a horizontal separator. RTL reverses horizontal visual flow without reversing logical primary/secondary identity.

All sizes, bounds, collapsedSize, step and callback numbers use the Root unit. Default size is 50 only in % mode; px mode requires size or defaultSize. Default step is 1% or 10px, Shift multiplies by ten. Numbers must be finite; sizes/bounds nonnegative, step positive, max at least min. Percentage values lie in 0..100. Omitted min is 0; omitted max is 100 in % mode and unbounded in px mode. Primary collapsedSize cannot exceed its minSize; when minSize is 0 only a 0-sized collapse is valid. Changing unit requires the application to provide coherently converted size/bounds; the component does not reinterpret stored px numbers as percentages.

## Layout and constraints

Available size A is Root's inner content size along the layout axis, excluding handle track and gaps. Percentages refer to A, not the outer border box. Use native CSS grid/flex sizing for initial layout and a single owner-scoped measurement boundary for constrained interactions; no document-wide layout registry.

Resolve both panels' bounds into pixels. For requested primary P, feasible primary interval is `[max(primaryMin, A-secondaryMax), min(primaryMax, A-secondaryMin)]`, bounded by 0..A. Clamp P into that interval; secondary receives the remainder. Percentage callbacks convert the result back against A. Retain fractional values; pointer updates are not forced to keyboard step increments. Keyboard changes add the configured step and then constrain through this same calculation.

When the interval is empty, bounds are infeasible. Preserve each panel's stated bounds: clamp the requested primary to its own bounds and clamp the remaining secondary to its own bounds. This can overflow Root when minima exceed space, or leave unused trailing space when maxima cannot fill it. Do not emit negative size, silently violate a minimum, or invent a feasible range. Expose `data-constraint-state="overflow"` or `"underflow"` (otherwise `"satisfied"`). Handle remains focusable but aria-disabled and performs no pointer or keyboard action, including Enter, until feasibility returns. External controlled collapse/restore remains possible. Its value remains the actual primary size and its min/max are ordered primary bounds, with finite maximum resolved from actual space/size. Caller CSS decides scrolling/clipping; primary sizing is deterministic rather than a second responsive-layout policy.

Observe Root and handle/gap geometry. Changing container or constraints recomputes effective layout from the accepted size. This is not a user request: no onSizeChange/onSizeCommit is emitted solely for measurement. A controlled size outside the current feasible interval remains the parent's supplied request but renders constrained; it can regain that requested size when space returns. Zero/unmeasurable available space disables all Handle actions, including Enter, reports no speculative callbacks, and keeps deterministic CSS; external controlled updates remain possible. Never divide by zero or emit NaN.

## Controlled state and event semantics

`onSizeChange` always carries the **constrained proposal** from a user resize, before parent acceptance. Uncontrolled Root accepts it; controlled Root renders from the supplied size, constrained to the current layout. A refusing parent must not make the handle/panels jump to the proposal. Suppress proposals equal to the current constrained accepted size; repeated identical refused pointer proposals within one gesture need not repeatedly notify, but later gestures can request them again.

`onSizeCommit` carries the **effective accepted rendered primary size**, never a rejected proposal, and applies only to completed pointer or keyboard size-resize actions. At pointerup emit once if that size differs from gesture start; after a keyboard resize emit once if accepted rendered size changed. Observe accepted state at the existing native flush/render boundary used by Slider, not by assuming an immediate signal read after a callback proves acceptance. Parent updates not visible by that completion boundary are ordinary later external updates and do not retroactively generate commits. No stronger synchronous acceptance guarantee is added to the shared state helper. Collapse/restore never emits this callback.

Pointer cancellation/lost capture ends the gesture without a commit and without reverting already accepted live changes. Disable/unmount likewise ends without commit. An application requiring persistence-on-cancel must use the live change callback or its own policy; the primitive does not silently roll back controlled state.

External accepted size changes during a drag terminate it without commit, except acknowledgement of that drag's current proposal observed through the normal native flush/render boundary. Container size, axis, direction, unit or constraints changing during a drag also terminate rather than reuse a stale baseline rectangle. The next gesture starts from current accepted geometry.

## Collapse placement and state

Only primary Panel is collapsible; secondary collapse is out of scope. Root owns `collapsed/defaultCollapsed/onCollapsedChange`. Requesting collapse when primary is not collapsible is a configuration error for supplied state and a no-op for user toggle. `collapsedSize` bypasses primary expanded min/max only during collapse; secondary bounds still apply and may produce documented underflow/overflow.

Collapse preserves the last accepted expanded `size` in Root; it does not overwrite size with collapsedSize or emit onSizeChange. onCollapsedChange carries the boolean proposal. Accepted collapse renders collapsedSize; accepted restore renders the retained expanded size constrained to current bounds. External size changes while collapsed update the future expanded size. Refused collapse/restore leaves layout and focus unchanged.

Enter on an actionable Handle requests collapse/restore if allowed. An external toggle uses controlled collapsed state; no separate imperative engine is required. onCollapsedChange alone owns the user collapse/restore proposal: neither accepted nor rejected collapse/restore emits onSizeChange or onSizeCommit. Thus consumers persisting committed size cannot overwrite retained expanded size with collapsedSize. On restored layout the same expanded size state remains available even if geometry temporarily clamps it.

Arrow/Home/End resize is inactive while collapsed; Enter restores first only when Handle is actionable. There is no implicit drag-to-collapse threshold, snap zone, double-click reset or drag-to-expand behavior. Keep the primary Panel element and its collapsedSize layout track reserved; hide/inert its descendants, not the whole Panel with display:none, so Handle and secondary track placement do not shift. A nonzero collapsed rail does not keep original descendants interactive or exposed as active content. Applications needing an interactive rail render it outside the collapsed subtree. Preserve mounted child state rather than destroying descendants just to collapse.

Before an accepted collapse hides currently focused primary content, move focus to Handle. Do not steal focus when it is outside the pane. Keep Handle visible/focusable while collapsed; if application styling deliberately hides it, the application must provide an external restore button and move focus there before hiding. Disabled Root prevents Handle interactions but not programmatic state changes; focus evacuation still occurs for accepted programmatic collapse.

## Pointer, keyboard and accessibility

Handle accepts only the primary pointer and primary button; store its pointer ID, capture on Handle and ignore additional pointers. Pointer motion changes primary size relative to gesture-start accepted geometry, not the absolute pointer position, avoiding jumps on a thick handle. Release capture and resources on up/cancel/lostcapture/disable/unmount. Handle gestures cannot bubble into nested/ancestor splitter handlers. Scope touch-action:none and selection suppression to the handle/active gesture, preserving panel scrolling outside it; do not install a permanent document cursor override.

Arrows move the divider physically: horizontal flow Left moves left and Right right; vertical flow Up moves up and Down down. Convert physical motion to primary-size increase/decrease using direction and primary location. Other-axis arrows are not intercepted. Home/End request feasible minimum/maximum primary size regardless of direction. Enter toggles collapse when supported. Ignore composition and modified Ctrl/Meta/Alt shortcuts. Consumer preventDefault suppresses internal behavior.

Handle has role separator, tabindex 0 unless Root disabled (then -1), and aria-controls/name tied to primary Panel. aria-disabled means no Handle action, including collapse Enter, for Root disabled, infeasible bounds or unmeasured/zero area; external controlled restoration remains available. aria-orientation is perpendicular to pane flow. After measurement, aria-valuenow/min/max describe effective primary size and feasible bounds in the Root unit, not pointer proposals. While collapsed, current value is collapsedSize and range includes that value and expanded reachable maximum. `aria-valuetext` defaults to a unit-qualified value (pixels or percent) and can be overridden for localization. Fixed/zero-size states still expose finite ordered values, not NaN/Infinity.

The CSS hit target can be larger than the visible divider; the styled recipe must provide a usable touch target, visible focus and forced-colors treatment. Neither primitive nor docs claim assistive-technology certification from role/value attributes alone.

## SSR and lifecycle

SSR emits deterministic two-pane CSS from supplied unit/size/bounds and accepted collapse without measuring the DOM. In % mode use fractional/native layout against space left after handle/gaps; px mode reserves supplied primary pixels with secondary remainder and both panel bounds. Do not perform client-specific pixel conversion on the server. Until a positive measurement is available, Handle is aria-disabled with no actions. Its provisional current value is the supplied expanded size clamped to primary own bounds, or collapsedSize; provisional minimum includes that current value and primary minimum. Provisional maximum is explicit primary max (including current value when collapsed), otherwise 100 in % mode or max(provisional current, primary minimum) in px mode. These finite ordered estimates do not assert measured container feasibility; measurement replaces them with effective bounds.

Hydration preserves nodes and initial CSS. Client measurement reconciles effective bounds/ARIA without state proposal callbacks or an unnecessary rerendered subtree. Nonnegative/finite guards cover hidden Roots and first measurement. Dispose observers, captures and gesture resources; nested Root cleanup must not affect its parent.

## Reuse, alternatives and acceptance

Static references, all relative to `packages/primitives/src/`: `slider/slider.tsx:61–139` supplies accepted-state/commit and capture cleanup patterns; `slider/math.ts:1–69` supplies pure clamp/scale/rounding; `internal/state.ts:1–28` supplies parent-authoritative state. `separator/separator.tsx:8–12` is a static separator, not this behavior.

Composition-only CSS plus application resize logic remains sufficient for a one-off layout and is not migrated here. An external native resize implementation is a credible alternative if real N-pane redistribution is later approved; no external source/license was consulted or selected.

Required bounded checks after implementation approval:

- Built/subpath and TS7/TS5.9 props/declarations; exact two-panel/units configuration errors and native cancellation/ref behavior.
- Actual panel rectangles for px/% modes, horizontal/vertical/RTL, both-pane bounds, handle/gaps, parent resize, zero area, impossible minima and impossible maxima. Assert finite ordered ARIA and no fictitious callback on measurement.
- Controlled proposal accepted/refused/async cases; commit contains accepted rendered value, once per completed changed gesture/key, never rejected proposal. Cancellation keeps live accepted changes but emits no commit.
- Capture outside Handle, second pointer, touch scrolling elsewhere, cancel/lostcapture/disable/unmount, stale geometry termination and nested isolation.
- Controlled/uncontrolled collapse, retained size, updated bounds on restore, no size-change/commit callbacks for collapse, and actual focus evacuation. Collapsed descendants cannot tab/focus while Panel track stays reserved; disabled/infeasible/zero-area Handle cannot toggle and external controlled restoration still works.
- SSR CSS/node-preserving hydration then measured reconciliation. No requirement to run the unrelated historical browser matrix.
- Native API page and styled live example/playground with readable live proposal/accepted outputs, both units, nested roots and keyboard collapse. Follow current website native-route, snippet and Themes-recipe conventions; check real geometry/focus rather than only CSS variables.

Reference: [WAI-ARIA window splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/). That guidance explicitly has unfinished example/review work; it is not a certification source.
