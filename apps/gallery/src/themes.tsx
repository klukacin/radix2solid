import { createSignal, Show, type Element } from 'solid-js';
import {
  Theme, useThemeContext, AccessibleIcon, AspectRatio, Avatar, Badge, Blockquote, Box, Button, Callout, Calendar, Card,
  Code, Container, DataList, DatePicker, Em, FileDrop, Flex, Grid, Heading, IconButton, Inset, Kbd, Link, Progress, Quote, Reset,
  ScrollArea, Section, Separator, Skeleton, Spinner, Strong, Table, Text, VisuallyHidden,
  ChevronDownIcon, ThickCheckIcon, ThickChevronRightIcon, ThickDividerHorizontalIcon
} from '@wsagency/radix2solid-themes';
import '@wsagency/radix2solid-themes/styles.css';
import { Form, Slot } from '@wsagency/radix2solid-primitives';

const frozenSize = Object.freeze({ md: '3' as const });
const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const useCalendarScope = Calendar.createCalendarScope();
const useDatePickerScope = DatePicker.createDatePickerScope();
const useFileDropScope = FileDrop.createFileDropScope();

function ThemeCalendarGrid(props: { scope?: Calendar.GridProps['__scopeCalendar']; focusDate?: string; focusId?: string }): Element {
  const scope = props.scope;
  return <Calendar.Grid __scopeCalendar={scope}>{state => <>
    <Calendar.Row __scopeCalendar={scope}>
      {state.weekdays.map(day => <Calendar.HeaderCell __scopeCalendar={scope} weekday={day.index} />)}
    </Calendar.Row>
    {state.weeks.map(week => <Calendar.Row __scopeCalendar={scope}>
      {week.map(day => day === null
        ? <div role="gridcell" aria-disabled="true" />
        : <Calendar.Cell __scopeCalendar={scope} date={day.date}
          data-testid={day.date === '2026-10-19' ? 'calendar-selected-day'
            : day.date === '2026-10-18' ? 'calendar-today-day' : undefined}>
          <Calendar.Day __scopeCalendar={scope} date={day.date}
            data-testid={day.date === props.focusDate ? props.focusId ?? 'calendar-focus-day'
              : day.date === '2026-10-20' ? 'calendar-unavailable-day' : undefined}>
            {Number(day.date.slice(-2))}
          </Calendar.Day>
        </Calendar.Cell>)}
    </Calendar.Row>)}
  </>}</Calendar.Grid>;
}
function ThemeSettings(): Element {
  const theme = useThemeContext();
  return <Flex gap="2" wrap="wrap" mb="3">
    <Button onClick={() => theme.onAppearanceChange(theme.appearance === 'dark' ? 'light' : 'dark')}>Theme appearance</Button>
    <Button onClick={() => theme.onAccentColorChange(theme.accentColor === 'indigo' ? 'tomato' : 'indigo')}>Theme accent</Button>
    <Button onClick={() => theme.onRadiusChange(theme.radius === 'medium' ? 'full' : 'medium')}>Theme radius</Button>
    <Button onClick={() => theme.onScalingChange(theme.scaling === '100%' ? '110%' : '100%')}>Theme scaling</Button>
    <output id="theme-context-settings">{`${theme.appearance}/${theme.accentColor}/${theme.resolvedGrayColor}/${theme.radius}/${theme.scaling}`}</output>
  </Flex>;
}
export function Themes(): Element {
  const [changed, setChanged] = createSignal(false), [loading, setLoading] = createSignal(false);
  const [skeleton, setSkeleton] = createSignal(true), [requests, setRequests] = createSignal(0);
  const [avatarError, setAvatarError] = createSignal(false), [value, setValue] = createSignal<number | null>(25);
  const [calendarAccent, setCalendarAccent] = createSignal<'jade' | 'tomato'>('jade');
  const [calendarAppearance, setCalendarAppearance] = createSignal<'light' | 'dark'>('light');
  const [calendarScale, setCalendarScale] = createSignal<'100%' | '110%'>('100%');
  const [calendarRadius, setCalendarRadius] = createSignal<'none' | 'large'>('none');
  const calendarScope = useCalendarScope();
  const [datePickerAccent, setDatePickerAccent] = createSignal<'jade' | 'tomato'>('jade');
  const [datePickerAppearance, setDatePickerAppearance] = createSignal<'light' | 'dark'>('light');
  const [datePickerScale] = createSignal<'110%'>('110%');
  const datePickerScope = useDatePickerScope();
  const rootOnlyDatePickerScope = useDatePickerScope();
  const [fileDropAccent, setFileDropAccent] = createSignal<'jade' | 'tomato'>('jade');
  const [fileDropAppearance, setFileDropAppearance] = createSignal<'light' | 'dark'>('light');
  const [fileDropScale, setFileDropScale] = createSignal<'100%' | '110%'>('100%');
  const fileDropScope = useFileDropScope();
  const disabledFileDropScope = useFileDropScope();
  const [fileDropFiles, setFileDropFiles] = createSignal<readonly File[]>([]);
  const [fileDropChangeCount, setFileDropChangeCount] = createSignal(0);
  const [fileDropRejectionCount, setFileDropRejectionCount] = createSignal(0);
  let viewport!: HTMLDivElement;
  return <section aria-label="Native presentational Themes">
    <h2>Native Themes</h2>
    <button onClick={() => setChanged(previous => !previous)}>Change responsive theme props</button>
    <button onClick={() => setLoading(previous => !previous)}>Toggle themed loading</button>
    <button onClick={() => setSkeleton(previous => !previous)}>Toggle themed skeleton</button>
    <button onClick={() => setAvatarError(previous => !previous)}>Toggle themed avatar failure</button>
    <button onClick={() => setValue(previous => previous === null ? 75 : null)}>Toggle themed progress</button>
    <Theme id="themes-root" appearance="light" accentColor="indigo" style={{ padding: '24px' }}>
      <ThemeSettings />
      <Container size="3" width="100%"><Section size="1">
        <Heading size={{ initial: '5', md: '7' }} as="h3">Solid layout and typography</Heading>
        <Text as="p" size="3">A <Strong>native</Strong> <Em>reactive</Em> theme with <Code>frozen props</Code>, <Kbd>Tab</Kbd> and <Quote>one host</Quote>.</Text>
        <Link href="#theme-table" underline="always">Read the semantic table</Link>
        <Blockquote size="2">CSS tokens and responsive breakpoints stay unchanged.</Blockquote>
        <Text as="label" for="theme-label-input">Native label target</Text><input id="theme-label-input" />
        <Grid columns={{ initial: '1', sm: '2' }} gap="3" mt="3">
          <Card><Flex gap="2" align="center"><Avatar id="theme-avatar-image" src={avatarError() ? '/missing-themed-avatar.png' : pixel}
            alt="Themed avatar" fallback="TS" /><Badge color="green">Native</Badge><Text>Image attributes and ref target the image.</Text></Flex>
            <Inset side="bottom" clip="padding-box" mt="3"><AspectRatio ratio={3} style={{ background: 'var(--accent-a3)' }}>
              <Flex align="center" justify="center" height="100%">3:1 native aspect ratio</Flex>
            </AspectRatio></Inset>
          </Card>
          <Callout.Root size={{ initial: '1', md: '3' }}><Callout.Icon><ThickCheckIcon /></Callout.Icon>
            <Callout.Text>Callout text inherits responsive size from its context.</Callout.Text>
          </Callout.Root>
        </Grid>
        <Flex gap="3" wrap="wrap" mt="3" align="center">
          <Button id="theme-responsive-button" size={changed() ? '4' : frozenSize} color={changed() ? 'tomato' : 'blue'}
            m={changed() ? { initial: '-3', xs: '17px' } : '-2'} style={{ '--m-xs': '33px' }}>Responsive button</Button>
          <Button id="theme-loading-button" loading={loading()} onClick={() => setRequests(previous => previous + 1)}>Save theme</Button>
          <Button id="theme-loading-override" loading={loading()} disabled={false} onClick={() => setRequests(previous => previous + 1)}>Loading override</Button>
          <IconButton id="theme-icon-button" aria-label="Confirm theme" loading={loading()}><ThickCheckIcon /></IconButton>
          <Spinner id="theme-spinner" loading={loading()}><Text>Spinner content</Text></Spinner>
          <AccessibleIcon label="More theme details">{target => target(ChevronDownIcon, {})}</AccessibleIcon>
          <ThickChevronRightIcon /><ThickDividerHorizontalIcon />
          <VisuallyHidden>Visually hidden themed description</VisuallyHidden>
        </Flex>
        <output id="theme-loading-requests">{requests()}</output>
        <Box id="theme-responsive-box" width={{ initial: '120px', xs: '160px', sm: '200px', md: '240px', lg: '280px', xl: '320px' }}
          height="32px" style={{ background: 'var(--accent-9)' }} />
        <Box asChild width="240px" mt="2">{target => target('article', { id: 'theme-owned-target', children: 'A single native article target' })}</Box>
        <Skeleton asChild loading={skeleton()}>{target => target('button', { id: 'theme-skeleton-button', children: 'Skeleton action',
          onClick: () => setRequests(previous => previous + 1) })}</Skeleton>
        <Skeleton loading={skeleton()}>Inline skeleton text</Skeleton>
        <Separator size="4" my="3" />
        <Progress id="theme-progress" aria-label="Theme upload" value={value()} max={100} />
        <DataList.Root size="2" mt="3"><DataList.Item><DataList.Label color="gray" minWidth="96px">Runtime</DataList.Label>
          <DataList.Value>Solid 2</DataList.Value></DataList.Item><DataList.Item><DataList.Label>Framework</DataList.Label>
          <DataList.Value><Code>No React runtime</Code></DataList.Value></DataList.Item></DataList.Root>
        <Table.Root id="theme-table" layout={{ initial: 'auto', md: 'fixed' }} mt="3"><Table.Header><Table.Row>
          <Table.ColumnHeaderCell>Component</Table.ColumnHeaderCell><Table.ColumnHeaderCell>Host</Table.ColumnHeaderCell>
        </Table.Row></Table.Header><Table.Body><Table.Row align="center"><Table.RowHeaderCell>Text</Table.RowHeaderCell>
          <Table.Cell justify="end">Native paragraph</Table.Cell></Table.Row></Table.Body></Table.Root>
        <ScrollArea id="theme-scroll-viewport" dir="rtl" type="always" scrollbars="both" size="2" style={{ height: '72px', width: '240px' }}
          ref={node => { viewport = node; }}>
          <Box width="640px" height="160px">A real RTL scroll viewport with both axes.</Box>
        </ScrollArea><button onClick={() => viewport.scrollTo({ left: -150, top: 60 })}>Scroll referenced viewport</button>
        <Theme id="theme-nested" accentColor="grass"><Text>Nested accent inherits the parent's resolved gray.</Text></Theme>
        <Theme id="theme-nested-auto" accentColor="grass" grayColor="auto" appearance="dark"><Text>Explicit auto resolves the nested gray.</Text></Theme>
        <Theme id="theme-calendar-theme" accentColor={calendarAccent()} appearance={calendarAppearance()} scaling={calendarScale()}>
          <Calendar.Root {...calendarScope} id="theme-calendar-selective" dir="rtl" today="2026-10-18"
            defaultViewMonth="2026-10" value="2026-10-19" isDateUnavailable={date => date === '2026-10-20'}
            size={{ initial: '1', md: '3' }} variant="classic" radius={calendarRadius()}>
            <Calendar.Header {...calendarScope}>
              <Calendar.PrevTrigger {...calendarScope}>Previous month</Calendar.PrevTrigger>
              <Calendar.Heading {...calendarScope} />
              <Calendar.NextTrigger {...calendarScope}>Next month</Calendar.NextTrigger>
            </Calendar.Header>
            <Button id="theme-calendar-before" type="button" highContrast>Before calendar</Button>
            <ThemeCalendarGrid scope={calendarScope.__scopeCalendar} focusDate="2026-10-19" />
          </Calendar.Root>
          <button onClick={() => setCalendarAccent(value => value === 'jade' ? 'tomato' : 'jade')}>Toggle calendar custom accent</button>
          <button onClick={() => setCalendarScale(value => value === '100%' ? '110%' : '100%')}>Toggle calendar local scaling</button>
          <button onClick={() => setCalendarRadius(value => value === 'none' ? 'large' : 'none')}>Toggle calendar radius</button>
          <button onClick={() => setCalendarAppearance(value => value === 'light' ? 'dark' : 'light')}>Toggle calendar dark appearance</button>
        </Theme>
        <Theme id="theme-date-picker-theme" accentColor={datePickerAccent()} appearance={datePickerAppearance()} scaling={datePickerScale()}>
          <Form.Root id="theme-date-picker-form">
            <Form.Field name="appointmentDate">
              <Form.Label>Theme appointment date</Form.Label>
              <DatePicker.Root {...datePickerScope} id="theme-date-picker-selective" dir="rtl"
                name="appointmentDate" required today="2026-10-18" defaultViewMonth="2026-10"
                size="3" variant="classic" radius="large">
                <Button id="theme-date-picker-before" type="button" highContrast>Before date picker</Button>
                <DatePicker.Trigger {...datePickerScope} id="theme-date-picker-trigger" aria-label="Theme appointment date">
                  <DatePicker.Value {...datePickerScope} placeholder="Choose a date" />
                </DatePicker.Trigger>
                <Form.Control name="appointmentDate" id="theme-date-picker-input" required asChild>
                  {target => target(DatePicker.FormControl, { __scopeDatePicker: datePickerScope.__scopeDatePicker })}
                </Form.Control>
                <DatePicker.Portal {...datePickerScope}>
                  <DatePicker.Content {...datePickerScope} id="theme-date-picker-content" aria-label="Appointment date">
                    <DatePicker.Calendar {...datePickerScope} id="theme-date-picker-calendar">
                      <Calendar.Header __scopeCalendar={datePickerScope.__scopeDatePicker}>
                        <Calendar.PrevTrigger __scopeCalendar={datePickerScope.__scopeDatePicker}>Previous month</Calendar.PrevTrigger>
                        <Calendar.Heading __scopeCalendar={datePickerScope.__scopeDatePicker} />
                        <Calendar.NextTrigger __scopeCalendar={datePickerScope.__scopeDatePicker}>Next month</Calendar.NextTrigger>
                      </Calendar.Header>
                      <ThemeCalendarGrid scope={datePickerScope.__scopeDatePicker}
                        focusDate="2026-10-18" focusId="date-picker-focus-day" />
                    </DatePicker.Calendar>
                  </DatePicker.Content>
                </DatePicker.Portal>
              </DatePicker.Root>
              <Form.ValidityState>{validity =>
                <output id="theme-date-picker-form-validity">{String(!!validity?.valueMissing)}</output>}
              </Form.ValidityState>
            </Form.Field>
            <DatePicker.Root {...rootOnlyDatePickerScope} name="rootOnlyDate" today="2026-10-18"
              defaultViewMonth="2026-10">
              <DatePicker.Trigger {...rootOnlyDatePickerScope} aria-label="Root-only date">
                <DatePicker.Value {...rootOnlyDatePickerScope} />
              </DatePicker.Trigger>
            </DatePicker.Root>
          </Form.Root>
          <button onClick={() => setDatePickerAccent(value => value === 'jade' ? 'tomato' : 'jade')}>Toggle date picker custom accent</button>
          <button onClick={() => setDatePickerAppearance(value => value === 'light' ? 'dark' : 'light')}>Toggle date picker dark appearance</button>
        </Theme>
        <Theme id="theme-file-drop-theme" accentColor={fileDropAccent()} appearance={fileDropAppearance()} scaling={fileDropScale()}>
          <form id="theme-file-drop-form">
            <button type="button" id="theme-file-drop-before">Before file drop</button>
            <FileDrop.Root {...fileDropScope} id="theme-file-drop-selective" dir="rtl" name="themeFiles"
              value={fileDropFiles()} accept=".txt" required size="3" variant="outline" radius="large"
              onValueChange={files => { setFileDropFiles(files); setFileDropChangeCount(count => count + 1); }}
              onReject={() => setFileDropRejectionCount(count => count + 1)} asChild>
              {(target: Slot.SlotTarget) => target('section', { children: <>
                <label for="theme-file-drop-input">Theme file drop</label>
                <FileDrop.Input {...fileDropScope} id="theme-file-drop-input"
                  aria-describedby={`theme-file-drop-description${fileDropFiles().length ? '' : ' theme-file-drop-error'}`} />
                <p id="theme-file-drop-description">Allowed types: .txt. {fileDropFiles().length
                  ? `Selected: ${fileDropFiles()[0].name}.` : 'A file is required.'}</p>
                <Show when={!fileDropFiles().length}>
                  <span id="theme-file-drop-error" role="alert">Choose a text file.</span>
                </Show>
                <FileDrop.Trigger {...fileDropScope} id="theme-file-drop-browse">Browse files</FileDrop.Trigger>
                <span id="theme-file-drop-filename">{fileDropFiles()[0]?.name ?? 'No file selected'}</span>
                <span data-testid="file-drop-nested-icon">Icon</span>
                <span data-testid="file-drop-nested-text">Drop here</span>
                <output id="theme-file-drop-change-count">{fileDropChangeCount()}</output>
                <output id="theme-file-drop-rejection-count">{fileDropRejectionCount()}</output>
              </> })}
            </FileDrop.Root>
          </form>
          <FileDrop.Root {...disabledFileDropScope} id="theme-file-drop-disabled" disabled>
            <label for="theme-file-drop-disabled-input">Disabled file drop</label>
            <FileDrop.Input {...disabledFileDropScope} id="theme-file-drop-disabled-input" />
            <FileDrop.Trigger {...disabledFileDropScope} id="theme-file-drop-disabled-browse">Browse disabled files</FileDrop.Trigger>
          </FileDrop.Root>
          <button onClick={() => setFileDropAccent(value => value === 'jade' ? 'tomato' : 'jade')}>Toggle file drop custom accent</button>
          <button onClick={() => setFileDropScale(value => value === '100%' ? '110%' : '100%')}>Toggle file drop local scaling</button>
          <button onClick={() => setFileDropAppearance(value => value === 'light' ? 'dark' : 'light')}>Toggle file drop dark appearance</button>
        </Theme>
        <Reset>{target => target('button', { id: 'theme-reset-button', children: 'Native reset target' })}</Reset>
      </Section></Container>
    </Theme>
  </section>;
}
