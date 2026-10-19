import { merge, omit, type Element } from 'solid-js';
import * as Native from '@wsagency/radix2solid-primitives/calendar';
import { createCalendarScope } from '@wsagency/radix2solid-primitives/calendar';
import type { CalendarGridState, CalendarProps, CalendarHeaderProps, CalendarHeadingProps, CalendarPrevTriggerProps, CalendarNextTriggerProps, CalendarGridProps, CalendarRowProps, CalendarHeaderCellProps, CalendarCellProps, CalendarDayProps, DateValue, MonthValue } from '@wsagency/radix2solid-primitives/calendar';
import { extractProps } from '../helpers/extract-props.js';
import type { GetPropDefTypes, PropDef } from '../props/prop-def.js';
import { calendarRootPropDefs } from './calendar.props.js';

type Settings = GetPropDefTypes<typeof calendarRootPropDefs>;
type RootProps = CalendarProps & Settings;
type RadiusSettings = Pick<Settings, 'radius'>;
type ColorRadiusSettings = Pick<Settings, 'color' | 'radius'>;
type HeaderProps = CalendarHeaderProps;
type HeadingProps = CalendarHeadingProps;
type PrevTriggerProps = CalendarPrevTriggerProps & RadiusSettings;
type NextTriggerProps = CalendarNextTriggerProps & RadiusSettings;
type GridProps = CalendarGridProps;
type RowProps = CalendarRowProps;
type HeaderCellProps = CalendarHeaderCellProps;
type CellProps = CalendarCellProps & ColorRadiusSettings;
type DayProps = CalendarDayProps & ColorRadiusSettings;

const radiusPropDefs = { radius: calendarRootPropDefs.radius };
const colorRadiusPropDefs = { color: calendarRootPropDefs.color, radius: calendarRootPropDefs.radius };

function getPartProps<P extends object>(props: P, className: string, propDefs: Record<string, PropDef> = {}) {
  const parsed = extractProps(props as P & Settings, propDefs);
  const unsupported = (['size', 'variant', 'color', 'radius'] as const).filter(key => !(key in propDefs));
  const forwarded = omit(parsed as Record<string, unknown>, 'color', 'radius', ...unsupported);
  return merge(forwarded, {
    get ['data-accent-color']() { return 'color' in propDefs ? parsed.color : undefined; },
    get ['data-radius']() { return 'radius' in propDefs ? parsed.radius : undefined; },
    get class() { return [className, parsed.class]; }
  });
}
function CalendarRoot(props: RootProps): Element {
  const parsed = extractProps(props, calendarRootPropDefs);
  const forwarded = merge(omit(parsed as Record<string, unknown>, 'color', 'radius'), {
    get ['data-accent-color']() { return parsed.color; },
    get ['data-radius']() { return parsed.radius; },
    get class() { return ['rt-CalendarRoot', parsed.class]; }
  });
  return <Native.Root {...forwarded as unknown as CalendarProps} />;
}
function CalendarHeader(props: HeaderProps): Element { return <Native.Header {...getPartProps(props, 'rt-CalendarHeader') as unknown as CalendarHeaderProps} />; }
function CalendarHeading(props: HeadingProps): Element { return <Native.Heading {...getPartProps(props, 'rt-CalendarHeading') as unknown as CalendarHeadingProps} />; }
function CalendarPrevTrigger(props: PrevTriggerProps): Element { return <Native.PrevTrigger {...getPartProps(props, 'rt-reset rt-CalendarPrevTrigger', radiusPropDefs) as unknown as CalendarPrevTriggerProps} />; }
function CalendarNextTrigger(props: NextTriggerProps): Element { return <Native.NextTrigger {...getPartProps(props, 'rt-reset rt-CalendarNextTrigger', radiusPropDefs) as unknown as CalendarNextTriggerProps} />; }
function CalendarGrid(props: GridProps): Element { return <Native.Grid {...getPartProps(props, 'rt-CalendarGrid') as unknown as CalendarGridProps} />; }
function CalendarRow(props: RowProps): Element { return <Native.Row {...getPartProps(props, 'rt-CalendarRow') as unknown as CalendarRowProps} />; }
function CalendarHeaderCell(props: HeaderCellProps): Element { return <Native.HeaderCell {...getPartProps(props, 'rt-CalendarHeaderCell') as unknown as CalendarHeaderCellProps} />; }
function CalendarCell(props: CellProps): Element { return <Native.Cell {...getPartProps(props, 'rt-CalendarCell', colorRadiusPropDefs) as unknown as CalendarCellProps} />; }
function CalendarDay(props: DayProps): Element { return <Native.Day {...getPartProps(props, 'rt-reset rt-CalendarDay', colorRadiusPropDefs) as unknown as CalendarDayProps} />; }

export {
  createCalendarScope,
  CalendarRoot as Root,
  CalendarHeader as Header,
  CalendarHeading as Heading,
  CalendarPrevTrigger as PrevTrigger,
  CalendarNextTrigger as NextTrigger,
  CalendarGrid as Grid,
  CalendarRow as Row,
  CalendarHeaderCell as HeaderCell,
  CalendarCell as Cell,
  CalendarDay as Day
};
export type {
  DateValue,
  MonthValue,
  CalendarGridState,
  RootProps,
  HeaderProps,
  HeadingProps,
  PrevTriggerProps,
  NextTriggerProps,
  GridProps,
  RowProps,
  HeaderCellProps,
  CellProps,
  DayProps
};
