import {
  createContext,
  untrack,
  useContext,
  type Accessor,
  type Element,
} from "solid-js";

export interface FormValiditySource {
  baseline: Accessor<string>;
  revision: Accessor<number>;
}

export interface FormValidityOwner {
  name: Accessor<string | undefined>;
  form: Accessor<string | undefined>;
  register(source: FormValiditySource): () => void;
  revalidate(): void;
}

export interface FormFieldMetadata {
  readonly name: Accessor<string>;
  readonly serverInvalid: Accessor<boolean>;
}

const FormValidityContext = createContext<FormValidityOwner | null>(null);
const FormFieldMetadataContext = createContext<FormFieldMetadata | null>(null);

export function FormValidityProvider(props: {
  value: FormValidityOwner;
  children?: Element;
}): Element {
  const owner = untrack(() => props.value);
  return (
    <FormValidityContext value={owner}>{props.children}</FormValidityContext>
  );
}

export function useFormValidityOwner(): FormValidityOwner | undefined {
  return useContext(FormValidityContext) ?? undefined;
}

export function FormFieldMetadataProvider(props: {
  value: FormFieldMetadata | null;
  children?: Element;
}): Element {
  const metadata = untrack(() => props.value);
  return (
    <FormFieldMetadataContext value={metadata}>
      {props.children}
    </FormFieldMetadataContext>
  );
}

export function useFormFieldMetadata(): FormFieldMetadata | undefined {
  return useContext(FormFieldMetadataContext) ?? undefined;
}
