# Next Suite CI mode split implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolate the two complete browser modes into separate GitHub jobs without narrowing coverage or weakening the npm release gate.

**Architecture:** Add reusable full packed/dev commands and share one empty-environment dev command between `test` and `check:dev`. Run both modes in a fail-fast-disabled matrix with a stable fail-closed aggregate. Reuse that workflow read-only from publish; rebuild the same validated tag SHA once before packing.

**Tech Stack:** Node **24.21.0**, pnpm **11.5.0**, npm **11.21.0**, GitHub runner **ubuntu-24.04**, Playwright **1.64.0**. Preserve all existing action pins and lockfile.

**Spec:** `docs/superpowers/specs/2026-10-20-next-suite-ci-mode-split.md`.

## Global Constraints

- Preserve complete tests and existing push/pull_request filters; no scopes, Playwright selectors in implementation scripts, retries, timeout changes, or removed skips.
- In `test:dev`, use exactly `GALLERY_PACKED='' GALLERY_PRODUCTION=''`, matching `tests/consumer/run.ts:93-95`; `playwright.config.ts` compares values to literal `'1'`. Do not use `'0'`.
- Preserve `check` job id/name, branch required-check policy, Node/npm/pnpm/action pins, `v*-rc.*` publisher trigger, repository guard, `environment: npm`, OIDC, `--tag next`, and registry readback. Do not create/change branch protection.
- Validation is `contents: read` only. Only the existing protected publish job gets `id-token: write`. The publisher rebuilds the validated caller/tag SHA before packing; it does not rerun browser install or `pnpm check` after reusable validation.
- Writer has no push, merge, tag, environment-approval, or npm-release authority. No local packed consumer build/pack replay and no permanent workflow-wiring tests.

## Review Focus

1. **Coverage and mode selection:** exact scripts/config retain all four unit files, all five consumer packages, packed consumer default/all scopes and all six Playwright projects; empty env values select development. Verify script/config text, a one-case `check:dev` smoke (final PW selector only), and actual full current-head mode jobs.
2. **Aggregate failure/cancel/skip:** final id/name `check` uses `always()` and explicitly fails unless matrix result is `success`. Review the actual workflow expression and matrix job/aggregate results on GitHub; do not add permanent wiring tests or claim the green run exercises failure branches.
3. **OIDC/environment boundary:** reusable validation and caller have read-only permissions; only the existing publish job has OIDC and `environment: npm`. Review YAML and, after merge, the actual tag run's validation-before-protected-publish ordering.
4. **Source SHA/build-pack identity:** reusable validation and publisher use the same caller tag SHA; publisher performs `pnpm build` once after validation and before pack. Review checkout/ref and step order, then confirm SHA and build/pack ordering in actual tag-run metadata/logs.
5. **Event coverage:** preserve existing `push` and `pull_request` trigger blocks exactly while adding `workflow_call`; verify the diff and observe normal PR/branch CI plus the post-merge tag run. Do not substitute a narrower tag filter or change protection rules.

---

## Task 1 — Implement mode split, release gate, and documentation atomically

**One implementation owner for all four files; do not split into independent writer tasks.**

**Files:**
- Modify `package.json` — shared unit/dev scripts and full mode pipelines.
- Modify `.github/workflows/check.yml` — reusable mode matrix and aggregate.
- Modify `.github/workflows/publish.yml` — reusable read-only validation and single build before pack.
- Modify `README.md` — Native distribution and release gates commands/coverage.

- [ ] **Step 1: Factor package test scripts.** Add `test:unit` with the exact existing files `tests/slider.test.ts`, `tests/splitter.test.ts`, `tests/calendar.test.ts`, `tests/file-drop.test.ts`; add `test:dev` as the full `playwright test` command with `GALLERY_PACKED='' GALLERY_PRODUCTION=''`. Set `test` to unit → full `test:consumer` → shared `test:dev`. Keep `check` as build → typecheck → full `test`. Add `check:packed` as build → typecheck → unit → unscoped full consumer; add `check:dev` as build → typecheck → unit → shared full `test:dev`.
- [ ] **Step 2: Make `check.yml` reusable and mode-isolated.** Add `workflow_call` without changing existing `push` or `pull_request` filters. Use exactly `packed` and `dev` matrix values with `fail-fast: false`; keep runner, checkout/setup pins, frozen install and browser install; call `pnpm check:${{ matrix.mode }}`. Set read-only permissions. Preserve final job id/name `check`, dependent on the matrix with `if: always()`, and make it fail unless matrix result is exactly `success`.
- [ ] **Step 3: Gate release and remove duplicated expensive work.** Add `validate` in `publish.yml` with the existing `if: github.repository == 'wsagency/radix2solid'` guard, calling `./.github/workflows/check.yml` with `contents: read` only; make existing `publish` depend on it and keep its current repository guard. In `publish` remove exactly the browser-install step and `pnpm check` step (existing lines 53-54); retain frozen install, then run `pnpm build` once immediately before the existing pack/inspect step. Keep checkout on the same caller/tag SHA; retain manifests, artifact checks, existing pins, npm environment/OIDC permissions, publish tag and registry readback unchanged.
- [ ] **Step 4: Update `README.md` Native distribution and release gates.** Replace the stale single-slider description with the four unit tests and full local `pnpm check` contract; describe complete `check:packed`/`check:dev`, all-package packed coverage and six-project dev coverage without implying the mode jobs are subsets.

**Acceptance:** One reviewable atomic change across those four files. `pnpm check` remains both modes; `test` and `check:dev` share the exact empty-string dev entrypoint; publish runs validation then one rebuild/pack path; all scope, event, OIDC and source-SHA constraints above remain intact.

## Task 2 — Smoke, contract review, and required CI lifecycle

**Files:** no permanent tests/wiring files; temporary inspection scripts only if needed.

- [ ] Run `pnpm test:unit`.
- [ ] Smoke the complete `check:dev` script with one final Playwright grep selector, e.g. `GALLERY_PORT=4306 pnpm run check:dev e2e/advanced.spec.ts --grep 'OTP rapid repeated typing preserves every entered digit' --project=ssr`. Use owned port 4306 (4307 alternate); never use 4147, 4149, or 4150. This runs build/typecheck/units and one Chromium SSR case, not packed consumer packaging. The selector is invocation-only, never committed.
- [ ] Inspect/parse the resulting workflow YAML and diff: mode list and fail-fast, `always()` plus explicit result guard, unchanged push/PR trigger blocks, caller permissions, `needs`, protected OIDC job, removed publisher browser-install/check, and build-before-pack on the same tag SHA. Temporary checks only; no permanent wiring tests.
- [ ] After an authorized branch push, require actual full current-head GitHub CI success for packed, dev and aggregate `check`; merge only under the existing green required-check policy. Require full main-branch CI after merge.
- [ ] Only after merge, the release owner may create the existing tag. Confirm actual reusable validation ran successfully on that tag SHA before the protected npm publication job; proceed only through its existing environment/OIDC approval. This tag-run proof is post-merge, not a pre-merge condition, and the implementation worker performs no release action.

**Completion:** Report local smoke separately from full GitHub evidence. If current-head CI or post-merge main CI is not available, state exactly which gate remains outstanding; never claim local smoke proves full coverage.