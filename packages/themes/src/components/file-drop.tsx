import { createContext, merge, omit, useContext, type Element } from 'solid-js';
import * as Native from '@wsagency/radix2solid-primitives/file-drop';
import { createFileDropScope } from '@wsagency/radix2solid-primitives/file-drop';
import type { FileDropProps, FileDropInputProps, FileDropTriggerProps, FileDropRejection } from '@wsagency/radix2solid-primitives/file-drop';
import { extractProps } from '../helpers/extract-props.js';
import type { GetPropDefTypes } from '../props/prop-def.js';
import { fileDropRootPropDefs } from './file-drop.props.js';

type Settings = GetPropDefTypes<typeof fileDropRootPropDefs>;
const FileDropSettings = createContext<Settings>({});
type RootProps = FileDropProps & Settings;
type InputProps = FileDropInputProps & Settings;
type TriggerProps = FileDropTriggerProps & Settings;

function rootSettings(props: Settings): Settings {
  return {
    get size() { return props.size ?? fileDropRootPropDefs.size.default; },
    get variant() { return props.variant ?? fileDropRootPropDefs.variant.default; },
    get color() { return props.color ?? fileDropRootPropDefs.color.default; },
    get radius() { return props.radius ?? fileDropRootPropDefs.radius.default; }
  };
}
function styledProps<P extends object>(props: P, className: string) {
  const parsed = extractProps(merge(useContext(FileDropSettings), props) as P & Settings, fileDropRootPropDefs);
  return merge(omit(parsed as Record<string, unknown>, 'color', 'radius'), {
    get ['data-accent-color']() { return parsed.color; },
    get ['data-radius']() { return parsed.radius; },
    get class() { return [className, parsed.class]; }
  });
}
function FileDropRoot(props: RootProps): Element {
  const parsed = extractProps(props, fileDropRootPropDefs);
  const context = rootSettings(props);
  const forwarded = merge(omit(parsed as Record<string, unknown>, 'color', 'radius'), {
    get ['data-accent-color']() { return parsed.color; },
    get ['data-radius']() { return parsed.radius; },
    get class() { return ['rt-FileDropRoot', parsed.class]; }
  });
  return <FileDropSettings value={context}><Native.Root {...forwarded as unknown as FileDropProps} /></FileDropSettings>;
}
function FileDropInput(props: InputProps): Element { return <Native.Input {...styledProps(props, 'rt-FileDropInput') as unknown as FileDropInputProps} />; }
function FileDropTrigger(props: TriggerProps): Element { return <Native.Trigger {...styledProps(props, 'rt-reset rt-FileDropTrigger') as unknown as FileDropTriggerProps} />; }

export {
  createFileDropScope,
  FileDropRoot as Root,
  FileDropInput as Input,
  FileDropTrigger as Trigger
};
export type { RootProps, InputProps, TriggerProps, FileDropRejection };
