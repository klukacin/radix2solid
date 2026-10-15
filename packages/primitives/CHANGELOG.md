# Changelog

## 0.1.0-rc.3 — source candidate, not yet published

- Add data-driven Combobox with independent selection/query/open, draft-safe native form participation and client-only portal options; add caller-filtered Command with cancellable action selection and no form/value channel.
- Default Combobox.Input's native HTML autocomplete to off, preventing competing browser form-history suggestions from consuming Enter; preserve explicit consumer and target-factory overrides.
- Correct the Command gallery's keyed Show callback signature for native Solid 2 type checking; public Command item types and target-factory usage are unchanged.
- Preserve Combobox/Command active identity across caller object replacement by registering rows in the native render phase before post-render reconciliation; retain Command search reset intent through empty or disabled-only results.
- Keep target-factory List/Item/Label IDs connected to their ARIA owners, preserve native Shift+Up/Down selection, and resolve Empty only after client list registration instead of announcing false server-side emptiness.
- Correct gallery and type-consumer composition by placing Empty and loading statuses beside their List rather than inside the listbox; retain status announcements and client-resolved server/hydration behavior without changing the primitive API.
- Mark Combobox/Command initialization, post-render cursor reconciliation and disposal reads as intentional snapshots for native Solid 2 diagnostics; keep record/filter derivations and shared collection, active-descendant and controlled-state accessors tracked.
- Keep collection unregister invalidation and Combobox/Command List teardown writes outside ambient list-computation ownership, so dynamic row disposal does not halt native development reactivity; registration ordering and tracked collection reads are unchanged.
- Read controlled values and change-callback props freshly inside a short-lived owned scope, so requests from effect callbacks or unmount cleanups no longer halt native development reactivity on compiled conditional props; the callback itself runs outside that scope and unchanged requests remain no-ops.
- Add two-pane Splitter with both-panel constraints, accepted size commits, independent collapse, native pointer/keyboard handling and provisional server layout reconciled after measurement without user callbacks.
- Add native Tree parts, scope and types with independent controlled selection/expansion, cancellable activation, visible enabled preorder focus, explicit typeahead and collapse/removal focus repair.
- Track Splitter available space through inherited or changed CSS gaps with one private hidden, inert measurement node appended after the semantic parts; reconciliation emits no size proposals or commits.
- Follow Tree subtree focus ownership through native `focusout`, so explicit blur or outside focus ends ownership and later repair updates the tab stop without stealing focus; restoring items hands a focused fallback Root to the preferred item.
- Preserve native target-factory composition and server-rendered hierarchy/selection; retained closed groups remain excluded from navigation. Prefer disclosure lists for ordinary navigation.
- Stabilize controlled render reads across conditional JSX with an identity-compared tuple memo, preserving raw Promise/AsyncIterable values. Setters continue reading fresh parent authority, preserving existing no-op suppression and Menu submenu teardown notifications, including simultaneous parent close and unmount. The duplicate notification found during candidate development was an unreleased regression, not a defect in rc.1.
- This source candidate is not an npm publication or screen-reader interoperability certification.

## 0.1.0-rc.2 — prepared candidate, not yet published

- Require exactly `solid-js` and `@solidjs/web` `2.0.0-rc.15` as peers (was `2.0.0-rc.13`). The repository builds with `@solidjs/vite-plugin` `3.0.0-next.50`; Solid rc.15 requires Node `>=22.12.0`.
- Remove the private server-only workaround that rewrote `defaultValue`/`defaultChecked` on `Slot` and `Primitive` input hosts. `@solidjs/web` rc.15 renders them as `value`/`checked` during SSR itself. No public API changes.
- Breaking naming migration: Dialog, Popover and AlertDialog Content link Root-allocated title/description IDs without descendant registration. Explicit Content ARIA relationships replace defaults, including explicit-undefined opt-outs; a nonblank `aria-label` suppresses only the automatic title link. Custom part IDs and conditionally absent parts require matching explicit Content relationships. Remove server child pre-reading from Slot and overlays, preserving custom target providers and native child ownership; Slot retains absent versus explicitly undefined relationship keys.
- Reset Menu's roving entry target before default open autofocus, so keyboard reopening during a retained exit animation focuses the first enabled item rather than the previous selection. Preserve cancellable autofocus, pointer entry and submenu behavior.
- Declarations are emitted by TypeScript 7.0.2; the packed consumer checks use TypeScript 5.9.3.

## 0.1.0-rc.1 — prepared candidate, not yet published

- Rename the package from `@radix-solid/primitives` to `@wsagency/radix2solid-primitives`; all namespace subpaths, including `/internal`, are unchanged under the new name.
- Prepare public npm metadata for release under the `next` dist-tag; the Solid `2.0.0-rc.13` peers are unchanged.
- Make the Presence close→reopen browser check hold the real exit animation paused instead of racing its 200ms duration; README now states that the node is preserved when reopened before exit completion. Test and documentation only; no runtime or API change.

## 0.0.0-local — local-only Solid 2 port

- Implement native Slot/Slottable factories and Toggle with live reactive forwarding, parent-authoritative controlled state, latest callbacks, initial-only defaults and batched local functional requests.
- Preserve child-first Slot events versus cancellable consumer-first internal events, class/style/ARIA ID merging, native array refs and single-target loading content composition.
- Use explicit target factories for asChild instead of React element cloning or plain-JSX render-prop introspection; migration and callback timing differences are documented in README.
- Emit explicit true/false aria-pressed strings across native/custom dynamic targets.
- Build browser/default-server ESM outputs and declarations against exactly pinned Solid/web/compiler/Babel RC.13, plugin next.35 and Vite 8.3.3.
- Add independent tarball consumer, no-DOM server rendering, public type boundaries, singleton/no-React graph inspection, CSR and two-root nonce-CSP hydration/node-reuse checks.
- Add native Direction, Portal, VisuallyHidden, Arrow, Dialog and Popover namespaces/subpaths, all current compound parts and scope factories.
- Share scoped context, DOM-ordered collections/roving focus, animation-aware Presence, ownerDocument layer/focus/scroll stacks and Floating UI DOM positioning without React adapters.
- Preserve nested portalled branch ownership, independent/nested render roots, custom/ShadowRoot containers, cancellable native outside/autofocus events, pointer interception and touch-scroll-versus-click dismissal; restore body styles/ARIA on final disposal.
- Render accessible title/description links for inline SSR, retain custom/live client IDs, and document RC.13 client-only portals even under defaultOpen/forceMount.
- Require typed single-target factories under every primitive-backed asChild boundary; retain native callbacks/ref types and default native hosts.
- Extend packed/development CSR/SSR verification with layer lifecycle, reactive arrow geometry, trusted Chromium touch, native render-root cleanup and no-DOM portal/inline composition checks.
- Add native AccessibleIcon target factories, responsive AspectRatio, platform Label activation, validated scoped Progress and reactive/decorative Separator namespaces with runnable examples and CSR/SSR behavior checks.
- Add ownerDocument Avatar image decoding, source/callback lifecycle guards and delayed fallback disposal; add shared polite/assertive/off Announce regions with incremental native DOM notification mirroring, visibility suppression and final-owner cleanup/restoration.
- Add parent-authoritative Collapsible and single/multiple Accordion with native factory targets, measured content dimensions, CSS exit retention, scoped parts, linked regions and DOM-ordered disabled/orientation/RTL keyboard navigation.
- Refresh Presence's open animation snapshot for always-mounted hidden content shells; preserve natural completion, cancellation and close→reopen across existing Dialog/Popover consumers.
- Add native Checkbox/Switch and upstream unstable split parts with scoped checked state, mixed indicators, native label/keyboard behavior, real sized form inputs, validation/submission, external ownership and cancellable initial-state reset.
- Keep form change notification distinct from user-only ancestor clicks; resynchronize inputs after rejected resets and preserve current checked state across control resizing. Resolve structural context selection without an untracked reactive scope read.
- Add complete native RadioGroup, scoped roving items and unstable split parts with real radio/form ownership, one selected-input change notification, cancelled/refused initial reset, DOM-order/disabled/orientation/RTL/loop navigation and controlled null clearing.
- Limit consumer-stopped propagation to its user interaction; subsequent programmatic checked changes still notify the form without ancestor clicks.
- Add complete native Tabs, ToggleGroup and Toolbar parts/scopes/Props, shared DOM-ordered roving focus, automatic/manual tab activation, blur-before-content-removal and descendant-key isolation.
- Preserve scalar deselection and functional multiple toggles, one outer toolbar roving group, group-disabled skipping and native link Space activation.
- Enumerate structural Slot handler keys and resolve roving scopes untracked without freezing live prop values. Defer owned layer autofocus until descendant registration settles; cancelled/disposed activation cannot steal focus.
- Add native AlertDialog's complete parts/scopes/Props over the shared Dialog engine, forced modal ownership, Cancel autofocus, blocked outside dismissal, cancellable action/Escape and parent-authoritative latest callbacks.
- Add complete native HoverCard with scoped parts/Props, non-touch/focus delays, selectable preview containment, exact body-style restoration, no preview autofocus/tab stops/restore, and ancestor modal focus/scroll branches.
- Separate top dismissal from top focus-scope ownership in the shared layer; default-open portalled previews cannot suppress parent autofocus or trap Tab. Resolve structural Popper scopes untracked while keeping positioning props reactive.
- Cancel pending HoverCard reopen timers on dismissal and recheck selection/pointer ownership when a queued close expires; trusted drag regressions exercise Chromium, Firefox and WebKit in CSR/SSR.
- Add complete native Tooltip parts/scopes/Props and Provider delays, warm transitions, controlled authority, exclusive ownerDocument activation, native descriptions and hoverable pointer corridors without duplicate child rendering.
- Preserve real ancestor-scroll dismissal while settling native keyboard focus scrolling; cancel pending activation on blur, pointer activation, Escape and disposal.
- Skip Popper work for force-mounted content without a layout box, resuming on resize/show. Defer modal body-focus fallback until native blur/focus completes so tooltip portal removal cannot intercept Tab or Shift+Tab.
- Add complete native DropdownMenu, ContextMenu and Menubar parts/scopes/Props/subpaths over one shared Menu engine with native cancellable selection, mixed/radio notifications, DOM-ordered typeahead, disabled skipping, descendant-key isolation, LTR/RTL submenus and collision-aware pointer grace.
- Preserve controlled ContextMenu authority/current callbacks, repeated pointer reanchoring/focus and owned touch/pen long-press cancellation; preserve Menubar open-menu switching and nonmodal trigger restoration.
- Share pointer-corridor geometry with Tooltip, separate virtual/host Popper anchors, and run composed Slot event dispatch untracked so native disposal blur cannot create strict reactive-read warnings.
- Own Menu pointer presses per root, clear cancelled/released ownership before synthetic selection, and serialize explicit expanded true/false states for native/SSR dropdown and submenu triggers.
- Add all nine native NavigationMenu parts/scopes/Props/subpaths with controlled string authority, automatic/manual hover timing, Sub toggle semantics, native focus proxies, cancellable link selection and original-owner viewport/indicator geometry.
- Preserve non-focusing ancestors' outside boundaries when a nested preview/navigation layer prevents its own dismissal. Cancel pending Tooltip focus activation even when another existing layer already consumed Escape.
- Add complete independent native Select parts/scopes/Props/subpath and unstable split Provider/BubbleInput with detached closed options, rich Value/ItemText factories, placeholder/explicit clearing and parent-authoritative current callbacks.
- Preserve selected-item-aligned and Floating UI placement, modal disabled-skipping focus/typeahead, mouse release suppression, touch/pen click selection, owned scrolling timers and native external-form validation/reset/change synchronization.
- Consume same-value/rejected Select interaction markers without leaking user bubbling into programmatic updates; honor stopped selection propagation and resynchronize refused native changes.
- Allow Select to block Tab without the shared layer moving item focus; apply factory metadata only after native ref commitment instead of writing reactive state during factory rendering.
- Preserve Select scroll-expanded height across native ResizeObserver delivery by distinguishing intrinsic content changes from the viewport's allocated height.
- Add native unstable PasswordToggleField's five parts/Props/subpath with controlled visibility, native value/caret/selection preservation, keyboard focus, external-form submission masking and cancelled reset/activation ownership.
- Replace cloned password SVGs with native target factories, retain visible-text/fallback labels and reserve settlement hydration IDs on both server and client.
- Keep PasswordToggleField's live Root/default ID separate from its observed native Input ID so reactive IDs retain the correct Toggle controls link.
- Add native unstable OneTimePasswordField's three parts/Props/subpath with sanitized parent-authoritative aggregate, native external-form submission/reset, controlled DOM restoration, paste overflow, IME/input-change deduplication and editing guards.
- Base OTP autocomplete/full-code input and password-manager exclusions on the current shared roving tab stop; preserve group/index semantics and defer composition completion until native constraints settle.
- Ignore composing keyboard events in the shared roving handler without cancelling native composition; regression coverage includes vertical OTP plus existing control/menu consumers.
- Add native Slider's complete scoped/split public API, offset/scientific stepping, sorted or neighbor-constrained thumbs, native external forms and owned pointer/reset behavior.
- Keep logical Range geometry, measured thumb offsets and the shared transform variable consistent across horizontal RTL and inverted vertical axes.
- Add native ScrollArea's six scoped parts/Props/subpath, implicit or explicit content measurement, native viewport factories, visibility modes, RTL negative offsets and proportional thumbs.
- Own scrollbar capture, cancellation/disposal style restoration, resize/scroll frames and hide/idle timers; defer geometry writes beyond ResizeObserver delivery and keep hover active across the whole root.
- Add native Form's seven scoped parts/Props/subpath with native constraint precedence, once-only sync/Promise matching, stale-result ownership and validity callbacks.
- Preserve first-invalid associated-control focus, mounted description IDs, cancellable native reset and server-error clearing even on prevented submission; keep server invalidity accessible before hydration.
- Normalize native input defaultValue/defaultChecked only at the two shared server target boundaries so Slot and every primitive preserve real initial/reset baselines without client shims.
- Add all seven native Toast parts/Props/subpath with parent-authoritative state, monotonic pause/resume timers, native swipe cancellation/click interception and independent priority announcements.
- Integrate document-wide viewport/announcement branches with shared modal focus, accessibility, scroll and pointer ownership; route focused Toast Escape before the top-layer fallback and handle Tab on the physical portal viewport.
- No release, publishing identity, complete-component parity or manual assistive-technology certification is claimed.
- Expose existing Primitive/PrimitiveProps and Slot style merging from `/internal` for native Themes reuse, without a second composition/style implementation.
- Capture Menu and Tooltip listener windows at registration so detached-document cleanup does not dereference a cleared ownerDocument.defaultView.
- Make ScrollArea viewports keyboard-focusable by default, preserving explicit consumer tabindex overrides and native LTR/RTL arrow scrolling across Chromium, Firefox and WebKit.
- Preserve default multiple-thumb Slider names when native wrappers forward undefined aria-label values; explicit consumer labels retain precedence.
- Stabilize shared Primitive/Slot ref arrays across ordinary and atomic prop updates without reinitializing unchanged connected hosts; replacement consumers retain native invocation/cleanup.
- Dispatch nested outside pointer/focus events through every eligible layer up to the highest modal boundary; preserve top-only Escape, owned overlay/ancestor scrolling and final-owner restoration.
- Reveal offscreen keyboard Menu/Select/NavigationMenu/Toolbar targets without changing pointer/autofocus/restore no-jump behavior.
- Restore NavigationMenu.Sub's native div/factory/ref/activation contract and move disableToggle from Trigger to Sub, with no compatibility alias.
- Release mounted Toast and menu/navigation presence registrations on disposal, including empty-viewport focus proxies and parked navigation content.
- Focus the first asynchronous server-invalid Form control after ARIA updates, keep submit focus while clearing server errors, retain matcher validity and suppress native invalid UI without skipping managed validation.
- Keep OTP editing focus immediate for rapid repeated typing; defer only owned nearest reveal beyond the native editor's caret scroll and cancel it after consumer focus transfer or disposal.
- Publish source in the public repository with a Radix2Solid contributors MIT notice; original Radix MIT copyright notices and texts are retained in the distributed `LICENSE`.
- Check exhaustive server-host reuse before outside dismissal, then retain second-root host/ID identity while verifying default-open navigation content is disposed; run this CSP hydration transition in Chromium, Firefox and WebKit.
- Wait for Select's real placed-item autofocus before exercising Home/End viewport boundaries; retain focused-option, padding reveal, Escape restoration and modal teardown checks without timing retries or product focus changes.
