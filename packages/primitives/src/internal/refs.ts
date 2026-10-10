import type { JSX } from '@solidjs/web';

/** Native array refs preserve directive setup and disposal; no unowned lifecycle registration. */
export function composeRefs<T>(...refs: JSX.Ref<T>[]): JSX.Ref<T> {
  return refs;
}

/** Compare nested native ref arrays without copying or invoking their callbacks. */
export function equalRefs<T>(previous: JSX.Ref<T>, next: JSX.Ref<T>): boolean {
  if (previous === next) return true;
  if (!Array.isArray(previous) || !Array.isArray(next) || previous.length !== next.length) return false;
  for (let index = 0; index < previous.length; index++) {
    if (!equalRefs(previous[index], next[index])) return false;
  }
  return true;
}
