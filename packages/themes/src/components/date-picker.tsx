import { createContext, merge, omit, useContext, type Element } from 'solid-js';
import * as Native from '@wsagency/radix2solid-primitives/date-picker';
import { createDatePickerScope } from '@wsagency/radix2solid-primitives/date-picker';
import type { DatePickerProps, DatePickerTriggerProps, DatePickerValueProps, DatePickerPortalProps, DatePickerContentProps, DatePickerTitleProps, DatePickerDescriptionProps, DatePickerCloseProps, DatePickerClearProps, DatePickerCalendarProps, DatePickerFormControlProps } from '@wsagency/radix2solid-primitives/date-picker';
import { extractProps } from '../helpers/extract-props.js';
import type { GetPropDefTypes, PropDef } from '../props/prop-def.js';
import { Theme, useThemeContext } from './theme.js';
import { datePickerRootPropDefs } from './date-picker.props.js';

type Settings = GetPropDefTypes<typeof datePickerRootPropDefs>;
const DatePickerSettings = createContext<Settings>({});
type RootProps = DatePickerProps & Settings;
type PartVariantRadius = Pick<Settings, 'variant' | 'radius'>;
type ContentSettings = Pick<Settings, 'variant' | 'color' | 'radius'>;
type TriggerProps = DatePickerTriggerProps & PartVariantRadius;
type ValueProps = DatePickerValueProps;
type PortalProps = DatePickerPortalProps;
type ContentProps = DatePickerContentProps & ContentSettings;
type TitleProps = DatePickerTitleProps;
type DescriptionProps = DatePickerDescriptionProps;
type CloseProps = DatePickerCloseProps & PartVariantRadius;
type ClearProps = DatePickerClearProps & PartVariantRadius;
type CalendarProps = DatePickerCalendarProps & Settings;
type FormControlProps = DatePickerFormControlProps;

const partVariantPropDef = { ...datePickerRootPropDefs.variant, default: undefined };
const partSizePropDef = { ...datePickerRootPropDefs.size, default: undefined };
const triggerPropDefs = { variant: partVariantPropDef, radius: datePickerRootPropDefs.radius };
const contentPropDefs = {
  variant: partVariantPropDef, color: datePickerRootPropDefs.color, radius: datePickerRootPropDefs.radius
};
const calendarPartPropDefs = {
  size: partSizePropDef, variant: partVariantPropDef, color: datePickerRootPropDefs.color, radius: datePickerRootPropDefs.radius
};

function rootSettings(props: Settings): Settings {
  return {
    get size() { return props.size; },
    get variant() { return props.variant; },
    get color() { return props.color; },
    get radius() { return props.radius; }
  };
}
function styledProps<P extends object>(
  props: P,
  className: string,
  propDefs: Record<string, PropDef> = {},
  accent?: () => string | undefined
) {
  const settings = useContext(DatePickerSettings);
  const inherited = {
    get size() { return 'size' in propDefs ? settings.size : undefined; },
    get variant() { return 'variant' in propDefs ? settings.variant : undefined; },
    get color() { return 'color' in propDefs ? settings.color : undefined; },
    get radius() { return 'radius' in propDefs ? settings.radius : undefined; }
  };
  const parsed = extractProps(merge(inherited, props) as P & Settings, propDefs);
  const unsupported = (['size', 'variant', 'color', 'radius'] as const).filter(key => !(key in propDefs));
  const forwarded = omit(parsed as Record<string, unknown>, 'color', 'radius', ...unsupported);
  return merge(forwarded, {
    get ['data-accent-color']() { return 'color' in propDefs ? parsed.color ?? accent?.() : undefined; },
    get ['data-radius']() { return 'radius' in propDefs ? parsed.radius : undefined; },
    get class() { return [className, parsed.class]; }
  });
}
function DatePickerRoot(props: RootProps): Element {
  const parsed = extractProps(props, datePickerRootPropDefs);
  const context = rootSettings(props);
  const forwarded = merge(omit(parsed as Record<string, unknown>, 'color', 'radius'), {
    get ['data-accent-color']() { return parsed.color; },
    get ['data-radius']() { return parsed.radius; },
    get class() { return ['rt-DatePickerRoot', parsed.class]; }
  });
  return <DatePickerSettings value={context}><Native.Root {...forwarded as unknown as DatePickerProps} /></DatePickerSettings>;
}
function DatePickerTrigger(props: TriggerProps): Element { return <Native.Trigger {...styledProps(props, 'rt-reset rt-DatePickerTrigger', triggerPropDefs) as unknown as DatePickerTriggerProps} />; }
function DatePickerValue(props: ValueProps): Element { return <Native.Value {...styledProps(props, 'rt-DatePickerValue') as unknown as DatePickerValueProps} />; }
function DatePickerPortal(props: PortalProps): Element { return <Native.Portal {...props} />; }
function DatePickerContent(props: ContentProps): Element {
  const theme = useThemeContext();
  const forwarded = merge({ align: 'start' as const, sideOffset: 8, collisionPadding: 10 },
    styledProps(props, 'rt-PopperContent rt-PopoverContent rt-DatePickerContent', contentPropDefs, () => theme.accentColor)) as unknown as DatePickerContentProps;
  return <Theme asChild>{target => target(Native.Content, forwarded)}</Theme>;
}
function DatePickerTitle(props: TitleProps): Element { return <Native.Title {...styledProps(props, 'rt-DatePickerTitle') as unknown as DatePickerTitleProps} />; }
function DatePickerDescription(props: DescriptionProps): Element { return <Native.Description {...styledProps(props, 'rt-DatePickerDescription') as unknown as DatePickerDescriptionProps} />; }
function DatePickerClose(props: CloseProps): Element { return <Native.Close {...styledProps(props, 'rt-reset rt-DatePickerClose', triggerPropDefs) as unknown as DatePickerCloseProps} />; }
function DatePickerClear(props: ClearProps): Element { return <Native.Clear {...styledProps(props, 'rt-reset rt-DatePickerClear', triggerPropDefs) as unknown as DatePickerClearProps} />; }
function DatePickerCalendar(props: CalendarProps): Element { return <Native.Calendar {...styledProps(props, 'rt-DatePickerCalendar', calendarPartPropDefs) as unknown as DatePickerCalendarProps} />; }
function DatePickerFormControl(props: FormControlProps): Element { return <Native.FormControl {...styledProps(props, 'rt-DatePickerFormControl') as unknown as DatePickerFormControlProps} />; }

export {
  createDatePickerScope,
  DatePickerRoot as Root,
  DatePickerTrigger as Trigger,
  DatePickerValue as Value,
  DatePickerPortal as Portal,
  DatePickerContent as Content,
  DatePickerTitle as Title,
  DatePickerDescription as Description,
  DatePickerClose as Close,
  DatePickerClear as Clear,
  DatePickerCalendar as Calendar,
  DatePickerFormControl as FormControl
};
export type {
  RootProps,
  TriggerProps,
  ValueProps,
  PortalProps,
  ContentProps,
  TitleProps,
  DescriptionProps,
  CloseProps,
  ClearProps,
  CalendarProps,
  FormControlProps
};
