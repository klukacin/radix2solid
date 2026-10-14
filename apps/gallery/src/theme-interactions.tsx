import { createSignal, type Element } from 'solid-js';
import { Theme, ThemePanel, unstable_ThemePanelContent as ThemePanelContent, CheckboxGroup, CheckboxCards, RadioGroup, RadioCards, SegmentedControl, Radio, TextField, TextArea, Text, Em, Checkbox, Switch, Slider, Tabs, TabNav, Dialog, AlertDialog, Popover, HoverCard, Tooltip, DropdownMenu, ContextMenu, Select, Button } from '@wsagency/radix2solid-themes';
import { Popover as PrimitivePopover } from '@wsagency/radix2solid-primitives';
import '@wsagency/radix2solid-themes/styles.css';
const responsiveMenuSize = Object.freeze({ initial: '1', md: '2' } as const);

export function ThemeInteractions(): Element {
  const [selected, setSelected] = createSignal(['alpha']), [accept, setAccept] = createSignal(false);
  const [requests, setRequests] = createSignal<string[]>([]), [radioRequests, setRadioRequests] = createSignal<string[]>([]);
  const [inputRef, setInputRef] = createSignal('unmounted');
  const [range, setRange] = createSignal([20, 60]);
  const [customPanel, setCustomPanel] = createSignal(false);
  return <section aria-label="Native interactive Themes">
    <h2>Interactive Themes</h2>
    <button onClick={() => setAccept(true)}>Accept themed selection</button>
    <Theme id="interactive-theme" appearance="light" accentColor="indigo">
      <form id="theme-selection-form">
        <CheckboxGroup.Root id="theme-checkbox-group" value={selected()} onValueChange={value => {
          setRequests(previous => [...previous, value.join('+')]); if (accept()) setSelected(value);
        }} name="theme-choice" required dir="rtl" orientation="horizontal">
          <CheckboxGroup.Item value="alpha">Themed alpha</CheckboxGroup.Item>
          <CheckboxGroup.Item value="blocked" disabled>Themed blocked</CheckboxGroup.Item>
          <CheckboxGroup.Item value="beta">Themed beta</CheckboxGroup.Item>
        </CheckboxGroup.Root>
        <output id="theme-checkbox-requests">{requests().join(',')}</output>
        <CheckboxCards.Root name="theme-card" defaultValue={['alpha']}>
          <CheckboxCards.Item value="alpha">Checkbox card alpha</CheckboxCards.Item>
          <CheckboxCards.Item value="beta">Checkbox card beta</CheckboxCards.Item>
        </CheckboxCards.Root>
        <RadioGroup.Root name="theme-radio-group" defaultValue="alpha">
          <RadioGroup.Item value="alpha">Radio group alpha</RadioGroup.Item>
          <RadioGroup.Item value="beta">Radio group beta</RadioGroup.Item>
        </RadioGroup.Root>
        <RadioCards.Root name="theme-radio-card" defaultValue="alpha">
          <RadioCards.Item value="alpha">Radio card alpha</RadioCards.Item>
          <RadioCards.Item value="beta">Radio card beta</RadioCards.Item>
        </RadioCards.Root>
      </form>
      <SegmentedControl.Root id="theme-segmented" defaultValue="alpha">
        <SegmentedControl.Item value="alpha">Segment alpha</SegmentedControl.Item>
        <SegmentedControl.Item value="beta"><Em>Segment beta</Em></SegmentedControl.Item>
      </SegmentedControl.Root>
      <form id="theme-native-radio-form">
        <Text as="label"><Radio name="theme-native-radio" value="alpha" defaultChecked onValueChange={value => setRadioRequests(previous => [...previous, value])} />Native radio alpha</Text>
        <Text as="label"><Radio name="theme-native-radio" value="beta" onValueChange={value => setRadioRequests(previous => [...previous, value])} />Native radio beta</Text>
      </form>
      <output id="theme-native-radio-requests">{radioRequests().join(',')}</output>
      <TextField.Root id="theme-text-input" class="theme-input-custom" style={{ width: '260px' }} defaultValue="native text" aria-label="Themed text field"
        ref={node => setInputRef(node?.tagName === 'INPUT' ? 'input' : 'wrong host')}>
        <TextField.Slot id="theme-input-left">L</TextField.Slot>
        <TextField.Slot id="theme-input-right" side="right">R<button type="button" id="theme-input-action">Field action</button></TextField.Slot>
      </TextField.Root>
      <output id="theme-input-ref">{inputRef()}</output>
      <TextArea aria-label="Themed text area" defaultValue="native textarea" />
      <Text as="label"><Checkbox defaultChecked="indeterminate" />Mixed themed checkbox</Text>
      <Text as="label"><Switch />Themed switch</Text>
      <button onClick={() => setRange([30, 70])}>Change themed range</button>
      <Slider id="theme-range" aria-label="Themed range" value={range()} onValueChange={setRange} highContrast radius="full" style={{ width: '240px' }} />
      <Tabs.Root id="theme-tabs" defaultValue="alpha"><Tabs.List aria-label="Themed panels">
        <Tabs.Trigger value="alpha">Themed tab alpha</Tabs.Trigger><Tabs.Trigger value="beta"><Em>Themed tab beta</Em></Tabs.Trigger>
      </Tabs.List><Tabs.Content value="alpha">Themed panel alpha</Tabs.Content><Tabs.Content value="beta">Themed panel beta</Tabs.Content></Tabs.Root>
      <TabNav.Root aria-label="Themed document navigation"><TabNav.Link href="#theme-tabs" active>Themed document alpha</TabNav.Link>
        <TabNav.Link asChild>{target => target('a', { href: '#theme-range', children: 'Themed document beta' })}</TabNav.Link>
      </TabNav.Root>
    </Theme>
    <ThemeOverlayInteractions />
    <Theme id="panel-root-theme" appearance="light">
      <button id="panel-previous-focus">Previous panel focus</button>
      <input aria-label="Panel shortcut text exclusion" />
      <div contenteditable="true" role="textbox" tabindex="0" aria-label="Panel shortcut editable exclusion" />
      <select aria-label="Panel shortcut combobox exclusion"><option>Combobox</option></select>
      <ThemePanel id="native-theme-panel" defaultOpen={false} />
      <button onClick={() => setCustomPanel(true)}>Mount custom ThemePanel</button>
      {customPanel() && <><ThemePanelContent id="custom-theme-panel-content" gap="7" />
        <ThemePanel id="custom-inert-theme-panel" inert={false} defaultOpen={false} /></>}
    </Theme>
  </section>;
}

function ThemeOverlayInteractions(): Element {
  const [appearance, setAppearance] = createSignal<'light' | 'dark'>('light');
  const [accent, setAccent] = createSignal<'indigo' | 'tomato'>('indigo');
  const [container, setContainer] = createSignal<HTMLElement>();
  const [selection, setSelection] = createSignal('alpha');
  return <section aria-label="Themed overlay interactions">
    <Theme id="overlay-root-theme" appearance={appearance()} accentColor={accent()}>
      <Dialog.Root><Dialog.Trigger>{target => target(Button, { children: 'Open themed modal' })}</Dialog.Trigger>
        <Dialog.Content container={container()} id="themed-dialog" align="start">
          <Dialog.Title>Themed modal title</Dialog.Title><Dialog.Description>Themed modal description</Dialog.Description>
          <button onClick={() => { setAppearance('dark'); setAccent('tomato'); }}>Update open overlay theme</button>
          <Theme accentColor="amber" id="themed-nested-inherited">
            <Popover.Root><Popover.Trigger>{target => target(Button, { children: 'Open inherited themed popover' })}</Popover.Trigger>
              <Popover.Content container={container()} id="themed-inherited-popover" aria-label="Inherited themed popover"><input aria-label="Themed nested input" />
                <Popover.Close>{target => target(Button, { children: 'Close inherited themed popover' })}</Popover.Close>
                <button onClick={() => { setAppearance('dark'); setAccent('tomato'); }}>Update nested open overlay theme</button>
              </Popover.Content>
            </Popover.Root>
          </Theme>
          <Theme accentColor="amber" grayColor="auto" appearance="light">
            <Popover.Root><Popover.Trigger>{target => target(Button, { children: 'Open explicit auto themed popover' })}</Popover.Trigger>
              <Popover.Content container={container()} id="themed-auto-popover" aria-label="Fallback popup name" aria-labelledby="themed-auto-title" aria-describedby="themed-auto-description">
                <PrimitivePopover.Title id="themed-auto-title">Explicit auto themed popover</PrimitivePopover.Title>
                <PrimitivePopover.Description id="themed-auto-description">Explicit popup description.</PrimitivePopover.Description>
                Explicit light auto gray
              </Popover.Content>
            </Popover.Root>
          </Theme>
          <Dialog.Close>{target => target(Button, { children: 'Close themed modal' })}</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
      <AlertDialog.Root><AlertDialog.Trigger>{target => target(Button, { children: 'Open themed alert' })}</AlertDialog.Trigger>
        <AlertDialog.Content container={container()}><AlertDialog.Title>Themed alert title</AlertDialog.Title><AlertDialog.Description>Themed alert description</AlertDialog.Description>
          <AlertDialog.Cancel>{target => target(Button, { children: 'Cancel themed alert' })}</AlertDialog.Cancel>
          <AlertDialog.Action>{target => target(Button, { children: 'Confirm themed alert' })}</AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Root>
      <HoverCard.Root><HoverCard.Trigger>{target => target('a', { href: '#overlay-root-theme', children: 'Themed hover target' })}</HoverCard.Trigger>
        <HoverCard.Content container={container()} id="themed-hover-content">Themed hover details</HoverCard.Content>
      </HoverCard.Root>
      <Tooltip content="Themed tooltip details" container={container()}>{target => target(Button, { children: 'Themed tooltip target' })}</Tooltip>
      <DropdownMenu.Root><DropdownMenu.Trigger>{target => target(Button, { children: 'Open themed dropdown' })}</DropdownMenu.Trigger>
        <DropdownMenu.Content container={container()} color="crimson" size={responsiveMenuSize} variant="soft" highContrast id="themed-menu-content">
          <DropdownMenu.Label>Themed menu label</DropdownMenu.Label><DropdownMenu.Group><DropdownMenu.Item shortcut="⌘E">Themed edit</DropdownMenu.Item></DropdownMenu.Group>
          <DropdownMenu.CheckboxItem checked shortcut="⌘K">Themed checked</DropdownMenu.CheckboxItem>
          <DropdownMenu.RadioGroup value="alpha"><DropdownMenu.RadioItem value="alpha">Themed radio alpha</DropdownMenu.RadioItem><DropdownMenu.RadioItem value="beta">Themed radio beta</DropdownMenu.RadioItem></DropdownMenu.RadioGroup>
          <DropdownMenu.Separator /><DropdownMenu.Sub><DropdownMenu.SubTrigger>Themed submenu</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent container={container()} id="themed-submenu-content"><DropdownMenu.Item>Themed nested edit</DropdownMenu.Item></DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <ContextMenu.Root><ContextMenu.Trigger>{target => target('button', { children: 'Themed context target' })}</ContextMenu.Trigger>
        <ContextMenu.Content container={container()} size={responsiveMenuSize} id="themed-context-content"><ContextMenu.Label>Themed context label</ContextMenu.Label><ContextMenu.Item shortcut="⌘E">Themed context edit</ContextMenu.Item>
          <ContextMenu.CheckboxItem checked>Themed context checked</ContextMenu.CheckboxItem>
          <ContextMenu.RadioGroup value="alpha"><ContextMenu.RadioItem value="alpha">Themed context radio</ContextMenu.RadioItem></ContextMenu.RadioGroup>
          <ContextMenu.Sub><ContextMenu.SubTrigger>Themed context submenu</ContextMenu.SubTrigger><ContextMenu.SubContent container={container()}><ContextMenu.Item>Themed context nested edit</ContextMenu.Item></ContextMenu.SubContent></ContextMenu.Sub>
          <ContextMenu.Group><ContextMenu.Separator /></ContextMenu.Group>
        </ContextMenu.Content>
      </ContextMenu.Root>
      <form id="themed-select-form"><Select.Root name="themed-select" value={selection()} onValueChange={setSelection} size="2">
        <Select.Trigger aria-label="Themed select" placeholder="Choose themed value" /><Select.Content container={container()} position="popper" color="crimson">
          <Select.Group><Select.Label>Themed options</Select.Label><Select.Item value="alpha">Themed option alpha</Select.Item><Select.Item value="beta">Themed option beta</Select.Item></Select.Group><Select.Separator />
        </Select.Content>
      </Select.Root></form>
    </Theme>
    <div id="themed-portal-container" ref={setContainer} />
  </section>;
}
