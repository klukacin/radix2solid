import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createComponent } from 'solid-js';
import { renderToString } from '@solidjs/web';
import { AccessibleIcon, Accordion, AlertDialog, Announce, AspectRatio, Avatar, Checkbox, Collapsible, ContextMenu, Dialog, DropdownMenu, HoverCard, Label, Menubar, NavigationMenu, Popover, Portal, Progress, RadioGroup, Select, Slot, Switch, Tabs, Toggle, ToggleGroup, Toolbar, Tooltip } from '@radix-solid/primitives';
import { Form, ScrollArea, Slider, Toast, unstable_PasswordToggleField as Password, unstable_OneTimePasswordField as OTP } from '@radix-solid/primitives';
import { AccessibilityIcon, PanelLeftIcon, PanelRightIcon } from '@radix-solid/icons';
import GitHubLogoIcon from '@radix-solid/icons/GitHubLogoIcon';
import ts from 'typescript';
import * as Themes from '@radix-solid/themes';

test('packed packages resolve one physical native runtime from every package origin and Themes shares primitives', async () => {
  const names = ['primitives', 'themes', 'icons'];
  const origins = await Promise.all(names.map(async name =>
    dirname(await realpath(fileURLToPath(import.meta.resolve(`@radix-solid/${name}`))))));
  const consumerRequire = createRequire(import.meta.url);
  const consumerSolidOrigin = dirname(await realpath(consumerRequire.resolve('solid-js')));
  for (const dependency of ['solid-js', '@solidjs/web', '@solidjs/signals']) {
    const consumerOrigin = dependency === '@solidjs/signals' ? consumerSolidOrigin : import.meta.dirname;
    const resolutions = await Promise.all([consumerOrigin, ...origins].map(async origin =>
      realpath(createRequire(resolve(origin, 'physical-consumer.cjs')).resolve(dependency))));
    assert.equal(new Set(resolutions).size, 1, `${dependency}: distinct physical package runtimes: ${resolutions.join(', ')}`);
  }
  const themesRequire = createRequire(resolve(origins[1], 'physical-consumer.cjs'));
  assert.equal(await realpath(themesRequire.resolve('@radix-solid/primitives')),
    await realpath(fileURLToPath(import.meta.resolve('@radix-solid/primitives'))));
});

test('packed server entry imports and renders pressed state without a DOM', () => {
  assert.equal(typeof window, 'undefined');
  assert.equal(typeof document, 'undefined');
  const html = renderToString(() => createComponent(Toggle.Root, { defaultPressed: true, children: 'Packed state' }), { renderId: 'packed-' });
  assert.match(html, /<button[^>]*aria-pressed="true"[^>]*>Packed state<\/button>/);
  assert.match(html, /type="button"/);
});

test('packed Slot merges accessible descriptions and serializes its only target on the server', () => {
  const html = renderToString(() => createComponent(Slot.Root, {
    class: 'parent', 'aria-describedby': 'parent shared',
    children: target => target('button', { class: 'child', 'aria-describedby': 'shared child', children: 'Packed slot' })
  }));
  assert.match(html, /aria-describedby="shared child parent"/);
  assert.deepEqual(html.match(/class="([^"]+)"/)?.[1].split(/\s+/).sort(), ['child', 'parent']);
  assert.match(html, /<button[^>]*>Packed slot<\/button>/);
});

for (const [name, compound] of [['dialog', Dialog], ['popover', Popover]] as const) {
  test(`packed inline ${name} renders accessible title and description links without a DOM`, () => {
    assert.equal(typeof document, 'undefined');
    const titleId = `packed-${name}-title`;
    const descriptionId = `packed-${name}-description`;
    const html = renderToString(() => createComponent(compound.Root, {
      defaultOpen: true,
      get children() {
        return createComponent(compound.Content, {
          'aria-labelledby': 'external-title',
          get children() {
            return [
              createComponent(compound.Title, { id: titleId, children: `Server ${name}` }),
              createComponent(compound.Description, { id: descriptionId, children: 'Server description' }),
              createComponent(compound.Close, { children: 'Close' }),
              ...(name === 'popover' ? [createComponent(Popover.Arrow, { width: 12, height: 6 })] : [])
            ];
          }
        });
      }
    }), { renderId: `packed-${name}-` });
    assert.match(html, /role="dialog"/);
    assert.match(html, /data-state="open"/);
    assert.match(html, new RegExp(`<h2[^>]*id="${titleId}"`));
    assert.ok(html.match(/aria-labelledby="([^"]+)"/)?.[1].split(/\s+/).includes(titleId), html);
    assert.ok(html.match(/aria-labelledby="([^"]+)"/)?.[1].split(/\s+/).includes('external-title'), html);
    assert.ok(html.match(/aria-describedby="([^"]+)"/)?.[1].split(/\s+/).includes(descriptionId), html);
    if (name === 'popover') assert.match(html, /<svg[^>]*width="12"[^>]*height="6"/);
  });

  test(`packed ${name} Portal does not render server content, including defaultOpen and forceMount`, () => {
    for (const defaultOpen of [true, false]) {
      const html = renderToString(() => createComponent(compound.Root, {
        defaultOpen,
        get children() {
          return createComponent(compound.Portal, {
            forceMount: true,
            get children() { return createComponent(compound.Content, { children: 'Server portal content' }); }
          });
        }
      }));
      assert.doesNotMatch(html, /role="dialog"|Server portal content/);
    }
  });
}

test('packed standalone Portal omits server children without accessing the DOM', () => {
  const html = renderToString(() => createComponent(Portal.Root, { children: 'Standalone server portal content' }));
  assert.doesNotMatch(html, /Standalone server portal content/);
});

test('packed Slot-backed dialog content links titles from lazy target children on the server', () => {
  const html = renderToString(() => createComponent(Dialog.Root, {
    defaultOpen: true,
    get children() {
      return createComponent(Dialog.Content, {
        asChild: true,
        children: target => target('section', {
          get children() {
            return [
              createComponent(Dialog.Title, { id: 'slot-title', children: 'Slot title' }),
              createComponent(Dialog.Description, { id: 'slot-description', children: 'Slot description' })
            ];
          }
        })
      });
    }
  }));
  assert.match(html, /<section[^>]*role="dialog"/);
  assert.match(html, /aria-labelledby="slot-title"/);
  assert.match(html, /aria-describedby="slot-description"/);
});

test('packed simple controls render native accessible semantics without a document', () => {
  assert.equal(typeof document, 'undefined');
  const html = renderToString(() => [
    createComponent(AccessibleIcon.Root, { label: 'Close', children: target => target('svg', { 'aria-hidden': 'false' }) }),
    createComponent(AspectRatio.Root, { ratio: 2, children: 'Media' }),
    createComponent(Label.Root, { for: 'server-input', children: 'Name' }),
    createComponent(Progress.Root, {
      value: 0, max: 80,
      get children() { return createComponent(Progress.Indicator, { id: 'server-progress' }); }
    })
  ]);
  assert.match(html, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
  assert.match(html, />Close<\/span>/);
  assert.match(html, /padding-bottom:50%/);
  assert.match(html, /<label[^>]*for="server-input"/);
  assert.match(html, /aria-valuenow="0"/);
  assert.match(html, /aria-valuetext="0%"/);
  assert.match(html, /id="server-progress"[^>]*data-state="loading"|data-state="loading"[^>]*id="server-progress"/);
});

test('packed avatar and announcements render original content without creating client document resources', () => {
  assert.equal(typeof document, 'undefined');
  const html = renderToString(() => [
    createComponent(Avatar.Root, {
      get children() { return [
        createComponent(Avatar.Image, { src: '/account.svg', alt: 'Account avatar' }),
        createComponent(Avatar.Fallback, { children: 'Account initials' }),
        createComponent(Avatar.Fallback, { delayMs: 200, children: 'Delayed initials' })
      ]; }
    }),
    createComponent(Announce.Root, { type: 'assertive', regionIdentifier: 'account', children: 'Account changed' })
  ]);
  assert.match(html, /Account initials/);
  assert.doesNotMatch(html, /<img|Delayed initials|data-radix-announce-region|aria-live=/);
  assert.equal(html.match(/Account changed/g)?.length, 1);
});

test('packed disclosures serialize linked open content and omit closed children without a document', () => {
  assert.equal(typeof document, 'undefined');
  for (const asChild of [true, false]) for (const open of [true, false]) {
    const html = renderToString(() => createComponent(Collapsible.Root, {
      open,
      get children() { return [
        createComponent(Collapsible.Trigger, { children: 'SSR disclosure' }),
        asChild
          ? createComponent(Collapsible.Content, { asChild: true, children: target => target('article', { children: 'SSR disclosure body' }) })
          : createComponent(Collapsible.Content, { children: 'SSR disclosure body' })
      ]; }
    }), { renderId: `disclosure-${asChild}-${open}-` });
    assert.match(html, new RegExp(`aria-expanded="${open}"`));
    if (open) {
      const contentId = html.match(/aria-controls="([^"]+)"/)?.[1];
      assert.ok(contentId, html);
      assert.match(html, new RegExp(`<${asChild ? 'article' : 'div'}[^>]*id="${contentId}"[^>]*>SSR disclosure body`));
    } else {
      assert.doesNotMatch(html, /aria-controls|SSR disclosure body|<article/);
      if (!asChild) assert.match(html, /<div[^>]*hidden/);
    }
  }
  const accordion = renderToString(() => createComponent(Accordion.Root, {
    type: 'single', defaultValue: 'one',
    get children() { return ['one', 'two'].map(value => createComponent(Accordion.Item, {
      value, get children() { return [
        createComponent(Accordion.Header, { get children() { return createComponent(Accordion.Trigger, { children: `SSR ${value}` }); } }),
        createComponent(Accordion.Content, { children: `SSR ${value} body` })
      ]; }
    })); }
  }), { renderId: 'accordion-' });
  const triggerId = accordion.match(/<button[^>]*id=\"([^\"]+)\"/)?.[1];
  assert.ok(triggerId, accordion);
  assert.match(accordion, new RegExp(`aria-labelledby=\"${triggerId}\"`));
  assert.match(accordion, /SSR one body/);
  assert.doesNotMatch(accordion, /SSR two body/);
});

test('packed checked controls render native form inputs and scoped mixed state without a document', () => {
  assert.equal(typeof document, 'undefined');
  const checked = renderToString(() => createComponent(Checkbox.Root, {
    defaultChecked: true, name: 'permission', value: 'allowed', required: true, form: 'external',
    get children() { return createComponent(Checkbox.Indicator, { children: 'Selected' }); }
  }));
  assert.match(checked, /role="checkbox"/);
  assert.match(checked, /aria-checked="true"/);
  assert.match(checked, /aria-required="true"/);
  const checkedInput = checked.match(/<input\b[^>]*>/)?.[0] ?? '';
  assert.match(checkedInput, /type="checkbox"/);
  assert.match(checkedInput, /\schecked(?:\s|=|>)/);
  assert.match(checkedInput, /name="permission"/);
  assert.match(checkedInput, /value="allowed"/);
  assert.match(checkedInput, /form="external"/);
  assert.match(checked, /Selected/);
  const scope = Checkbox.createCheckboxScope()();
  const mixed = renderToString(() => createComponent(Checkbox.unstable_Provider, {
    ...scope, defaultChecked: 'indeterminate',
    get children() { return [
      createComponent(Checkbox.unstable_Trigger, { ...scope, get children() { return createComponent(Checkbox.Indicator, { ...scope, children: 'Mixed' }); } }),
      createComponent(Checkbox.unstable_BubbleInput, { ...scope, name: 'mixed' })
    ]; }
  }));
  assert.match(mixed, /aria-checked="mixed"/);
  assert.match(mixed, /Mixed/);
  assert.doesNotMatch(mixed, /<input[^>]*\schecked(?:\s|=|>)/);
  const switchHtml = renderToString(() => createComponent(Switch.Root, {
    defaultChecked: true, name: 'notify',
    get children() { return createComponent(Switch.Thumb, { children: 'Enabled' }); }
  }));
  assert.match(switchHtml, /role="switch"/);
  assert.match(switchHtml, /aria-checked="true"/);
  const switchInput = switchHtml.match(/<input\b[^>]*>/)?.[0] ?? '';
  assert.match(switchInput, /type="checkbox"/);
  assert.match(switchInput, /\schecked(?:\s|=|>)/);
  assert.match(switchHtml, /Enabled/);
});

test('packed radio group serializes one selected native radio with external form ownership and scoped split parts', () => {
  assert.equal(typeof document, 'undefined');
  const scope = RadioGroup.createRadioGroupScope()();
  const html = renderToString(() => createComponent(RadioGroup.Root, {
    ...scope, defaultValue: 'two', name: 'choice', form: 'external', required: true,
    get children() { return [
      createComponent(RadioGroup.Item, { ...scope, value: 'one', children: 'One' }),
      createComponent(RadioGroup.unstable_ItemProvider, { ...scope, value: 'two', get children() { return [
        createComponent(RadioGroup.unstable_ItemTrigger, { ...scope, get children() { return createComponent(RadioGroup.Indicator, { ...scope, children: 'Selected two' }); } }),
        createComponent(RadioGroup.unstable_ItemBubbleInput, scope)
      ]; } })
    ]; }
  }));
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /Selected two/);
  const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(match => match[0]);
  for (const input of inputs) {
    assert.match(input, /type="radio"/);
    assert.match(input, /name="choice"/);
    assert.match(input, /form="external"/);
    assert.match(input, /\srequired(?:\s|=|>)/);
  }
  assert.deepEqual(inputs.filter(input => /\schecked(?:\s|=|>)/.test(input)).map(input => input.match(/value="([^"]*)"/)?.[1]), ['two']);
});

test('packed scoped tabs link selected triggers and panel shells without rendering inactive children', () => {
  const scope = Tabs.createTabsScope()();
  const html = renderToString(() => createComponent(Tabs.Root, { ...scope, defaultValue: 'one', get children() { return [
    createComponent(Tabs.List, { ...scope, get children() { return ['one', 'two'].map(value => createComponent(Tabs.Trigger, { ...scope, value, children: value })); } }),
    createComponent(Tabs.Content, { ...scope, value: 'one', children: 'Selected document' }),
    createComponent(Tabs.Content, { ...scope, value: 'two', children: 'Inactive document' })
  ]; } }), { renderId: 'packed-tabs-' });
  const trigger = html.match(/<button\b[^>]*aria-selected="true"[^>]*>/)?.[0];
  const panel = html.match(/<div\b[^>]*role="tabpanel"[^>]*>/)?.[0];
  assert.ok(trigger && panel, html);
  assert.equal(trigger.match(/aria-controls="([^"]+)"/)?.[1], panel.match(/\sid="([^"]+)"/)?.[1]);
  assert.equal(panel.match(/aria-labelledby="([^"]+)"/)?.[1], trigger.match(/\sid="([^"]+)"/)?.[1]);
  assert.match(html, /Selected document/);
  assert.doesNotMatch(html, /Inactive document/);
  assert.match(html, /\shidden(?:\s|=|>)/);
});

test('packed toggle and toolbar scopes preserve distinct single/multiple selection without native radio inputs', () => {
  const scope = Toolbar.createToolbarScope()();
  const html = renderToString(() => [
    createComponent(ToggleGroup.Root, { type: 'single', defaultValue: 'one', get children() { return createComponent(ToggleGroup.Item, { value: 'one', children: 'Single selected' }); } }),
    createComponent(Toolbar.Root, { ...scope, get children() { return [
      createComponent(Toolbar.Link, { ...scope, href: '/native', children: 'Native link' }),
      createComponent(Toolbar.ToggleGroup, { ...scope, type: 'multiple', defaultValue: ['bold'], get children() { return createComponent(Toolbar.ToggleItem, { ...scope, value: 'bold', children: 'Bold selected' }); } })
    ]; } })
  ]);
  const single = html.match(/<button\b[^>]*>Single selected<\/button>/)?.[0];
  assert.ok(single, html);
  assert.match(single, /role="radio"/);
  assert.match(single, /aria-checked="true"/);
  assert.match(html, /<button[^>]*aria-pressed="true"[^>]*>Bold selected/);
  assert.match(html, /<a[^>]*href="\/native"[^>]*>Native link/);
  assert.doesNotMatch(html, /<input/);
});

test('packed scoped AlertDialog links its modal alert while an inner default root is closed', () => {
  const scope = AlertDialog.createAlertDialogScope()();
  const html = renderToString(() => createComponent(AlertDialog.Root, {
    ...scope, defaultOpen: true, get children() {
      return createComponent(AlertDialog.Root, { get children() {
        return createComponent(AlertDialog.Content, { ...scope, 'aria-labelledby': 'external-alert-title', get children() { return [
          createComponent(AlertDialog.Title, { ...scope, id: 'scoped-alert-title', children: 'Scoped destructive alert' }),
          createComponent(AlertDialog.Description, { ...scope, id: 'scoped-alert-description', children: 'No recovery' }),
          createComponent(AlertDialog.Cancel, { ...scope, children: 'Scoped keep' })
        ]; } });
      } });
    }
  }));
  const content = html.match(/<div\b(?=[^>]*role="alertdialog")[^>]*>/)?.[0];
  assert.ok(content, html);
  assert.match(content, /aria-labelledby="external-alert-title scoped-alert-title"/);
  assert.match(content, /aria-describedby="scoped-alert-description"/);
  assert.match(html, /<button[^>]*>Scoped keep<\/button>/);
});

test('packed scoped HoverCard resolves the open outer preview through a closed inner default root without a DOM', () => {
  const scope = HoverCard.createHoverCardScope()();
  const html = renderToString(() => createComponent(HoverCard.Root, {
    ...scope, defaultOpen: true, get children() {
      return createComponent(HoverCard.Root, { get children() { return [
        createComponent(HoverCard.Trigger, { ...scope, href: '/profile', children: 'Scoped profile' }),
        createComponent(HoverCard.Content, { ...scope, get children() { return [
          'Scoped preview document',
          createComponent(HoverCard.Arrow, { ...scope })
        ]; } })
      ]; } });
    }
  }));
  assert.match(html, /<a[^>]*data-state="open"[^>]*href="\/profile"[^>]*>Scoped profile<\/a>/);
  assert.match(html, /<div[^>]*data-state="open"/);
  assert.match(html, /Scoped preview document/);
  assert.match(html, /<svg/);
});

test('packed inline Tooltip descriptions remain linked and labelled factories render their children only once without a DOM', () => {
  const scope = Tooltip.createTooltipScope()();
  const html = renderToString(() => createComponent(Tooltip.Provider, { ...scope, get children() {
    return createComponent(Tooltip.Root, { ...scope, defaultOpen: true, get children() {
      return createComponent(Tooltip.Provider, { get children() {
        return createComponent(Tooltip.Root, { get children() { return [
          createComponent(Tooltip.Trigger, { ...scope, 'aria-describedby': 'external-tip', children: 'Scoped tooltip trigger' }),
          createComponent(Tooltip.Content, { ...scope, children: 'Visible tooltip document' })
        ]; } });
      } });
    } });
  } }));
  const trigger = html.match(/<button\b[^>]*>Scoped tooltip trigger<\/button>/)?.[0];
  const content = html.match(/<div\b(?=[^>]*role="tooltip")[^>]*>/)?.[0];
  assert.ok(trigger && content, html);
  const id = content.match(/\sid="([^"]+)"/)?.[1];
  assert.equal(trigger.match(/aria-describedby="([^"]+)"/)?.[1], `external-tip ${id}`);
  assert.match(html, /Visible tooltip document/);
  const labelled = renderToString(() => createComponent(Tooltip.Provider, { get children() {
    return createComponent(Tooltip.Root, { defaultOpen: true, get children() { return [
      createComponent(Tooltip.Trigger, { children: 'Labelled trigger' }),
      createComponent(Tooltip.Content, { 'aria-label': 'Label override', asChild: true, children: target => target('section', { children: 'Single labelled child' }) })
    ]; } });
  } }));
  assert.equal(labelled.match(/Single labelled child/g)?.length, 1);
  const label = labelled.match(/<span\b(?=[^>]*role="tooltip")[^>]*>Label override<\/span>/)?.[0];
  assert.ok(label, labelled);
  assert.match(labelled, /<section\b/);
  assert.equal(labelled.match(/<button\b[^>]*aria-describedby="([^"]+)"/)?.[1], label.match(/\sid="([^"]+)"/)?.[1]);
});

test('packed scoped Menu consumers retain open authority, trigger links and mixed selection across nested default roots without a DOM', () => {
  const dropdownScope = DropdownMenu.createDropdownMenuScope()();
  const contextScope = ContextMenu.createContextMenuScope()();
  const barScope = Menubar.createMenubarScope()();
  const html = renderToString(() => [
    createComponent(DropdownMenu.Root, { ...dropdownScope, defaultOpen: true, get children() {
      return createComponent(DropdownMenu.Root, { get children() { return [
        createComponent(DropdownMenu.Trigger, { ...dropdownScope, children: 'Scoped dropdown' }),
        createComponent(DropdownMenu.Content, { ...dropdownScope, get children() {
          return createComponent(DropdownMenu.CheckboxItem, { ...dropdownScope, checked: 'indeterminate', children: 'Mixed menu choice' });
        } })
      ]; } });
    } }),
    createComponent(ContextMenu.Root, { ...contextScope, open: true, get children() {
      return createComponent(ContextMenu.Root, { get children() { return [
        createComponent(ContextMenu.Trigger, { ...contextScope, children: 'Scoped context target' }),
        createComponent(ContextMenu.Content, { ...contextScope, 'aria-label': 'Scoped context actions', children: 'Open context document' })
      ]; } });
    } }),
    createComponent(Menubar.Root, { ...barScope, defaultValue: 'file', dir: 'rtl', get children() {
      return createComponent(Menubar.Root, { get children() {
        return createComponent(Menubar.Menu, { ...barScope, value: 'file', get children() { return [
          createComponent(Menubar.Trigger, { ...barScope, children: 'Scoped file' }),
          createComponent(Menubar.Content, { ...barScope, children: 'Open file document' })
        ]; } });
      } });
    } })
  ], { renderId: 'menus-' });
  for (const title of ['Scoped dropdown', 'Scoped file']) {
    const trigger = html.match(new RegExp(`<button\\b[^>]*>${title}</button>`))?.[0];
    assert.ok(trigger, html);
    assert.match(trigger, /aria-expanded="true"/);
    const id = trigger.match(/\sid="([^"]+)"/)?.[1];
    const controls = trigger.match(/aria-controls="([^"]+)"/)?.[1];
    assert.ok(id && controls, trigger);
    assert.match(html, new RegExp(`<div\\b(?=[^>]*id="${controls}")(?=[^>]*role="menu")(?=[^>]*aria-labelledby="${id}")[^>]*>`));
  }
  assert.match(html, /role="menuitemcheckbox"[^>]*aria-checked="mixed"/);
  assert.match(html, /<span[^>]*data-state="open"[^>]*>Scoped context target<\/span>/);
  assert.match(html, /aria-label="Scoped context actions"/);
  assert.match(html, /Open context document/);
  assert.match(html, /Open file document/);
  assert.match(html, /role="menubar"[^>]*dir="rtl"/);
});

test('packed scoped NavigationMenu links selected inline content and native current-page semantics without a DOM', () => {
  const scope = NavigationMenu.createNavigationMenuScope()();
  const html = renderToString(() => createComponent(NavigationMenu.Root, { ...scope, defaultValue: 'docs', dir: 'rtl', orientation: 'vertical', get children() {
    return createComponent(NavigationMenu.Root, { get children() {
      return createComponent(NavigationMenu.List, { ...scope, get children() {
        return createComponent(NavigationMenu.Item, { ...scope, value: 'docs', get children() { return [
          createComponent(NavigationMenu.Trigger, { ...scope, children: 'Scoped navigation' }),
          createComponent(NavigationMenu.Content, { ...scope, asChild: true, children: target => target('section', { children:
            createComponent(NavigationMenu.Link, { ...scope, active: true, href: '/docs', children: 'Current document' })
          }) })
        ]; } });
      } });
    } });
  } }), { renderId: 'navigation-' });
  const trigger = html.match(/<button\b[^>]*>Scoped navigation<\/button>/)?.[0];
  const content = html.match(/<section\b[^>]*>/)?.[0];
  assert.ok(trigger && content, html);
  assert.match(trigger, /aria-expanded="true"/);
  assert.equal(trigger.match(/aria-controls="([^"]+)"/)?.[1], content.match(/\sid="([^"]+)"/)?.[1]);
  assert.equal(content.match(/aria-labelledby="([^"]+)"/)?.[1], trigger.match(/\sid="([^"]+)"/)?.[1]);
  assert.match(content, /data-orientation="vertical"/);
  assert.match(html, /<nav\b[^>]*dir="rtl"/);
  assert.match(html, /<a\b[^>]*aria-current="page"[^>]*>Current document<\/a>/);
});

test('production client graph has one physical runtime per package and uses the packed client output', async () => {
  const graph: unknown = JSON.parse(await readFile('dist/client/runtime-graph.json', 'utf8'));
  assert.ok(Array.isArray(graph) && graph.every(id => typeof id === 'string'));
  const modules: string[] = graph;
  for (const name of ['solid-js', '@solidjs/web', '@solidjs/signals']) {
    const marker = `/node_modules/${name}/`;
    const instances = new Set(modules.filter(id => id.includes(marker)).map(id => id.slice(0, id.lastIndexOf(marker) + marker.length)));
    assert.equal(instances.size, 1, `${name} runtime instances: ${[...instances].join(', ')}`);
  }
  assert.ok(modules.some(id => id.includes('/node_modules/@radix-solid/primitives/dist/client/')));
  assert.ok(!modules.some(id => /\/node_modules\/(?:react|react-dom|@types\/react)(?:\/|$)/.test(id)));
  assert.ok(!modules.some(id => id.includes('/packages/primitives/src/') || id.includes('/upstream/')));
});

test('packed public declarations typecheck the native consumer without React types', () => {
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  assert.equal(config.error, undefined);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
  const program = ts.createProgram(options.fileNames, options.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.deepEqual(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')), []);
  assert.ok(!program.getSourceFiles().some(file => /\/node_modules\/(?:react|react-dom|@types\/react)(?:\/|$)/.test(file.fileName)));
});

test('packed scoped inline Select preserves its open authority, option labelling and external native form without a document', () => {
  const scope = Select.createSelectScope()();
  const html = renderToString(() => createComponent(Select.Root, {
    ...scope, defaultOpen: true, defaultValue: 'chosen', dir: 'rtl', name: 'picked', form: 'native-form', required: true,
    get children() { return createComponent(Select.Root, { get children() { return [
      createComponent(Select.Trigger, { ...scope, 'aria-label': 'Scoped choice', get children() { return createComponent(Select.Value, { ...scope, placeholder: 'Empty choice' }); } }),
      createComponent(Select.Content, { ...scope, asChild: true, children: target => target('section', { children:
        createComponent(Select.Item, { ...scope, value: 'chosen', get children() { return createComponent(Select.ItemText, { ...scope, children: 'Chosen option' }); } })
      }) }),
      createComponent(Select.Portal, { ...scope, forceMount: true, children: 'Client-only Select portal' })
    ]; } }); }
  }), { renderId: 'select-packed-' });
  const trigger = html.match(/<button\b(?=[^>]*role="combobox")[^>]*>/)?.[0];
  const content = html.match(/<section\b(?=[^>]*role="listbox")[^>]*>/)?.[0];
  assert.ok(trigger && content, html);
  assert.match(trigger, /aria-expanded="true"/);
  assert.match(trigger, /aria-required="true"/);
  assert.equal(trigger.match(/aria-controls="([^"]+)"/)?.[1], content.match(/\bid="([^"]+)"/)?.[1]);
  assert.match(content, /dir="rtl"/);
  const option = html.match(/<div\b(?=[^>]*role="option")[^>]*>/)?.[0];
  assert.ok(option, html);
  assert.match(option, /data-state="checked"/);
  assert.match(html, new RegExp(`<span\\b[^>]*\\bid="${option.match(/aria-labelledby="([^"]+)"/)?.[1]}"[^>]*>Chosen option`));
  assert.match(html, /<select\b[^>]*name="picked"[^>]*form="native-form"/);
  assert.doesNotMatch(html, /Client-only Select portal|Empty choice/);
});

test('packed password masks native external-form input and keeps its inactive server toggle inaccessible without a document', () => {
  const html = renderToString(() => createComponent(Password.Root, {
    get children() { return [
      createComponent(Password.Input, { id: 'packed-secret', name: 'secret', form: 'external-secret', value: 'retained-secret', 'aria-label': 'Secret' }),
      createComponent(Password.Toggle, { get children() { return createComponent(Password.Slot, { visible: 'Hide', hidden: 'Show' }); } })
    ]; }
  }), { renderId: 'password-packed-' });
  const input = html.match(/<input\b[^>]*>/)?.[0];
  const toggle = html.match(/<button\b[^>]*>/)?.[0];
  assert.ok(input && toggle, html);
  assert.match(input, /type="password"/);
  assert.match(input, /name="secret"/);
  assert.match(input, /form="external-secret"/);
  assert.match(input, /value="retained-secret"/);
  assert.match(toggle, /aria-hidden="true"/);
  assert.match(toggle, /tabindex="-1"/);
  assert.doesNotMatch(toggle, /aria-controls=/);
  assert.match(html, />Show<\/button>/);
});

test('packed OTP server renders sanitized aggregate and indexed native characters associated with an external form', () => {
  const html = renderToString(() => createComponent(OTP.Root, {
    defaultValue: '1a2 3', name: 'code', form: 'code-form',
    get children() { return [
      ...[0, 1, 2].map(index => createComponent(OTP.Input, { index, 'aria-label': `Digit ${index + 1}` })),
      createComponent(OTP.HiddenInput, {})
    ]; }
  }), { renderId: 'otp-packed-' });
  const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(match => match[0]);
  const hidden = inputs.find(input => /type="hidden"/.test(input));
  assert.ok(hidden, html);
  assert.match(hidden, /value="123"/); assert.match(hidden, /name="code"/); assert.match(hidden, /form="code-form"/);
  assert.deepEqual(inputs.filter(input => /type="text"/.test(input)).map(input => input.match(/value="([^"]*)"/)?.[1]), ['1', '2', '3']);
  assert.equal(inputs.filter(input => /type="text"/.test(input)).every(input => /form="code-form"/.test(input)), true);
});

test('packed slider preserves separate thumb indices and named external native values without a document', () => {
  const html = renderToString(() => createComponent(Slider.Root, {
    defaultValue: [20, 80], name: 'levels', form: 'levels-form', orientation: 'vertical', disabled: true,
    get children() { return [
      createComponent(Slider.Track, { get children() { return createComponent(Slider.Range, {}); } }),
      createComponent(Slider.Thumb, { 'aria-label': 'Lower' }),
      createComponent(Slider.unstable_ThumbProvider, { name: 'upper', get children() { return [
        createComponent(Slider.unstable_ThumbTrigger, { 'aria-label': 'Upper' }),
        createComponent(Slider.unstable_BubbleInput, {})
      ]; } })
    ]; }
  }), { renderId: 'slider-packed-' });
  const thumbs = [...html.matchAll(/<span\b(?=[^>]*role=\"slider\")[^>]*>/g)].map(match => match[0]);
  assert.deepEqual(thumbs.map(thumb => thumb.match(/aria-valuenow=\"([^\"]*)\"/)?.[1]), ['20', '80']);
  assert.equal(thumbs.every(thumb => /aria-orientation=\"vertical\"/.test(thumb) && /aria-disabled=\"true\"/.test(thumb)), true);
  const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(match => match[0]);
  assert.deepEqual(inputs.map(input => input.match(/name=\"([^\"]*)\"/)?.[1]), ['levels[]', 'upper']);
  assert.deepEqual(inputs.map(input => input.match(/value=\"([^\"]*)\"/)?.[1]), ['20', '80']);
  assert.equal(inputs.every(input => /form=\"levels-form\"/.test(input) && /disabled/.test(input)), true);
});

test('packed scroll area preserves the native viewport factory and nonce while wrapping only measured content without a document', () => {
  const html = renderToString(() => createComponent(ScrollArea.Root, {
    type: 'always', dir: 'rtl',
    get children() { return [
      createComponent(ScrollArea.Viewport, { nonce: 'scroll-nonce', asChild: true, children: target => target('article', { id: 'packed-scroll-viewport', children: 'Measured content' }) }),
      createComponent(ScrollArea.Scrollbar, { orientation: 'horizontal' }),
      createComponent(ScrollArea.Scrollbar, { orientation: 'vertical' })
    ]; }
  }), { renderId: 'scroll-packed-' });
  const viewport = html.match(/<article\b[^>]*>/)?.[0];
  assert.ok(viewport, html); assert.match(viewport, /id=\"packed-scroll-viewport\"/); assert.match(viewport, /data-radix-scroll-area-viewport/);
  assert.match(html, /<article\b[^>]*><div\b[^>]*data-radix-scroll-area-content[^>]*>Measured content<\/div><\/article>/);
  assert.match(html, /<style\b[^>]*nonce=\"scroll-nonce\"/);
  assert.match(html, /<div\b[^>]*dir=\"rtl\"/);
  assert.deepEqual([...html.matchAll(/data-orientation=\"([^\"]+)\"/g)].map(match => match[1]), ['horizontal', 'vertical']);
});

test('packed form associates native labels and controls, exposes server invalidity and renders only forced server messages without a document', () => {
  const html = renderToString(() => createComponent(Form.Root, {
    get children() { return createComponent(Form.Field, {
      name: 'email', serverInvalid: true,
      get children() { return [
        createComponent(Form.Label, { children: 'Email' }),
        createComponent(Form.Control, { required: true, type: 'email', defaultValue: 'server@example.test', asChild: true, children: target => target('input', {}) }),
        createComponent(Form.Message, { forceMatch: true, children: 'Server error' }),
        createComponent(Form.Message, { match: 'valueMissing', children: 'Client error' }),
        createComponent(Form.Submit, { children: 'Send' })
      ]; }
    }); }
  }), { renderId: 'form-packed-' });
  const input = html.match(/<input\b[^>]*>/)?.[0], labelFor = html.match(/<label\b[^>]*for=\"([^\"]+)\"/)?.[1];
  assert.ok(input, html); assert.ok(labelFor, html);
  assert.match(input, new RegExp(`id=\"${labelFor}\"`)); assert.match(input, /name=\"email\"/);
  assert.match(input, /aria-invalid=\"true\"/); assert.match(input, /required/);
  assert.match(input, /value=\"server@example.test\"/);
  assert.match(html, /Server error/); assert.doesNotMatch(html, /Client error/);
  assert.match(html, /<button\b[^>]*type=\"submit\"/);
});

test('packed native Slot preserves input default value and checkbox reset baseline without a document', () => {
  const html = renderToString(() => createComponent(Slot.Root, {
    children: target => target('input', { type: 'checkbox', name: 'choice', defaultValue: 'initial', defaultChecked: true })
  }));
  assert.match(html, /value=\"initial\"/); assert.match(html, /\bchecked(?:=\"\"|\s|\/?>)/);
});

test('packed Toast keeps default-open notifications client-only while serializing a native viewport without a document', () => {
  const html = renderToString(() => createComponent(Toast.Provider, {
    get children() { return [
      createComponent(Toast.Root, { forceMount: true, children: 'Client notification' }),
      createComponent(Toast.Viewport, { label: 'Updates ({hotkey})', hotkey: ['altKey', 'KeyN'], asChild: true, children: target => target('ol', { id: 'notification-list' }) })
    ]; }
  }), { renderId: 'notifications-packed-' });
  assert.match(html, /role="region"/); assert.match(html, /aria-label="Updates \(alt\+N\)"/);
  assert.match(html, /<ol\b[^>]*id="notification-list"/); assert.match(html, /tabindex="-1"/);
  assert.doesNotMatch(html, /Client notification|<li\b/);
});

test('packed icons render named native SVG and isolate mask references without a document', () => {
  const html = renderToString(() => [
    createComponent(AccessibilityIcon, { title: 'Accessible <person>', size: 32, width: 21, color: 'tomato' }),
    createComponent(GitHubLogoIcon, { 'aria-label': 'GitHub' }),
    createComponent(PanelLeftIcon, {}),
    createComponent(PanelRightIcon, {})
  ], { renderId: 'icons-packed-' });
  const svgs = [...html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)].map(match => match[0]);
  assert.match(svgs[0], /role="img"/); assert.doesNotMatch(svgs[0], /aria-hidden="true"/);
  assert.match(svgs[0], /width="21"/); assert.match(svgs[0], /height="32"/);
  assert.match(svgs[0], /fill="tomato"/);
  assert.match(svgs[1], /aria-label="GitHub"/); assert.doesNotMatch(svgs[1], /aria-hidden="true"/);
  const ids = svgs.slice(2).map(svg => svg.match(/<mask\b[^>]*id="([^"]+)"/)?.[1]);
  assert.ok(ids[0]); assert.ok(ids[1]); assert.notEqual(ids[0], ids[1]);
  for (const [index, svg] of svgs.slice(2).entries()) {
    assert.match(svg, /aria-hidden="true"/);
    assert.ok(svg.includes(`mask="url(#${ids[index]})"`), svg);
  }
});

test('packed Themes server preserves frozen responsive defaults, nested gray inheritance and inert factory hosts without a document', () => {
  assert.equal(typeof document, 'undefined');
  assert.throws(() => renderToString(() => { Themes.useThemeContext(); return null; }), /must be used within a `Theme`/);
  const frozen = Object.freeze({ md: '3' as const });
  const html = renderToString(() => createComponent(Themes.Theme, {
    accentColor: 'tomato', appearance: 'light',
    get children() { return [
      createComponent(Themes.Button, { size: frozen, children: 'Frozen theme button' }),
      createComponent(Themes.Theme, { accentColor: 'grass', id: 'inherited-gray', children: 'Inherited gray' }),
      createComponent(Themes.Theme, { accentColor: 'grass', grayColor: 'auto', appearance: 'dark', id: 'auto-gray', children: 'Auto gray' }),
      createComponent(Themes.Skeleton, { asChild: true, children: target => target('button', { id: 'inert-theme-target', children: 'Loading action' }) }),
      createComponent(Themes.Skeleton, { loading: false, children: 'Original content' }),
      createComponent(Themes.Progress, { value: 0, max: 80, 'aria-label': 'Packed themed progress' })
    ]; }
  }), { renderId: 'themes-packed-' });
  assert.equal(Reflect.get(frozen, 'initial'), undefined);
  const button = html.match(/<button\b[^>]*>[\s\S]*?Frozen theme button[\s\S]*?<\/button>/)?.[0];
  assert.ok(button, html); assert.match(button, /\brt-r-size-2\b/); assert.match(button, /\bmd:rt-r-size-3\b/);
  const inherited = html.match(/<div\b[^>]*id="inherited-gray"[^>]*>/)?.[0];
  const auto = html.match(/<div\b[^>]*id="auto-gray"[^>]*>/)?.[0];
  assert.ok(inherited, html); assert.match(inherited, /data-gray-color="mauve"/);
  assert.ok(auto, html); assert.match(auto, /data-gray-color="olive"/); assert.match(auto, /data-has-background="true"/);
  const skeleton = html.match(/<button\b[^>]*id="inert-theme-target"[^>]*>/)?.[0];
  assert.ok(skeleton, html); assert.match(skeleton, /\binert(?:=""|\s|>)/); assert.match(skeleton, /aria-hidden="true"/);
  assert.match(html, /Original content/); assert.match(html, /aria-valuenow="0"/); assert.match(html, /aria-valuemax="80"/);
});
