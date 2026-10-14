// Native port of Radix Slot merge policy; upstream MIT, Copyright (c) 2022 WorkOS.
import { createMemo, merge, omit, untrack, type Element } from 'solid-js';
import { dynamic, type ComponentProps, type JSX, type ValidComponent } from '@solidjs/web';
import { composeRefs, equalRefs } from '../internal/refs.js';
import { callEventHandler } from '../internal/events.js';

export type SlotTarget = <T extends ValidComponent>(component: T, props: ComponentProps<T>) => Element;
export type SlotRender = (target: SlotTarget) => Element;
export type SlotProps = Omit<JSX.HTMLAttributes<HTMLElement>, 'children'> & { children: SlotRender };

export function mergeStyles(parent: unknown, child: unknown): JSX.CSSProperties | string {
  if (typeof parent !== 'string' && typeof child !== 'string') {
    return merge(typeof parent === 'object' && parent !== null ? parent : {}, typeof child === 'object' && child !== null ? child : {});
  }
  return [parent, child].map(style => {
    if (typeof style === 'string') return style;
    if (typeof style !== 'object' || style === null) return '';
    return Object.entries(style).filter(([, value]) => value !== undefined && value !== null)
      .map(([name, value]) => `${name}:${value}`).join(';');
  }).filter(Boolean).join(';');
}

export function concatAriaIds(...values: unknown[]): string | undefined {
  return [...new Set(values.filter(value => typeof value === 'string').join(' ').split(/\s+/).filter(Boolean))].join(' ') || undefined;
}

function mergeSlotProps(parent: object, child: object) {
  const ref = createMemo(() => composeRefs(Reflect.get(parent, 'ref'), Reflect.get(child, 'ref')), { equals: equalRefs });
  const overrides: Record<string, unknown> = {
    get class() { return [Reflect.get(parent, 'class'), Reflect.get(child, 'class')]; },
    get style() { return mergeStyles(Reflect.get(parent, 'style'), Reflect.get(child, 'style')); },
    get ref() { return ref(); }
  };
  const describedBy = {
    get ['aria-describedby']() {
      return concatAriaIds(Reflect.get(child, 'aria-describedby'), Reflect.get(parent, 'aria-describedby'));
    }
  };
  const labelledBy = {
    get ['aria-labelledby']() {
      return concatAriaIds(Reflect.get(child, 'aria-labelledby'), Reflect.get(parent, 'aria-labelledby'));
    }
  };
  for (const key of untrack(() => Object.keys(merge(parent, child)))) {
    if (/^on[A-Z]/.test(key)) {
      overrides[key] = (...args: unknown[]) => untrack(() => {
        const result = callEventHandler(Reflect.get(child, key), ...args);
        callEventHandler(Reflect.get(parent, key), ...args);
        return result;
      });
    }
  }
  return merge(parent, child, overrides,
    () => 'aria-describedby' in parent || 'aria-describedby' in child ? describedBy : undefined,
    () => 'aria-labelledby' in parent || 'aria-labelledby' in child ? labelledBy : undefined);
}

export function createSlot(ownerName: string) {
  return function Slot(props: SlotProps): Element {
    const render = untrack(() => props.children);
    if (typeof render !== 'function') throw new TypeError(`${ownerName} requires a single-target render function.`);
    let count = 0;
    let host: Element;
    const target: SlotTarget = (component, childProps) => {
      if (++count !== 1) throw new TypeError(`${ownerName} requires exactly one target.`);
      const Target = dynamic(() => component, { static: true });
      // The generic renderer props retain the same native keys after Slot's merge policy.
      const forwarded = mergeSlotProps(omit(props, 'children'), childProps) as ComponentProps<typeof component>;
      return host = <Target {...forwarded} />;
    };
    const result = render(target);
    if (count !== 1 || result !== host) throw new TypeError(`${ownerName} must return its single requested target.`);
    return result;
  };
}

export const Slot = createSlot('Slot');

export interface SlottableProps {
  child: SlotRender;
  leading?: Element;
  trailing?: Element;
  children?: (content: Element) => Element;
}

export function createSlottable(ownerName: string) {
  return function Slottable(props: SlottableProps): SlotRender {
    if (typeof untrack(() => props.child) !== 'function') throw new TypeError(`${ownerName} requires a target factory.`);
    return target => props.child((component, childProps) => {
      const wrapped = merge(childProps, {
        get children() {
          return <>{props.leading}{props.children ? props.children(childProps.children) : childProps.children}{props.trailing}</>;
        }
      });
      // Only the native children field changes; all target-specific props stay intact.
      const forwarded = wrapped as ComponentProps<typeof component>;
      return target(component, forwarded);
    });
  };
}

export const Slottable = createSlottable('Slottable');
