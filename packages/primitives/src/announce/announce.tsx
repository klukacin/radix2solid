// Native port of Radix Announce; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, merge, omit, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { composeRefs } from '../internal/refs.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { VISUALLY_HIDDEN_STYLES } from '../visually-hidden/visually-hidden.js';

type RegionType = 'polite' | 'assertive' | 'off';
type RegionRole = 'status' | 'alert' | 'log' | 'none';
export type AnnounceProps = PrimitiveProps<'div'> & {
  type?: RegionType;
  role?: RegionRole;
  regionIdentifier?: string;
};
const roles = { polite: 'status', assertive: 'alert', off: 'none' } as const;
type RegionConfig = { type: RegionType; role: RegionRole; atomic: boolean; relevant?: string; id: string };
type Region = { node: HTMLElement; owned: boolean; count: number; dispose: () => void };
const documents = new WeakMap<Document, Map<string, Region>>();

function acquireRegion(document: Document, config: RegionConfig) {
  let regions = documents.get(document);
  if (!regions) documents.set(document, regions = new Map());
  const key = JSON.stringify(config);
  let region = regions.get(key);
  if (!region) {
    const view = document.defaultView!;
    const marker = 'data-radix-announce-region' + (config.id ? `-${config.id}` : '');
    const selector = `[${view.CSS.escape(marker)}][aria-live=${config.type}][role=${config.role}][aria-atomic=${config.atomic}]` +
      (config.relevant ? `[aria-relevant=${view.CSS.escape(config.relevant)}]` : ':not([aria-relevant])');
    const existing = document.querySelector<HTMLElement>(selector);
    const node = existing ?? document.createElement('div');
    if (!existing) {
      node.setAttribute(marker, '');
      node.setAttribute('aria-atomic', String(config.atomic));
      if (config.relevant) node.setAttribute('aria-relevant', config.relevant);
      Object.assign(node.style, VISUALLY_HIDDEN_STYLES);
    }
    const visibility = () => {
      node.setAttribute('role', document.hidden ? 'none' : config.role);
      node.setAttribute('aria-live', document.hidden ? 'off' : config.type);
    };
    visibility();
    if (!existing) document.body.append(node);
    document.addEventListener('visibilitychange', visibility);
    region = { node, owned: !existing, count: 0, dispose: () => document.removeEventListener('visibilitychange', visibility) };
    regions.set(key, region);
  }
  region.count++;
  const current = region;
  return {
    node: current.node,
    release() {
      if (--current.count) return;
      current.dispose();
      if (current.owned) current.node.remove();
      else {
        current.node.setAttribute('role', config.role);
        current.node.setAttribute('aria-live', config.type);
      }
      regions!.delete(key);
      if (!regions!.size) documents.delete(document);
    }
  };
}

// Native JSX owns DOM nodes, not replayable React elements. Mirror their live DOM
// without moving originals, re-running child components, or replacing unchanged text.
function mirrorChildren(source: HTMLElement, target: HTMLElement, includeSource: boolean) {
  const nodes = new WeakMap<Node, Node>();
  if (!includeSource) nodes.set(source, target);
  const remember = (original: Node, mirror: Node) => {
    nodes.set(original, mirror);
    let child = original.firstChild;
    let copy = mirror.firstChild;
    while (child && copy) {
      remember(child, copy);
      child = child.nextSibling;
      copy = copy.nextSibling;
    }
  };
  const sync = (original: Node) => {
    const mirror = nodes.get(original);
    if (!mirror) return;
    let cursor = mirror.firstChild;
    for (const child of original.childNodes) {
      let copy = nodes.get(child);
      if (!copy) { copy = child.cloneNode(true); remember(child, copy); }
      if (copy !== cursor) mirror.insertBefore(copy, cursor);
      cursor = copy.nextSibling;
    }
    while (cursor) {
      const next = cursor.nextSibling;
      mirror.removeChild(cursor);
      cursor = next;
    }
  };
  const view = source.ownerDocument.defaultView!;
  let started = false;
  const observer = new view.MutationObserver(records => {
    if (!started) return;
    for (const record of records) {
      const mirror = nodes.get(record.target);
      if (record.type === 'childList') sync(record.target);
      else if (record.type === 'characterData' && mirror) mirror.nodeValue = record.target.nodeValue;
      else if (record.type === 'attributes' && (includeSource || record.target !== source) && record.attributeName && mirror instanceof view.Element && record.target instanceof view.Element) {
        const attribute = record.target.getAttributeNodeNS(record.attributeNamespace, record.attributeName);
        if (!attribute) mirror.removeAttributeNS(record.attributeNamespace, record.attributeName);
        else mirror.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
      }
    }
  });
  observer.observe(source, { subtree: true, childList: true, characterData: true, attributes: true });
  // Expose the empty live region before adding its first notification.
  const frame = view.requestAnimationFrame(() => {
    started = true;
    if (includeSource) {
      const copy = source.cloneNode(true);
      remember(source, copy);
      target.append(copy);
    } else sync(source);
  });
  return () => { started = false; view.cancelAnimationFrame(frame); observer.disconnect(); };
}

export function Announce(props: AnnounceProps): Element {
  const [node, setNode] = createSignal<HTMLElement>();
  const includeSource = untrack(() => props.asChild === true);
  if (!isServer) createEffect(() => ({
    node: node(), type: props.type ?? 'polite', role: props.role ?? roles[props.type ?? 'polite'],
    atomic: props['aria-atomic'] === 'true',
    relevant: props['aria-relevant'] || undefined, id: props.regionIdentifier || ''
  }), ({ node, ...config }) => {
    if (!node) return;
    const region = acquireRegion(node.ownerDocument, config);
    const mirror = node.ownerDocument.createElement('div');
    region.node.append(mirror);
    const dispose = mirrorChildren(node, mirror, includeSource);
    return () => { dispose(); mirror.remove(); region.release(); };
  }, { transparent: true });
  const forwarded = merge(omit(props, 'type', 'role', 'regionIdentifier', 'aria-relevant', 'ref'), { ref: composeRefs(props.ref, setNode) });
  return <Primitive as="div" {...forwarded} />;
}
