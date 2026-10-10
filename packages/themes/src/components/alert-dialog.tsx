import { merge, omit, type Element } from 'solid-js';
import * as Native from '@radix-solid/primitives/alert-dialog';
import type { SlotRender } from '@radix-solid/primitives/slot';
import { Theme } from './theme.js';
import { Heading, type HeadingProps } from './heading.js';
import { Text } from './text.js';
import { extractProps } from '../helpers/extract-props.js';
import type { ComposedProps, ComponentPropsAs, RemovedProps } from '../helpers/component-props.js';
import { alertDialogContentPropDefs, type AlertDialogContentOwnProps } from './alert-dialog.props.js';

type AlertDialogRootProps = Native.AlertDialogProps;
type AlertDialogTriggerProps = Omit<Native.AlertDialogTriggerProps, RemovedProps | 'children'> & { children: SlotRender };
type AlertDialogActionProps = Omit<Native.AlertDialogActionProps, RemovedProps | 'children'> & { children: SlotRender };
type AlertDialogCancelProps = Omit<Native.AlertDialogCancelProps, RemovedProps | 'children'> & { children: SlotRender };
type AlertDialogContentProps = ComposedProps<Omit<Native.AlertDialogContentProps, RemovedProps> & AlertDialogContentOwnProps & { container?: Native.AlertDialogPortalProps['container'] }>;
type AlertDialogTitleProps = Omit<Extract<HeadingProps, { asChild?: false }>, 'asChild'>;
type AlertDialogDescriptionProps = ComponentPropsAs<typeof Text, 'p'>;
const { align, ...contentDefs } = alertDialogContentPropDefs;

function AlertDialogRoot(props: AlertDialogRootProps): Element { return <Native.Root {...props} />; }
function AlertDialogTrigger(props: AlertDialogTriggerProps): Element { return <Native.Trigger {...props} asChild />; }
function AlertDialogAction(props: AlertDialogActionProps): Element { return <Native.Action {...props} asChild />; }
function AlertDialogCancel(props: AlertDialogCancelProps): Element { return <Native.Cancel {...props} asChild />; }
function AlertDialogContent(props: AlertDialogContentProps): Element {
  const alignment = extractProps({ get align() { return props.align; } }, { align });
  const parsed = extractProps(omit(props, 'align'), contentDefs);
  const forwarded = merge(omit(parsed, 'container', 'forceMount', 'class'), {
    get class() { return ['rt-BaseDialogContent', 'rt-AlertDialogContent', parsed.class]; }
  }) as Native.AlertDialogContentProps;
  return <Native.Portal container={props.container} forceMount={props.forceMount}>
    <Theme asChild>{target => target(Native.Overlay, { class: 'rt-BaseDialogOverlay rt-AlertDialogOverlay', children:
      <div class="rt-BaseDialogScroll rt-AlertDialogScroll"><div class={['rt-BaseDialogScrollPadding', 'rt-AlertDialogScrollPadding', alignment.class]}>
        <Native.Content {...forwarded} />
      </div></div>
    })}</Theme>
  </Native.Portal>;
}
function AlertDialogTitle(props: AlertDialogTitleProps): Element {
  return <Native.Title asChild>{target => target(Heading, merge({ size: '5' as const, mb: '3' as const, trim: 'start' as const }, props, { asChild: false as const }))}</Native.Title>;
}
function AlertDialogDescription(props: AlertDialogDescriptionProps): Element {
  return <Native.Description asChild>{target => target(Text, merge({ as: 'p' as const, size: '3' as const }, props, { asChild: false as const }))}</Native.Description>;
}
export { AlertDialogRoot as Root, AlertDialogTrigger as Trigger, AlertDialogContent as Content, AlertDialogTitle as Title, AlertDialogDescription as Description, AlertDialogAction as Action, AlertDialogCancel as Cancel };
export type { AlertDialogRootProps as RootProps, AlertDialogTriggerProps as TriggerProps, AlertDialogContentProps as ContentProps, AlertDialogTitleProps as TitleProps, AlertDialogDescriptionProps as DescriptionProps, AlertDialogActionProps as ActionProps, AlertDialogCancelProps as CancelProps };
