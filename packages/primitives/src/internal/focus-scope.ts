import type { LayerRecord } from './dismissable-layer.js';
import { dispatchCancelableEvent } from './events.js';

export function composedContains(container: Node, target: Node | null): boolean {
  for (let node = target; node;) {
    if (container.contains(node)) return true;
    const root = node.getRootNode();
    node = root instanceof container.ownerDocument!.defaultView!.ShadowRoot ? root.host : null;
  }
  return false;
}
export function activeElement(document: Document): HTMLElement | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active as HTMLElement | null;
}
export function focus(node: HTMLElement | null | undefined, select = false, preventScroll = true): void {
  if (!node?.isConnected) return;
  const previous = activeElement(node.ownerDocument);
  node.focus({ preventScroll });
  if (select && previous !== node && node.tagName === 'INPUT' && 'select' in node) (node as HTMLInputElement).select();
  if (!preventScroll && activeElement(node.ownerDocument) === node) node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
export function tabbables(container: HTMLElement): HTMLElement[] {
  const candidates: HTMLElement[] = [];
  const walk = (parent: globalThis.Element | ShadowRoot) => {
    for (const child of parent.children) {
      const node = child as HTMLElement;
      if (node.hidden || node.matches(':disabled, [inert], input[type="hidden"]')) continue;
      if (node.tabIndex >= 0 && typeof node.focus === 'function' && node.checkVisibility({ checkVisibilityCSS: true })) candidates.push(node);
      if (node.shadowRoot) walk(node.shadowRoot);
      walk(node);
    }
  };
  walk(container);
  return candidates;
}
export function inLayer(layer: LayerRecord, target: Node | null): boolean {
  if (layer.node && composedContains(layer.node, target)) return true;
  for (const branch of layer.branches) if (composedContains(branch, target)) return true;
  return false;
}
export function autofocus(layer: LayerRecord): void {
  const node = layer.node!;
  const previous = activeElement(node.ownerDocument);
  layer.previousFocus = previous;
  if (inLayer(layer, previous)) { layer.lastFocus = previous; return; }
  const event = new node.ownerDocument.defaultView!.CustomEvent('focusScope.autoFocusOnMount', { cancelable: true });
  dispatchCancelableEvent(node, event, layer.options.onOpenAutoFocus);
  if (!event.defaultPrevented) {
    for (const candidate of tabbables(node)) {
      if (candidate.tagName === 'A') continue;
      focus(candidate, true);
      if (activeElement(node.ownerDocument) !== previous) break;
    }
    if (activeElement(node.ownerDocument) === previous) focus(node);
  }
  layer.lastFocus = activeElement(node.ownerDocument);
}
export function restoreFocus(layer: LayerRecord): void {
  const node = layer.node!;
  const event = new node.ownerDocument.defaultView!.CustomEvent('focusScope.autoFocusOnUnmount', { cancelable: true });
  dispatchCancelableEvent(node, event, layer.options.onCloseAutoFocus);
  if (event.defaultPrevented) return;
  const target = layer.options.modal() || !layer.interactedOutside ? layer.options.trigger() ?? layer.previousFocus : null;
  // Disposal of the child precedes resuming its parent; never steal focus on a close→reopen interruption.
  queueMicrotask(() => { if (!layer.options.active() && !(layer.options.kind === 'popover' && layer.rightClickOutside)) focus(target); });
}
export function loopFocus(layer: LayerRecord, event: KeyboardEvent): void {
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
  const node = layer.node!;
  const candidates = tabbables(node);
  for (const branch of layer.branches) candidates.push(...tabbables(branch));
  const current = activeElement(node.ownerDocument);
  if (!candidates.length) { event.preventDefault(); focus(node, false, false); }
  else if (event.shiftKey && current === candidates[0]) { event.preventDefault(); focus(candidates.at(-1), false, false); }
  else if (!event.shiftKey && current === candidates.at(-1)) { event.preventDefault(); focus(candidates[0], false, false); }
}
