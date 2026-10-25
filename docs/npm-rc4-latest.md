# RC.4 on npm `latest`: DevOps instructions

## Status and scope

These instructions cover the approved one-time npm dist-tag change for the **already published** `0.1.0-rc.4` versions; they do not claim that the change has been performed. Per the user's confirmation, DevOps has already published all five packages. Tag `v0.1.0-rc.4` and source commit `4ff4954be95bab5db9004f9a09c744f780f38929` remain unchanged. Do not run a new build, `npm publish`, Git tag/push, or provenance/OIDC check; OIDC success has not been confirmed.

`0.1.0-rc.4` remains a prerelease and uses Solid `2.0.0-rc.15`. The npm dist-tag `latest` determines what an **unpinned** installation resolves to; it does not change semver status or make the release stable/GA. For this prerelease, a one-time change setting `latest` to rc.4 is approved. The future prerelease publishing workflow and `publishConfig` remain on `next` ([workflow](../.github/workflows/publish.yml)); do not republish the packages.

## Before changing tags

1. An authorized DevOps operator must work in a private shell session. Before **all** npm commands (login, preflight, tag changes, verification, and rollback), run `cd /tmp` or move to another known directory outside every Git repository and remain there; this prevents the project `.npmrc` from loading. Use existing approved npm authentication if available; otherwise, run the entire procedure in the same shell session with a temporary npm userconfig outside the repository. Never print or `cat` the userconfig, run `npm config list`, enable `set -x`, or write tokens/2FA codes to logs.

   If no existing approved npm authentication is available and a temporary login is needed for this procedure, use this block; otherwise, skip it and leave the existing configuration untouched:

   ```bash
   umask 077
   NPM_CONFIG_USERCONFIG="$(mktemp /tmp/radix2solid-npmrc.XXXXXX)" || exit 1
   if [ -z "$NPM_CONFIG_USERCONFIG" ] || [ ! -f "$NPM_CONFIG_USERCONFIG" ]; then
     printf 'Temporary npm userconfig creation failed.\n' >&2
     exit 1
   fi
   export NPM_CONFIG_USERCONFIG
   TEMP_NPM_LOGIN=0
   cleanup_temp_npm_auth() {
     if [ "$TEMP_NPM_LOGIN" = 1 ]; then
       npm logout --registry=https://registry.npmjs.org/ || printf 'Temporary npm logout failed; escalate before closing.\n' >&2
     fi
     rm -f "$NPM_CONFIG_USERCONFIG"
   }
   trap cleanup_temp_npm_auth EXIT
   npm login --registry=https://registry.npmjs.org/ || exit 1
   TEMP_NPM_LOGIN=1
   ```

2. Immediately before making changes, record the **current** `latest` and `next` tags for all five packages in private operational notes. Use the explicit public registry:

   ```bash
   npm dist-tag ls @wsagency/radix2solid-primitives --registry=https://registry.npmjs.org/
   npm dist-tag ls @wsagency/radix2solid-icons --registry=https://registry.npmjs.org/
   npm dist-tag ls @wsagency/radix2solid-icons-extra --registry=https://registry.npmjs.org/
   npm dist-tag ls @wsagency/radix2solid-themes --registry=https://registry.npmjs.org/
   npm dist-tag ls @wsagency/radix2solid-charts --registry=https://registry.npmjs.org/
   ```

3. The last state reported by the user is **historical, not a current check**: `next=0.1.0-rc.4` for all five packages; `latest` was `rc.1` for Primitives, Icons, and Themes, `rc.3` for Icons Extra, and `rc.2` for Charts. If any current `next` differs from rc.4, is missing, or points to a newer version, **stop without changes** and confirm with the owner. For `latest`, if it is already rc.4, record and skip that package; otherwise, if it differs from the historical value, is missing, or is unexpected, stop and confirm the current state before making any change.

## One-time change

Each call changes one package; the operation is not atomic. Run the commands individually and stop at the first error:

```bash
npm dist-tag add @wsagency/radix2solid-primitives@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
npm dist-tag add @wsagency/radix2solid-icons@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
npm dist-tag add @wsagency/radix2solid-icons-extra@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
npm dist-tag add @wsagency/radix2solid-themes@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
npm dist-tag add @wsagency/radix2solid-charts@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
```

## Verification and rollback

After all calls, rerun the five `npm dist-tag ls` commands above. For each package, confirm `latest=0.1.0-rc.4` and that `next` equals the value recorded before the change (expected: rc.4). Record only tags and outcomes, not credentials.

If a command fails or the state changes only partially, **stop** and compare the results for all five packages with the snapshot. Roll back only a package confirmed to have been changed by this operation from an existing initial `latest` value to rc.4. If `latest` was already rc.4 or the current value is already the recorded initial version, skip that package. Immediately before each rollback, recheck the tag and proceed only if current `latest` is still `0.1.0-rc.4`; if it is missing, has another value, or the change cannot be proven to have been made by this operation, do not change it and escalate to the owner. An initially missing `latest` must fail preflight, so there is no `rm` rollback. For an allowed rollback, use the recorded existing initial version: `npm dist-tag add <package-name>@<recorded-version> latest --registry=https://registry.npmjs.org/`. After manual rollback, check all five packages.

For a temporary login created by this block, before ending the session run `npm logout --registry=https://registry.npmjs.org/`, set `TEMP_NPM_LOGIN=0`, remove only that userconfig with `rm -f "$NPM_CONFIG_USERCONFIG"`, and disable the EXIT trap with `trap - EXIT`. If the session ends before manual cleanup, the trap logs out only when `TEMP_NPM_LOGIN=1` and removes only that temporary userconfig. If existing authentication or a userconfig was used, do not run the temporary block, log out, or delete that configuration.

This is only a dist-tag change for existing prerelease versions; it does not change packages, versions, `next`, the workflow, the Git tag, or OIDC provenance. For exact consumer installs and API context, see the [root README](../README.md) and the five package READMEs.
