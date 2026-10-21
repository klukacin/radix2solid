import {
  createContext,
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
  return (
    <FormValidityContext value={props.value}>
      {props.children}
    </FormValidityContext>
  );
}

export function useFormValidityOwner(): FormValidityOwner | undefined {
  return useContext(FormValidityContext) ?? undefined;
}

export function FormFieldMetadataProvider(props: {
  value: FormFieldMetadata | null;
  children?: Element;
}): Element {
  return (
    <FormFieldMetadataContext value={props.value}>
      {props.children}
    </FormFieldMetadataContext>
  );
}

export function useFormFieldMetadata(): FormFieldMetadata | undefined {
  return useContext(FormFieldMetadataContext) ?? undefined;
}
