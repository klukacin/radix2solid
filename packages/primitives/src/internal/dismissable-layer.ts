import { createContext, createEffect, untrack, useContext, type Accessor } from 'solid-js';
import { isServer } from '@solidjs/web';
import { activeElement, autofocus, composedContains, focus, inLayer, loopFocus, restoreFocus } from './focus-scope.js';
import { lockScroll } from './scroll-lock.js';
import { dispatchCancelableEvent } from './events.js';

export type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;
export type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;
export interface LayerCallbacks {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
  onFocusOutside?: (event: FocusOutsideEvent) => void;
  onInteractOutside?: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}
export interface LayerOptions extends LayerCallbacks {
  active: Accessor<boolean>;
  modal: Accessor<boolean>;
  trigger: Accessor<HTMLElement | undefined>;
  dismiss: () => void;
  kind: 'dialog' | 'popover' | 'layer';
  surfaces?: Set<HTMLElement>;
  focusScope?: boolean;
  loopFocus?: boolean;
}
export interface LayerRecord {
  node: HTMLElement | null;
  parent: LayerRecord | null;
  branches: Set<HTMLElement>;
  options: LayerOptions;
  previousFocus: HTMLElement | null;
  lastFocus: HTMLElement | null;
  interactedOutside: boolean;
  rightClickOutside: boolean;
}
export const LayerContext = createContext<LayerRecord | null>(null);
const documents = new WeakMap<Document, LayerRegistry>();
const branches = new WeakMap<Document, Map<HTMLElement, ((event: KeyboardEvent) => boolean) | undefined>>();

/** A document-wide branch remains interactive across independently owned modal roots. */
export function registerLayerBranch(node: HTMLElement, onEscapeKeyDown?: (event: KeyboardEvent) => boolean): () => void {
  const document = node.ownerDocument;
  let entries = branches.get(document);
  if (!entries) { entries = new Map(); branches.set(document, entries); }
  entries.set(node, onEscapeKeyDown);
  const registry = documents.get(document);
  for (const layer of registry?.layers ?? []) layer.branches.add(node);
  registry?.sync();
  return () => {
    if (!entries!.delete(node)) return;
    const current = documents.get(document);
    for (const layer of current?.layers ?? []) layer.branches.delete(node);
    current?.sync();
    if (!entries!.size) branches.delete(document);
  };
}
const interactionEvents = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click'];
type PendingPointer = { layers: LayerRecord[]; original: PointerEvent; target: Node; intercepted: Set<string>; surface: boolean; prevented: boolean };

class LayerRegistry {
  layers: LayerRecord[] = [];
  hidden = new Map<globalThis.Element, string | null>();
  pointerStyles = new Map<HTMLElement, string>();
  originalBodyPointer: string | undefined;
  unlockScroll: (() => void) | undefined;
  pending: PendingPointer | undefined;
  focusFallback: number | undefined;
  observer: MutationObserver;
  constructor(readonly document: Document) {
    document.addEventListener('keydown', this.keydown, true);
    document.addEventListener('focusin', this.focusin);
    document.addEventListener('pointercancel', this.cancelPointer, true);
    for (const event of interactionEvents) {
      document.addEventListener(event, this.capture, true);
      document.addEventListener(event, this.bubble);
    }
    this.observer = new document.defaultView!.MutationObserver(() => {
      const modal = this.modal();
      if (modal && activeElement(document) === document.body && this.focusFallback === undefined) {
        // Portal removal may run between native blur and focus; let that transfer finish.
        this.focusFallback = document.defaultView!.setTimeout(() => {
          this.focusFallback = undefined;
          const modal = this.modal();
          if (modal && activeElement(document) === document.body) focus(modal.node);
        }, 0);
      }
      this.hideOutside();
    });
  }
  top() { return this.layers.at(-1); }
  focusScope() { return this.layers.findLast(layer => layer.options.focusScope !== false); }
  modal() { return this.layers.findLast(layer => layer.options.modal()); }
  outsideLayers(target: Node): LayerRecord[] {
    const layers: LayerRecord[] = [];
    for (let index = this.layers.length - 1; index >= 0; index--) {
      const layer = this.layers[index]!;
      if (!inLayer(layer, target)) layers.push(layer);
      if (layer.options.modal()) break;
    }
    return layers;
  }
  isDescendant(layer: LayerRecord, ancestor: LayerRecord): boolean {
    for (let parent = layer.parent; parent; parent = parent.parent) if (parent === ancestor) return true;
    return false;
  }
  add(layer: LayerRecord) {
    const child = this.layers.findIndex(candidate => this.isDescendant(candidate, layer));
    if (child < 0) this.layers.push(layer); else this.layers.splice(child, 0, layer);
    for (const branch of branches.get(this.document)?.keys() ?? []) layer.branches.add(branch);
    for (let parent = layer.parent; parent; parent = parent.parent) parent.branches.add(layer.node!);
    layer.interactedOutside = layer.rightClickOutside = false;
    this.sync();
    layer.previousFocus = activeElement(this.document);
  }
  remove(layer: LayerRecord) {
    const index = this.layers.indexOf(layer);
    if (index >= 0) this.layers.splice(index, 1);
    for (let parent = layer.parent; parent; parent = parent.parent) parent.branches.delete(layer.node!);
    // Closed-but-owned layers must not retain regions disposed after their deactivation.
    for (const branch of branches.get(this.document)?.keys() ?? []) layer.branches.delete(branch);
    const pointer = this.pointerStyles.get(layer.node!);
    if (pointer !== undefined) { layer.node!.style.pointerEvents = pointer; this.pointerStyles.delete(layer.node!); }
    this.sync();
    if (layer.options.focusScope !== false) restoreFocus(layer);
    if (!this.layers.length) this.dispose();
  }
  sync() {
    const modal = this.modal();
    if (modal && !this.unlockScroll) this.unlockScroll = lockScroll(this.document, () => {
      const current = this.modal();
      return current?.node ? [current.node, ...current.branches, ...current.options.surfaces ?? []] : [];
    });
    if (!modal && this.unlockScroll) { this.unlockScroll(); this.unlockScroll = undefined; }
    if (modal && this.originalBodyPointer === undefined) {
      this.originalBodyPointer = this.document.body.style.pointerEvents;
      this.document.body.style.pointerEvents = 'none';
    }
    if (!modal && this.originalBodyPointer !== undefined) {
      this.document.body.style.pointerEvents = this.originalBodyPointer;
      this.originalBodyPointer = undefined;
    }
    const threshold = modal ? this.layers.indexOf(modal) : -1;
    for (const [index, layer] of this.layers.entries()) {
      const node = layer.node!;
      if (modal) {
        if (!this.pointerStyles.has(node)) this.pointerStyles.set(node, node.style.pointerEvents);
        let globalBranch = false;
        for (const branch of branches.get(this.document)?.keys() ?? []) {
          if (composedContains(branch, node)) { globalBranch = true; break; }
        }
        node.style.pointerEvents = index >= threshold || globalBranch ? 'auto' : 'none';
      } else if (this.pointerStyles.has(node)) {
        node.style.pointerEvents = this.pointerStyles.get(node)!;
        this.pointerStyles.delete(node);
      }
    }
    this.hideOutside();
    this.observer.disconnect();
    if (this.layers.length) {
      this.observer.observe(this.document.body, { childList: true, subtree: true });
      const shadows = new Set<Node>();
      for (const layer of this.layers) {
        const root = layer.node!.getRootNode();
        if (root !== this.document && !shadows.has(root)) {
          this.observer.observe(root, { childList: true, subtree: true }); shadows.add(root);
        }
      }
    }
  }
  hideOutside() {
    const modal = this.modal();
    const allowed = modal?.node ? [modal.node, ...modal.branches] : [];
    const next = new Set<globalThis.Element>();
    const walk = (parent: globalThis.Element | ShadowRoot) => {
      for (const node of parent.children) {
        if (allowed.some(root => root === node)) continue;
        if (allowed.some(root => composedContains(node, root))) {
          walk(node); if (node.shadowRoot) walk(node.shadowRoot);
        } else if (!node.matches('script, style, link')) next.add(node);
      }
    };
    if (allowed.length) walk(this.document.body);
    for (const [node, original] of this.hidden) {
      if (!next.has(node)) {
        if (original === null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', original);
        this.hidden.delete(node);
      }
    }
    for (const node of next) {
      if (!this.hidden.has(node)) this.hidden.set(node, node.getAttribute('aria-hidden'));
      node.setAttribute('aria-hidden', 'true');
    }
  }
  keydown = (event: KeyboardEvent) => {
    const top = this.top();
    if (!top || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      const target = event.composedPath()[0] as Node;
      for (const [node, handle] of branches.get(this.document) ?? []) {
        if (handle && composedContains(node, target) && handle(event)) return;
      }
      top.options.onEscapeKeyDown?.(event);
      if (!event.defaultPrevented) { event.preventDefault(); top.options.dismiss(); }
    } else {
      const scope = this.focusScope();
      if (scope && scope.options.loopFocus !== false) loopFocus(scope, event);
    }
  };
  focusin = (original: FocusEvent) => {
    const target = original.composedPath()[0] as Node;
    const top = this.top();
    if (!top) return;
    if (!this.pending) {
      for (const layer of this.outsideLayers(target)) this.outside(layer, original, target);
    }
    const modal = this.modal();
    if (modal) {
      if (inLayer(modal, target)) modal.lastFocus = activeElement(this.document);
      else focus(modal.lastFocus?.isConnected && inLayer(modal, modal.lastFocus) ? modal.lastFocus : modal.node, true);
    }
    if (inLayer(top, target)) top.lastFocus = activeElement(this.document);
  };
  outside(layer: LayerRecord, original: PointerEvent | FocusEvent, target: Node) {
    if (!this.layers.includes(layer) || !layer.options.active()) return;
    const pointer = original.type === 'pointerdown';
    const event = new this.document.defaultView!.CustomEvent(pointer ? 'dismissableLayer.pointerDownOutside' : 'dismissableLayer.focusOutside', {
      cancelable: true, detail: { originalEvent: original }
    });
    dispatchCancelableEvent(target, event, event => {
      if (pointer) layer.options.onPointerDownOutside?.(event as PointerDownOutsideEvent);
      else layer.options.onFocusOutside?.(event as FocusOutsideEvent);
      layer.options.onInteractOutside?.(event as PointerDownOutsideEvent | FocusOutsideEvent);
    });
    if (!pointer && layer.options.modal()) event.preventDefault();
    if (pointer) {
      const down = original as PointerEvent;
      const right = down.button === 2 || down.button === 0 && down.ctrlKey;
      if (layer.options.kind === 'dialog' && layer.options.modal() && right) event.preventDefault();
      layer.rightClickOutside = right;
    }
    if (target && layer.options.trigger() && composedContains(layer.options.trigger()!, target)) event.preventDefault();
    if (!event.defaultPrevented) { layer.interactedOutside = true; layer.options.dismiss(); }
  }
  finish(pending: PendingPointer) {
    if (this.pending !== pending) return;
    this.pending = undefined;
    if (!pending.prevented && (pending.surface || !pending.intercepted.size)) {
      for (const layer of pending.layers) this.outside(layer, pending.original, pending.target);
    }
  }
  capture = (event: Event) => {
    if (event.type === 'pointerdown') {
      this.pending = undefined;
      const target = event.composedPath()[0] as Node;
      const layers = this.outsideLayers(target);
      if (!layers.length) return;
      const original = event as PointerEvent;
      let surface = false;
      for (const layer of this.layers) {
        if (layer.options.surfaces) for (const node of layer.options.surfaces) {
          if (composedContains(node, target)) { surface = true; break; }
        }
        if (surface) break;
      }
      const pending = this.pending = { layers, original, target, surface, intercepted: new Set<string>(), prevented: false };
      if (original.button !== 0) setTimeout(() => this.finish(pending), 0);
    }
    const pending = this.pending;
    if (!pending) return;
    pending.intercepted.add(event.type);
    // Trusted dispatch checkpoints microtasks between listeners; inspect interception after bubbling.
    if (event.type === 'click') setTimeout(() => { pending.prevented ||= event.defaultPrevented; this.finish(pending); }, 0);
  };
  bubble = (event: Event) => {
    const pending = this.pending;
    if (pending) {
      pending.intercepted.delete(event.type);
      pending.prevented ||= event.defaultPrevented;
      if (event.type === 'pointerdown' && pending.original.button !== 0) this.finish(pending);
    }
  };
  cancelPointer = () => { this.pending = undefined; };
  dispose() {
    this.pending = undefined;
    this.document.defaultView!.clearTimeout(this.focusFallback);
    this.observer.disconnect();
    this.document.removeEventListener('keydown', this.keydown, true);
    this.document.removeEventListener('focusin', this.focusin);
    this.document.removeEventListener('pointercancel', this.cancelPointer, true);
    for (const event of interactionEvents) {
      this.document.removeEventListener(event, this.capture, true);
      this.document.removeEventListener(event, this.bubble);
    }
    documents.delete(this.document);
  }
}

export function createLayer(node: Accessor<HTMLElement | undefined>, options: LayerOptions): LayerRecord {
  const parent = useContext(LayerContext);
  const layer: LayerRecord = { node: null, parent, options, branches: new Set(), previousFocus: null, lastFocus: null, interactedOutside: false, rightClickOutside: false };
  if (!isServer) {
    const active = () => {
      for (let ancestor = parent; ancestor; ancestor = ancestor.parent) if (!ancestor.options.active()) return false;
      return options.active();
    };
    createEffect(() => [node(), active()] as const, ([element, active]) => {
      if (!element || !active) return;
      layer.node = element;
      let registry = documents.get(element.ownerDocument);
      if (!registry) { registry = new LayerRegistry(element.ownerDocument); documents.set(element.ownerDocument, registry); }
      const owner = registry;
      let mounted = true;
      untrack(() => owner.add(layer));
      // Descendant effects register roving items after this parent's activation effect.
      queueMicrotask(() => { if (mounted && owner.focusScope() === layer) autofocus(layer); });
      return () => { mounted = false; untrack(() => owner.remove(layer)); };
    }, { transparent: true });
    createEffect(() => [options.modal(), node()] as const, ([, element]) => {
      if (element) untrack(() => documents.get(element.ownerDocument)?.sync());
    }, { transparent: true });
  }
  return layer;
}
