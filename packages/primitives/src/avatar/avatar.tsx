// Native port of Radix Avatar; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, DEV, merge, omit, Show, untrack, type Accessor, type Element, type Setter } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { composeRefs } from '../internal/refs.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';

type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';
const [createAvatarContext, createAvatarScope] = createContextScope('Avatar');
const [AvatarProvider, useAvatarContext] = createAvatarContext<{
  status: Accessor<ImageLoadingStatus>;
  setStatus: Setter<ImageLoadingStatus>;
  node: Accessor<HTMLElement | undefined>;
  registerImage: () => () => void;
}>('Avatar');
export { createAvatarScope };
export type AvatarProps = PrimitiveProps<'span'> & { __scopeAvatar?: Scope };
export type AvatarImageProps = PrimitiveProps<'img'> & {
  __scopeAvatar?: Scope;
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
};
export type AvatarFallbackProps = PrimitiveProps<'span'> & { __scopeAvatar?: Scope; delayMs?: number };

export function Avatar(props: AvatarProps): Element {
  const [status, setStatus] = createSignal<ImageLoadingStatus>('idle');
  const [node, setNode] = createSignal<HTMLElement>();
  let images = 0;
  let warned = false;
  const registerImage = () => {
    if (DEV && ++images > 1 && !warned) {
      warned = true;
      console.warn('Avatar: Only one Avatar.Image is supported per Avatar.Root.');
    }
    return () => { if (DEV) images--; };
  };
  const forwarded = merge(omit(props, '__scopeAvatar', 'ref'), { ref: composeRefs(props.ref, setNode) });
  return <AvatarProvider scope={props.__scopeAvatar} value={{ status, setStatus, node, registerImage }}><Primitive as="span" {...forwarded} /></AvatarProvider>;
}

export function AvatarImage(props: AvatarImageProps): Element {
  const context = useAvatarContext('AvatarImage', props.__scopeAvatar);
  if (!isServer) {
    createEffect(() => null, () => context.registerImage(), { transparent: true });
    createEffect(() => [context.node(), props.src, props.crossorigin, props.referrerpolicy] as const, ([node, src, crossOrigin, referrerPolicy]) => {
      if (!node) return;
      let active = true;
      const update = (status: ImageLoadingStatus) => {
        if (!active || untrack(context.status) === status) return;
        context.setStatus(status);
        untrack(() => props.onLoadingStatusChange?.(status));
      };
      if (!src) { update('error'); return; }
      const image = new node.ownerDocument.defaultView!.Image();
      const loaded = () => update(image.complete ? image.naturalWidth > 0 ? 'loaded' : 'error' : 'loading');
      const error = () => update('error');
      image.addEventListener('load', loaded);
      image.addEventListener('error', error);
      if (referrerPolicy) image.referrerPolicy = referrerPolicy;
      image.crossOrigin = crossOrigin === false || crossOrigin == null ? null : crossOrigin === true ? '' : crossOrigin;
      image.src = src;
      loaded();
      return () => {
        active = false;
        image.removeEventListener('load', loaded);
        image.removeEventListener('error', error);
        context.setStatus('idle');
      };
    }, { transparent: true });
  }
  const forwarded = omit(props, '__scopeAvatar', 'onLoadingStatusChange');
  return <Show when={context.status() === 'loaded'}><Primitive as="img" {...forwarded} /></Show>;
}

export function AvatarFallback(props: AvatarFallbackProps): Element {
  const context = useAvatarContext('AvatarFallback', props.__scopeAvatar);
  const [ready, setReady] = createSignal(untrack(() => props.delayMs === undefined));
  if (!isServer) createEffect(() => [context.node(), props.delayMs] as const, ([node, delay]) => {
    if (!node) return;
    if (delay === undefined) { setReady(true); return; }
    const view = node.ownerDocument.defaultView!;
    const timer = view.setTimeout(() => setReady(true), delay);
    return () => view.clearTimeout(timer);
  }, { transparent: true });
  const forwarded = omit(props, '__scopeAvatar', 'delayMs');
  return <Show when={ready() && context.status() !== 'loaded'}><Primitive as="span" {...forwarded} /></Show>;
}
