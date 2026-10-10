// Native port of Radix ToggleGroup; upstream MIT, Copyright (c) 2022 WorkOS.
import { createMemo, merge, omit, Show, untrack, type Accessor, type Element } from 'solid-js';
import { createContextScope, type Scope } from '../internal/context.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { createControllableState } from '../internal/state.js';
import { createRovingFocusGroupScope, RovingFocusGroup, RovingFocusGroupItem } from '../internal/roving-focus.js';
import { Toggle, type ToggleProps } from '../toggle/toggle.js';
import { useDirection, type Direction } from '../direction/direction.js';

const [createToggleGroupContext, createToggleGroupScope] = createContextScope('ToggleGroup', [createRovingFocusGroupScope]);
const useRovingScope = createRovingFocusGroupScope();
const [Provider, useToggleGroupContext] = createToggleGroupContext<{
  type: 'single' | 'multiple'; value: Accessor<string[]>; activate: (value: string) => void; deactivate: (value: string) => void;
  disabled: Accessor<boolean>; rovingFocus: Accessor<boolean>;
}>('ToggleGroup');
// Toolbar consumes the same disabled state when registering its outer roving items.
export { createToggleGroupScope, useToggleGroupContext };
type ToggleGroupBaseProps = PrimitiveProps<'div'> & { __scopeToggleGroup?: Scope; disabled?: boolean; rovingFocus?: boolean;
  loop?: boolean; orientation?: 'horizontal' | 'vertical'; dir?: Direction };
export type ToggleGroupSingleProps = ToggleGroupBaseProps & { type: 'single'; value?: string; defaultValue?: string; onValueChange?: (value: string) => void };
export type ToggleGroupMultipleProps = ToggleGroupBaseProps & { type: 'multiple'; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void };
export type ToggleGroupItemProps = PrimitiveProps<'button'> & { __scopeToggleGroup?: Scope; value: string };

export function ToggleGroup(props: ToggleGroupSingleProps | ToggleGroupMultipleProps): Element {
  const scope = untrack(() => props.__scopeToggleGroup);
  const state = untrack(() => {
    if (props.type === 'multiple') {
      const multiple = props;
      const [value, change] = createControllableState<string[]>({ value: () => multiple.value,
        get defaultValue() { return multiple.defaultValue ?? []; }, get onChange() { return multiple.onValueChange; } });
      return { type: 'multiple' as const, value, activate: (item: string) => change(previous => [...previous, item]),
        deactivate: (item: string) => change(previous => previous.filter(value => value !== item)) };
    }
    if (props.type !== 'single') throw new Error('Missing prop `type` expected on `ToggleGroup`');
    const single = props;
    const [value, change] = createControllableState<string>({ value: () => single.value,
      get defaultValue() { return single.defaultValue ?? ''; }, get onChange() { return single.onValueChange; } });
    const selected = createMemo(() => { const current = value(); return current ? [current] : []; });
    return { type: 'single' as const, value: selected, activate: (item: string) => change(item), deactivate: () => change('') };
  });
  const context = { ...state, disabled: () => props.disabled ?? false, rovingFocus: () => props.rovingFocus ?? true };
  const dir = useDirection(() => props.dir);
  const hostProps = props as ToggleGroupSingleProps;
  const forwarded = merge({ role: state.type === 'single' ? 'radiogroup' as const : 'toolbar' as const, get dir() { return dir(); } },
    omit(hostProps, '__scopeToggleGroup', 'type', 'value', 'defaultValue', 'onValueChange', 'disabled', 'rovingFocus', 'loop', 'orientation', 'dir'));
  return <Provider scope={scope} value={context}><Show when={context.rovingFocus()} fallback={<Primitive as="div" {...forwarded} />}>
    <RovingFocusGroup {...useRovingScope(scope)} orientation={props.orientation} dir={dir()} loop={props.loop ?? true} asChild>
      {target => target(Primitive, merge({ as: 'div' as const }, forwarded))}
    </RovingFocusGroup>
  </Show></Provider>;
}

export function ToggleGroupItem(props: ToggleGroupItemProps): Element {
  const scope = untrack(() => props.__scopeToggleGroup);
  const context = useToggleGroupContext('ToggleGroupItem', scope);
  const pressed = () => context.value().includes(props.value);
  const disabled = () => context.disabled() || !!props.disabled;
  const forwarded = merge({ get role() { return context.type === 'single' ? 'radio' as const : undefined; },
    get ['aria-checked']() { return context.type === 'single' ? pressed() ? 'true' as const : 'false' as const : undefined; },
    get ['aria-pressed']() { return context.type === 'single' ? undefined : pressed() ? 'true' as const : 'false' as const; }
  }, omit(props, '__scopeToggleGroup', 'value'), {
    get disabled() { return disabled(); }, get pressed() { return pressed(); },
    onPressedChange: (next: boolean) => { if (next) context.activate(props.value); else context.deactivate(props.value); }
  }) as ToggleProps;
  return <Show when={context.rovingFocus()} fallback={<Toggle {...forwarded} />}>
    <RovingFocusGroupItem {...useRovingScope(scope)} focusable={!disabled()} active={pressed()} asChild>
      {target => target(Toggle<HTMLButtonElement>, forwarded)}
    </RovingFocusGroupItem>
  </Show>;
}
