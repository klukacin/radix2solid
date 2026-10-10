import { createEffect, createSignal, onCleanup, untrack, type Accessor } from 'solid-js';
import { isServer } from '@solidjs/web';

export type CheckedState = boolean | 'indeterminate';
export interface FormControlState<T extends CheckedState = CheckedState> {
  checked: Accessor<T>;
  setChecked: (value: T | ((previous: T) => T)) => void;
  disabled: Accessor<boolean | undefined>;
  required: Accessor<boolean | undefined>;
  name: Accessor<string | undefined>;
  value: Accessor<string | undefined>;
  form: Accessor<string | undefined>;
  control: Accessor<HTMLElement | undefined>;
  controlRef: (node: HTMLElement | undefined) => void;
  input: Accessor<HTMLInputElement | undefined>;
  inputRef: (node: HTMLInputElement | undefined) => void;
  hasForm: Accessor<boolean>;
  initial: T;
  interaction: Accessor<number>;
  markInteraction: (bubbles: boolean) => void;
  bubbles: Accessor<boolean>;
}

export function createFormControl<T extends CheckedState>(options: Pick<FormControlState<T>, 'checked' | 'setChecked' | 'disabled' | 'required' | 'name' | 'value' | 'form'>): FormControlState<T> {
  const [control, controlRef] = createSignal<HTMLElement | undefined>();
  const [input, inputRef] = createSignal<HTMLInputElement | undefined>();
  const [interaction, setInteraction] = createSignal(0);
  let bubbles = true;
  return { ...options, control, controlRef, input, inputRef,
    initial: untrack(options.checked), interaction, bubbles: () => bubbles,
    hasForm: () => !control() || !!options.form() || !!control()!.closest('form'),
    markInteraction: value => { bubbles = value; setInteraction(previous => previous + 1); }
  };
}

/** Native inputs own submission/validation; only a user change forwards a click. */
export function createFormInput<T extends CheckedState>(state: FormControlState<T>, requestReset = true) {
  const [size, setSize] = createSignal({ width: '0px', height: '0px' });
  if (!isServer) {
    let previousInput: HTMLInputElement | undefined;
    let previousChecked = untrack(state.checked);
    let previousInteraction = 0;
    createEffect(() => [state.input(), state.checked(), state.interaction()] as const, ([input, checked, interaction]) => {
      const userChange = interaction !== previousInteraction;
      previousInteraction = interaction;
      if (!input) { previousInput = undefined; return; }
      const first = input !== previousInput;
      const changed = checked !== previousChecked;
      previousInput = input;
      previousChecked = checked;
      if (first) input.defaultChecked = state.initial === true;
      input.indeterminate = checked === 'indeterminate';
      input.checked = checked === true;
      if (!first && changed && (input.type !== 'radio' || checked === true)) {
        const view = input.ownerDocument.defaultView!;
        // Event, not MouseEvent: the latter activates and toggles an input again.
        if (userChange) input.dispatchEvent(new view.Event('click', { bubbles: state.bubbles() }));
        input.dispatchEvent(new view.Event('change', { bubbles: !userChange || state.bubbles() }));
      }
    }, { transparent: true });
    createEffect(() => [state.input(), state.control()] as const, ([input, control]) => {
      if (!input) return;
      const view = input.ownerDocument.defaultView!;
      let active = true;
      const timers = new Set<number>();
      const reset = (event: Event) => {
        if (event.target !== input.form) return;
        const timer = view.setTimeout(() => {
          timers.delete(timer);
          if (!active || event.defaultPrevented) return;
          if (requestReset) state.setChecked(state.initial);
          // Reset's default action can disagree with a controlled parent that rejects it.
          queueMicrotask(() => {
            if (!active) return;
            input.indeterminate = untrack(state.checked) === 'indeterminate';
            input.checked = untrack(state.checked) === true;
          });
        }, 0);
        timers.add(timer);
      };
      input.ownerDocument.addEventListener('reset', reset);
      const measure = () => {
        const rect = control?.getBoundingClientRect();
        setSize({ width: `${rect?.width ?? 0}px`, height: `${rect?.height ?? 0}px` });
      };
      const observer = control ? new view.ResizeObserver(measure) : undefined;
      if (control) observer?.observe(control);
      measure();
      return () => {
        active = false;
        observer?.disconnect();
        input.ownerDocument.removeEventListener('reset', reset);
        for (const timer of timers) view.clearTimeout(timer);
      };
    }, { transparent: true });
    onCleanup(() => state.inputRef(undefined));
  }
  return size;
}
