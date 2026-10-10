// Native port of Radix Accordion; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createMemo, createSignal, createUniqueId, merge, omit, untrack, type Accessor, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { Collapsible, CollapsibleTrigger, CollapsibleContent, createCollapsibleScope } from '../collapsible/collapsible.js';
import { createContextScope, type Scope } from '../internal/context.js';
import { createCollection } from '../internal/collection.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeRefs } from '../internal/refs.js';
import { composeEventHandlers } from '../internal/events.js';
import { useDirection, type Direction } from '../direction/direction.js';
import { mergeStyles } from '../slot/slot.js';

const [createAccordionContext, createAccordionScope] = createContextScope('Accordion', [createCollapsibleScope]);
const useCollapsibleScope = createCollapsibleScope();
type TriggerItem = { disabled: Accessor<boolean> };
const [Provider, useAccordion] = createAccordionContext<{
  value: Accessor<string[]>; open: (value: string) => void; close: (value: string) => void; collapsible: Accessor<boolean>;
  disabled: Accessor<boolean>; orientation: Accessor<'horizontal' | 'vertical'>; collection: ReturnType<typeof createCollection<TriggerItem>>;
}>('Accordion');
const [ItemProvider, useItem] = createAccordionContext<{ open: Accessor<boolean>; disabled: Accessor<boolean>; triggerId: string }>('AccordionItem');
export { createAccordionScope };
type AccordionBaseProps = PrimitiveProps<'div'> & { __scopeAccordion?: Scope; disabled?: boolean; orientation?: 'horizontal' | 'vertical'; dir?: Direction };
export type AccordionSingleProps = AccordionBaseProps & { type: 'single'; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; collapsible?: boolean };
export type AccordionMultipleProps = AccordionBaseProps & { type: 'multiple'; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void };
export type AccordionItemProps = PrimitiveProps<'div'> & { __scopeAccordion?: Scope; value: string; disabled?: boolean };
export type AccordionHeaderProps = PrimitiveProps<'h3'> & { __scopeAccordion?: Scope };
export type AccordionTriggerProps = PrimitiveProps<'button'> & { __scopeAccordion?: Scope };
export type AccordionContentProps = PrimitiveProps<'div'> & { __scopeAccordion?: Scope; forceMount?: true };
const navigationKeys = ['Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];

export function Accordion(props: AccordionSingleProps | AccordionMultipleProps): Element {
  const state = untrack(() => {
    if (props.type === 'multiple') {
      const multiple = props;
      const [value, change] = createControllableState<string[]>({ value: () => multiple.value,
        get defaultValue() { return multiple.defaultValue ?? []; }, get onChange() { return multiple.onValueChange; } });
      return { value, open: (item: string) => change(previous => [...previous, item]),
        close: (item: string) => change(previous => previous.filter(value => value !== item)), collapsible: () => true };
    }
    const single = props;
    const [value, change] = createControllableState<string>({ value: () => single.value,
      get defaultValue() { return single.defaultValue ?? ''; }, get onChange() { return single.onValueChange; } });
    const selected = createMemo(() => { const current = value(); return current ? [current] : []; });
    return { value: selected, open: (item: string) => change(item), close: () => { if (single.collapsible) change(''); }, collapsible: () => single.collapsible ?? false };
  });
  const collection = createCollection<TriggerItem>();
  const dir = useDirection(() => props.dir);
  const context = { ...state, collection, disabled: () => props.disabled ?? false, orientation: () => props.orientation ?? 'vertical' as const };
  const onKeyDown = composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
    if (!navigationKeys.includes(event.key)) return;
    const items = collection.items().filter(item => !item.value.disabled());
    const index = items.findIndex(item => item.node === event.target);
    if (index < 0) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (context.orientation() === 'vertical') {
      if (event.key === 'ArrowDown') next++;
      else if (event.key === 'ArrowUp') next--;
    } else {
      if (event.key === 'ArrowRight') next += dir() === 'rtl' ? -1 : 1;
      else if (event.key === 'ArrowLeft') next += dir() === 'rtl' ? 1 : -1;
    }
    items[(next + items.length) % items.length]?.node.focus();
  });
  // Only native host props remain after consuming either state shape above.
  const rootProps = props as AccordionSingleProps;
  const forwarded = merge(omit(rootProps, '__scopeAccordion', 'type', 'value', 'defaultValue', 'onValueChange', 'collapsible', 'disabled', 'orientation'), {
    get ['data-orientation']() { return context.orientation(); }, get onKeyDown() { return props.disabled ? undefined : onKeyDown; }
  });
  return <Provider scope={props.__scopeAccordion} value={context}><Primitive as="div" {...forwarded} /></Provider>;
}

export function AccordionItem(props: AccordionItemProps): Element {
  const root = useAccordion('AccordionItem', props.__scopeAccordion);
  const item = { open: () => !!props.value && root.value().includes(props.value), disabled: () => root.disabled() || !!props.disabled, triggerId: createUniqueId() };
  const forwarded = merge(omit(props, '__scopeAccordion', 'value'), {
    get __scopeCollapsible() { return useCollapsibleScope(props.__scopeAccordion).__scopeCollapsible; },
    get ['data-orientation']() { return root.orientation(); }, get open() { return item.open(); }, get disabled() { return item.disabled(); },
    onOpenChange: (open: boolean) => { if (open) root.open(props.value); else root.close(props.value); }
  });
  return <ItemProvider scope={props.__scopeAccordion} value={item}><Collapsible {...forwarded} /></ItemProvider>;
}

export function AccordionHeader(props: AccordionHeaderProps): Element {
  const root = useAccordion('AccordionHeader', props.__scopeAccordion);
  const item = useItem('AccordionHeader', props.__scopeAccordion);
  const forwarded = merge({ get ['data-orientation']() { return root.orientation(); }, get ['data-state']() { return item.open() ? 'open' : 'closed'; },
    get ['data-disabled']() { return item.disabled() ? '' : undefined; } }, omit(props, '__scopeAccordion'));
  return <Primitive as="h3" {...forwarded} />;
}

export function AccordionTrigger(props: AccordionTriggerProps): Element {
  const root = useAccordion('AccordionTrigger', props.__scopeAccordion);
  const item = useItem('AccordionTrigger', props.__scopeAccordion);
  const [node, ref] = createSignal<HTMLElement | undefined>();
  if (!isServer) createEffect(node, element => element ? root.collection.register(element, { disabled: item.disabled }) : undefined, { transparent: true });
  const forwarded = merge({ id: item.triggerId, get ['aria-disabled']() { return item.open() && !root.collapsible() ? 'true' : undefined; },
    get ['data-orientation']() { return root.orientation(); } }, omit(props, '__scopeAccordion'), {
    get __scopeCollapsible() { return useCollapsibleScope(props.__scopeAccordion).__scopeCollapsible; }, get ref() { return composeRefs(props.ref, ref); }
  });
  return <CollapsibleTrigger {...forwarded} />;
}

export function AccordionContent(props: AccordionContentProps): Element {
  const root = useAccordion('AccordionContent', props.__scopeAccordion);
  const item = useItem('AccordionContent', props.__scopeAccordion);
  const style = createMemo(() => {
    const values = { '--radix-accordion-content-height': 'var(--radix-collapsible-content-height)', '--radix-accordion-content-width': 'var(--radix-collapsible-content-width)' };
    const consumer = props.style;
    return typeof consumer === 'string' ? mergeStyles(values, consumer) : Object.assign(values, consumer);
  });
  const forwarded = merge({ role: 'region' as const, 'aria-labelledby': item.triggerId, get ['data-orientation']() { return root.orientation(); } },
    omit(props, '__scopeAccordion'), { get __scopeCollapsible() { return useCollapsibleScope(props.__scopeAccordion).__scopeCollapsible; }, get style() { return style(); } });
  return <CollapsibleContent {...forwarded} />;
}
