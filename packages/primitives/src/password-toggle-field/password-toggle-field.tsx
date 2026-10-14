// Native Radix PasswordToggleField; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, createUniqueId, flush, merge, omit, onSettled, Show, untrack, type Element } from 'solid-js';
import { isServer } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { createControllableState } from '../internal/state.js';
import { callEventHandler, composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import type { SlotRender } from '../slot/slot.js';

type Scoped = { __scopePasswordToggleField?: Scope };
export type PasswordToggleFieldProps = Scoped & { id?: string; visible?: boolean; defaultVisible?: boolean; onVisibilityChange?: (visible: boolean) => void; children?: Element };
export type PasswordToggleFieldInputProps = Scoped & PrimitiveProps<'input'> & { type?: never; autoComplete?: 'current-password' | 'new-password' | 'off' };
export type PasswordToggleFieldToggleProps = Scoped & PrimitiveProps<'button'> & { type?: never };
export type PasswordToggleFieldSlotProps = Scoped & ({ visible: Element; hidden: Element } | { render: (state: { visible: boolean }) => Element });
export type PasswordToggleFieldIconProps = Scoped & Omit<PrimitiveProps<'svg'>, 'children' | 'asChild'> & { visible: SlotRender; hidden: SlotRender };
interface PasswordState {
  visible: () => boolean; setVisible: (value: boolean | ((previous: boolean) => boolean)) => void;
  input: () => HTMLInputElement | undefined; inputRef: (node: HTMLInputElement | undefined) => void;
  defaultId: () => string; inputId: () => string; inputIdRef: (id: string) => void;
  pointer: boolean; selection?: [number, number, 'forward' | 'backward' | 'none'];
}
const [createPasswordContext] = createContextScope('PasswordToggleField');
const [Provider, usePassword] = createPasswordContext<PasswordState>('PasswordToggleField.Root');

export function PasswordToggleField(props: PasswordToggleFieldProps): Element {
  const [visible, setVisible] = createControllableState({ value: () => props.visible, get defaultValue() { return props.defaultVisible ?? false; }, onChange: next => props.onVisibilityChange?.(next) });
  const [input, inputRef] = createSignal<HTMLInputElement | undefined>();
  const generatedId = createUniqueId(), defaultId = () => props.id ?? generatedId;
  const [observedId, inputIdRef] = createSignal('');
  const state: PasswordState = { visible, setVisible, input, inputRef, defaultId, inputId: () => observedId() || defaultId(), inputIdRef, pointer: false };
  if (!isServer) createEffect(input, node => {
    if (!node) return;
    const doc = node.ownerDocument, view = doc.defaultView!;
    let active = true;
    const timers = new Set<number>();
    const later = (callback: () => void) => { const timer = view.setTimeout(() => { timers.delete(timer); if (active) callback(); }, 0); timers.add(timer); };
    const submit = (event: Event) => { if (event.target === node.form) state.setVisible(false); };
    const reset = (event: Event) => { if (event.target === node.form) later(() => { if (!event.defaultPrevented && event.target === node.form) state.setVisible(false); }); };
    const release = () => { if (state.pointer) later(() => { state.pointer = false; }); };
    doc.addEventListener('submit', submit, true);
    doc.addEventListener('reset', reset, true);
    view.addEventListener('pointerup', release);
    return () => { active = false; state.pointer = false; doc.removeEventListener('submit', submit, true); doc.removeEventListener('reset', reset, true); view.removeEventListener('pointerup', release); for (const timer of timers) view.clearTimeout(timer); };
  }, { transparent: true });
  return <Provider scope={props.__scopePasswordToggleField} value={state}>{props.children}</Provider>;
}

export function PasswordToggleFieldInput(props: PasswordToggleFieldInputProps): Element {
  const context = usePassword('PasswordToggleField.Input', untrack(() => props.__scopePasswordToggleField));
  if (!isServer) createEffect(() => [context.input(), props.id] as const, ([input]) => {
    if (!input) return;
    const sync = () => { if (input.id) context.inputIdRef(input.id); };
    sync();
    const observer = new input.ownerDocument.defaultView!.MutationObserver(sync);
    observer.observe(input, { attributes: true, attributeFilter: ['id'] });
    return () => observer.disconnect();
  }, { transparent: true });
  const forwarded = merge(omit(props, '__scopePasswordToggleField', 'autoComplete'), {
    as: 'input' as const,
    get id() { return props.id ?? context.defaultId(); },
    get type() { return context.visible() ? 'text' : 'password'; },
    get autocomplete() { return props.autoComplete ?? 'current-password'; },
    autocapitalize: 'off' as const, spellcheck: false,
    get ref() { return composeRefs(props.ref, context.inputRef); },
    onBlur: composeEventHandlers<FocusEvent>(() => props.onBlur, event => { const node = event.currentTarget as HTMLInputElement; if (node.selectionStart !== null && node.selectionEnd !== null) context.selection = [node.selectionStart, node.selectionEnd, node.selectionDirection ?? 'none']; })
  }) as PrimitiveProps<'input'>;
  return <Primitive {...forwarded} />;
}

export function PasswordToggleFieldToggle(props: PasswordToggleFieldToggleProps): Element {
  const context = usePassword('PasswordToggleField.Toggle', untrack(() => props.__scopePasswordToggleField));
  const [button, buttonRef] = createSignal<HTMLButtonElement | undefined>();
  const [settled, setSettled] = createSignal(false);
  const [text, setText] = createSignal('');
  let frame = 0;
  onSettled(() => { setSettled(true); });
  if (!isServer) {
    createEffect(button, node => {
      if (!node) return;
      const sync = () => { setText(node.textContent?.trim() ?? ''); };
      sync();
      const view = node.ownerDocument.defaultView!;
      const observer = new view.MutationObserver(sync);
      observer.observe(node, { childList: true, characterData: true, subtree: true });
      return () => { observer.disconnect(); view.cancelAnimationFrame(frame); context.pointer = false; };
    }, { transparent: true });
  }
  const forwarded = merge(omit(props, '__scopePasswordToggleField'), {
    as: 'button' as const, type: 'button' as const,
    get ref() { return composeRefs(props.ref, buttonRef); },
    get 'aria-label'() { return props['aria-label'] || (text() ? undefined : context.visible() ? 'Hide password' : 'Show password'); },
    get 'aria-hidden'() { return props['aria-hidden'] ?? (settled() ? undefined : 'true' as const); },
    get 'aria-controls'() { return props['aria-controls'] ?? (settled() ? context.inputId() : undefined); },
    get tabindex() { return props.tabindex ?? (settled() ? undefined : -1); },
    onPointerDown: (event: PointerEvent) => { context.pointer = false; callEventHandler(props.onPointerDown, event); if (!event.defaultPrevented && event.button === 0) context.pointer = true; },
    onPointerCancel: (event: PointerEvent) => { context.pointer = false; context.selection = undefined; callEventHandler(props.onPointerCancel, event); },
    onClick: (event: MouseEvent) => {
      callEventHandler(props.onClick, event);
      const pointer = context.pointer;
      context.pointer = false;
      if (event.defaultPrevented || (event.currentTarget as HTMLButtonElement).disabled) { context.selection = undefined; return; }
      context.setVisible(previous => !previous);
      const input = context.input();
      if (pointer && input) {
        flush();
        untrack(() => input.focus());
        const selection = context.selection, view = input.ownerDocument.defaultView!;
        view.cancelAnimationFrame(frame);
        if (selection) frame = view.requestAnimationFrame(() => { if (input.ownerDocument.activeElement === input) input.setSelectionRange(...selection); });
      }
    }
  }) as PrimitiveProps<'button'>;
  return <Primitive {...forwarded} />;
}

export function PasswordToggleFieldSlot(props: PasswordToggleFieldSlotProps): Element {
  const context = usePassword('PasswordToggleField.Slot', untrack(() => props.__scopePasswordToggleField));
  return <>{'render' in props ? props.render({ visible: context.visible() }) : context.visible() ? props.visible : props.hidden}</>;
}

export function PasswordToggleFieldIcon(props: PasswordToggleFieldIconProps): Element {
  const context = usePassword('PasswordToggleField.Icon', untrack(() => props.__scopePasswordToggleField));
  const forwarded = omit(props, '__scopePasswordToggleField', 'visible', 'hidden');
  return <Show when={context.visible()} fallback={<Primitive {...forwarded} as="svg" asChild aria-hidden="true">{props.hidden}</Primitive>}><Primitive {...forwarded} as="svg" asChild aria-hidden="true">{props.visible}</Primitive></Show>;
}
