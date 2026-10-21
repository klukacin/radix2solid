# CI: split packed and development verification by mode

## Current behavior and evidence

- `.github/workflows/check.yml` has one `check` job running `pnpm check`; root `check` runs build, typecheck and full `test`.
- `test` runs four Node tests, the default all-package `test:consumer`, then root Playwright. The consumer runner's default branch runs the complete packed suite; root Playwright config has six projects, one worker, and selects packed/production servers only when the relevant variable equals the literal `'1'`. The existing neutral dev environment is `GALLERY_PACKED='' GALLERY_PRODUCTION=''` (`tests/consumer/run.ts:93-95`). Do not use `'0'` as a neutral value.
- Reported GitHub runs hit the six-hour job cap: packed completed 1,806 tests with 21 skips in ~2.4h; development reached WebKit CSR at ~1,754 tests without assertion failures before cancellation. The remedy is mode isolation, not reduced coverage.
- The existing check workflow's unfiltered `push` covers every tag. `publish.yml` independently installs browsers, then runs `pnpm check`, before packing and publishing only `v*-rc.*` tags on the owned repository.

## Decision and command contract

Split only at the existing complete packed/development mode boundary. Both modes run build, typecheck and all four unit tests; `check:packed` then runs unscoped `pnpm test:consumer`, while `check:dev` runs the complete root Playwright suite. Factor the full dev command into `test:dev` with the exact neutral empty-string environment pattern above, and use `test:dev` from both `check:dev` and `test`. Keep `test` full (unit + consumer + dev) and `pnpm check` full (build + typecheck + test). No project/spec/grep selectors, consumer scopes, retries, timeout changes, or skipped coverage in implementation scripts.

A fail-fast-disabled `packed`/`dev` matrix in `check.yml` provides independent job limits. Preserve its `check` job id/name as a final fail-closed aggregate so required checks remain stable and cancellation/skip cannot pass. Reuse `check.yml` from a read-only `publish.yml` validation job; validation must gate the existing publish job.
This is preferred to increasing Playwright workers, which leaves the combined job runtime coupled, or spec/project sharding, which adds selectors and risks coverage loss despite the existing natural mode boundary.

Keep both existing `push` and `pull_request` filters unchanged when adding `workflow_call`. Therefore all-tag/fork direct-check coverage remains, and matching owned-repository RC tags continue to run both direct and reusable full validation. This duplicate is accepted CI cost, not a reason to narrow existing events.

## Release contract

Keep all existing action pins, version checks and npm protection. After reusable validation, the publish job checks out the same caller tag SHA, installs dependencies, runs only `pnpm build` to rebuild verified tagged source, then packs and inspects the actual tarballs. Remove its old browser installation and monolithic `pnpm check`; do not replay the full tests after validation. Preserve tarball checks, `environment: npm`, repository guard, `id-token: write` only on the protected publication job, `npm publish --tag next`, and registry readback. Apply the existing `github.repository == 'wsagency/radix2solid'` guard to both the reusable `validate` job and the existing `publish` job; validation has `contents: read` only, no secrets/environment/OIDC. Do not rely on caller workflow-level `env` propagation.

## Documentation and acceptance

Update `README.md`'s Native distribution and release gates section to describe the full `pnpm check`, the packed/dev CI commands and their coverage. Keep pins and existing release guidance accurate.

Acceptance: both isolated mode jobs retain every current unit/package/build/version assertion, all six Playwright projects and every existing skip; `pnpm check` remains the full local gate; final `check` succeeds only when both modes succeed; publish awaits read-only validation and rebuilds/packs the same tag SHA before the existing protected OIDC path.

## Verification and release lifecycle

Local verification is smoke-only: unit tests and a one-test selector applied only to the final Playwright invocation of the complete `check:dev` script, with the owned `GALLERY_PORT=4306` (4307 is the alternate owned port; never use 4147/4149/4150). Inspect config/YAML and compare event filters; do not replay the local packed consumer build/pack. No permanent workflow-wiring tests.

Then review and push the implementation branch; require successful full current-head GitHub CI for packed, dev, and aggregate `check`; merge under the existing required-check policy; require full main-branch CI. Only after merge, the release owner may create the existing tag: inspect the actual reusable validation run's tag SHA and success, then proceed through the protected npm environment/OIDC approval and publication. Tag validation is post-merge release evidence, not a pre-merge condition. The implementation writer has no push, merge, tag, environment-approval, or npm-release authority.
