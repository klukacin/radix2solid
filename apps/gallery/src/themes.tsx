import { createSignal, type Element } from 'solid-js';
import {
  Theme, useThemeContext, AccessibleIcon, AspectRatio, Avatar, Badge, Blockquote, Box, Button, Callout, Card,
  Code, Container, DataList, Em, Flex, Grid, Heading, IconButton, Inset, Kbd, Link, Progress, Quote, Reset,
  ScrollArea, Section, Separator, Skeleton, Spinner, Strong, Table, Text, VisuallyHidden,
  ChevronDownIcon, ThickCheckIcon, ThickChevronRightIcon, ThickDividerHorizontalIcon
} from '@wsagency/radix2solid-themes';
import '@wsagency/radix2solid-themes/styles.css';

const frozenSize = Object.freeze({ md: '3' as const });
const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
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
        <Reset>{target => target('button', { id: 'theme-reset-button', children: 'Native reset target' })}</Reset>
      </Section></Container>
    </Theme>
  </section>;
}
