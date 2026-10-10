import { createSignal, type Element } from 'solid-js';
import * as Primitives from '@radix-solid/primitives';

const AlertDialog = Primitives.AlertDialog;
const HoverCard = Primitives.HoverCard;
const Dialog = Primitives.Dialog;
const Tooltip = Primitives.Tooltip;
const DropdownMenu = Primitives.DropdownMenu;
const ContextMenu = Primitives.ContextMenu;
const Menubar = Primitives.Menubar;
const NavigationMenu = Primitives.NavigationMenu;

export function Menus(): Element {
  const [open, setOpen] = createSignal(false);
  const [accept, setAccept] = createSignal(false);
  const [latest, setLatest] = createSignal(false);
  const [cancelEscape, setCancelEscape] = createSignal(false);
  const [cancelAction, setCancelAction] = createSignal(false);
  const [requests, setRequests] = createSignal<string[]>([]);
  const [hoverOpen, setHoverOpen] = createSignal(false);
  const [hoverAccept, setHoverAccept] = createSignal(false);
  const [hoverLatest, setHoverLatest] = createSignal(false);
  const [hoverRequests, setHoverRequests] = createSignal<string[]>([]);
  const [tooltipId, setTooltipId] = createSignal('live-tooltip-one');
  const [tooltipSkip, setTooltipSkip] = createSignal(200);
  const [tooltipHoverDisabled, setTooltipHoverDisabled] = createSignal(false);
  const [tooltipOpen, setTooltipOpen] = createSignal(false);
  const [tooltipAccept, setTooltipAccept] = createSignal(false);
  const [tooltipLatest, setTooltipLatest] = createSignal(false);
  const [tooltipRequests, setTooltipRequests] = createSignal<string[]>([]);
  const [tooltipCancelEscape, setTooltipCancelEscape] = createSignal(false);
  const [menuChecked, setMenuChecked] = createSignal(false);
  const [menuRadio, setMenuRadio] = createSignal('one');
  const [menuSelections, setMenuSelections] = createSignal<string[]>([]);
  const [menuDir, setMenuDir] = createSignal<'ltr' | 'rtl'>('ltr');
  const [contextOpen, setContextOpen] = createSignal(false);
  const [contextAccept, setContextAccept] = createSignal(false);
  const [contextLatest, setContextLatest] = createSignal(false);
  const [contextRequests, setContextRequests] = createSignal<string[]>([]);
  const contextRequest = (version: string, next: boolean) => {
    setContextRequests(previous => [...previous, `${version}:${next}`]);
    if (contextAccept()) setContextOpen(next);
  };
  const tooltipRequest = (version: string, next: boolean) => {
    setTooltipRequests(previous => [...previous, `${version}:${next}`]);
    if (tooltipAccept()) setTooltipOpen(next);
  };
  const hoverRequest = (version: string, next: boolean) => {
    setHoverRequests(previous => [...previous, `${version}:${next}`]);
    if (hoverAccept()) setHoverOpen(next);
  };
  const oldRequest = (next: boolean) => {
    setRequests(previous => [...previous, `old:${next}`]);
    if (accept()) setOpen(next);
  };
  const latestRequest = (next: boolean) => {
    setRequests(previous => [...previous, `latest:${next}`]);
    if (accept()) setOpen(next);
  };
  return <section aria-label="Native overlays and menus">
    <label><input type="checkbox" checked={accept()} onChange={event => setAccept(event.currentTarget.checked)} />Accept alert requests</label>
    <button onClick={() => setLatest(true)}>Replace alert callback</button>
    <AlertDialog.Root open={open()} onOpenChange={latest() ? latestRequest : oldRequest}>
      <AlertDialog.Trigger>Open destructive alert</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay data-alert-overlay style={{ position: 'fixed', inset: '0', 'z-index': 20, background: 'rgb(0 0 0 / 0.12)' }} />
        <AlertDialog.Content style={{ position: 'fixed', inset: '25% 25%', 'z-index': 21, padding: '1rem', background: 'Canvas' }}
          onEscapeKeyDown={event => { if (cancelEscape()) event.preventDefault(); }}>
          <AlertDialog.Title>Delete the draft?</AlertDialog.Title>
          <AlertDialog.Description>This action permanently removes this draft.</AlertDialog.Description>
          <AlertDialog.Action onClick={event => { if (cancelAction()) event.preventDefault(); }}>Delete draft</AlertDialog.Action>
          <AlertDialog.Cancel>Keep draft</AlertDialog.Cancel>
          <label><input type="checkbox" checked={cancelEscape()} onChange={event => setCancelEscape(event.currentTarget.checked)} />Prevent alert Escape</label>
          <label><input type="checkbox" checked={cancelAction()} onChange={event => setCancelAction(event.currentTarget.checked)} />Prevent destructive action</label>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
    <output id="alert-requests">{requests().join(',')}</output>
    <label><input type="checkbox" checked={hoverAccept()} onChange={event => setHoverAccept(event.currentTarget.checked)} />Accept hover requests</label>
    <button onClick={() => setHoverLatest(true)}>Replace hover callback</button>
    <HoverCard.Root open={hoverOpen()} onOpenChange={hoverLatest() ? next => hoverRequest('latest', next) : next => hoverRequest('old', next)} openDelay={60} closeDelay={100}>
      <HoverCard.Trigger href="#profile" style={{ display: 'inline-block', padding: '1rem' }}>Preview profile</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content data-profile-preview sideOffset={8} style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 10 }}>
          <p>Profile preview text can be selected.</p>
          <a href="#profile-details">Profile details</a>
          <HoverCard.Arrow />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
    <output id="hover-requests">{hoverRequests().join(',')}</output>
    <Dialog.Root>
      <Dialog.Trigger>Open preview dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: 'fixed', inset: 0, 'z-index': 30 }} />
        <Dialog.Content style={{ position: 'fixed', inset: '20% 20%', background: 'Canvas', 'z-index': 31 }}>
          <Dialog.Title>Preview ownership dialog</Dialog.Title>
          <Dialog.Description>A portalled preview must not own this dialog's focus scope.</Dialog.Description>
          <button>Preview dialog first</button>
          <HoverCard.Root defaultOpen>
            <HoverCard.Trigger href="#nested-profile">Nested profile preview</HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Content data-nested-preview style={{ padding: '1rem', background: 'Canvas', 'z-index': 32 }}>
                <input aria-label="Preview branch field" />
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
          <Dialog.Close>Close preview dialog</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <button id="replace-tooltip-id" onClick={() => setTooltipId('live-tooltip-two')}>Replace tooltip id</button>
    <label><input type="checkbox" checked={tooltipSkip() === 0} onChange={event => setTooltipSkip(event.currentTarget.checked ? 0 : 200)} />Disable tooltip warmup</label>
    <label><input type="checkbox" checked={tooltipHoverDisabled()} onChange={event => setTooltipHoverDisabled(event.currentTarget.checked)} />Disable hoverable tooltip content</label>
    <Tooltip.Provider delayDuration={80} skipDelayDuration={tooltipSkip()} disableHoverableContent={tooltipHoverDisabled()}>
      <span id="tooltip-extra-description">Existing hint.</span>
      <Tooltip.Root>
        <Tooltip.Trigger aria-describedby="tooltip-extra-description">Tooltip alpha</Tooltip.Trigger>
        <Tooltip.Portal><Tooltip.Content id={tooltipId()} data-tooltip-alpha sideOffset={24} style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 10 }}>
          <span data-tooltip-child>Alpha tooltip description.</span><Tooltip.Arrow />
        </Tooltip.Content></Tooltip.Portal>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>Tooltip beta</Tooltip.Trigger>
        <Tooltip.Portal><Tooltip.Content data-tooltip-beta sideOffset={24} style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 10 }}>
          Beta tooltip description.<Tooltip.Arrow />
        </Tooltip.Content></Tooltip.Portal>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{target => target('a', { href: '#tooltip-label', type: 'text/html', children: 'Labelled tooltip anchor' })}</Tooltip.Trigger>
        <Tooltip.Portal><Tooltip.Content id="labelled-tooltip-description" aria-label="Detailed labelled description." data-labelled-tooltip asChild>
          {target => target('section', { style: { padding: '1rem', background: 'Canvas', 'z-index': 10 }, children: <><p data-labelled-child>Rendered only once.</p><Tooltip.Arrow /></> })}
        </Tooltip.Content></Tooltip.Portal>
      </Tooltip.Root>
      <label><input id="tooltip-accept" type="checkbox" checked={tooltipAccept()} onChange={event => setTooltipAccept(event.currentTarget.checked)} />Accept tooltip requests</label>
      <button onClick={() => setTooltipLatest(true)}>Replace tooltip callback</button>
      <Tooltip.Root open={tooltipOpen()} onOpenChange={tooltipLatest() ? next => tooltipRequest('latest', next) : next => tooltipRequest('old', next)}>
        <Tooltip.Trigger>Controlled tooltip</Tooltip.Trigger>
        <Tooltip.Portal><Tooltip.Content forceMount data-controlled-tooltip style={{ display: tooltipOpen() ? 'block' : 'none', padding: '1rem', background: 'Canvas', 'z-index': 10 }}>
          Controlled tooltip description.
        </Tooltip.Content></Tooltip.Portal>
      </Tooltip.Root>
      <output id="tooltip-requests">{tooltipRequests().join(',')}</output>
      <Dialog.Root>
        <Dialog.Trigger>Open tooltip dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: 'fixed', inset: 0, 'z-index': 30 }} />
          <Dialog.Content style={{ position: 'fixed', inset: '20% 20%', background: 'Canvas', 'z-index': 31 }}>
            <Dialog.Title>Tooltip ownership dialog</Dialog.Title>
            <Dialog.Description>A portalled tooltip does not replace its modal parent's focus scope.</Dialog.Description>
            <Tooltip.Root>
              <Tooltip.Trigger>Dialog tooltip trigger</Tooltip.Trigger>
              <Tooltip.Portal><Tooltip.Content data-modal-tooltip sideOffset={8} onEscapeKeyDown={event => { if (tooltipCancelEscape()) event.preventDefault(); }} style={{ padding: '1rem', background: 'Canvas', 'z-index': 32 }}>
                Modal tooltip description.
              </Tooltip.Content></Tooltip.Portal>
            </Tooltip.Root>
            <label><input id="tooltip-cancel-escape" type="checkbox" checked={tooltipCancelEscape()} onChange={event => setTooltipCancelEscape(event.currentTarget.checked)} />Prevent tooltip Escape</label>
            <Dialog.Close>Close tooltip dialog</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Tooltip.Provider>
    <button onClick={() => setMenuDir('rtl')}>Use RTL menus</button>
    <DropdownMenu.Root dir={menuDir()}>
      <DropdownMenu.Trigger>Open native dropdown</DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content aria-labelledby="native-actions-label" sideOffset={6} style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 10 }}>
        <DropdownMenu.Label id="native-actions-label">Native actions</DropdownMenu.Label>
        <DropdownMenu.Item disabled>Unavailable action</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => setMenuSelections(previous => [...previous, 'alpha'])}>Alpha action</DropdownMenu.Item>
        <DropdownMenu.Item data-menu-beta onSelect={() => setMenuSelections(previous => [...previous, 'beta'])}>Beta action</DropdownMenu.Item>
        <DropdownMenu.CheckboxItem checked={menuChecked()} onCheckedChange={setMenuChecked} onSelect={event => event.preventDefault()}>
          <DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator>Keep menu checked
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.RadioGroup value={menuRadio()} onValueChange={setMenuRadio}>
          <DropdownMenu.RadioItem value="one" onSelect={event => event.preventDefault()}><DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator>First choice</DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="two" onSelect={event => event.preventDefault()}><DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator>Second choice</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
        <DropdownMenu.Separator />
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>More actions</DropdownMenu.SubTrigger>
          <DropdownMenu.Portal><DropdownMenu.SubContent aria-labelledby="more-native-actions-label" sideOffset={6} style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 11 }}>
            <DropdownMenu.Label id="more-native-actions-label">More native actions</DropdownMenu.Label>
            <DropdownMenu.Item onSelect={() => setMenuSelections(previous => [...previous, 'nested'])}>Nested action</DropdownMenu.Item>
          </DropdownMenu.SubContent></DropdownMenu.Portal>
        </DropdownMenu.Sub>
        <DropdownMenu.Item textValue="Bravo">Bravo action</DropdownMenu.Item>
        <DropdownMenu.Item data-menu-berlin textValue="Berlin">Berlin action</DropdownMenu.Item>
        <DropdownMenu.Item disabled textValue="Beta unavailable">Beta unavailable</DropdownMenu.Item>
        <DropdownMenu.Item textValue="Editor">Embedded editor<input aria-label="Menu editor" /></DropdownMenu.Item>
        <DropdownMenu.Arrow />
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
    <output id="menu-selections">{menuSelections().join(',')}</output>
    <label><input type="checkbox" checked={contextAccept()} onChange={event => setContextAccept(event.currentTarget.checked)} />Accept context requests</label>
    <button onClick={() => setContextLatest(true)}>Replace context callback</button>
    <ContextMenu.Root modal={false} open={contextOpen()} onOpenChange={contextLatest() ? next => contextRequest('latest', next) : next => contextRequest('old', next)}>
      <ContextMenu.Trigger data-context-trigger style={{ display: 'inline-block', padding: '2rem', border: '1px solid' }}>Context target</ContextMenu.Trigger>
      <ContextMenu.Portal><ContextMenu.Content aria-label="Context actions" onPointerDownOutside={event => { if ((event.target as HTMLElement).closest('[data-context-trigger]')) event.preventDefault(); }} style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 10 }}>
        <ContextMenu.Item onSelect={() => setMenuSelections(previous => [...previous, 'context'])}>Context action</ContextMenu.Item>
      </ContextMenu.Content></ContextMenu.Portal>
    </ContextMenu.Root>
    <output id="context-requests">{contextRequests().join(',')}</output>
    <Menubar.Root aria-label="Native menu bar" dir={menuDir()}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File menu</Menubar.Trigger>
        <Menubar.Portal><Menubar.Content aria-labelledby="file-menu-label" style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 10 }}>
          <Menubar.Label id="file-menu-label">File actions</Menubar.Label>
          <Menubar.Item>File action</Menubar.Item>
          <Menubar.Sub>
            <Menubar.SubTrigger>File submenu</Menubar.SubTrigger>
            <Menubar.Portal><Menubar.SubContent aria-label="File nested actions" style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 11 }}>
              <Menubar.Item>File nested action</Menubar.Item>
            </Menubar.SubContent></Menubar.Portal>
          </Menubar.Sub>
        </Menubar.Content></Menubar.Portal>
      </Menubar.Menu>
      <Menubar.Menu value="disabled"><Menubar.Trigger disabled>Unavailable menu</Menubar.Trigger><Menubar.Content><Menubar.Item>Unavailable item</Menubar.Item></Menubar.Content></Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit menu</Menubar.Trigger>
        <Menubar.Portal><Menubar.Content aria-labelledby="edit-menu-label" style={{ padding: '1rem', background: 'Canvas', border: '1px solid', 'z-index': 10 }}>
          <Menubar.Label id="edit-menu-label">Edit actions</Menubar.Label>
          <Menubar.Item>Edit action</Menubar.Item>
        </Menubar.Content></Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
    <NavigationExamples />
  </section>;
}

function NavigationExamples(): Element {
  const [value, setValue] = createSignal('');
  const [accept, setAccept] = createSignal(true);
  const [latest, setLatest] = createSignal(false);
  const [requests, setRequests] = createSignal<string[]>([]);
  const [cancel, setCancel] = createSignal(true);
  const [manual, setManual] = createSignal(false);
  const [dir, setDir] = createSignal<'ltr' | 'rtl'>('ltr');
  const [toggleSub, setToggleSub] = createSignal(false);
  const [manualSub, setManualSub] = createSignal(false);
  const request = (version: string, next: string) => {
    setRequests(previous => [...previous, `${version}:${next || 'closed'}`]);
    if (accept()) setValue(next);
  };
  return <section aria-label="Navigation fixtures">
    <label><input type="checkbox" checked={accept()} onChange={event => setAccept(event.currentTarget.checked)} />Accept navigation requests</label>
    <button onClick={() => setLatest(true)}>Replace navigation callback</button>
    <label><input type="checkbox" checked={manual()} onChange={event => setManual(event.currentTarget.checked)} />Manual navigation activation</label>
    <label><input type="checkbox" checked={cancel()} onChange={event => setCancel(event.currentTarget.checked)} />Cancel navigation selection</label>
    <label><input type="checkbox" checked={manualSub()} onChange={event => setManualSub(event.currentTarget.checked)} />Manual subnavigation activation</label>
    <button onClick={() => setDir(previous => previous === 'ltr' ? 'rtl' : 'ltr')}>Reverse navigation direction</button>
    <NavigationMenu.Root aria-label="Native site navigation" value={value()} dir={dir()} activationMode={manual() ? 'manual' : 'automatic'}
      onValueChange={latest() ? next => request('latest', next) : next => request('old', next)}>
      <NavigationMenu.List style={{ display: 'flex', gap: '1rem', padding: 0, 'list-style': 'none' }}>
        <NavigationMenu.Item value="docs">
          <NavigationMenu.Trigger>Navigation docs</NavigationMenu.Trigger>
          <NavigationMenu.Content data-nav-docs style={{ width: '240px', height: '160px', padding: '1rem', background: 'Canvas', border: '1px solid' }}>
            <NavigationMenu.Link href="#nav-target" onClick={event => event.preventDefault()} onSelect={event => { if (cancel()) event.preventDefault(); }}>First document</NavigationMenu.Link>
            <NavigationMenu.Link href="#nav-target">Second document</NavigationMenu.Link>
            <input aria-label="Persistent navigation draft" />
            <NavigationMenu.Sub defaultValue="basic" data-nav-sub activationMode={manualSub() ? 'manual' : undefined} disableToggle={!toggleSub()}>
              <NavigationMenu.List style={{ display: 'flex', padding: 0, 'list-style': 'none' }}>
                <NavigationMenu.Item value="basic"><NavigationMenu.Trigger>Basic subnavigation</NavigationMenu.Trigger><NavigationMenu.Content><NavigationMenu.Link href="#nav-target">Basic document</NavigationMenu.Link></NavigationMenu.Content></NavigationMenu.Item>
                <NavigationMenu.Item value="advanced"><NavigationMenu.Trigger>Advanced subnavigation</NavigationMenu.Trigger><NavigationMenu.Content><NavigationMenu.Link href="#nav-target">Advanced document</NavigationMenu.Link></NavigationMenu.Content></NavigationMenu.Item>
              </NavigationMenu.List>
            </NavigationMenu.Sub>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="disabled"><NavigationMenu.Trigger disabled>Disabled navigation</NavigationMenu.Trigger></NavigationMenu.Item>
        <NavigationMenu.Item><NavigationMenu.Link href="#nav-target" active>Current navigation page</NavigationMenu.Link></NavigationMenu.Item>
        <NavigationMenu.Item value="guides">
          <NavigationMenu.Trigger>Navigation guides</NavigationMenu.Trigger>
          <NavigationMenu.Content data-nav-guides style={{ width: '360px', height: '100px', padding: '1rem', background: 'Canvas', border: '1px solid' }}>
            <NavigationMenu.Link href="#nav-target">Guide document</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Indicator data-nav-indicator style={{ width: '8px', height: '3px', background: 'currentColor' }} />
      </NavigationMenu.List>
      <NavigationMenu.Viewport data-nav-viewport asChild style={{ position: 'relative' }}>{target => target('section', { children: <span data-nav-decoration>Viewport decoration</span> })}</NavigationMenu.Viewport>
    </NavigationMenu.Root>
    <output id="navigation-requests">{requests().join(',')}</output>
    <label><input type="checkbox" checked={toggleSub()} onChange={event => setToggleSub(event.currentTarget.checked)} />Allow subnavigation toggle</label>
    <button id="after-navigation">After navigation</button>
    <div id="nav-target">Navigation destination</div>
    <NavigationMenu.Root aria-label="Inline navigation" defaultValue="inline" orientation="vertical">
      <NavigationMenu.List><NavigationMenu.Item value="inline"><NavigationMenu.Trigger>Inline navigation trigger</NavigationMenu.Trigger>
        <NavigationMenu.Content data-inline-navigation><NavigationMenu.Link href="#nav-target" onClick={event => event.preventDefault()}>Inline document</NavigationMenu.Link></NavigationMenu.Content>
      </NavigationMenu.Item></NavigationMenu.List>
    </NavigationMenu.Root>
  </section>;
}
