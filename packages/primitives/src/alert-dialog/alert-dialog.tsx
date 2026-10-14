// Native port of Radix AlertDialog; upstream MIT, Copyright (c) 2022 WorkOS.
import { merge, omit, onCleanup, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import type { PrimitiveProps } from '../internal/primitive.js';
import type { LayerCallbacks } from '../internal/dismissable-layer.js';
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose, createDialogScope,
  type DialogProps, type DialogTriggerProps, type DialogPortalProps, type DialogOverlayProps, type DialogContentProps, type DialogTitleProps, type DialogDescriptionProps, type DialogCloseProps } from '../dialog/dialog.js';

type Scoped = { __scopeAlertDialog?: Scope };
export type AlertDialogProps = Scoped & Omit<DialogProps, 'modal' | '__scopeDialog' | '__scopePopover'>;
export type AlertDialogTriggerProps = Scoped & PrimitiveProps<'button'>;
export type AlertDialogPortalProps = Scoped & { children?: Element; container?: globalThis.Element | DocumentFragment | null; forceMount?: true };
export type AlertDialogOverlayProps = Scoped & PrimitiveProps<'div'> & { forceMount?: true };
export type AlertDialogContentProps = Scoped & PrimitiveProps<'div'> & Omit<LayerCallbacks, 'onPointerDownOutside' | 'onInteractOutside'> & { forceMount?: true };
export type AlertDialogTitleProps = Scoped & PrimitiveProps<'h2'>;
export type AlertDialogDescriptionProps = Scoped & PrimitiveProps<'p'>;
export type AlertDialogActionProps = Scoped & PrimitiveProps<'button'>;
export type AlertDialogCancelProps = Scoped & PrimitiveProps<'button'>;

const [createAlertDialogContext, createAlertDialogScope] = createContextScope('AlertDialog', [createDialogScope]);
export { createAlertDialogScope };
const useDialogScope = createDialogScope();
const [ContentProvider, useContent] = createAlertDialogContext<{ cancel: HTMLElement | undefined }>('AlertDialogContent');
function dialogScope(props: Scoped): { __scopeDialog?: Scope } {
  return untrack(() => useDialogScope(props.__scopeAlertDialog));
}

export function AlertDialog(props: AlertDialogProps): Element {
  const forwarded = merge(omit(props, '__scopeAlertDialog'), dialogScope(props), { modal: true });
  return <Dialog {...forwarded} />;
}
export function AlertDialogTrigger(props: AlertDialogTriggerProps): Element {
  const forwarded = merge(omit(props, '__scopeAlertDialog'), dialogScope(props)) as DialogTriggerProps;
  return <DialogTrigger {...forwarded} />;
}
export function AlertDialogPortal(props: AlertDialogPortalProps): Element {
  const forwarded = merge(omit(props, '__scopeAlertDialog'), dialogScope(props)) as DialogPortalProps;
  return <DialogPortal {...forwarded} />;
}
export function AlertDialogOverlay(props: AlertDialogOverlayProps): Element {
  const forwarded = merge(omit(props, '__scopeAlertDialog'), dialogScope(props)) as DialogOverlayProps;
  return <DialogOverlay {...forwarded} />;
}
export function AlertDialogContent(props: AlertDialogContentProps): Element {
  const value = { cancel: undefined as HTMLElement | undefined };
  const forwarded = merge({ role: 'alertdialog' as const }, omit(props, '__scopeAlertDialog'), dialogScope(props), {
    onOpenAutoFocus: composeEventHandlers<Event>(() => props.onOpenAutoFocus, event => {
      event.preventDefault();
      value.cancel?.focus({ preventScroll: true });
    }),
    onPointerDownOutside: (event: Event) => event.preventDefault(),
    onInteractOutside: (event: Event) => event.preventDefault()
  }) as DialogContentProps;
  return <ContentProvider scope={props.__scopeAlertDialog} value={value}><DialogContent {...forwarded} /></ContentProvider>;
}
export function AlertDialogTitle(props: AlertDialogTitleProps): Element {
  const forwarded = merge(omit(props, '__scopeAlertDialog'), dialogScope(props)) as DialogTitleProps;
  return <DialogTitle {...forwarded} />;
}
export function AlertDialogDescription(props: AlertDialogDescriptionProps): Element {
  const forwarded = merge(omit(props, '__scopeAlertDialog'), dialogScope(props)) as DialogDescriptionProps;
  return <DialogDescription {...forwarded} />;
}
export function AlertDialogAction(props: AlertDialogActionProps): Element {
  const forwarded = merge(omit(props, '__scopeAlertDialog'), dialogScope(props)) as DialogCloseProps;
  return <DialogClose {...forwarded} />;
}
export function AlertDialogCancel(props: AlertDialogCancelProps): Element {
  const value = useContent('AlertDialogCancel', untrack(() => props.__scopeAlertDialog));
  let node: HTMLElement | undefined;
  if (!isServer) onCleanup(() => { if (value.cancel === node) value.cancel = undefined; });
  const forwarded = merge(omit(props, '__scopeAlertDialog'), dialogScope(props), {
    get ref() { return composeRefs(props.ref, (element: HTMLElement | undefined) => { node = element; value.cancel = element; }); }
  }) as DialogCloseProps;
  return <DialogClose {...forwarded} />;
}
