// Native port of Radix HoverCard; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, merge, omit, onCleanup, Show, untrack, type Element } from 'solid-js';
import { isServer, Portal as NativePortal } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { createPresence } from '../internal/presence.js';
import { createLayer, LayerContext, type LayerCallbacks } from '../internal/dismissable-layer.js';
import { tabbables } from '../internal/focus-scope.js';
import { Popper, PopperContent, PopperArrow, usePopper, createPopperScope, type PopperContentProps, type PopperArrowProps } from '../internal/popper.js';
import { mergeStyles } from '../slot/slot.js';

type Scoped = { __scopeHoverCard?: Scope };
export type HoverCardProps = Scoped & { children?: Element; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; openDelay?: number; closeDelay?: number };
export type HoverCardTriggerProps = Scoped & PrimitiveProps<'a'>;
export type HoverCardPortalProps = Scoped & { children?: Element; container?: globalThis.Element | DocumentFragment | null; forceMount?: true };
export type HoverCardContentProps = Scoped & PopperContentProps & Pick<LayerCallbacks, 'onEscapeKeyDown' | 'onPointerDownOutside' | 'onFocusOutside' | 'onInteractOutside'> & { forceMount?: true; onPlaced?: never };
export type HoverCardArrowProps = Scoped & PopperArrowProps;
interface HoverCardValue {
  open: () => boolean; setOpen: (open: boolean) => void; onOpen: () => void; onClose: () => void;
  trigger: () => HTMLElement | undefined; setTrigger: (node: HTMLElement | undefined) => void;
  hasSelection: boolean; pointerDown: boolean;
}
const [createHoverCardContext, createHoverCardScope] = createContextScope('HoverCard', [createPopperScope]);
const [Provider, useHoverCard] = createHoverCardContext<HoverCardValue>('HoverCard');
const [PortalProvider, usePortal] = createHoverCardContext<{ forceMount: () => boolean }>('HoverCardPortal', { forceMount: () => false });

export function HoverCard(props: HoverCardProps): Element {
  const [open, setOpen] = createControllableState({ value: () => props.open, get defaultValue() { return props.defaultOpen ?? false; }, get onChange() { return props.onOpenChange; } });
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>();
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const value: HoverCardValue = { open, trigger, setTrigger, hasSelection: false, pointerDown: false,
    setOpen(next) { clearTimeout(openTimer); clearTimeout(closeTimer); setOpen(next); },
    onOpen() {
      clearTimeout(closeTimer); clearTimeout(openTimer);
      openTimer = setTimeout(() => { openTimer = undefined; setOpen(true); }, props.openDelay ?? 700);
    },
    onClose() {
      clearTimeout(openTimer); clearTimeout(closeTimer);
      if (!value.hasSelection && !value.pointerDown) closeTimer = setTimeout(() => {
        closeTimer = undefined;
        if (!value.hasSelection && !value.pointerDown) setOpen(false);
      }, props.closeDelay ?? 300);
    }
  };
  onCleanup(() => { clearTimeout(openTimer); clearTimeout(closeTimer); });
  return <Provider scope={props.__scopeHoverCard} value={value}><Popper __scopePopper={props.__scopeHoverCard}>{props.children}</Popper></Provider>;
}

export function HoverCardTrigger(props: HoverCardTriggerProps): Element {
  const root = useHoverCard('HoverCardTrigger', untrack(() => props.__scopeHoverCard));
  const popper = usePopper(untrack(() => props.__scopeHoverCard));
  if (!isServer) createEffect(root.trigger, anchor => {
    popper.setAnchor(anchor);
    return () => { if (untrack(popper.anchor) === anchor) popper.setAnchor(undefined); };
  }, { transparent: true });
  return <Primitive as="a" {...merge({ get ['data-state']() { return root.open() ? 'open' : 'closed'; } }, omit(props, '__scopeHoverCard'), {
    get ref() { return composeRefs(props.ref, root.setTrigger); },
    onPointerEnter: composeEventHandlers<PointerEvent>(() => props.onPointerEnter, event => { if (event.pointerType !== 'touch') root.onOpen(); }),
    onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, event => { if (event.pointerType !== 'touch') root.onClose(); }),
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, root.onOpen),
    onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, root.onClose),
    onTouchStart: composeEventHandlers<TouchEvent>(() => props.onTouchStart, event => event.preventDefault())
  })} />;
}

export function HoverCardPortal(props: HoverCardPortalProps): Element {
  useHoverCard('HoverCardPortal', untrack(() => props.__scopeHoverCard));
  const forwarded = {
    get mount() { return props.container ?? undefined; },
    get children() { return <PortalProvider scope={props.__scopeHoverCard} value={{ forceMount: () => props.forceMount ?? false }}>{props.children}</PortalProvider>; }
  } as Parameters<typeof NativePortal>[0];
  return <NativePortal {...forwarded} />;
}

export function HoverCardContent(props: HoverCardContentProps): Element {
  const root = useHoverCard('HoverCardContent', untrack(() => props.__scopeHoverCard));
  const portal = usePortal('HoverCardContent', untrack(() => props.__scopeHoverCard));
  const presence = createPresence(root.open, () => props.forceMount ?? portal.forceMount());
  function Mounted(): Element {
    const [node, ref] = createSignal<HTMLElement | undefined>();
    const [containSelection, setContainSelection] = createSignal(false);
    const layer = createLayer(node, {
      active: root.open, modal: () => false, trigger: root.trigger, dismiss: () => root.setOpen(false), kind: 'layer', focusScope: false,
      get onEscapeKeyDown() { return props.onEscapeKeyDown; },
      get onPointerDownOutside() { return props.onPointerDownOutside; },
      get onInteractOutside() { return props.onInteractOutside; },
      onFocusOutside: composeEventHandlers(() => props.onFocusOutside, event => event.preventDefault()),
    });
    if (!isServer) {
      onCleanup(() => presence.ref(undefined));
      createEffect(() => [containSelection(), node()] as const, ([contain, element]) => {
        if (!contain || !element) return;
        const body = element.ownerDocument.body;
        const original = [body.style.userSelect, body.style.webkitUserSelect];
        body.style.userSelect = body.style.webkitUserSelect = 'none';
        return () => { body.style.userSelect = original[0]!; body.style.webkitUserSelect = original[1]!; };
      }, { transparent: true });
      createEffect(node, element => {
        if (!element) return;
        const document = element.ownerDocument;
        let selectionTimer: ReturnType<typeof setTimeout> | undefined;
        const pointerUp = () => {
          setContainSelection(false); root.pointerDown = false;
          clearTimeout(selectionTimer);
          selectionTimer = setTimeout(() => { if (document.getSelection()?.toString()) root.hasSelection = true; }, 0);
        };
        const removeTabStops = () => { for (const node of tabbables(element)) node.setAttribute('tabindex', '-1'); };
        removeTabStops();
        const observer = new document.defaultView!.MutationObserver(removeTabStops);
        observer.observe(element, { subtree: true, childList: true, attributes: true, attributeFilter: ['tabindex', 'disabled', 'hidden', 'href', 'type', 'contenteditable'] });
        document.addEventListener('pointerup', pointerUp);
        return () => {
          observer.disconnect(); document.removeEventListener('pointerup', pointerUp); clearTimeout(selectionTimer);
          root.hasSelection = root.pointerDown = false;
        };
      }, { transparent: true });
    }
    return <LayerContext value={layer}><PopperContent {...merge(omit(props, '__scopeHoverCard', 'forceMount', 'onEscapeKeyDown', 'onPointerDownOutside', 'onFocusOutside', 'onInteractOutside'), {
      get __scopePopper() { return props.__scopeHoverCard; },
      get ['data-state']() { return root.open() ? 'open' : 'closed'; },
      get ref() { return composeRefs(props.ref, ref, presence.ref); },
      onPointerEnter: composeEventHandlers<PointerEvent>(() => props.onPointerEnter, event => { if (event.pointerType !== 'touch') root.onOpen(); }),
      onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, event => { if (event.pointerType !== 'touch') root.onClose(); }),
      onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => {
        if (node()?.contains(event.target as Node)) setContainSelection(true);
        root.hasSelection = false; root.pointerDown = true;
      }),
      get style() { return mergeStyles(props.style, {
        'user-select': containSelection() ? 'text' : undefined, '-webkit-user-select': containSelection() ? 'text' : undefined,
        '--radix-hover-card-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-hover-card-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-hover-card-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-hover-card-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-hover-card-trigger-height': 'var(--radix-popper-anchor-height)'
      }); }
    })} /></LayerContext>;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}

export function HoverCardArrow(props: HoverCardArrowProps): Element {
  return <PopperArrow {...merge(omit(props, '__scopeHoverCard'), { get __scopePopper() { return props.__scopeHoverCard; } })} />;
}
export { createHoverCardScope, HoverCard as Root, HoverCardTrigger as Trigger, HoverCardPortal as Portal, HoverCardContent as Content, HoverCardArrow as Arrow };
