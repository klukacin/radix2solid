# Agent instructions

## Definition of done

A task is done only when `pnpm lint` reports 0 linting issues: 0 errors and 0 warnings. Lint output with any diagnostic means the task is not finished, whatever else passes.

Before you report a task as done:

1. Run `pnpm lint`. Done when it exits 0 with no diagnostics.
2. Run `pnpm format`, then `pnpm format:check`. Done when the check exits 0.
3. Run the checks for the code you changed, up to `pnpm check` for the full gate.

## Tooling

- Lint: Oxlint with `eslint-plugin-solid` (`v2-strict` preset), configured in `oxlint.config.ts`. Warnings fail the run.
- Format: oxfmt, configured in `.oxfmtrc.json`.
- Generated icon sources (`packages/icons/src/*Icon.tsx`, `packages/icons/src/index.ts`, and the same files under `packages/icons-extra/src`) come from `packages/icons/scripts/generate.ts`. Change the generator, then run `pnpm --filter @wsagency/radix2solid-icons generate` and `pnpm --filter @wsagency/radix2solid-icons-extra generate`.
- OMP picks up the `oxlint` and `oxfmt` language servers from `.omp/lsp.json`.
