# Native Calendar and DatePicker

Status: **Implemented and locally accepted on bounded targeted evidence**; see [Final local acceptance and delivery](../plans/2026-10-18-calendar-date-picker.md#final-local-acceptance-and-delivery). Calendar/DatePicker remain project extensions, not upstream ports. This status does not claim a monolithic full suite or universal platform/AT certification. No publication, version, tag, or deployment is authorized.

## Purpose, scope and alternatives

Provide a headless inline Calendar and a button-triggered DatePicker composed with the existing Popover. Applications can inspect availability, browse dates without changing their selected value, select a booking/due date and submit it through native forms. Applications own fetching and month-scoped availability; `onViewMonthChange` reports navigation without adding a loader.

Scope is **one Gregorian date-only selection**, one six-week day grid, nullable selection, bounds/unavailable dates, locale/week-start/RTL, controlled or uncontrolled selection/month/open state, native forms, styled Themes components and complete website integration. Calendar and DatePicker are this project's extensions, **not official upstream Radix components or ports**.

Non-goals: date ranges, multiple selection, timestamps/time zones, time entry, alternate calendars, editable custom text input/parsing, month/year selection grids, virtualization, scheduling/event persistence and a public date-library adapter. Calendar remains useful for an inline availability display; it does not become a form field automatically.

Chosen approach: native Solid headless Calendar plus existing Popover composition. A native `<input type="date">` with existing Form is retained as a documented alternative for typing, mobile native UI and distant/birth dates. It does not replace a customizable unavailable-date grid. Larger libraries/ports are rejected because this scope does not justify their runtime, dependency or parser model. Foldkit supplies behavioral inspiration only, not its runtime or three-view architecture.

## Public API and date model

Namespaces/subpaths are `Calendar` / `@wsagency/radix2solid-primitives/calendar` and `DatePicker` / `@wsagency/radix2solid-primitives/date-picker`, within the existing package. Existing long-name/short-alias exports, scoped contexts, native refs, cancellable event composition and target-factory `asChild` apply. No new package or scope.

`DateValue` is a canonical `YYYY-MM-DD` string for a real proleptic Gregorian date in years `0001`–`9999`, no year zero. Empty selection is `null`. `MonthValue` is canonical `YYYY-MM` in that domain. Public type aliases do not replace runtime validation. Invalid date strings, impossible dates and `min > max` are configuration errors reported consistently in SSR and client rendering; do not normalize them to another day.

| Root              | Contract                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Calendar.Root`   | `value?: DateValue \| null`, `defaultValue?: DateValue \| null` (default null), `onValueChange?: (value: DateValue \| null) => void`; `viewMonth?: MonthValue`, `defaultViewMonth?: MonthValue`, `onViewMonthChange?: (month: MonthValue) => void`; required `today: DateValue`; `locale?: string` (default `en-US`), `weekStartsOn?: 0\|1\|2\|3\|4\|5\|6` (default 0/Sunday), `dir?: 'ltr'\|'rtl'`; `min?: DateValue`, `max?: DateValue`, `isDateUnavailable?: (date: DateValue) => boolean`; `disabled?: boolean`, `readOnly?: boolean`; children and scope. |
| `DatePicker.Root` | The same date/selection/month configuration, plus `open?: boolean`, `defaultOpen?: boolean` (default false), `onOpenChange?: (open: boolean) => void`, existing Popover `modal` (default false), and `name?: string`, `form?: string`, `required?: boolean` for its explicit native form-control part.                                                                                                                                                                                                                                                         |

`undefined` means uncontrolled; a controlled callback requests a change and does not mutate accepted state. Equal accepted values do not produce change callbacks. There are no acknowledgement return values or message objects. The keyboard cursor is internal, independent of selection, and not a second controlled public value.

Date arithmetic is bounded and pure. Compare canonical values, calculate day/month changes without local-time conversions, and clamp a requested month/year movement to its last existing day. No mutable Date values in public state, `new Date(isoDate)` plus local getters, ISO timestamp round-trips, global locale mutation or Date prototype changes. A well-formed selected value made unavailable by changed bounds/predicate is retained and marked invalid, not silently cleared or clamped.

### Calendar parts

| Part                         | Contract                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Root`                       | Owns state/context, not an opaque pre-rendered widget.                                                                                                                             |
| `Header`                     | Structural header container; normal native props.                                                                                                                                  |
| `Heading`                    | Localized visible month/year text, stable grid-label ID and restrained polite month-change announcement; not a drill-down button.                                                  |
| `PrevTrigger`, `NextTrigger` | `type="button"`; request preceding/following month within bounds; caller supplies accessible action labels.                                                                        |
| `Grid`                       | Named grid associated with Heading; non-asChild children may be a getter-state render function exposing `weekdays` and `weeks`, following existing roving-focus state conventions. |
| `Row`, `HeaderCell`          | Row and columnheader semantics; HeaderCell exposes a full weekday name even if visually abbreviated.                                                                               |
| `Cell`                       | `date={DateValue}`; gridcell semantics and `aria-selected`.                                                                                                                        |
| `Day`                        | `date={DateValue}`; full localized date label, real-button focus/activation, `aria-current="date"` for today and `aria-disabled` for unavailable dates.                            |

Every month derives six rows of seven positions, including adjacent-month dates; supported-domain edges use inert padding, not fabricated dates outside 0001–9999. Day records contain canonical date, localized day text and selected/today/unavailable/outside-month flags. Render rows from this data using canonical-date keys; padding has stable positional keys. Only 42 positions are derived, not a giant date/year inventory. DOM parts retain PrimitiveProps/asChild and ref/cancellation behavior. Consumer badges and event counts remain consumer markup; do not create conflicting nested focus targets.

Expose `data-selected`, `data-today`, `data-disabled`, `data-outside-month` and focus-visible styling hooks. Today, selected and focused are distinct. Selection ARIA belongs to Cell; focus/activation belongs to Day. The header row participates in the grid's structural semantics without becoming a day-navigation row.

### DatePicker parts

`Root`, `Trigger`, `Value`, `Portal`, `Content`, `Title`, `Description`, `Close`, `Clear`, `Calendar`, `FormControl`.

`DatePicker.Calendar` provides the shared Calendar state to Calendar structural parts; it does not create another independently controlled selection. `Value` renders the localized accepted date or caller placeholder. Trigger communicates the accepted value and opens the named dialog. Content/Portal preserve existing Popover positioning, collision, container, forceMount and cancellable focus/outside/escape hooks. Default is nonmodal; `aria-modal` is not claimed without actual existing layer modality. All action buttons default to type button.

Clear requests null even when required; required makes empty submission invalid rather than forbidding editing. Read-only allows opening/inspection/navigation but no selection or clear. Disabled removes user interactions. Close/Escape do not select the cursor. FormControl is one explicit actual native input when form participation is needed; root name alone does not serialize an unmounted input. Themes includes the bridge in its form-capable composition, and primitive form examples show it explicitly.

## State ownership, transitions and focus

Initial uncontrolled month comes from defaultViewMonth, else accepted selected date's month, else supplied today, clamped to month bounds. The controlled month prop is authoritative. Selection, visible month, open state and keyboard cursor are separate.

- Browsing/cursor movement never selects. Click, Enter or Space on an allowed day requests that date once. An adjacent-month activation also requests its visible month; selection validity is determined by the date, not whether the month request was accepted.
- Keyboard movement across a month requests the new month and moves DOM focus only after that month is accepted and rendered. A refused request leaves a mounted usable focus target; reconciliation never repeatedly reissues the request.
- On actual open, focus the selected date if displayed and in bounds, otherwise supplied today if displayed/in bounds, otherwise the first in-bounds date in the visible month. Unavailable dates may receive focus. A controlled visible month wins over automatic centering. An uncontrolled picker reopens at the selected month when a selection exists, bounded by min/max; otherwise it retains its bounded navigation month.
- A commit requests value and then requests `open=false`. Those are independent authorities: rejecting selection but accepting close leaves the old value on Trigger; rejecting close keeps the actual popup open and focus active within it. Do not restore Trigger focus on a mere close request. Consumers needing approval-before-close control both props.
- Restore focus on accepted close through existing layer hooks. Outside pointer interaction must not steal focus from the clicked destination. Removed triggers must not throw or force a gratuitous body-focus jump. Programmatic changes while closed do not open or focus the picker.
- Reconcile external month changes to a usable cursor in the newly displayed grid. Do not steal focus when it was outside the calendar; only repair the future tab stop then. While focus is inside, repair its target after the accepted DOM update.

### Changing bounds after mount

A min/max change never mutates the accepted selected date. Its native/domain validity updates instead. In uncontrolled navigation, clamp the visible month to the new interval and repair the cursor to an in-bounds date, preserving its date/day where possible; report an actual month change once through the normal callback, not through a selection callback.

Never silently override controlled viewMonth. If changed bounds leave it outside the interval, keep the supplied month displayed with its disallowed cells unavailable. Use an in-bounds displayed day if one exists; otherwise Grid is the focusable fallback and has no date cursor until the owner supplies an allowed month. Navigation toward the interval requests the nearest boundary month; navigation away is disabled. This takes constant work, not a month-by-month search. The owner may refuse the request. A supplied out-of-range controlled month uses the same explicit behavior, not an internal substitute month.

## Keyboard and unavailable-date policy

Left/Right move one visual day (horizontal directions reverse in RTL); Up/Down move seven days; Home/End move to first/last day of the displayed week; PageUp/PageDown move a month; Shift+PageUp/PageDown move a year. Clamp short-month/leap-day movement; min/max stop movement beyond the interval. Enter/Space select only if allowed. Ignore IME/composition and unrelated modified keys; consumer cancellation of cancelable interaction wins. Tab visits one day tab stop plus navigation controls, not every date. Inline Tab leaves naturally; DatePicker follows actual nonmodal/modal layer mode. Escape is a popup action, not inline selection.

Unavailable dates are **focusable aria-disabled**, not native-disabled day buttons skipped by an unbounded search. They remain inspectable but do not activate. An entirely unavailable month/calendar remains navigable with a stable date focus target and working month/close controls. Only min/max month boundaries disable month navigation; arbitrary unavailable predicates do not require exhaustive scans. Root disabled removes interactive day/navigation tab stops. Read-only preserves browsing while blocking selection/clear.

The linear key mapping in the existing roving-focus helper is not a calendar algorithm. Reuse its real-focus, scope and ref patterns where applicable; Calendar owns bounded two-dimensional date navigation. No extra month/year view state is implemented. Distant-date use cases use keyboard year movement or the documented native-input alternative.

## Native forms and shared private Form integration

### Native bridge and events

FormControl renders a visually hidden real **input type=date**, not type hidden, display:none or the hidden attribute. It has tabindex -1 and is not a second accessible editor. Mirror accepted canonical value (null becomes empty string), name, external form ID, min, max, required, disabled and actual root readOnly. Do not make the bridge readOnly just because editing uses a button: that would remove required validation. Actual readOnly intentionally has native date-input semantics: retained submission, barred constraint validation.

Exactly one named successful control serializes the accepted value. Empty enabled named controls serialize an empty string; disabled controls are omitted. A newly unavailable accepted date remains visible and present in direct FormData, while ordinary validated submission is blocked. FormData does not validate, and `form.submit()` bypasses validation by browser design. Client constraints do not replace server validation.

Accepted selection/clear changes synchronize the bridge before notifying native form observers. User-originated accepted changes dispatch input then change, bubbling; programmatic accepted changes dispatch a non-bubbling change following existing native-control conventions. No events on initial projection, no-op or refused value request. Internal dispatch must not become another selection request. Use owner-document event constructors and cancel pending work on disposal. Normalized notifications describe accepted state, not a cursor movement.

Standalone, the bridge owns unavailable-date custom validity; required/min/max use native flags. Route **actual input focus** to the visible Trigger. Never unconditionally focus/preventDefault from invalid: standalone checkValidity must not steal focus. reportValidity, requestSubmit and submit-button activation can focus an invalid bridge, which then redirects. Provide visible/associated error text and invalid state on Trigger; do not promise native validation-bubble suppression or duplicate a field in the accessibility tree.

### Single custom-validity owner

Compose **Form.Control asChild with DatePicker.FormControl**, never Trigger. Current Form.Control is input-specific and clears/sets customValidity during its matcher lifecycle; a second independent customValidity writer would be incorrect.

Root owns selection and constraints; Form.Control target-factory props must not override them. Preserve the wrapper's id, composed ref/events and aria-describedby forwarding to the actual date input. For managed composition, supply DatePicker.Root.name equal to Form.Control's resolved name (including a surrounding Form.Field name); any explicitly supplied wrapper form association must equal Root.form. Conflicting names/associations are configuration errors, not separate submission and matcher keys.

Add one narrow private per-control integration shared with FileDrop. Form.Control supplies an optional scoped registration/context around its native/slotted input. The child registers a baseline-error getter and can request managed revalidation after projection. With this owner present, the child does not set customValidity. Form.Control alone combines native constraints, current registered baseline and its existing matcher results. Clearing/reset clears appropriate matcher results but re-applies current baseline; changing baseline invalidates pending validation and recomputes. Existing synchronous/asynchronous generation guards and serverInvalid behavior remain. Without registration, existing Form.Control behavior is unchanged. Unregistration/cleanup cannot retain a disposed input or publish stale results.

The integration additionally supports a control-specific value revision for FileDrop's File-reference sequence, so existing string-value equality is not mistaken for file identity. This is private control coordination, not a public generic validator framework, new scheduling system or rewrite of the checkbox/radio helper.

Preserve Form's existing capture-invalid focus policy: it already focuses first-invalid controls, including during managed checkValidity. Bridge focus redirection therefore also handles that and the server-error focus path. Only standalone checkValidity is promised focusless. Forward description/error associations to Trigger. Its accessible name must be caller-declared using explicit label IDs/aria-labelledby or accessible Trigger text; do not walk DOM label text or claim Form.Label derives a Trigger name automatically. Normal Form.Label activation targets the forwarded native input id and its actual focus redirects correctly. Do not globally suppress invalid or redesign Form focus policy.

### Reset and cleanup

Capture the initial accepted/default selection once at mount. An uncancelled associated reset requests it, then reprojects current accepted state after browser reset; controlled refusal wins. Cancelled reset does nothing. Native reset does not clear custom errors automatically: recompute baseline and clear only reset-appropriate managed errors. Do not synthesize user input/change on reset. As with existing deferred native bridges, synchronous reads during the browser reset/reconciliation window are not the settled-state guarantee. Reassociation follows actual input.form; listeners, queued reset/focus work, refs and registrations clean up on unmount.

## SSR, locale and effects

Require today at the application boundary, serialize it with server data, and pass it identically to client. No independent Date.now/current local day, navigator locale, default time zone or midnight timer in either primitive. Locale defaults to en-US and weekStartsOn to Sunday; explicit locale and week start are independent of dir. Regional week inference, if desired, belongs to the app, not engine-dependent weekInfo fallbacks.

Use Intl labels with explicit Gregorian calendar and fixed UTC formatting bridge built from numeric date fields, handling years 1–99 without the JavaScript 1900 shortcut. Domain arithmetic remains date-only; the formatting object never becomes the selected instant. Server/client require matching locale configuration and compatible Intl data. Changing locale/week start/direction does not change the selected ISO value.

Direction uses existing Direction context unless overridden; RTL reverses horizontal navigation and icon appearance, not chronological previous/next month meaning. Locale formats dates but does not translate 'Choose date', 'Clear' or error prose. Callers supply accessible action/error text via normal parts/descriptions; Themes documents its default language and overrides.

Use existing deterministic createUniqueId/scoped contexts, not random/time/global IDs. Two instances remain isolated. Initial closed and explicitly open SSR structures hydrate without DOM reads during render or pre-mount autofocus. Effects own only mounted focus, bridge synchronization, registration and native listener resources. No second renderer, context runtime or DOM ownership layer. Custom picker functionality is hydration-dependent; the native-input recipe serves progressive enhancement.

## Accessibility, Themes and mobile

Use grid/row/columnheader/gridcell semantics, full localized date labels, selected/today distinction, restrained month announcements, accessible popup Title/Description and a visibly labeled Trigger. Do not announce navigation as selection or announce the same month through two live regions. Unavailable dates remain comprehensible. Focus rings survive forced colors and do not rely on color alone.

Themes supplies styled Calendar and DatePicker components/parts using existing size/color/radius/variant patterns, palette/custom accent/local scaling and Theme propagation through portals. Comfortable controls target about 44 CSS pixels; dense variants still meet WCAG 2.2 target-size/spacing requirements. At narrow widths and 200–400% zoom preserve operable controls and visible focused dates. Constrain popup height to existing available-space variables, allow internal scrolling and avoid unexpected document scroll. Button opening must not summon a virtual keyboard. No viewport-sniffed automatic switch to another dialog mode; modal is explicit. Existing nested Dialog/Popover dismissal/scroll ownership applies.

Browser/assistive-technology verification is required; ARIA markup or an upstream example does not certify accessibility.

## Distribution, website and documentation contract

Keep existing packages `@wsagency/radix2solid-primitives` and `@wsagency/radix2solid-themes`, native Solid 2 RC15 and TS 7.0.2 producer/current consumer declaration conventions. No Foldkit, Effect, date library, runtime adapter, new package scope or publication action is part of this specification stage.

Real library integration landmarks: `packages/primitives/src/index.ts`, `packages/primitives/package.json`, `packages/primitives/vite.config.ts`, primitive README/CHANGELOG; `packages/themes/src/components/index.ts`, `packages/themes/src/components/index.css`, Themes package exports/README/CHANGELOG, and `packages/themes/scripts/build-css.js`. Root and family subpaths include types/browser/server outputs. DatePicker selective CSS includes Calendar/Popover dependencies; Calendar-only CSS must not import popup styling. Preserve full CSS, layered CSS, per-component and palette workflows.

In the **separate radix2solid-web repository**, integration covers `apps/website/data/primitives/docs/components/`, `apps/website/data/themes/`, `apps/website/src/demos/` live/CSS/Tailwind sources, `apps/website/src/pages/playground.tsx`, `apps/website/src/components/navigation.tsx`, `apps/website/src/routes.ts`, `apps/website/coverage-manifest.json`, README/CHANGELOG and existing sandbox/snippet/export/search/markdown scripts under `apps/website/scripts/`. Follow generated-output workflows; do not hand-edit generated site output. Source links and coverage classify these as project extensions, not nonexistent Radix React ports.

Required docs/examples: anatomy; complete props/callbacks/data attributes and keyboard reference; inline Calendar; DatePicker; bounds/unavailable/all-unavailable dates; controlled refusal and month-data loading; required/external-form/reset/Form server errors; locale/week start/RTL; disabled/readOnly/clear; native input alternative and non-goals; selective/full CSS; copyable code, runnable sandbox, playground, search and machine-readable markdown. No fake range component or unimplemented editable API in examples.

## Required acceptance

These are release criteria, **not tests already passed**:

1. Keyboard/cursor/month navigation never selects; allowed click/Enter/Space commits once. Leap days, short months, 0001/9999 padding, min/max and RTL navigation preserve correct dates without time-zone shifts.
2. Independent controlled refusal of value/month/open/close leaves authoritative display, submitted value and mounted focus intact, without callback loops or false selected states. External changes while focus is elsewhere do not steal focus.
3. Dynamic bounds clamp uncontrolled navigation/cursor, preserve newly invalid selection, and never override controlled month. An out-of-bounds controlled view provides its documented fallback and bounded navigation requests. All-unavailable dates remain inspectable with stable navigation and close controls.
4. Standalone required/min/max/unavailable validation blocks ordinary invalid submission and redirects actual bridge focus; checkValidity itself stays focusless. Valid ISO submission does not steal focus. Form-managed checkValidity retains existing first-invalid focus behavior; form.submit remains a documented bypass.
5. One named date field; clear/disabled/readOnly semantics, explicitly declared Trigger name, label activation/description/error association, native and baseline validity, sync/async/server Form errors and stale-result prevention all coexist. Form target-factory id/ref/events/descriptions survive forwarding; Root and Form resolved names/associations match, and conflicts are configuration errors. No competing customValidity writers.
6. Accepted/refused/cancelled reset, default value capture, external form/reassociation, domain validity reset and unmount during queued reset/focus/validation are correct with no ghost events or retained listeners.
7. Accepted close, rejected close, Escape, outside click, nested Dialog, removed Trigger, nonmodal Tab and actual modal containment preserve documented focus behavior.
8. Differing machine clocks/timezones with identical serialized today/locale/week start hydrate stably; multiple IDs are independent; locale/RTL changes do not mutate value; open SSR and teardown/remount work.
9. Touch, narrow viewport, zoom, forced colors and representative supported browser/screen-reader combinations permit browsing, errors and selection without hover-only controls or unintended keyboard. Record tested combinations and gaps honestly.
10. Root/subpath browser/SSR imports and consumer declarations work; Themes selective/full CSS dependencies and portal theme values are correct; live docs/snippets/sandboxes/playground/search/markdown agree with the API.

Existing verification landmarks include `e2e/inputs.spec.ts`, `e2e/layers.spec.ts`, `e2e/composition.spec.ts`, `e2e/hydration.spec.ts`, `tests/consumer/` and separate web `e2e/website.spec.ts` plus its checker scripts. Exact implementation/test task allocation belongs to a subsequently approved plan.

## Source compatibility, platform evidence and legal provenance

Repository-relative source evidence: `packages/primitives/src/internal/state.ts:3–37`; `internal/primitive.tsx:6–23`, `internal/context.tsx:7–34`, `internal/roving-focus.tsx:57–87` under the same source root; `packages/primitives/src/popover/popover.tsx:9–19`; `packages/primitives/src/internal/overlay.tsx:16–28,39–105`; `packages/primitives/src/form/form.tsx:18,78–90,139–201`; `packages/primitives/src/internal/form-control.ts:4–24,36–98` (checked-state-specific, not a generic date bridge); `packages/themes/src/components/popover.tsx:18–23`; `packages/themes/scripts/build-css.js:23–60`.

Design-time native-platform probes used Playwright 1.64.0 and headless Chromium 156.0.8078.4 on Linux, plain HTML, not built components. They observed: real date inputs enforce required/min/max and sanitize malformed strings; type hidden ignores required; readonly date inputs are barred from validation but submitted; disabled is omitted; reset restores defaults without clearing customError. With a visually hidden tabindex=-1 date input and a focus listener redirecting to a visible button, standalone checkValidity returned false without moving focus; reportValidity/requestSubmit/submit click blocked submission and ended focused on the visible button; valid requestSubmit submitted `YYYY-MM-DD` without moving focus. No invalid-handler preventDefault was used for that focus proof. This is Chromium-only platform evidence, not native picker UI, validation-bubble, mobile, Firefox/WebKit, screen-reader or completed-component certification.

Public references: [HTML date state](<https://html.spec.whatwg.org/multipage/input.html#date-state-(type=date)>), [hidden state](<https://html.spec.whatwg.org/multipage/input.html#hidden-state-(type=hidden)>), [APG date-picker dialog example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), [grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). APG's illustrative modal example is not production certification and is not copied as the nonmodal tab policy.

Foldkit [Calendar](https://foldkit.dev/ui/calendar) and [DatePicker](https://foldkit.dev/ui/date-picker) inspired independent selection/navigation and explicit today. Examined upstream: version 0.168.0, commit `606ca39eaf1cb92659d83aaaac3512b47cba25a2`, MIT copyright 2025 Devin Jameson. No upstream code is copied by this specification. Future actual copying/adaptation requires the exact applicable copyright/permission notices in distributed source/package notices and review of the chosen file's license; record source URL/revision and adaptation as engineering provenance. A SHA is not an MIT requirement. Preserve existing Radix-derived MIT notices; do not add Foldkit/snabbdom-derived attribution without actual copied/adapted material or claim an independent extension is a port.
