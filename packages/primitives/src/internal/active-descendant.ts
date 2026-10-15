import { createSignal, type Accessor } from 'solid-js';

export type ActiveDescendantItem = { key: string; id: string; node: HTMLElement; disabled: boolean };

export interface ActiveDescendantCursor {
  active: Accessor<string | null>; activeId: Accessor<string | undefined>;
  setActive(key: string | null): void;
  move(intent: 'first' | 'last' | 'next' | 'previous'): void;
  reconcile(reset?: boolean): void;
}

/** Only cursor identity and movement: callers supply visible DOM order and own observation. */
export function createActiveDescendant(options: { items: () => readonly ActiveDescendantItem[]; loop: () => boolean }): ActiveDescendantCursor {
  const [active, update] = createSignal<string | null>(null);
  let current: string | null = null, previous: string[] = [];
  function setActive(key: string | null) {
    const items = options.items().filter(item => !item.disabled);
    const item = items.find(item => item.key === key);
    current = item?.key ?? null;
    previous = items.map(item => item.key);
    update(current);
    item?.node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  return {
    active,
    activeId: () => options.items().find(item => !item.disabled && item.key === active())?.id,
    setActive,
    move(intent) {
      const items = options.items().filter(item => !item.disabled);
      const index = items.findIndex(item => item.key === current);
      let next = intent === 'first' ? 0 : intent === 'last' ? items.length - 1 : index < 0 ? (intent === 'next' ? 0 : items.length - 1) : index + (intent === 'next' ? 1 : -1);
      next = options.loop() && items.length ? (next + items.length) % items.length : Math.max(0, Math.min(items.length - 1, next));
      setActive(items[next]?.key ?? null);
    },
    reconcile(reset = false) {
      const items = options.items().filter(item => !item.disabled);
      if (reset) { setActive(items[0]?.key ?? null); return; }
      if (current !== null && !items.some(item => item.key === current)) {
        const index = Math.max(0, previous.indexOf(current));
        setActive(items[Math.min(index, items.length - 1)]?.key ?? null);
      } else previous = items.map(item => item.key);
    }
  };
}
