import { isServer, type ComponentProps } from "@solidjs/web";
import {
  createEffect,
  createMemo,
  createSignal,
  merge,
  omit,
  onCleanup,
  untrack,
  type Accessor,
  type Element,
} from "solid-js";

import { createContextScope, type Scope } from "../internal/context.js";
import { callEventHandler } from "../internal/events.js";
import {
  useFormValidityOwner,
  type FormValidityOwner,
} from "../internal/form-validity.js";
import { Primitive, type PrimitiveProps } from "../internal/primitive.js";
import { composeRefs } from "../internal/refs.js";
import { createControllableState } from "../internal/state.js";
import type { SlotRender } from "../slot/slot.js";
import {
  parseAccept,
  rejectCandidate,
  sameFiles,
  type AcceptToken,
  type CandidateFailure,
} from "./files.js";

type Without<P, K extends PropertyKey> = P extends unknown ? Omit<P, K> : never;
type Scoped = { __scopeFileDrop?: Scope };
type FileDropSource = "picker" | "drop";

export interface FileDropRejection {
  source: FileDropSource;
  reason: CandidateFailure;
  files: readonly File[];
}

export type FileDropProps = Scoped &
  Without<PrimitiveProps<"div">, "value"> & {
    value?: readonly File[];
    defaultValue?: readonly File[];
    onValueChange?: (value: readonly File[]) => void;
    multiple?: boolean;
    accept?: string;
    name?: string;
    form?: string;
    required?: boolean;
    disabled?: boolean;
    onReject?: (rejection: FileDropRejection) => void;
  };

type RootContext = {
  value: Accessor<readonly File[]>;
  setValue: (value: readonly File[]) => void;
  multiple: Accessor<boolean>;
  accept: Accessor<string | undefined>;
  name: Accessor<string | undefined>;
  form: Accessor<string | undefined>;
  required: Accessor<boolean>;
  disabled: Accessor<boolean>;
  tokens: Accessor<readonly AcceptToken[]>;
  input: Accessor<HTMLInputElement | undefined>;
  setInput: (node: HTMLInputElement | undefined) => void;
  formValidityOwner: Accessor<FormValidityOwner | undefined>;
  setFormValidityOwner: (owner: FormValidityOwner | undefined) => void;
  revision: Accessor<number>;
  processCandidate: (files: readonly File[], source: FileDropSource) => void;
  processDrop: (event: DragEvent, stopPropagation?: boolean) => void;
  setDragging: (dragging: boolean) => void;
  isInternalEvent: (event: Event) => boolean;
};

const [createFileDropContext, createFileDropScope] =
  createContextScope("FileDrop");
const [Provider, useFileDrop] = createFileDropContext<RootContext>("FileDrop");
export { createFileDropScope };

export type FileDropInputProps = Scoped &
  Without<
    PrimitiveProps<"input">,
    | "type"
    | "value"
    | "defaultValue"
    | "readOnly"
    | "readonly"
    | "files"
    | "multiple"
    | "accept"
    | "name"
    | "form"
    | "required"
    | "disabled"
  >;
export type FileDropTriggerProps = Scoped &
  Without<PrimitiveProps<"button">, "type">;

function snapshot(
  files: FileList | readonly File[] | null | undefined,
): readonly File[] {
  return files ? Array.from(files) : [];
}

function matchesNativeFiles(
  node: HTMLInputElement,
  files: readonly File[],
): boolean {
  const native = node.files;
  if (!native || native.length !== files.length) return false;
  for (let index = 0; index < files.length; index++)
    if (native[index] !== files[index]) return false;
  return true;
}

function projectFiles(node: HTMLInputElement, files: readonly File[]): void {
  if (matchesNativeFiles(node, files)) return;
  if (files.length === 0) {
    node.value = "";
    return;
  }
  const view = node.ownerDocument.defaultView;
  if (!view || typeof view.DataTransfer !== "function")
    throw new Error(
      "FileDrop requires DataTransfer FileList projection support.",
    );
  const transfer = new view.DataTransfer();
  for (const file of files) transfer.items.add(file);
  try {
    node.files = transfer.files;
  } catch (error) {
    throw new Error(
      "FileDrop could not project accepted files into the native input.",
      { cause: error },
    );
  }
  if (!matchesNativeFiles(node, files))
    throw new Error(
      "FileDrop native FileList projection did not preserve the accepted files.",
    );
}

function failureMessage(reason: CandidateFailure | null): string {
  if (reason === "too-many-files") return "Select one file at a time.";
  if (reason === "accept-mismatch")
    return "Selected files do not match the accepted file types.";
  return "";
}

export function FileDrop(props: FileDropProps): Element {
  const [value, setValue] = createControllableState<readonly File[]>({
    value: () => props.value,
    get defaultValue() {
      return props.defaultValue ?? [];
    },
    get onChange() {
      return props.onValueChange;
    },
  });
  const initialValue = snapshot(untrack(value));
  const tokens = createMemo(() => parseAccept(props.accept));
  untrack(tokens);
  const [input, setInputRef] = createSignal<HTMLInputElement | undefined>();
  const [dragging, setDragging] = createSignal(false);
  let revision = 0;
  const readRevision = () => revision;
  const advanceRevision = () => {
    revision += 1;
  };
  const [formValidityOwner, setFormValidityOwner] = createSignal<
    FormValidityOwner | undefined
  >();
  const multiple = () => props.multiple ?? false;
  const disabled = () => !!props.disabled;
  let active = true;
  let inputNode: HTMLInputElement | undefined;
  let lastAccepted: readonly File[] | undefined;
  let lastTokens: readonly AcceptToken[] | undefined;
  let lastMultiple: boolean | undefined;
  let pendingCandidate = false;
  let pendingSource: FileDropSource | "reset" | undefined;
  let pendingFiles: readonly File[] | undefined;
  let settlementQueued = false;
  let pendingDropAccepted = false;
  let pendingPolicyChanged = false;
  let dragDepth = 0;
  const internalEvents = new WeakSet<Event>();
  const dispatchInternal = (
    node: HTMLInputElement,
    type: "input" | "change",
    bubbles: boolean,
  ) => {
    const event = new node.ownerDocument.defaultView!.Event(type, { bubbles });
    internalEvents.add(event);
    node.dispatchEvent(event);
  };

  const reconcile = (
    node: HTMLInputElement,
    next: readonly File[],
    owner: FormValidityOwner | undefined,
    baseline: string,
  ) => {
    projectFiles(node, next);
    if (!owner) node.setCustomValidity(baseline);
    lastAccepted = next;
  };

  const clearDrag = () => {
    dragDepth = 0;
    setDragging(false);
  };
  const processDrop = (event: DragEvent, stopPropagation = false) => {
    try {
      callEventHandler(props.onDrop, event);
      const acceptedByConsumer = !event.defaultPrevented;
      event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      if (acceptedByConsumer)
        processCandidate(snapshot(event.dataTransfer?.files), "drop");
    } finally {
      clearDrag();
    }
  };

  const queueSettlement = () => {
    if (settlementQueued) return;
    settlementQueued = true;
    queueMicrotask(() => {
      settlementQueued = false;
      if (!active) return;
      const source = pendingSource;
      const candidate = pendingFiles;
      const acceptedDropCandidate = pendingDropAccepted;
      const policyChangedForSettlement = pendingPolicyChanged;
      pendingPolicyChanged = false;
      pendingDropAccepted = false;
      pendingSource = undefined;
      pendingFiles = undefined;
      pendingCandidate = false;
      const node = untrack(input);
      if (!node) return;
      const accepted = untrack(value);
      const countMode = untrack(multiple);
      const parsedTokens = untrack(tokens);
      const owner = untrack(formValidityOwner);
      const nextBaseline = failureMessage(
        rejectCandidate(accepted, "picker", countMode, parsedTokens),
      );
      const changed =
        lastAccepted !== undefined && !sameFiles(lastAccepted, accepted);
      if (changed || source === "reset") advanceRevision();
      reconcile(node, accepted, owner, nextBaseline);
      const dispatchesChange = source === "drop" && changed;
      if (
        owner &&
        (changed ||
          policyChangedForSettlement ||
          source === "reset" ||
          (source === "picker" && candidate !== undefined)) &&
        !dispatchesChange
      )
        owner.revalidate();
      if (source === "drop" && changed) {
        if (
          acceptedDropCandidate &&
          candidate &&
          sameFiles(candidate, accepted)
        ) {
          dispatchInternal(node, "input", true);
          dispatchInternal(node, "change", true);
        } else {
          dispatchInternal(node, "change", false);
        }
      }
    });
  };

  const processCandidate = (files: readonly File[], source: FileDropSource) => {
    const candidate = files;
    if (source === "picker" && !sameFiles(candidate, value()))
      advanceRevision();
    pendingCandidate = true;
    pendingSource = source;
    pendingFiles = candidate;
    pendingDropAccepted = false;
    if (disabled()) {
      queueSettlement();
      return;
    }
    const failure = rejectCandidate(candidate, source, multiple(), tokens());
    if (failure) {
      callEventHandler(props.onReject, {
        source,
        reason: failure,
        files: candidate,
      } satisfies FileDropRejection);
      queueSettlement();
      return;
    }
    pendingDropAccepted = source === "drop";
    if (!sameFiles(candidate, value())) setValue(candidate);
    queueSettlement();
  };

  const setInput = (node: HTMLInputElement | undefined) => {
    const current = untrack(input);
    if (node && current && current !== node)
      throw new TypeError("FileDrop.Root supports exactly one FileDrop.Input.");
    setInputRef(node);
  };

  const state: RootContext = {
    value,
    setValue,
    multiple,
    accept: () => props.accept,
    name: () => props.name,
    form: () => props.form,
    required: () => !!props.required,
    disabled,
    tokens,
    input,
    setInput,
    formValidityOwner,
    setFormValidityOwner,
    revision: readRevision,
    processCandidate,
    processDrop,
    setDragging,
    isInternalEvent: (event) => internalEvents.has(event),
  };

  if (!isServer) {
    createEffect(
      () =>
        [
          input(),
          value(),
          tokens(),
          multiple(),
          disabled(),
          formValidityOwner(),
        ] as const,
      ([node, accepted, parsedTokens, countMode, currentlyDisabled, owner]) => {
        if (currentlyDisabled) {
          dragDepth = 0;
          setDragging(false);
        }
        const policyChanged =
          lastTokens !== undefined &&
          (lastTokens !== parsedTokens || lastMultiple !== countMode);
        lastTokens = parsedTokens;
        lastMultiple = countMode;
        if (!node) return;
        const currentBaseline = failureMessage(
          rejectCandidate(accepted, "picker", countMode, parsedTokens),
        );
        if (pendingCandidate) {
          if (policyChanged) {
            pendingPolicyChanged = true;
            advanceRevision();
          }
          if (!owner) node.setCustomValidity(currentBaseline);
          return;
        }
        const newNode = node !== inputNode;
        const changed =
          lastAccepted !== undefined && !sameFiles(lastAccepted, accepted);
        if (changed || policyChanged) advanceRevision();
        inputNode = node;
        reconcile(node, accepted, owner, currentBaseline);
        const dispatchesChange = changed && !newNode;
        if (dispatchesChange) dispatchInternal(node, "change", false);
        if (owner && (changed || policyChanged) && !dispatchesChange)
          owner.revalidate();
      },
      { transparent: true },
    );

    createEffect(
      input,
      (node) => {
        if (!node) return;
        const document = node.ownerDocument;
        let alive = true;
        const timers = new Set<number>();
        const reset = (event: Event) => {
          if (event.target !== node.form) return;
          const timer = document.defaultView!.setTimeout(() => {
            timers.delete(timer);
            if (!alive || event.defaultPrevented) return;
            pendingCandidate = true;
            pendingSource = "reset";
            pendingFiles = initialValue;
            pendingDropAccepted = false;
            advanceRevision();
            if (!sameFiles(value(), initialValue)) setValue(initialValue);
            queueSettlement();
          }, 0);
          timers.add(timer);
        };
        document.addEventListener("reset", reset);
        return () => {
          alive = false;
          document.removeEventListener("reset", reset);
          for (const timer of timers) document.defaultView!.clearTimeout(timer);
        };
      },
      { transparent: true },
    );
    onCleanup(() => {
      active = false;
      dragDepth = 0;
      pendingDropAccepted = false;
      pendingPolicyChanged = false;
      setDragging(false);
      setInputRef(undefined);
    });
  }

  const fileDrag = (event: DragEvent): boolean => {
    const transfer = event.dataTransfer;
    if (!transfer) return false;
    const types = transfer.types;
    for (let index = 0; index < types.length; index++)
      if (types[index] === "Files") return true;
    const items = transfer.items;
    for (let index = 0; index < items.length; index++)
      if (items[index].kind === "file") return true;
    return false;
  };
  const dragEnter = (event: DragEvent) => {
    callEventHandler(props.onDragEnter, event);
    if (!event.defaultPrevented && !disabled() && fileDrag(event)) {
      dragDepth++;
      setDragging(true);
    }
  };
  const dragLeave = (event: DragEvent) => {
    callEventHandler(props.onDragLeave, event);
    if (!fileDrag(event) || dragDepth === 0) return;
    dragDepth--;
    if (dragDepth === 0) setDragging(false);
  };
  const dragOver = (event: DragEvent) => {
    callEventHandler(props.onDragOver, event);
    if (fileDrag(event)) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    }
  };
  const finishDrag = (event: DragEvent) => {
    callEventHandler(props.onDragEnd, event);
    clearDrag();
  };

  const rootProps = merge(
    omit(
      props,
      "__scopeFileDrop",
      "value",
      "defaultValue",
      "onValueChange",
      "multiple",
      "accept",
      "name",
      "form",
      "required",
      "disabled",
      "onReject",
    ),
    {
      get ["data-dragging"]() {
        return dragging() ? "true" : "false";
      },
      get ["data-disabled"]() {
        return disabled() ? "" : undefined;
      },
      onDragEnter: dragEnter,
      onDragLeave: dragLeave,
      onDragOver: dragOver,
      onDragEnd: finishDrag,
      onDrop: processDrop,
    },
  ) as PrimitiveProps<"div">;

  return (
    <Provider
      scope={props.__scopeFileDrop}
      value={state}
    >
      <Primitive
        as="div"
        {...rootProps}
      />
    </Provider>
  );
}

export function FileDropInput(props: FileDropInputProps): Element {
  const context = useFileDrop(
    "FileDropInput",
    untrack(() => props.__scopeFileDrop),
  );
  const runtimeProps = props as FileDropInputProps & Record<string, unknown>;
  const owner = useFormValidityOwner();
  let alive = true;
  const setInput = (node: HTMLInputElement | undefined) => {
    if (node) {
      if (!isServer && owner) context.setFormValidityOwner(owner);
      context.setInput(node);
    } else if (alive) context.setInput(undefined);
  };
  const validateConfig = (name: unknown, form: unknown) => {
    const rootName = context.name();
    const rootForm = context.form();
    if (owner) {
      if (owner.name() !== rootName)
        throw new TypeError(
          "FileDrop.Input name must match its Form.Control name.",
        );
      const ownerForm = owner.form();
      if (ownerForm !== undefined && ownerForm !== rootForm) {
        throw new TypeError(
          "FileDrop.Input form must match its Form.Control form.",
        );
      }
    }
    if (name !== undefined && name !== rootName)
      throw new TypeError("FileDrop.Input name must match FileDrop.Root name.");
    if (form !== undefined && form !== rootForm)
      throw new TypeError("FileDrop.Input form must match FileDrop.Root form.");
  };
  untrack(() => validateConfig(runtimeProps.name, runtimeProps.form));

  if (!isServer) {
    createEffect(
      () => {
        validateConfig(runtimeProps.name, runtimeProps.form);
        return true;
      },
      {
        effect: () => {},
        error: (error) => {
          throw error;
        },
      },
      { transparent: true },
    );
    if (owner)
      createEffect(
        context.input,
        (node) => {
          if (!node) return;
          return owner.register({
            baseline: () =>
              failureMessage(
                rejectCandidate(
                  context.value(),
                  "picker",
                  context.multiple(),
                  context.tokens(),
                ),
              ),
            revision: context.revision,
          });
        },
        { transparent: true },
      );
    onCleanup(() => {
      alive = false;
      context.setInput(undefined);
      if (untrack(context.formValidityOwner) === owner)
        context.setFormValidityOwner(undefined);
    });
  }

  const canonical = {
    type: "file" as const,
    get name() {
      return context.name();
    },
    get form() {
      return context.form();
    },
    get multiple() {
      return context.multiple();
    },
    get accept() {
      return context.accept();
    },
    get required() {
      return context.required();
    },
    get disabled() {
      return context.disabled();
    },
  };
  const targetRender: SlotRender = (target) =>
    untrack(() => props.children as SlotRender)((component, childProps) => {
      untrack(() => validateConfig(childProps.name, childProps.form));
      if (!isServer)
        createEffect(
          () => {
            validateConfig(childProps.name, childProps.form);
            return true;
          },
          {
            effect: () => {},
            error: (error) => {
              throw error;
            },
          },
          { transparent: true },
        );
      const forwarded = merge(
        omit(
          childProps,
          "value",
          "defaultValue",
          "files",
          "readOnly",
          "readonly",
          "type",
          "name",
          "form",
          "multiple",
          "accept",
          "required",
          "disabled",
        ),
        {
          get id() {
            return props.id ?? childProps.id;
          },
        },
        canonical,
      ) as ComponentProps<typeof component>;
      return target(component, forwarded);
    });
  const hostProps = merge(
    omit(
      runtimeProps,
      "__scopeFileDrop",
      "value",
      "defaultValue",
      "files",
      "readOnly",
      "readonly",
      "type",
      "name",
      "form",
      "multiple",
      "accept",
      "required",
      "disabled",
    ),
    {
      get ref() {
        return composeRefs(props.ref, setInput);
      },
      get children() {
        return props.asChild ? targetRender : undefined;
      },
      onInput: (event: InputEvent) => callEventHandler(props.onInput, event),
      onChange: (event: Event) => {
        callEventHandler(props.onChange, event);
        if (!context.isInternalEvent(event))
          context.processCandidate(
            snapshot((event.currentTarget as HTMLInputElement).files),
            "picker",
          );
      },
      onDrop: (event: DragEvent) => {
        callEventHandler(props.onDrop, event);
        context.processDrop(event, true);
      },
    },
    canonical,
  ) as PrimitiveProps<"input">;

  return (
    <Primitive
      as="input"
      {...hostProps}
    />
  );
}

export function FileDropTrigger(props: FileDropTriggerProps): Element {
  const context = useFileDrop(
    "FileDropTrigger",
    untrack(() => props.__scopeFileDrop),
  );
  const forwarded = merge(omit(props, "__scopeFileDrop"), {
    type: "button" as const,
    get disabled() {
      return !!context.disabled() || !!props.disabled;
    },
    onClick(event: MouseEvent) {
      callEventHandler(props.onClick, event);
      if (!event.defaultPrevented && !context.disabled() && !props.disabled)
        context.input()?.click();
    },
  }) as PrimitiveProps<"button">;
  return <Primitive {...forwarded} />;
}

export { FileDrop as Root, FileDropInput as Input, FileDropTrigger as Trigger };
