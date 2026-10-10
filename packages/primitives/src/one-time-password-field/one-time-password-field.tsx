// Native Radix OneTimePasswordField; upstream MIT, Copyright (c) 2022 WorkOS.
import { createEffect, createSignal, createUniqueId, flush, merge, omit, onCleanup, onSettled, untrack, type Element } from 'solid-js';
import { isServer, type ComponentProps } from '@solidjs/web';
import { createContextScope, type Scope } from '../internal/context.js';
import { createCollection } from '../internal/collection.js';
import { createControllableState } from '../internal/state.js';
import { Primitive, type PrimitiveProps } from '../internal/primitive.js';
import { composeEventHandlers } from '../internal/events.js';
import { composeRefs } from '../internal/refs.js';
import { activeElement, focus } from '../internal/focus-scope.js';
import { RovingFocusGroup, RovingFocusGroupItem, createRovingFocusGroupScope } from '../internal/roving-focus.js';
import { useDirection, type Direction } from '../direction/direction.js';

export type InputValidationType = 'numeric' | 'alpha' | 'alphanumeric' | 'none';
type Scoped = { __scopeOneTimePasswordField?: Scope };
type Options = {
  value?: string; defaultValue?: string; onValueChange?: (value: string) => void;
  name?: string; form?: string; disabled?: boolean; readOnly?: boolean; dir?: Direction;
  orientation?: 'horizontal' | 'vertical'; type?: 'text' | 'password'; placeholder?: string;
  autoComplete?: 'one-time-code' | 'off'; autoFocus?: boolean; autoSubmit?: boolean;
  onAutoSubmit?: (value: string) => void; validationType?: InputValidationType; sanitizeValue?: (value: string) => string;
};
export type OneTimePasswordFieldProps = Scoped & PrimitiveProps<'div'> & Options;
export type OneTimePasswordFieldInputProps = Scoped & PrimitiveProps<'input'> & {
  index?: number; onInvalidChange?: (character: string) => void;
  value?: never; defaultValue?: never; disabled?: never; readOnly?: never; readonly?: never; autoComplete?: never; autocomplete?: never; autoFocus?: never; autofocus?: never;
  form?: never; name?: never; placeholder?: never; type?: never;
};
export type OneTimePasswordFieldHiddenInputProps = Scoped & Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'type' | 'onChange' | 'readonly' | 'disabled' | 'autocomplete' | 'autofocus'>;
const patterns = { numeric: '[0-9]', alpha: '[a-zA-Z]', alphanumeric: '[a-zA-Z0-9]' };
interface State {
  props: Options; value: () => string; sanitize: (value: string) => string; current: () => string | null;
  inputRef: (node: HTMLInputElement | undefined) => void;
  collection: ReturnType<typeof createCollection<undefined>>; items: () => { node: HTMLElement; value: undefined }[];
  submit: () => void; focus: (index: number, preventScroll?: boolean) => void; paste: (value: string) => void;
  setChar: (index: number, char: string) => void; clear: (index: number, reason: string) => void;
}
const [createOTPContext] = createContextScope('OneTimePasswordField', [createRovingFocusGroupScope]);
const [Provider, useOTP] = createOTPContext<State>('OneTimePasswordField.Root');
const useRovingScope = createRovingFocusGroupScope();

export function OneTimePasswordField(props: OneTimePasswordFieldProps): Element {
  const scope = untrack(() => props.__scopeOneTimePasswordField), rovingScope = useRovingScope(scope);
  const direction = useDirection(() => props.dir);
  const sanitize = (value: string) => {
    const compact = value.replace(/\s/g, ''), validation = props.validationType ?? 'numeric';
    return validation === 'none' ? props.sanitizeValue?.(compact) ?? compact : compact.replace(new RegExp(`[^${patterns[validation].slice(1, -1)}]`, 'g'), '');
  };
  const [value, setValue] = createControllableState<string>({ value: () => props.value === undefined ? undefined : sanitize(props.value),
    get defaultValue() { return sanitize(props.defaultValue ?? ''); }, onChange: next => props.onValueChange?.(next) });
  const [root, rootRef] = createSignal<HTMLElement | undefined>(), [input, inputRef] = createSignal<HTMLInputElement | undefined>();
  const [current, setCurrent] = createSignal<string | null>(null);
  const collection = createCollection<undefined>(), items = () => collection.items(root());
  const locateForm = () => {
    const node = root();
    if (props.form && node) { const form = node.ownerDocument.getElementById(props.form); return form?.tagName === 'FORM' ? form as HTMLFormElement : null; }
    return input()?.form ?? (items()[0]?.node as HTMLInputElement | undefined)?.form ?? null;
  };
  let focusFrame = 0, focusView: Window | undefined;
  const cancelFocus = () => { focusView?.cancelAnimationFrame(focusFrame); focusView = undefined; };
  if (!isServer) onCleanup(cancelFocus);
  const focusInput = (index: number, preventScroll = false) => {
    cancelFocus();
    const node = items()[index]?.node as HTMLInputElement | undefined;
    if (!node) return;
    if (activeElement(node.ownerDocument) === node) node.select(); else focus(node);
    if (preventScroll || activeElement(node.ownerDocument) !== node) return;
    // Focus immediately for subsequent input; reveal after native caret scrolling.
    focusView = node.ownerDocument.defaultView!;
    focusFrame = focusView.requestAnimationFrame(() => {
      focusView = undefined;
      if (!node.isConnected || activeElement(node.ownerDocument) !== node) return;
      node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  };
  const mutable = () => !props.disabled && !props.readOnly;
  const state: State = { props, value, sanitize, current, inputRef, collection, items,
    submit: () => { if (mutable()) locateForm()?.requestSubmit(); }, focus: focusInput,
    paste: raw => { if (!mutable()) return; setValue(sanitize(raw).slice(0, items().length)); flush(); focusInput(Math.max(0, value().length - 1)); },
    setChar: (index, char) => {
      if (!mutable() || index < 0 || index >= items().length) return;
      const clean = sanitize(char); if (!clean || clean.length !== 1) return;
      setValue(value().slice(0, index) + clean + value().slice(index + 1)); flush();
      focusInput(Math.min(index + 1, items().length - 1));
    },
    clear: (index, reason) => {
      if (!mutable()) return;
      if (index < 0) { setValue(''); flush(); focusInput(0); return; }
      if (!value()[index]) return;
      setValue(value().slice(0, index) + value().slice(index + 1)); flush();
      focusInput(reason === 'Backspace' ? Math.max(0, index - 1) : index);
    }
  };
  let previousValidation = untrack(() => props.validationType ?? 'numeric'), previousValue = untrack(value);
  if (!isServer) {
    createEffect(() => props.validationType ?? 'numeric', validation => {
      if (validation !== previousValidation) { previousValidation = validation; if (validation !== 'none') untrack(() => { setValue(sanitize(value())); }); }
    }, { transparent: true });
    createEffect(root, node => {
      if (!node) return;
      const doc = node.ownerDocument, view = doc.defaultView!; let alive = true; const timers = new Set<number>();
      const reset = (event: Event) => {
        if (event.target !== locateForm()) return;
        const timer = view.setTimeout(() => { timers.delete(timer); if (alive && !event.defaultPrevented && event.target === locateForm()) setValue(''); }, 0); timers.add(timer);
      };
      doc.addEventListener('reset', reset, true);
      return () => { alive = false; doc.removeEventListener('reset', reset, true); for (const timer of timers) view.clearTimeout(timer); };
    }, { transparent: true });
    createEffect(() => [value(), props.autoSubmit, items().length, root(), props.disabled, props.readOnly] as const, ([current, auto, count, node, disabled, readOnly]) => {
      const changed = current !== previousValue; previousValue = current;
      if (!changed || !auto || !node || !count || current.length !== count || disabled || readOnly) return;
      const view = node.ownerDocument.defaultView!;
      const timer = view.setTimeout(() => {
        if (root() !== node || value() !== current || !mutable()) return;
        props.onAutoSubmit?.(current); state.submit();
      }, 0);
      return () => view.clearTimeout(timer);
    }, { transparent: true });
  }
  onSettled(() => untrack(() => { if (props.autoFocus && !props.disabled) focusInput(Math.min(value().length, items().length - 1), true); }));
  const forwarded = merge(omit(props, '__scopeOneTimePasswordField', 'value', 'defaultValue', 'onValueChange', 'name', 'form', 'disabled', 'readOnly', 'type', 'placeholder', 'autoComplete', 'autoFocus', 'autoSubmit', 'onAutoSubmit', 'validationType', 'sanitizeValue'), {
    get ref() { return composeRefs(props.ref, rootRef); }, get dir() { return direction(); }, get orientation() { return props.orientation ?? 'horizontal'; },
    role: 'group' as const, get ['data-disabled']() { return props.disabled ? '' : undefined; },
    get currentTabStopId() { return current(); }, onCurrentTabStopIdChange: setCurrent,
    onPaste: composeEventHandlers<ClipboardEvent>(() => props.onPaste, event => { if (!mutable()) return; event.preventDefault(); state.paste(event.clipboardData?.getData('text/plain') ?? ''); })
  });
  return <Provider scope={scope} value={state}><RovingFocusGroup {...rovingScope} {...forwarded} /></Provider>;
}

export function OneTimePasswordFieldInput(props: OneTimePasswordFieldInputProps): Element {
  const scope = untrack(() => props.__scopeOneTimePasswordField), context = useOTP('OneTimePasswordField.Input', scope), rovingScope = useRovingScope(scope);
  const [input, ref] = createSignal<HTMLInputElement | undefined>();
  const tabStopId = createUniqueId();
  const index = () => { const order = context.items().findIndex(item => item.node === input()); return order < 0 ? props.index ?? -1 : order; };
  const char = () => context.value().charAt(index());
  const fillable = () => index() >= 0 && index() <= context.value().length;
  const active = () => index() === Math.min(context.value().length, Math.max(0, context.items().length - 1));
  const supportsAutoComplete = () => context.current() === null ? index() === 0 : context.current() === tabStopId;
  let composing = false, processing = false, action: string | undefined, timer = 0, frame = 0, lastNative: string | undefined, lastAggregate: string | undefined;
  const allowed = () => !context.props.disabled && !context.props.readOnly;
  const rememberAction = (next: string) => {
    const view = input()?.ownerDocument.defaultView; if (!view) return;
    action = next; view.clearTimeout(timer); timer = view.setTimeout(() => { action = undefined; }, 10);
  };
  const process = (node: HTMLInputElement, event?: Event) => {
    if (processing || composing || event && 'isComposing' in event && event.isComposing) return;
    if (!allowed()) { node.value = char(); return; }
    if (node.value === lastNative && context.value() === lastAggregate) return;
    // Native blur/change can re-enter while the committed value is being focused.
    processing = true;
    try {
      if (node.value.length > 1) context.paste(node.value);
      else if (action === 'Clear') context.clear(-1, 'Backspace');
      else if (node.value === '') context.clear(index(), action ?? (event && 'inputType' in event && event.inputType === 'deleteByCut' ? 'Cut' : event && 'inputType' in event && event.inputType === 'deleteContentForward' ? 'Delete' : 'Backspace'));
      else if (node.validity.valid && ((context.props.validationType ?? 'numeric') === 'none' || context.sanitize(node.value) === node.value)) context.setChar(index(), node.value);
      else {
        props.onInvalidChange?.(node.value);
        lastNative = node.value; lastAggregate = context.value();
        const view = node.ownerDocument.defaultView!; view.cancelAnimationFrame(frame);
        frame = view.requestAnimationFrame(() => { if (view.document.activeElement === node) node.select(); }); return;
      }
      action = undefined; node.value = char(); lastNative = node.value; lastAggregate = context.value();
    } finally { processing = false; }
  };
  if (!isServer) createEffect(input, node => {
    if (!node) return;
    const unregister = context.collection.register(node, undefined), view = node.ownerDocument.defaultView!;
    return () => { unregister(); view.clearTimeout(timer); view.cancelAnimationFrame(frame); };
  }, { transparent: true });
  const forwarded = merge(omit(props, '__scopeOneTimePasswordField', 'index', 'onInvalidChange'), {
    as: 'input' as const, get ref() { return composeRefs(props.ref, ref); }, get value() { return char(); },
    get type() { return context.props.type ?? 'text'; }, get disabled() { return context.props.disabled; }, get readonly() { return context.props.readOnly; },
    get form() { return context.props.form; }, get placeholder() { const placeholder = context.props.placeholder ?? ''; return placeholder.charAt(index()) || (placeholder.length === 1 ? placeholder : ''); },
    get autocomplete() { return supportsAutoComplete() ? context.props.autoComplete ?? 'one-time-code' : 'off'; },
    get maxlength() { return supportsAutoComplete() ? Math.max(1, context.items().length) : 1; },
    get inputmode() { return props.inputmode ?? ((context.props.validationType ?? 'numeric') === 'numeric' ? 'numeric' as const : 'text' as const); },
    get pattern() { const validation = context.props.validationType ?? 'numeric'; return props.pattern ?? (validation === 'none' ? undefined : patterns[validation]); },
    get ['aria-label']() { return props['aria-label'] ?? `Character ${index() + 1} of ${context.items().length}`; },
    autocapitalize: 'off' as const, spellcheck: false,
    get ['data-1p-ignore']() { return supportsAutoComplete() ? undefined : 'true'; },
    get ['data-lpignore']() { return supportsAutoComplete() ? undefined : 'true'; },
    get ['data-protonpass-ignore']() { return supportsAutoComplete() ? undefined : 'true'; },
    get ['data-bwignore']() { return supportsAutoComplete() ? undefined : 'true'; },
    'data-radix-otp-input': '', get ['data-radix-index']() { return index(); },
    onFocus: composeEventHandlers<FocusEvent>(() => props.onFocus, event => { (event.currentTarget as HTMLInputElement).select(); }),
    onPointerDown: composeEventHandlers<PointerEvent>(() => props.onPointerDown, event => { if (!fillable() && !context.props.disabled) { event.preventDefault(); context.focus(Math.min(context.value().length, context.items().length - 1), true); } }),
    onInput: composeEventHandlers<InputEvent>(() => props.onInput, event => { process(event.currentTarget as HTMLInputElement, event); }),
    onChange: composeEventHandlers<Event>(() => props.onChange, event => { const node = event.currentTarget as HTMLInputElement; if (node.value !== lastNative || context.value() !== lastAggregate) process(node, event); }),
    onCompositionStart: composeEventHandlers<CompositionEvent>(() => props.onCompositionStart, () => { composing = true; action = undefined; input()?.ownerDocument.defaultView?.clearTimeout(timer); }),
    onCompositionEnd: composeEventHandlers<CompositionEvent>(() => props.onCompositionEnd, event => {
      composing = false;
      // Compositionend can precede native constraint updates; validate after commit.
      const node = event.currentTarget as HTMLInputElement, view = node.ownerDocument.defaultView!;
      view.clearTimeout(timer); timer = view.setTimeout(() => process(node), 0);
    }),
    onCut: composeEventHandlers<ClipboardEvent>(() => props.onCut, () => { if (allowed()) rememberAction('Cut'); }),
    onKeyDown: composeEventHandlers<KeyboardEvent>(() => props.onKeyDown, event => {
      if (!allowed() || event.isComposing) return;
      const node = event.currentTarget as HTMLInputElement;
      if (event.key === 'Enter') { event.preventDefault(); context.submit(); return; }
      if ((context.props.orientation ?? 'horizontal') === 'horizontal' && ['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); return; }
      if (['Backspace', 'Delete', 'Clear'].includes(event.key)) {
        const clearAll = event.key === 'Clear' || event.key === 'Backspace' && (event.ctrlKey || event.metaKey);
        if (!node.value) {
          if (clearAll) { event.preventDefault(); context.clear(-1, 'Backspace'); }
          else if (event.key === 'Backspace') { node.ownerDocument.defaultView!.cancelAnimationFrame(frame); context.focus(index() - 1); }
        } else rememberAction(clearAll ? 'Clear' : event.key);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (node.value === event.key) { event.preventDefault(); context.focus(index() + 1); return; }
      if (node.value && event.key.length === 1 && event.key !== ' ' && !(node.selectionStart === 0 && (node.selectionEnd ?? 0) > 0)) {
        const target = node.selectionStart === 0 ? index() : index() + 1;
        if (target < context.items().length) { event.preventDefault(); context.setChar(target, event.key); }
      }
    })
  }) as PrimitiveProps<'input'>;
  return <RovingFocusGroupItem {...rovingScope} tabStopId={tabStopId} asChild focusable={!context.props.disabled && fillable()} active={active()}>{target => target(Primitive, forwarded)}</RovingFocusGroupItem>;
}

export function OneTimePasswordFieldHiddenInput(props: OneTimePasswordFieldHiddenInputProps): Element {
  const context = useOTP('OneTimePasswordField.HiddenInput', props.__scopeOneTimePasswordField);
  if (!isServer) onCleanup(() => context.inputRef(undefined));
  return <input {...omit(props, '__scopeOneTimePasswordField')} ref={composeRefs(props.ref, context.inputRef)} type="hidden" value={context.value()} name={props.name ?? context.props.name} form={props.form ?? context.props.form} disabled={context.props.disabled} readonly autocomplete="off" autocapitalize="off" spellcheck={false} />;
}
