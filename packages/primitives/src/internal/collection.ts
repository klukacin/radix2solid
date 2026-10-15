import { createSignal, runWithOwner } from 'solid-js';

/** Registration belongs to the component owner; ordering is read from the current DOM. */
export function createCollection<T>() {
  const entries = new Map<HTMLElement, T>();
  const [version, changed] = createSignal(0);
  return {
    register(node: HTMLElement, value: T) {
      entries.set(node, value);
      changed(previous => previous + 1);
      // Row disposal can run inside a caller's list computation; invalidation is imperative.
      return () => { entries.delete(node); runWithOwner(null, () => changed(previous => previous + 1)); };
    },
    items(container?: Node) {
      version();
      return [...entries].filter(([node]) => container ? container.contains(node) : node.isConnected).sort(([a], [b]) => {
        const relation = a.compareDocumentPosition(b);
        return relation & 1 ? 0 : relation & 4 ? -1 : relation & 2 ? 1 : 0;
      }).map(([node, value]) => ({ node, value }));
    }
  };
}
