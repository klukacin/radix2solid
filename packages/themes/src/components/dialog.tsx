import { merge, omit, type Element } from 'solid-js';
import * as Native from '@wsagency/radix2solid-primitives/dialog';
import type { SlotRender } from '@wsagency/radix2solid-primitives/slot';
import { Theme } from './theme.js';
import { Heading, type HeadingProps } from './heading.js';
import { Text } from './text.js';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, ComponentPropsAs, RemovedProps } from '../helpers/component-props.js';
import { dialogContentPropDefs, type DialogContentOwnProps } from './dialog.props.js';

type DialogRootProps = Omit<Native.DialogProps, 'modal'>;
type DialogTriggerProps = Omit<Native.DialogTriggerProps, RemovedProps | 'children'> & { children: SlotRender };
type DialogCloseProps = Omit<Native.DialogCloseProps, RemovedProps | 'children'> & { children: SlotRender };
type DialogContentProps = ComposedProps<Omit<Native.DialogContentProps, RemovedProps> & DialogContentOwnProps & { container?: Native.DialogPortalProps['container'] }>;
type DialogTitleProps = Omit<Extract<HeadingProps, { asChild?: false }>, 'asChild'>;
type DialogDescriptionProps = ComponentPropsAs<typeof Text, 'p'>;
const { align, ...contentDefs } = dialogContentPropDefs;

function DialogRoot(props: DialogRootProps): Element { return <Native.Root {...props} modal />; }
function DialogTrigger(props: DialogTriggerProps): Element { return <Native.Trigger {...props} asChild />; }
function DialogClose(props: DialogCloseProps): Element { return <Native.Close {...props} asChild />; }
function DialogContent(props: DialogContentProps): Element {
  const alignment = extractProps({ get align() { return props.align; } }, { align });
  const parsed = extractProps(omit(props, 'align'), contentDefs);
  const forwarded = merge(omit(parsed, 'container', 'forceMount', 'class'), {
    get class() { return ['rt-BaseDialogContent', 'rt-DialogContent', parsed.class]; }
  }) as Native.DialogContentProps;
  return <Native.Portal container={props.container} forceMount={props.forceMount}>
    <Theme asChild>{target => target(Native.Overlay, { class: 'rt-BaseDialogOverlay rt-DialogOverlay', children:
      <div class="rt-BaseDialogScroll rt-DialogScroll"><div class={['rt-BaseDialogScrollPadding', 'rt-DialogScrollPadding', alignment.class]}>
        <Native.Content {...forwarded} />
      </div></div>
    })}</Theme>
  </Native.Portal>;
}
function DialogTitle(props: DialogTitleProps): Element {
  return <Native.Title asChild>{target => target(Heading, merge({ size: '5' as const, mb: '3' as const, trim: 'start' as const }, props, { asChild: false as const }))}</Native.Title>;
}
function DialogDescription(props: DialogDescriptionProps): Element {
  return <Native.Description asChild>{target => target(Text, merge({ as: 'p' as const, size: '3' as const }, props, { asChild: false as const }))}</Native.Description>;
}
export { DialogRoot as Root, DialogTrigger as Trigger, DialogContent as Content, DialogTitle as Title, DialogDescription as Description, DialogClose as Close };
export type { DialogRootProps as RootProps, DialogTriggerProps as TriggerProps, DialogContentProps as ContentProps, DialogTitleProps as TitleProps, DialogDescriptionProps as DescriptionProps, DialogCloseProps as CloseProps };
