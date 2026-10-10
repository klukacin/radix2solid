// Native port of Radix Select; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createMemo, createSignal, createUniqueId, For, merge, omit, onCleanup, Show, untrack, type Element } from 'solid-js';
import { isServer, Portal as NativePortal, type ComponentProps } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { createCollection } from '../internal/collection.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeRefs } from '../internal/refs.js';
import { composeEventHandlers } from '../internal/events.js';
import { createPresence } from '../internal/presence.js';
import { createLayer, LayerContext, type LayerCallbacks } from '../internal/dismissable-layer.js';
import { activeElement, focus } from '../internal/focus-scope.js';
import { Popper, PopperAnchor, PopperContent, PopperArrow, createPopperScope, type PopperContentProps, type PopperArrowProps } from '../internal/popper.js';
import { useDirection, type Direction } from '../direction/direction.js';
import { VISUALLY_HIDDEN_STYLES } from '../visually-hidden/visually-hidden.js';
import { mergeStyles, type SlotRender } from '../slot/slot.js';

type Scoped = { __scopeSelect?: Scope };
export type SelectSharedProps = Scoped & { children?: Element; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; dir?: Direction; name?: string; autoComplete?: string; disabled?: boolean; required?: boolean; form?: string };
export type SelectProps = SelectSharedProps & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void };
export type SelectProviderProps = SelectProps;
export type SelectTriggerProps = Scoped & PrimitiveProps<'button'>;
type Without<P, K extends PropertyKey> = P extends unknown ? Omit<P, K> : never;
export type SelectValueProps = Scoped & Without<PrimitiveProps<'span'>, 'placeholder'> & { placeholder?: Element };
export type SelectIconProps = Scoped & PrimitiveProps<'span'>;
export type SelectPortalProps = Scoped & { children?: Element; container?: globalThis.Element | DocumentFragment | null; forceMount?: true };
export type SelectContentProps = Scoped & PopperContentProps & Pick<LayerCallbacks, 'onCloseAutoFocus' | 'onEscapeKeyDown' | 'onPointerDownOutside'> & { position?: 'item-aligned' | 'popper'; forceMount?: true };
export type SelectViewportProps = Scoped & PrimitiveProps<'div'> & { nonce?: string };
export type SelectGroupProps = Scoped & PrimitiveProps<'div'>;
export type SelectLabelProps = Scoped & PrimitiveProps<'div'>;
export type SelectItemProps = Scoped & PrimitiveProps<'div'> & { value: string; disabled?: boolean; textValue?: string };
export type SelectItemTextProps = Scoped & PrimitiveProps<'span'>;
export type SelectItemIndicatorProps = Scoped & PrimitiveProps<'span'>;
export type SelectScrollUpButtonProps = Scoped & PrimitiveProps<'div'>;
export type SelectScrollDownButtonProps = SelectScrollUpButtonProps;
export type SelectSeparatorProps = Scoped & PrimitiveProps<'div'>;
export type SelectArrowProps = Scoped & PopperArrowProps;
export type SelectBubbleInputProps = Scoped & Without<PrimitiveProps<'select'>, 'value' | 'defaultValue'>;
interface ItemValue { value: () => string; disabled: () => boolean; text: () => string; textNode: () => HTMLElement | undefined; setTextNode: (node: HTMLElement | undefined) => void; textId: string }
interface RootValue {
  open: () => boolean; changeOpen: (open: boolean) => void; value: () => string | undefined; changeValue: (value: string | undefined) => void; initial: string | undefined;
  dir: () => Direction; disabled: () => boolean; required: () => boolean; trigger: () => HTMLElement | undefined; setTrigger: (node: HTMLElement | undefined) => void;
  valueNode: () => HTMLElement | undefined; setValueNode: (node: HTMLElement | undefined) => void; customValue: () => boolean; setCustomValue: (custom: boolean) => void;
  host: () => HTMLElement | undefined; setHost: (node: HTMLElement | undefined) => void; collection: ReturnType<typeof createCollection<ItemValue>>; items: () => { node: HTMLElement; value: ItemValue }[];
  options: Map<ItemValue, { value: string; disabled: boolean; text: string }>; optionVersion: () => number; optionsChanged: () => void; contentId: string;
  interaction: () => { count: number; bubbles: boolean }; markInteraction: (event: Event) => void; pointer: { x: number; y: number } | undefined;
}
interface ContentValue {
  node: () => HTMLElement | undefined; viewport: () => HTMLElement | undefined; setViewport: (node: HTMLElement | undefined) => void;
  wrapper: () => HTMLDivElement | undefined; position: () => 'item-aligned' | 'popper'; positioned: () => boolean;
  selected: () => { node: HTMLElement; value: ItemValue } | undefined; focusSelected: () => void; place: () => void; scrollButton: () => void;
  search: string; expand: boolean; scrollVersion: () => number; scrollChanged: () => void; focusLater: (nodes: HTMLElement[]) => void;
}
const [createSelectContext, createSelectScope] = createContextScope('Select', [createPopperScope]);
const [Provider, useRoot] = createSelectContext<RootValue>('Select');
const [ContentProvider, useContent] = createSelectContext<ContentValue>('SelectContent');
const [ItemProvider, useItem] = createSelectContext<ItemValue>('SelectItem');
const [GroupProvider, useGroup] = createSelectContext<string>('SelectGroup');
const [PortalProvider, usePortal] = createSelectContext<{ forceMount: () => boolean }>('SelectPortal', { forceMount: () => false });
export { createSelectScope };
const rootContext = (props: Scoped, part: string) => useRoot(`Select${part}`, untrack(() => props.__scopeSelect));
const contentContext = (props: Scoped, part: string) => useContent(`Select${part}`, untrack(() => props.__scopeSelect));
const empty = (value: string | undefined) => value === undefined || value === '';
const popperKeys = ['side', 'sideOffset', 'align', 'alignOffset', 'arrowPadding', 'avoidCollisions', 'collisionBoundary', 'collisionPadding', 'sticky', 'hideWhenDetached', 'updatePositionStrategy', 'onPlaced', '__scopePopper'] as const;

export function SelectProvider(props: SelectProviderProps): Element { return RootImpl(props, false); }
export function Select(props: SelectProps): Element { return RootImpl(props, true); }
function RootImpl(props: SelectProps, automaticInput: boolean): Element {
  const scope = untrack(() => props.__scopeSelect);
  const [open, changeOpen] = createControllableState({ value: () => props.open, get defaultValue() { return props.defaultOpen ?? false; }, get onChange() { return props.onOpenChange; } });
  const [value, changeValue] = createControllableState<string | undefined>({ value: () => props.value, get defaultValue() { return props.defaultValue; }, get onChange() { return props.onValueChange as ((value: string | undefined) => void) | undefined; } });
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>();
  const [valueNode, setValueNode] = createSignal<HTMLElement | undefined>();
  const [customValue, setCustomValue] = createSignal(false);
  const [host, setHost] = createSignal<HTMLElement | undefined>();
  const [optionVersion, changed] = createSignal(0);
  const [interaction, setInteraction] = createSignal({ count: 0, bubbles: false });
  const collection = createCollection<ItemValue>(), dir = useDirection(() => props.dir);
  const root: RootValue = { open, changeOpen, value, changeValue, initial: untrack(value), dir, trigger, setTrigger, valueNode, setValueNode, customValue, setCustomValue, host, setHost, collection,
    disabled: () => props.disabled ?? false, required: () => props.required ?? false, options: new Map(), optionVersion, optionsChanged: () => changed(previous => previous + 1), contentId: createUniqueId(), pointer: undefined,
    items: () => collection.items(host()), interaction, markInteraction: event => setInteraction(previous => ({ count: previous.count + 1, bubbles: !event.cancelBubble })) };
  const formControl = () => !!props.form || !trigger() || !!trigger()?.closest('form');
  return <Popper __scopePopper={scope}><Provider scope={scope} value={root}>{props.children}
    <Show when={automaticInput && formControl()}><SelectBubbleInput __scopeSelect={scope} name={props.name} form={props.form} disabled={props.disabled} required={props.required} autocomplete={props.autoComplete} /></Show>
  </Provider></Popper>;
}
function nextMatch(root: RootValue, search: string, current: HTMLElement | undefined) {
  const items = root.items().filter(item => !item.value.disabled());
  const index = items.findIndex(item => item.node === current);
  const repeated = [...search].every(character => character === search[0]);
  const term = (repeated ? search[0]! : search).toLowerCase();
  return [...items.slice(index + (repeated ? 1 : 0)), ...items.slice(0, index + (repeated ? 1 : 0))].find(item => item.value.text().toLowerCase().startsWith(term));
}
export function SelectTrigger(props: SelectTriggerProps): Element {
  const root = rootContext(props, 'Trigger');
  let pointerType = 'touch', search = '', timer: ReturnType<typeof setTimeout> | undefined;
  const disabled = () => root.disabled() || !!props.disabled;
  const reset = () => { clearTimeout(timer); search = ''; };
  onCleanup(reset);
  const open = (event?: PointerEvent) => { if (disabled()) return; root.changeOpen(true); reset(); root.pointer = event ? { x: Math.round(event.pageX), y: Math.round(event.pageY) } : undefined; };
  return <PopperAnchor __scopePopper={props.__scopeSelect} asChild>{target => target(Primitive, merge({ as: 'button' as const }, omit(props, '__scopeSelect'), {
    type: 'button' as const, role: 'combobox' as const, 'aria-autocomplete': 'none' as const,
    get disabled() { return disabled(); }, get dir() { return root.dir(); }, get ['aria-expanded']() { return root.open() ? 'true' as const : 'false' as const; },
    get ['aria-controls']() { return root.open() ? root.contentId : undefined; }, get ['aria-required']() { return root.required() ? 'true' as const : undefined; },
    get ['data-state']() { return root.open() ? 'open' : 'closed'; }, get ['data-disabled']() { return disabled() ? '' : undefined; }, get ['data-placeholder']() { return empty(root.value()) ? '' : undefined; },
    get ref() { return composeRefs(props.ref, root.setTrigger); },
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => {
      pointerType = event.pointerType;
      const node = event.currentTarget as HTMLElement;
      if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
      if (event.button === 0 && !event.ctrlKey && pointerType === 'mouse') { open(event); event.preventDefault(); }
    }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, event => { focus(event.currentTarget as HTMLElement); if (pointerType !== 'mouse') open(); }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (disabled() || event.target !== event.currentTarget) return;
      const typingSpace = search !== '' && event.key === ' ';
      if (!event.ctrlKey && !event.altKey && !event.metaKey && event.key.length === 1) {
        search += event.key; clearTimeout(timer); timer = setTimeout(reset, 1000);
        const selected = root.items().find(item => item.value.value() === root.value());
        const match = nextMatch(root, search, selected?.node);
        if (match) { root.markInteraction(event); root.changeValue(match.value.value()); }
      }
      if (!typingSpace && [' ', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) { open(); event.preventDefault(); }
    })
  }))}</PopperAnchor>;
}
export function SelectValue(props: SelectValueProps): Element {
  const root = rootContext(props, 'Value');
  const children = createMemo(() => props.children);
  let customChildren: () => Element = () => undefined;
  if (!isServer) { createEffect(() => [root.valueNode(), props.asChild ? customChildren() !== undefined : children() !== undefined] as const, ([, custom]) => { root.setCustomValue(custom); }, { transparent: true }); onCleanup(() => { root.setValueNode(undefined); root.setCustomValue(false); }); }
  const render: SlotRender = target => (untrack(children) as SlotRender)((component, childProps) => {
    customChildren = () => childProps.children;
    return target(component, merge(childProps, { get children() { return empty(root.value()) ? props.placeholder : childProps.children; } }) as ComponentProps<typeof component>);
  });
  return <Primitive as="span" {...(merge(omit(props, '__scopeSelect', 'placeholder', 'class', 'style', 'children'), {
    get ref() { return composeRefs(props.ref, root.setValueNode); }, style: { 'pointer-events': 'none' as const },
    get children() { return props.asChild ? render : empty(root.value()) ? props.placeholder : children(); }
  }) as PrimitiveProps<'span'>)} />;
}
export function SelectIcon(props: SelectIconProps): Element { return <Primitive as="span" {...(merge(omit(props, '__scopeSelect'), { 'aria-hidden': 'true' as const, get children() { return props.children ?? '▼'; } }) as PrimitiveProps<'span'>)} />; }
export function SelectPortal(props: SelectPortalProps): Element {
  const scope = untrack(() => props.__scopeSelect);
  return <PortalProvider scope={scope} value={{ forceMount: () => props.forceMount ?? false }}><NativePortal {...({ get mount() { return props.container ?? undefined; }, get children() { return props.children; } } as Parameters<typeof NativePortal>[0])} /></PortalProvider>;
}
export function SelectContent(props: SelectContentProps): Element {
  const root = rootContext(props, 'Content'), portal = usePortal('SelectContent', untrack(() => props.__scopeSelect));
  const presence = createPresence(root.open, () => props.forceMount ?? portal.forceMount());
  const fragment = isServer ? undefined : document.createDocumentFragment();
  return <Show when={presence.mounted()} fallback={fragment ? <NativePortal {...({ mount: fragment, get children() { return <ContentBody props={props} closed presence={presence} />; } } as unknown as Parameters<typeof NativePortal>[0])} /> : undefined}>
    <ContentBody props={props} closed={false} presence={presence} />
  </Show>;
}
function ContentBody(input: { props: SelectContentProps; closed: boolean; presence: ReturnType<typeof createPresence> }): Element {
  const props = input.props, scope = untrack(() => props.__scopeSelect), root = rootContext(props, 'Content');
  const [node, ref] = createSignal<HTMLElement | undefined>();
  const [viewport, setViewport] = createSignal<HTMLElement | undefined>();
  const [wrapper, wrapperRef] = createSignal<HTMLDivElement | undefined>();
  const [positioned, setPositioned] = createSignal(false);
  const [scrollVersion, changed] = createSignal(0);
  let searchTimer: ReturnType<typeof setTimeout> | undefined, focusTimer: ReturnType<typeof setTimeout> | undefined, frame: number | undefined;
  let firstScrollButton = true;
  const selected = () => { const items = root.items(); return items.find(item => item.value.value() === root.value()) ?? items.find(item => !item.value.disabled()); };
  const content: ContentValue = { node, viewport, setViewport, wrapper, position: () => input.closed ? 'item-aligned' : props.position ?? 'item-aligned', positioned, selected, search: '', expand: false, scrollVersion, scrollChanged: () => changed(previous => previous + 1),
    focusLater(nodes) { clearTimeout(focusTimer); focusTimer = setTimeout(() => focusCandidates(root, content, nodes), 0); },
    focusSelected() {
      const item = selected()?.node;
      focusCandidates(root, content, [item, node()].filter((node): node is HTMLElement => !!node));
    },
    place() { untrack(() => placeAligned(root, content, () => { setPositioned(true); props.onPlaced?.(); if (frame !== undefined) node()?.ownerDocument.defaultView!.cancelAnimationFrame(frame); frame = node()?.ownerDocument.defaultView!.requestAnimationFrame(() => { content.expand = true; }); })); },
    scrollButton() { if (firstScrollButton && positioned()) { firstScrollButton = false; if (content.position() === 'item-aligned') content.place(); content.focusSelected(); } }
  };
  onCleanup(() => { clearTimeout(searchTimer); clearTimeout(focusTimer); if (frame !== undefined) node()?.ownerDocument.defaultView!.cancelAnimationFrame(frame); });
  const layer = createLayer(node, { active: () => !input.closed && root.open(), modal: () => true, trigger: root.trigger, kind: 'layer', loopFocus: false, dismiss: () => root.changeOpen(false),
    onOpenAutoFocus: event => event.preventDefault(),
    onCloseAutoFocus(event) { props.onCloseAutoFocus?.(event); if (!event.defaultPrevented) { focus(root.trigger()); event.preventDefault(); } },
    get onEscapeKeyDown() { return props.onEscapeKeyDown; }, get onPointerDownOutside() { return props.onPointerDownOutside; }, onFocusOutside: event => event.preventDefault()
  });
  if (!isServer) {
    createEffect(node, element => { if (!element) return; root.setHost(element); return () => { if (untrack(root.host) === element) root.setHost(undefined); }; }, { transparent: true });
    createEffect(() => [root.open(), positioned(), selected()?.node] as const, ([open, placed]) => { if (!input.closed && open && placed) untrack(content.focusSelected); }, { transparent: true });
    createEffect(() => [node(), viewport(), wrapper(), selected()?.node, selected()?.value.textNode(), root.trigger(), root.valueNode(), props.position, root.dir()] as const, ([element, view, wrap, , , , , position]) => {
      if (input.closed || !element || !view || !wrap || position === 'popper') return;
      content.place();
      let width = element.offsetWidth, height = view.scrollHeight;
      const observer = new element.ownerDocument.defaultView!.ResizeObserver(() => {
        const nextWidth = element.offsetWidth, nextHeight = view.scrollHeight;
        // Allocated viewport height belongs to scroll expansion, not initial placement.
        if (nextWidth === width && nextHeight === height) return;
        width = nextWidth; height = nextHeight; content.place();
      });
      observer.observe(element); observer.observe(view);
      return () => observer.disconnect();
    }, { transparent: true });
    createEffect(() => [node(), root.open()] as const, ([element, open]) => {
      if (input.closed || !element || !open) return;
      const document = element.ownerDocument, view = document.defaultView!;
      const point = root.pointer;
      let delta = { x: 0, y: 0 };
      const move = (event: PointerEvent) => { if (point) delta = { x: Math.abs(Math.round(event.pageX) - point.x), y: Math.abs(Math.round(event.pageY) - point.y) }; };
      const clear = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up, true); document.removeEventListener('pointercancel', clear); root.pointer = undefined; };
      const up = (event: PointerEvent) => { if (delta.x <= 10 && delta.y <= 10) event.preventDefault(); else if (!element.contains(event.target as Node)) root.changeOpen(false); clear(); };
      const close = () => root.changeOpen(false);
      if (point) { document.addEventListener('pointermove', move); document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', clear); }
      view.addEventListener('blur', close); view.addEventListener('resize', close);
      return () => { clear(); view.removeEventListener('blur', close); view.removeEventListener('resize', close); };
    }, { transparent: true });
    onCleanup(() => input.presence.ref(undefined));
  }
  const style = createMemo(() => mergeStyles(props.style, { display: 'flex', 'flex-direction': 'column', outline: 'none', ...(content.position() === 'item-aligned' ? { 'box-sizing': 'border-box', 'max-height': '100%' } : {
    '--radix-select-content-transform-origin': 'var(--radix-popper-transform-origin)', '--radix-select-content-available-width': 'var(--radix-popper-available-width)', '--radix-select-content-available-height': 'var(--radix-popper-available-height)', '--radix-select-trigger-width': 'var(--radix-popper-anchor-width)', '--radix-select-trigger-height': 'var(--radix-popper-anchor-height)' }) }));
  const forwarded = merge({ role: 'listbox' as const, id: root.contentId, tabindex: -1 }, omit(props, '__scopeSelect', 'forceMount', 'position', 'onCloseAutoFocus', 'onEscapeKeyDown', 'onPointerDownOutside', ...popperKeys), {
    get dir() { return root.dir(); }, get ['data-state']() { return root.open() ? 'open' : 'closed'; }, get style() { return style(); },
    get ref() { return composeRefs(props.ref, ref, input.closed ? undefined : input.presence.ref); },
    onContextMenu: composeEventHandlers<MouseEvent>(() => props.onContextMenu, event => event.preventDefault()),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if ((event.target as HTMLElement).closest('[role="listbox"]') !== event.currentTarget) return;
      if (event.key === 'Tab') event.preventDefault();
      if (!event.ctrlKey && !event.altKey && !event.metaKey && event.key.length === 1) { content.search += event.key; clearTimeout(searchTimer); searchTimer = setTimeout(() => { content.search = ''; }, 1000); const match = nextMatch(root, content.search, activeElement((event.currentTarget as HTMLElement).ownerDocument) ?? undefined); if (match) content.focusLater([match.node]); }
      if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); const items = root.items().filter(item => !item.value.disabled()).map(item => item.node);
        if (event.key === 'ArrowUp' || event.key === 'End') items.reverse();
        const current = items.indexOf(event.target as HTMLElement);
        content.focusLater(event.key === 'Home' || event.key === 'End' ? items : items.slice(current + 1));
      }
    })
  }) as PopperContentProps;
  const render = () => content.position() === 'popper' && !input.closed
    ? <PopperContent {...(merge(omit(props, '__scopeSelect', 'forceMount', 'position', 'onCloseAutoFocus', 'onEscapeKeyDown', 'onPointerDownOutside'), forwarded, { __scopePopper: scope, get align() { return props.align ?? 'start' as const; }, get collisionPadding() { return props.collisionPadding ?? 10; }, onPlaced() { setPositioned(true); props.onPlaced?.(); } }) as PopperContentProps)} />
    : <Primitive as="div" {...forwarded} />;
  return <ContentProvider scope={scope} value={content}><LayerContext value={layer}>{input.closed || content.position() === 'popper' ? render() : <div data-radix-select-content-wrapper="" ref={wrapperRef} style={{ display: 'flex', 'flex-direction': 'column', position: 'fixed' }}>{render()}</div>}</LayerContext></ContentProvider>;
}
function focusCandidates(root: RootValue, content: ContentValue, nodes: HTMLElement[]) {
  const items = root.items(), viewport = content.viewport();
  for (const node of nodes) {
    node.scrollIntoView({ block: 'nearest' });
    if (viewport && node === items[0]?.node) viewport.scrollTop = 0;
    if (viewport && node === items.at(-1)?.node) viewport.scrollTop = viewport.scrollHeight;
    focus(node);
    if (activeElement(node.ownerDocument) === node) return;
  }
}
function placeAligned(root: RootValue, content: ContentValue, placed: () => void) {
  const trigger = root.trigger(), value = root.valueNode(), wrapper = content.wrapper(), node = content.node(), viewport = content.viewport(), item = content.selected(), text = item?.value.textNode();
  if (!trigger || !value || !wrapper || !node || !viewport || !item || !text || !node.isConnected) return;
  const view = node.ownerDocument.defaultView!, triggerRect = trigger.getBoundingClientRect(), valueRect = value.getBoundingClientRect(), contentRect = node.getBoundingClientRect(), textRect = text.getBoundingClientRect();
  const rtl = root.dir() === 'rtl';
  const offset = rtl ? contentRect.right - textRect.right : textRect.left - contentRect.left;
  const coordinate = rtl ? view.innerWidth - valueRect.right - offset : valueRect.left - offset;
  const triggerCoordinate = rtl ? view.innerWidth - triggerRect.right : triggerRect.left;
  const minWidth = triggerRect.width + triggerCoordinate - coordinate, width = Math.max(minWidth, contentRect.width);
  wrapper.style.minWidth = `${minWidth}px`;
  wrapper.style[rtl ? 'right' : 'left'] = `${Math.max(10, Math.min(coordinate, view.innerWidth - 10 - width))}px`;
  wrapper.style[rtl ? 'left' : 'right'] = '';
  const styles = view.getComputedStyle(node), viewportStyles = view.getComputedStyle(viewport);
  const number = (value: string) => Number.parseFloat(value) || 0;
  const borderTop = number(styles.borderTopWidth), borderBottom = number(styles.borderBottomWidth);
  const fullHeight = borderTop + number(styles.paddingTop) + viewport.scrollHeight + number(styles.paddingBottom) + borderBottom;
  const available = view.innerHeight - 20, minHeight = Math.min(item.node.offsetHeight * 5, fullHeight), half = item.node.offsetHeight / 2;
  const topToMiddle = borderTop + number(styles.paddingTop) + item.node.offsetTop + half;
  const triggerMiddle = triggerRect.top + triggerRect.height / 2 - 10;
  const items = root.items(), first = item.node === items[0]?.node, last = item.node === items.at(-1)?.node;
  Object.assign(wrapper.style, { margin: '10px 0', minHeight: `${minHeight}px`, maxHeight: `${available}px`, zIndex: styles.zIndex });
  if (topToMiddle <= triggerMiddle) {
    wrapper.style.bottom = '0px'; wrapper.style.top = '';
    const bottomHeight = half + (last ? number(viewportStyles.paddingBottom) : 0) + node.clientHeight - viewport.offsetTop - viewport.offsetHeight + borderBottom;
    wrapper.style.height = `${topToMiddle + Math.max(available - triggerMiddle, bottomHeight)}px`;
  } else {
    wrapper.style.top = '0px'; wrapper.style.bottom = '';
    const topHeight = borderTop + viewport.offsetTop + (first ? number(viewportStyles.paddingTop) : 0) + half;
    wrapper.style.height = `${Math.max(triggerMiddle, topHeight) + fullHeight - topToMiddle}px`;
    viewport.scrollTop = topToMiddle - triggerMiddle + viewport.offsetTop;
  }
  placed();
}
export function SelectViewport(props: SelectViewportProps): Element {
  const content = contentContext(props, 'Viewport'); let previousScrollTop = 0;
  const style = createMemo(() => mergeStyles({ position: 'relative', flex: '1', overflow: 'hidden auto' }, props.style));
  return <><style nonce={props.nonce}>{'[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch}[data-radix-select-viewport]::-webkit-scrollbar{display:none}'}</style>
    <Primitive as="div" data-radix-select-viewport="" {...merge(omit(props, '__scopeSelect', 'nonce'), { role: 'presentation' as const, get style() { return style(); }, get ref() { return composeRefs(props.ref, content.setViewport); },
      onScroll: composeEventHandlers<Event>(() => props.onScroll, event => {
        const viewport = event.currentTarget as HTMLElement, wrapper = content.wrapper();
        if (content.expand && wrapper) {
          const delta = Math.abs(previousScrollTop - viewport.scrollTop);
          const height = Number.parseFloat(wrapper.style.height) || 0, available = viewport.ownerDocument.defaultView!.innerHeight - 20;
          const next = Math.min(available, Math.max(Number.parseFloat(wrapper.style.minHeight) || 0, height) + delta);
          if (next > height) { wrapper.style.height = `${next}px`; if (wrapper.style.bottom === '0px') { viewport.scrollTop = Math.max(0, delta - (next - height)); wrapper.style.justifyContent = 'flex-end'; } }
        }
        previousScrollTop = viewport.scrollTop; content.scrollChanged();
      })
    })} />
  </>;
}
export function SelectGroup(props: SelectGroupProps): Element { const id = createUniqueId(); return <GroupProvider scope={props.__scopeSelect} value={id}><Primitive as="div" {...merge({ role: 'group' as const, 'aria-labelledby': id }, omit(props, '__scopeSelect'))} /></GroupProvider>; }
export function SelectLabel(props: SelectLabelProps): Element { const id = useGroup('SelectLabel', untrack(() => props.__scopeSelect)); return <Primitive as="div" {...merge({ id }, omit(props, '__scopeSelect'))} />; }
export function SelectItem(props: SelectItemProps): Element {
  const root = rootContext(props, 'Item'), content = contentContext(props, 'Item');
  const [node, ref] = createSignal<HTMLElement | undefined>(), [textNode, setTextNode] = createSignal<HTMLElement | undefined>(), [text, setText] = createSignal(''), [highlighted, setHighlighted] = createSignal(false);
  let pointerType = 'touch';
  const item: ItemValue = { value: () => props.value, disabled: () => props.disabled ?? false, text: () => props.textValue ?? text(), textNode, setTextNode, textId: createUniqueId() };
  if (!isServer) {
    createEffect(node, element => element ? root.collection.register(element, item) : undefined, { transparent: true });
    createEffect(textNode, element => { if (!element) return; const update = () => setText(element.textContent?.trim() ?? ''); update(); const observer = new element.ownerDocument.defaultView!.MutationObserver(update); observer.observe(element, { subtree: true, childList: true, characterData: true }); return () => observer.disconnect(); }, { transparent: true });
  }
  const select = (event: Event) => { if (item.disabled()) return; root.markInteraction(event); root.changeValue(props.value); root.changeOpen(false); };
  return <ItemProvider scope={props.__scopeSelect} value={item}><Primitive as="div" {...merge(omit(props, '__scopeSelect', 'value', 'disabled', 'textValue'), {
    role: 'option' as const, 'aria-labelledby': item.textId, get tabindex() { return props.disabled ? undefined : -1; },
    get ['aria-selected']() { return root.value() === props.value && highlighted() ? 'true' as const : 'false' as const; }, get ['aria-disabled']() { return props.disabled ? 'true' as const : undefined; },
    get ['data-state']() { return root.value() === props.value ? 'checked' : 'unchecked'; }, get ['data-disabled']() { return props.disabled ? '' : undefined; }, get ['data-highlighted']() { return highlighted() ? '' : undefined; },
    get ref() { return composeRefs(props.ref, ref); },
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, () => setHighlighted(true)), onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, () => setHighlighted(false)),
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => { pointerType = event.pointerType; }),
    onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, event => { pointerType = event.pointerType; if (pointerType !== 'mouse') return; if (props.disabled) focus(content.node()); else { focus(event.currentTarget as HTMLElement); } }),
    onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, event => { if (event.pointerType === 'mouse' && activeElement((event.currentTarget as HTMLElement).ownerDocument) === event.currentTarget) focus(content.node()); }),
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, event => { if (pointerType !== 'mouse') select(event); }),
    onPointerUp: composeEventHandlers<PointerEvent>(() => props.onPointerUp, event => { if (pointerType === 'mouse') select(event); }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || (event.key === ' ' && content.search === '')) { select(event); event.preventDefault(); } else if (event.key === ' ') event.preventDefault(); })
  })} /></ItemProvider>;
}
export function SelectItemText(props: SelectItemTextProps): Element {
  const scope = untrack(() => props.__scopeSelect), root = rootContext(props, 'ItemText'), item = useItem('SelectItemText', scope);
  let rich: () => Element = () => props.asChild ? undefined : props.children;
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => {
    rich = () => childProps.children;
    return target(component, childProps);
  });
  if (!isServer) {
    createEffect(() => ({ value: item.value(), disabled: item.disabled(), text: item.textNode()?.textContent ?? '' }), option => {
      root.options.set(item, option); root.optionsChanged(); return () => { root.options.delete(item); root.optionsChanged(); };
    }, { transparent: true });
    // Observe text itself, since native text mutations do not create reactive dependencies.
    createEffect(item.textNode, node => { if (!node) return; const update = () => { const option = root.options.get(item); if (option && option.text !== node.textContent) { option.text = node.textContent ?? ''; root.optionsChanged(); } }; update(); const observer = new node.ownerDocument.defaultView!.MutationObserver(update); observer.observe(node, { childList: true, subtree: true, characterData: true }); return () => observer.disconnect(); }, { transparent: true });
  }
  return <><Primitive as="span" {...(merge(omit(props, '__scopeSelect', 'class', 'style'), { id: item.textId, get ref() { return composeRefs(props.ref, item.setTextNode); }, get children() { return props.asChild ? render : props.children; } }) as PrimitiveProps<'span'>)} />
    <Show when={!!(root.value() === item.value() && !empty(root.value()) && !root.customValue() && root.valueNode())}><NativePortal {...({ get mount() { return root.valueNode(); }, get children() { item.textNode(); return rich(); } } as Parameters<typeof NativePortal>[0])} /></Show>
  </>;
}
export function SelectItemIndicator(props: SelectItemIndicatorProps): Element { const root = rootContext(props, 'ItemIndicator'), item = useItem('SelectItemIndicator', untrack(() => props.__scopeSelect)); return <Show when={root.value() === item.value()}><Primitive as="span" {...merge(omit(props, '__scopeSelect'), { 'aria-hidden': 'true' as const })} /></Show>; }
export function SelectScrollUpButton(props: SelectScrollUpButtonProps): Element { return ScrollButton(props, -1); }
export function SelectScrollDownButton(props: SelectScrollDownButtonProps): Element { return ScrollButton(props, 1); }
function ScrollButton(props: SelectScrollUpButtonProps, direction: -1 | 1): Element {
  const content = contentContext(props, 'ScrollButton'); let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => { clearInterval(timer); timer = undefined; };
  const scroll = () => { const viewport = content.viewport(); if (viewport) { viewport.scrollTop += direction * (content.selected()?.node.offsetHeight ?? 0); content.scrollChanged(); } };
  const start = () => { if (timer === undefined) timer = setInterval(scroll, 50); };
  onCleanup(stop);
  const visible = () => { content.scrollVersion(); const viewport = content.viewport(); return content.positioned() && !!viewport && (direction < 0 ? viewport.scrollTop > 0 : Math.ceil(viewport.scrollTop) < viewport.scrollHeight - viewport.clientHeight); };
  function Button(): Element {
    const [node, ref] = createSignal<HTMLElement | undefined>();
    if (!isServer) createEffect(node, element => { if (element) untrack(content.scrollButton); }, { transparent: true });
    onCleanup(stop);
    return <Primitive as="div" {...merge(omit(props, '__scopeSelect'), { 'aria-hidden': 'true' as const, get ref() { return composeRefs(props.ref, ref); }, get style() { return mergeStyles(props.style, { 'flex-shrink': 0 }); },
      onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, start),
      onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, () => { focus(content.node()); start(); }),
      onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, stop)
    })} />;
  }
  return <Show when={visible()}><Button /></Show>;
}
export function SelectSeparator(props: SelectSeparatorProps): Element { return <Primitive as="div" {...merge(omit(props, '__scopeSelect'), { 'aria-hidden': 'true' as const })} />; }
export function SelectArrow(props: SelectArrowProps): Element { const content = contentContext(props, 'Arrow'); return <Show when={content.position() === 'popper'}><PopperArrow {...merge(omit(props, '__scopeSelect'), { get __scopePopper() { return props.__scopeSelect; } })} /></Show>; }
export function SelectBubbleInput(props: SelectBubbleInputProps): Element {
  const root = rootContext(props, 'BubbleInput'), [node, ref] = createSignal<HTMLSelectElement | undefined>();
  const options = createMemo(() => { root.optionVersion(); return [...root.options.values()]; });
  let lastValue = untrack(root.value), interactionCount = 0;
  const synchronize = (element: HTMLSelectElement) => { element.value = untrack(root.value) ?? ''; };
  if (!isServer) {
    createEffect(() => ({ node: node(), value: root.value(), interaction: root.interaction(), options: options() }), ({ node, value, interaction }) => {
      const user = interaction.count !== interactionCount; interactionCount = interaction.count;
      if (!node) return;
      synchronize(node);
      if (lastValue !== value) { lastValue = value; untrack(() => node.dispatchEvent(new node.ownerDocument.defaultView!.Event('change', { bubbles: user && interaction.bubbles }))); }
    }, { transparent: true });
    createEffect(node, element => {
      if (!element) return; const document = element.ownerDocument, view = document.defaultView!, timers = new Set<number>(); let alive = true;
      const reset = (event: Event) => { if (event.target !== element.form) return; const timer = view.setTimeout(() => { timers.delete(timer); if (!alive || event.defaultPrevented) return; root.changeValue(root.initial); queueMicrotask(() => { if (alive) synchronize(element); }); }, 0); timers.add(timer); };
      document.addEventListener('reset', reset);
      return () => { alive = false; document.removeEventListener('reset', reset); for (const timer of timers) view.clearTimeout(timer); };
    }, { transparent: true });
  }
  const style = createMemo(() => mergeStyles(VISUALLY_HIDDEN_STYLES, props.style));
  const defaultOptions = () => <><Show when={empty(root.value()) && !options().some(option => option.value === '')}><option value="" /></Show><For each={options()}>{option => <option value={option.value} disabled={option.disabled}>{option.text}</option>}</For></>;
  const render: SlotRender = target => untrack(() => props.children as SlotRender)((component, childProps) => target(component, merge(childProps, { get children() { return childProps.children ?? defaultOptions(); } }) as ComponentProps<typeof component>));
  return <Primitive as="select" {...(merge(omit(props, '__scopeSelect', 'children'), { tabindex: -1, 'aria-hidden': 'true' as const, get ref() { return composeRefs(props.ref, ref); }, get style() { return style(); },
    onChange: composeEventHandlers<Event>(() => props.onChange, event => { const element = event.currentTarget as HTMLSelectElement; if (element.value === (root.value() ?? '')) return; root.changeValue(element.value); queueMicrotask(() => synchronize(element)); }),
    get children() { return props.asChild ? render : props.children ?? defaultOptions(); }
  }) as PrimitiveProps<'select'>)} />;
}
