import { createOverlay } from '../internal/overlay.js';
import type { OverlayRootProps, OverlayButtonProps, OverlayPortalProps, OverlayContentProps, OverlayOverlayProps, OverlayPartProps } from '../internal/overlay.js';

const dialog = createOverlay('Dialog', true);
export const { Root: Dialog, Trigger: DialogTrigger, Portal: DialogPortal, Content: DialogContent, Overlay: DialogOverlay, Title: DialogTitle, Description: DialogDescription, Close: DialogClose, createScope: createDialogScope } = dialog;
export type DialogProps = OverlayRootProps;
export type DialogTriggerProps = OverlayButtonProps;
export type DialogPortalProps = OverlayPortalProps;
export type DialogContentProps = OverlayContentProps;
export type DialogOverlayProps = OverlayOverlayProps;
export type DialogTitleProps = OverlayPartProps<'h2'>;
export type DialogDescriptionProps = OverlayPartProps<'p'>;
export type DialogCloseProps = OverlayButtonProps;
