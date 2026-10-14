// Native DOM port of Radix Popper; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createMemo, createSignal, merge, omit, onCleanup, Show, untrack, type Element } from 'solid-js';
import { isServer, type JSX } from '@solidjs/web';
import { autoUpdate, computePosition, offset, shift, limitShift, flip, size, hide, arrow as floatingArrow, type Placement, type ReferenceElement, type ComputePositionReturn } from '@floating-ui/dom';
import { createContextScope, type Scope } from './context.js';
import { Primitive, type PrimitiveProps } from './primitive.js';
import { composeRefs } from './refs.js';
import { mergeStyles } from '../slot/slot.js';
import { Arrow, type ArrowProps } from '../arrow/arrow.js';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';
export const [createPopperContext, createPopperScope] = createContextScope('Popper');
interface PopperValue {
  anchor: () => ReferenceElement | undefined;
  setAnchor: (anchor: ReferenceElement | undefined) => void;
  placement: () => Placement | undefined;
  setPlacement: (placement: Placement | undefined) => void;
}
const [PopperProvider, usePopperContext] = createPopperContext<PopperValue>('Popper');
export function usePopper(scope?: Scope) { return usePopperContext('Popper consumer', scope); }
export function Popper(props: { __scopePopper?: Scope; children?: Element }): Element {
  const [anchor, setAnchor] = createSignal<ReferenceElement | undefined>();
  const [placement, setPlacement] = createSignal<Placement | undefined>();
  return <PopperProvider scope={props.__scopePopper} value={{ anchor, setAnchor, placement, setPlacement }}>{props.children}</PopperProvider>;
}
export type PopperAnchorProps = PrimitiveProps<'div'> & { __scopePopper?: Scope; virtualRef?: { current: ReferenceElement | null } };
export function PopperAnchor(props: PopperAnchorProps): Element {
  const context = usePopper(untrack(() => props.__scopePopper));
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer) createEffect(() => props.virtualRef?.current ?? node(), anchor => {
    context.setAnchor(anchor);
    return () => { if (untrack(context.anchor) === anchor) context.setAnchor(undefined); };
  }, { transparent: true });
  const anchorProps = merge(omit(props, '__scopePopper', 'virtualRef'), {
    get ref() { return composeRefs(props.ref, ref); },
    get ['data-radix-popper-side']() { return context.placement()?.split('-')[0]; },
    get ['data-radix-popper-align']() { return context.placement()?.split('-')[1] ?? (context.placement() ? 'center' : undefined); }
  });
  return <Show when={!props.virtualRef}><Primitive as="div" {...anchorProps} /></Show>;
}
export type PopperContentProps = PrimitiveProps<'div'> & {
  __scopePopper?: Scope;
  side?: Side; sideOffset?: number; align?: Align; alignOffset?: number; arrowPadding?: number;
  avoidCollisions?: boolean; collisionBoundary?: globalThis.Element | null | (globalThis.Element | null)[];
  collisionPadding?: number | Partial<Record<Side, number>>; sticky?: 'partial' | 'always';
  hideWhenDetached?: boolean; updatePositionStrategy?: 'optimized' | 'always'; onPlaced?: () => void;
};
interface ContentValue { result: () => ComputePositionReturn | undefined; arrow: () => HTMLSpanElement | undefined; setArrow: (arrow: HTMLSpanElement | undefined) => void }
const [ContentProvider, useContentContext] = createPopperContext<ContentValue>('PopperContent');
const positioningKeys = ['__scopePopper', 'side', 'sideOffset', 'align', 'alignOffset', 'arrowPadding', 'avoidCollisions', 'collisionBoundary', 'collisionPadding', 'sticky', 'hideWhenDetached', 'updatePositionStrategy', 'onPlaced'] as const;

export function PopperContent(props: PopperContentProps): Element {
  const context = usePopper(untrack(() => props.__scopePopper));
  const [wrapper, wrapperRef] = createSignal<HTMLDivElement | undefined>();
  const [content, contentRef] = createSignal<HTMLElement | undefined>();
  const [arrow, setArrow] = createSignal<HTMLSpanElement | undefined>();
  const [result, setResult] = createSignal<ComputePositionReturn | undefined>();
  const [zIndex, setZIndex] = createSignal<string | undefined>();
  if (!isServer) createEffect(() => ({
    anchor: context.anchor(), wrapper: wrapper(), content: content(), arrow: arrow(),
    side: props.side ?? 'bottom', sideOffset: props.sideOffset ?? 0, align: props.align ?? 'center', alignOffset: props.alignOffset ?? 0,
    arrowPadding: props.arrowPadding ?? 0, avoidCollisions: props.avoidCollisions ?? true,
    boundary: props.collisionBoundary, padding: props.collisionPadding ?? 0, sticky: props.sticky ?? 'partial',
    hide: props.hideWhenDetached ?? false, always: props.updatePositionStrategy === 'always', dir: props.dir
  }), options => {
    const { anchor, wrapper, content, arrow } = options;
    if (!anchor || !wrapper || !content) return;
    const view = content.ownerDocument.defaultView!;
    let frame = 0;
    let alive = true;
    let request = 0;
    let placed = false;
    setZIndex(view.getComputedStyle(content).zIndex);
    const boundary = (Array.isArray(options.boundary) ? options.boundary : [options.boundary]).filter((node): node is globalThis.Element => !!node);
    const overflow = { padding: options.padding, boundary, altBoundary: boundary.length > 0 };
    const placement = `${options.side}${options.align === 'center' ? '' : `-${options.align}`}` as Placement;
    const update = () => {
      const current = ++request;
      if (!content.getClientRects().length) return;
      const arrowRect = arrow?.getBoundingClientRect();
      void computePosition(anchor, wrapper, {
        strategy: 'fixed', placement,
        middleware: [
          offset({ mainAxis: options.sideOffset + (arrowRect?.height ?? 0), alignmentAxis: options.alignOffset }),
          ...(options.avoidCollisions ? [shift({ ...overflow, ...(options.sticky === 'partial' ? { limiter: limitShift() } : {}) }), flip(overflow)] : []),
          size({ ...overflow, apply({ availableWidth, availableHeight, rects }) {
            if (!alive || current !== request) return;
            wrapper.style.setProperty('--radix-popper-available-width', `${availableWidth}px`);
            wrapper.style.setProperty('--radix-popper-available-height', `${availableHeight}px`);
            wrapper.style.setProperty('--radix-popper-anchor-width', `${rects.reference.width}px`);
            wrapper.style.setProperty('--radix-popper-anchor-height', `${rects.reference.height}px`);
          } }),
          ...(arrow ? [floatingArrow({ element: arrow, padding: options.arrowPadding })] : []),
          ...(options.hide ? [hide(boundary.length ? { ...overflow, strategy: 'referenceHidden' } : { padding: options.padding, strategy: 'referenceHidden' })] : [])
        ]
      }).then(next => {
        if (!alive || current !== request) return;
        setResult(next); context.setPlacement(next.placement);
        if (!placed) { placed = true; props.onPlaced?.(); }
      });
    };
    // Size middleware changes observed geometry; commit outside resize delivery.
    const updateFrame = () => { frame = 0; update(); };
    const scheduleUpdate = () => { if (!frame) frame = view.requestAnimationFrame(updateFrame); };
    const stop = autoUpdate(anchor, wrapper, scheduleUpdate, { animationFrame: options.always });
    const observer = arrow ? new view.ResizeObserver(scheduleUpdate) : undefined;
    if (arrow) observer?.observe(arrow);
    return () => { alive = false; stop(); observer?.disconnect(); view.cancelAnimationFrame(frame); context.setPlacement(undefined); };
  }, { transparent: true });
  const side = () => (result()?.placement.split('-')[0] ?? props.side ?? 'bottom') as Side;
  const align = () => result()?.placement.split('-')[1] ?? 'center';
  function origin() {
    const data = result()?.middlewareData.arrow;
    const dimensions = arrow()?.getBoundingClientRect();
    const centered = data && data.centerOffset === 0;
    const alignment = { start: '0%', center: '50%', end: '100%' }[align() as Align];
    const x = centered ? `${(data.x ?? 0) + (dimensions?.width ?? 0) / 2}px` : alignment;
    const y = centered ? `${(data.y ?? 0) + (dimensions?.width ?? 0) / 2}px` : alignment;
    const height = centered ? dimensions?.height ?? 0 : 0;
    return side() === 'bottom' ? `${x} ${-height}px` : side() === 'top' ? `${x} calc(100% + ${height}px)` : side() === 'right' ? `${-height}px ${y}` : `calc(100% + ${height}px) ${y}`;
  }
  const forwarded = merge(omit(props, ...positioningKeys), {
    get ref() { return composeRefs(props.ref, contentRef); },
    get ['data-side']() { return side(); }, get ['data-align']() { return align(); },
    get style() { return mergeStyles(props.style, result() ? {} : { animation: 'none' }); }
  });
  return <div data-radix-popper-content-wrapper="" ref={wrapperRef} dir={props.dir} style={{
    position: 'fixed', left: 0, top: 0, 'min-width': 'max-content',
    transform: result() ? `translate(${result()!.x}px, ${result()!.y}px)` : 'translate(0, -200%)',
    'z-index': zIndex(), '--radix-popper-transform-origin': origin(),
    visibility: result()?.middlewareData.hide?.referenceHidden ? 'hidden' : undefined,
    'pointer-events': result()?.middlewareData.hide?.referenceHidden ? 'none' : undefined
  }}><ContentProvider scope={props.__scopePopper} value={{ result, arrow, setArrow }}><Primitive as="div" {...forwarded} /></ContentProvider></div>;
}

export type PopperArrowProps = ArrowProps & { __scopePopper?: Scope };
export function PopperArrow(props: PopperArrowProps): Element {
  const context = useContentContext('PopperArrow', untrack(() => props.__scopePopper));
  const style = createMemo<JSX.CSSProperties>(() => {
    const result = context.result();
    const side = (result?.placement.split('-')[0] ?? 'bottom') as Side;
    const base = ({ top: 'bottom', right: 'left', bottom: 'top', left: 'right' } as const)[side];
    const { x, y, centerOffset } = result?.middlewareData.arrow ?? {};
    return {
      position: 'absolute',
      left: base === 'left' ? 0 : x === undefined ? undefined : `${x}px`,
      top: base === 'top' ? 0 : y === undefined ? undefined : `${y}px`,
      right: base === 'right' ? 0 : undefined,
      bottom: base === 'bottom' ? 0 : undefined,
      transform: { top: 'translateY(100%)', right: 'translateY(50%) rotate(90deg) translateX(-50%)', bottom: 'rotate(180deg)', left: 'translateY(50%) rotate(-90deg) translateX(50%)' }[side],
      'transform-origin': { top: '', right: '0 0', bottom: 'center 0', left: '100% 0' }[side],
      visibility: centerOffset ? 'hidden' : undefined
    };
  });
  onCleanup(() => context.setArrow(undefined));
  const arrowProps = merge(omit(props, '__scopePopper'), { get style() { return mergeStyles(props.style, { display: 'block' }); } });
  return <span ref={context.setArrow} style={style()}>
    <Arrow {...arrowProps} />
  </span>;
}
