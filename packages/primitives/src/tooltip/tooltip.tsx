// Native port of Radix Tooltip; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, createUniqueId, merge, omit, onCleanup, Show, untrack, type Element } from 'solid-js';
import { isServer, Portal as NativePortal } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { callEventHandler, composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { createPresence } from '../internal/presence.js';
import { createLayer, LayerContext, type LayerCallbacks } from '../internal/dismissable-layer.js';
import { activeElement, composedContains } from '../internal/focus-scope.js';
import { Popper, PopperContent, PopperArrow, usePopper, createPopperScope, type PopperContentProps, type PopperArrowProps } from '../internal/popper.js';
import { concatAriaIds, mergeStyles, Slottable, type SlotRender } from '../slot/slot.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { pointerGrace, pointInPolygon, type Point } from '../internal/pointer-grace.js';

type Scoped = { __scopeTooltip?: Scope };
export type TooltipProviderProps = Scoped & { children: Element; delayDuration?: number; skipDelayDuration?: number; disableHoverableContent?: boolean };
export type TooltipProps = Scoped & { children?: Element; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; delayDuration?: number; disableHoverableContent?: boolean };
export type TooltipTriggerProps = Scoped & PrimitiveProps<'button'>;
export type TooltipPortalProps = Scoped & { children?: Element; container?: globalThis.Element | DocumentFragment | null; forceMount?: true };
export type TooltipContentProps = Scoped & PopperContentProps & Pick<LayerCallbacks, 'onEscapeKeyDown' | 'onPointerDownOutside'> & { forceMount?: true; onPlaced?: never; 'aria-label'?: string };
export type TooltipArrowProps = Scoped & PopperArrowProps;
interface ProviderValue {
  delayed: () => boolean; delay: () => number; hoverDisabled: () => boolean;
  onOpen: () => void; onClose: () => void; inTransit: boolean;
}
interface TooltipValue {
  open: () => boolean; state: () => 'closed' | 'delayed-open' | 'instant-open'; contentId: () => string;
  setContentId: (id: string | undefined) => void; trigger: () => HTMLElement | undefined; setTrigger: (node: HTMLElement | undefined) => void;
  onOpen: () => void; onClose: () => void; onTriggerEnter: () => void; onTriggerLeave: () => void; hoverDisabled: () => boolean;
}
const [createTooltipContext, createTooltipScope] = createContextScope('Tooltip', [createPopperScope]);
const [ProviderContext, useProvider] = createTooltipContext<ProviderValue>('TooltipProvider');
const [RootContext, useTooltip] = createTooltipContext<TooltipValue>('Tooltip');
const [PortalContext, usePortal] = createTooltipContext<{ forceMount: () => boolean }>('TooltipPortal', { forceMount: () => false });

export function TooltipProvider(props: TooltipProviderProps): Element {
  let delayed = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const value: ProviderValue = {
    delayed: () => (props.skipDelayDuration ?? 300) <= 0 || delayed,
    delay: () => props.delayDuration ?? 700, hoverDisabled: () => props.disableHoverableContent ?? false, inTransit: false,
    onOpen() { if ((props.skipDelayDuration ?? 300) > 0) { clearTimeout(timer); delayed = false; } },
    onClose() {
      clearTimeout(timer);
      if ((props.skipDelayDuration ?? 300) > 0) timer = setTimeout(() => { delayed = true; timer = undefined; }, props.skipDelayDuration ?? 300);
    }
  };
  onCleanup(() => { clearTimeout(timer); value.inTransit = false; });
  return <ProviderContext scope={props.__scopeTooltip} value={value}>{props.children}</ProviderContext>;
}

export function Tooltip(props: TooltipProps): Element {
  const provider = useProvider('Tooltip', untrack(() => props.__scopeTooltip));
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>();
  const [customId, setContentId] = createSignal<string | undefined>();
  const generatedId = createUniqueId();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let delayed = false;
  const [open, setOpen] = createControllableState({ value: () => props.open, get defaultValue() { return props.defaultOpen ?? false; }, onChange(next) {
    if (next) {
      provider.onOpen();
      const document = untrack(trigger)?.ownerDocument;
      if (document) document.dispatchEvent(new document.defaultView!.CustomEvent('tooltip.open', { detail: value }));
    } else provider.onClose();
    props.onOpenChange?.(next);
  } });
  const value: TooltipValue = {
    open, trigger, setTrigger, setContentId, contentId: () => customId() ?? generatedId,
    state: () => open() ? delayed ? 'delayed-open' : 'instant-open' : 'closed',
    hoverDisabled: () => props.disableHoverableContent ?? provider.hoverDisabled(),
    onOpen() { clearTimeout(timer); timer = undefined; delayed = false; setOpen(true); },
    onClose() { clearTimeout(timer); timer = undefined; setOpen(false); },
    onTriggerEnter() {
      if (!provider.delayed()) { value.onOpen(); return; }
      clearTimeout(timer);
      timer = setTimeout(() => { timer = undefined; delayed = true; setOpen(true); }, props.delayDuration ?? provider.delay());
    },
    onTriggerLeave() { if (value.hoverDisabled()) value.onClose(); else { clearTimeout(timer); timer = undefined; } }
  };
  onCleanup(() => clearTimeout(timer));
  return <Popper __scopePopper={props.__scopeTooltip}><RootContext scope={props.__scopeTooltip} value={value}>{props.children}</RootContext></Popper>;
}

export function TooltipTrigger(props: TooltipTriggerProps): Element {
  const scope = untrack(() => props.__scopeTooltip);
  const root = useTooltip('TooltipTrigger', scope);
  const provider = useProvider('TooltipTrigger', scope);
  const popper = usePopper(scope);
  let pointerDown = false;
  let moved = false;
  let focusWindow: Window | undefined;
  let focusFrame: number | undefined;
  const cancelFocus = () => { if (focusFrame !== undefined) focusWindow?.cancelAnimationFrame(focusFrame); focusFrame = undefined; };
  onCleanup(cancelFocus);
  if (!isServer) createEffect(root.trigger, trigger => {
    popper.setAnchor(trigger);
    if (!trigger) return;
    const document = trigger.ownerDocument;
    const pointerUp = () => { pointerDown = false; };
    document.addEventListener('pointerup', pointerUp);
    document.addEventListener('pointercancel', pointerUp);
    return () => {
      document.removeEventListener('pointerup', pointerUp); document.removeEventListener('pointercancel', pointerUp);
      if (untrack(popper.anchor) === trigger) popper.setAnchor(undefined);
    };
  }, { transparent: true });
  const forwarded = merge(omit(props, '__scopeTooltip'), {
    get ref() { return composeRefs(props.ref, root.setTrigger); },
    get ['data-state']() { return root.state(); },
    get ['aria-describedby']() { return concatAriaIds(props['aria-describedby'], root.open() ? root.contentId() : undefined); },
    onPointerMove: composeEventHandlers<PointerEvent>(() => props.onPointerMove, event => {
      if (event.pointerType !== 'touch' && !moved && !provider.inTransit) { root.onTriggerEnter(); moved = true; }
    }),
    onPointerLeave: composeEventHandlers<PointerEvent>(() => props.onPointerLeave, () => { root.onTriggerLeave(); moved = false; }),
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, () => { cancelFocus(); if (root.open()) root.onClose(); pointerDown = true; }),
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, event => {
      if (pointerDown) return;
      cancelFocus();
      const trigger = event.currentTarget as HTMLElement;
      focusWindow = trigger.ownerDocument.defaultView!;
      // Native focus scrolling completes after layout; mount after it, not during its scroll.
      focusFrame = focusWindow.requestAnimationFrame(() => {
        focusFrame = focusWindow!.requestAnimationFrame(() => {
          focusFrame = undefined;
          if (!pointerDown && activeElement(trigger.ownerDocument) === trigger) root.onOpen();
        });
      });
    }),
    onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, () => { cancelFocus(); root.onClose(); }),
    onKeyDown(event: KeyboardEvent) {
      callEventHandler(props.onKeyDown, event);
      // Cancel scheduled focus even when an existing layer already consumed Escape.
      if (event.key === 'Escape') cancelFocus();
    },
    onClick: composeEventHandlers<MouseEvent>(() => props.onClick, () => { cancelFocus(); root.onClose(); })
  });
  return <Primitive as="button" {...forwarded} />;
}

export function TooltipPortal(props: TooltipPortalProps): Element {
  useTooltip('TooltipPortal', untrack(() => props.__scopeTooltip));
  const forwarded = {
    get mount() { return props.container ?? undefined; },
    get children() { return <PortalContext scope={props.__scopeTooltip} value={{ forceMount: () => props.forceMount ?? false }}>{props.children}</PortalContext>; }
  } as Parameters<typeof NativePortal>[0];
  return <NativePortal {...forwarded} />;
}

export function TooltipContent(props: TooltipContentProps): Element {
  const scope = untrack(() => props.__scopeTooltip);
  const root = useTooltip('TooltipContent', scope);
  const provider = useProvider('TooltipContent', scope);
  const portal = usePortal('TooltipContent', scope);
  const presence = createPresence(root.open, () => props.forceMount ?? portal.forceMount());
  function Mounted(): Element {
    const [node, ref] = createSignal<HTMLElement | undefined>();
    const layer = createLayer(node, {
      active: root.open, modal: () => false, trigger: root.trigger, dismiss: root.onClose, kind: 'layer', focusScope: false,
      get onEscapeKeyDown() { return props.onEscapeKeyDown; }, get onPointerDownOutside() { return props.onPointerDownOutside; },
      onFocusOutside: event => event.preventDefault()
    });
    if (!isServer) {
      onCleanup(() => presence.ref(undefined));
      createEffect(() => typeof props.id === 'string' ? props.id : undefined, id => {
        root.setContentId(id);
        return () => { if (untrack(root.contentId) === id) root.setContentId(undefined); };
      }, { transparent: true });
      createEffect(() => [node(), root.trigger(), root.open()] as const, ([content, trigger]) => {
        if (!content) return;
        const document = content.ownerDocument;
        const window = document.defaultView!;
        const opened = (event: Event) => { const tooltipEvent = event as CustomEvent; if (tooltipEvent.detail !== root) root.onClose(); };
        // A queued pre-activation scroll is not a new scroll of the open Tooltip.
        const scrollPositions = new Map<Node, { element: globalThis.Element; left: number; top: number }>();
        for (let ancestor: Node | null = trigger ?? null; ancestor;) {
          const element = ancestor.nodeType === 9 ? document.scrollingElement : ancestor.nodeType === 1 ? ancestor as globalThis.Element : null;
          if (element) scrollPositions.set(ancestor, { element, left: element.scrollLeft, top: element.scrollTop });
          ancestor = ancestor.parentNode ?? (ancestor instanceof document.defaultView!.ShadowRoot ? ancestor.host : null);
        }
        const scroll = (event: Event) => {
          const target = event.target;
          if (!(target instanceof document.defaultView!.Node)) return;
          const previous = scrollPositions.get(target);
          if (previous && (previous.element.scrollLeft !== previous.left || previous.element.scrollTop !== previous.top)) root.onClose();
        };
        document.addEventListener('tooltip.open', opened);
        window.addEventListener('scroll', scroll, true);
        return () => { document.removeEventListener('tooltip.open', opened); window.removeEventListener('scroll', scroll, true); };
      }, { transparent: true });
      createEffect(() => [node(), root.trigger(), root.hoverDisabled(), root.open()] as const, ([content, trigger, disabled, open]) => {
        if (!content || !trigger || disabled || !open) return;
        const document = content.ownerDocument;
        let grace: Point[] | undefined;
        const clear = () => { grace = undefined; provider.inTransit = false; };
        const triggerLeave = (event: PointerEvent) => { if (event.pointerType !== 'touch') { grace = pointerGrace(event, trigger, content); provider.inTransit = true; } };
        const contentLeave = (event: PointerEvent) => { if (event.pointerType !== 'touch') { grace = pointerGrace(event, content, trigger); provider.inTransit = true; } };
        const move = (event: PointerEvent) => {
          if (!grace || event.pointerType === 'touch') return;
          const target = event.composedPath()[0] as Node;
          if (composedContains(trigger, target) || composedContains(content, target)) clear();
          else if (!pointInPolygon({ x: event.clientX, y: event.clientY }, grace)) { clear(); root.onClose(); }
        };
        trigger.addEventListener('pointerleave', triggerLeave); content.addEventListener('pointerleave', contentLeave);
        document.addEventListener('pointermove', move);
        return () => {
          trigger.removeEventListener('pointerleave', triggerLeave); content.removeEventListener('pointerleave', contentLeave);
          document.removeEventListener('pointermove', move); clear();
        };
      }, { transparent: true });
    }
    const label = () => props['aria-label'] ? <VisuallyHidden id={root.contentId()} role="tooltip">{props['aria-label']}</VisuallyHidden> : undefined;
    const factory = untrack(() => props.asChild) ? Slottable({ child: untrack(() => props.children) as SlotRender, get trailing() { return label(); } }) : undefined;
    const fallbackChildren = () => <>{props.children}{label()}</>;
    const forwarded = merge({
      side: 'top' as const,
      get role() { return props['aria-label'] ? undefined : 'tooltip' as const; }
    }, omit(props, '__scopeTooltip', 'forceMount', 'onEscapeKeyDown', 'onPointerDownOutside', 'aria-label', 'id', 'children'), {
      get __scopePopper() { return props.__scopeTooltip; },
      get id() { return props['aria-label'] ? undefined : root.contentId(); },
      get ['data-state']() { return root.state(); },
      get ref() { return composeRefs(props.ref, ref, presence.ref); },
      get children() { return factory ?? fallbackChildren(); },
      get style() { return mergeStyles(props.style, {
        '--radix-tooltip-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-tooltip-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-tooltip-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-tooltip-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-tooltip-trigger-height': 'var(--radix-popper-anchor-height)'
      }); }
    }) as PopperContentProps;
    return <LayerContext value={layer}><PopperContent {...forwarded} /></LayerContext>;
  }
  return <Show when={presence.mounted()}><Mounted /></Show>;
}

export function TooltipArrow(props: TooltipArrowProps): Element {
  const forwarded = merge(omit(props, '__scopeTooltip'), { get __scopePopper() { return props.__scopeTooltip; } });
  return <PopperArrow {...forwarded} />;
}


export { createTooltipScope, TooltipProvider as Provider, Tooltip as Root, TooltipTrigger as Trigger, TooltipPortal as Portal, TooltipContent as Content, TooltipArrow as Arrow };
