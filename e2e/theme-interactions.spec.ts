import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, info) => { await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/'); });

test('themed checkbox groups preserve parent refusal, form fields, required items and RTL roving while cards share selection behavior', async ({ page }) => {
  const group = page.locator('#theme-checkbox-group');
  const alpha = group.getByRole('checkbox', { name: 'Themed alpha', exact: true });
  const beta = group.getByRole('checkbox', { name: 'Themed beta', exact: true });
  await beta.click();
  await expect(page.locator('#theme-checkbox-requests')).toHaveText('alpha+beta');
  await expect(beta).not.toBeChecked();
  await expect(alpha).toBeChecked();
  await expect(alpha).toHaveAttribute('aria-required', 'true');
  expect(await page.locator('#theme-selection-form').evaluate(form => new FormData(form as HTMLFormElement).getAll('theme-choice'))).toEqual(['alpha']);
  expect(await page.locator('#theme-selection-form').evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(false);
  await alpha.focus(); await page.keyboard.press('ArrowLeft'); await expect(beta).toBeFocused();
  await page.getByRole('button', { name: 'Accept themed selection', exact: true }).click();
  await beta.click(); await expect(beta).toBeChecked();
  expect(await page.locator('#theme-selection-form').evaluate(form => new FormData(form as HTMLFormElement).getAll('theme-choice'))).toEqual(['alpha', 'beta']);
  await page.getByText('Checkbox card beta', { exact: true }).click();
  expect(await page.locator('#theme-selection-form').evaluate(form => new FormData(form as HTMLFormElement).getAll('theme-card'))).toEqual(['alpha', 'beta']);
  await page.getByRole('radio', { name: 'Radio group beta', exact: true }).click();
  await page.getByRole('radio', { name: 'Radio card beta', exact: true }).click();
  expect(await page.locator('#theme-selection-form').evaluate(form => [new FormData(form as HTMLFormElement).get('theme-radio-group'), new FormData(form as HTMLFormElement).get('theme-radio-card')])).toEqual(['beta', 'beta']);
});

test('segmented selection cannot become empty and standalone Radio uses native same-name form and change behavior', async ({ page }) => {
  const segments = page.locator('#theme-segmented');
  const alpha = segments.getByRole('radio', { name: 'Segment alpha', exact: true });
  const beta = segments.getByRole('radio', { name: 'Segment beta', exact: true });
  await alpha.click(); await expect(alpha).toBeChecked();
  await beta.click(); await expect(beta).toBeChecked(); await expect(alpha).not.toBeChecked();
  await beta.click(); await expect(beta).toBeChecked();
  const radios = page.locator('#theme-native-radio-form');
  await expect(radios.getByRole('radio', { name: 'Native radio alpha', exact: true })).toBeChecked();
  expect(await radios.evaluate(form => new FormData(form as HTMLFormElement).get('theme-native-radio'))).toBe('alpha');
  await radios.getByRole('radio', { name: 'Native radio beta', exact: true }).check();
  await expect(radios.getByRole('radio', { name: 'Native radio alpha', exact: true })).not.toBeChecked();
  await expect(page.locator('#theme-native-radio-requests')).toHaveText('beta');
  expect(await radios.evaluate(form => new FormData(form as HTMLFormElement).get('theme-native-radio'))).toBe('beta');
});

test('TextField decorates its outer root, refs its input and slots place the caret without intercepting interactive targets', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Themed text field', exact: true });
  await expect(page.locator('#theme-input-ref')).toHaveText('input');
  await expect(input).toHaveValue('native text');
  await expect(input).not.toHaveClass(/theme-input-custom/);
  await expect(input.locator('..')).toHaveClass(/theme-input-custom/);
  await expect(input.locator('..')).toHaveCSS('width', '260px');
  await page.locator('#theme-input-left').click(); await expect(input).toBeFocused();
  expect(await input.evaluate(node => (node as HTMLInputElement).selectionStart)).toBe(0);
  await page.locator('#theme-input-right').click({ position: { x: 5, y: 5 } }); await expect(input).toBeFocused();
  expect(await input.evaluate(node => (node as HTMLInputElement).selectionStart)).toBe('native text'.length);
  await page.getByRole('button', { name: 'Field action', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Field action', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Themed text area', exact: true }).fill('changed native textarea');
  await expect(page.getByRole('textbox', { name: 'Themed text area', exact: true })).toHaveValue('changed native textarea');
});

test('themed indeterminate controls, index-stable range thumbs, rich tabs and native document links remain interactive', async ({ page }) => {
  const mixed = page.getByRole('checkbox', { name: 'Mixed themed checkbox', exact: true });
  await expect(mixed).toHaveAttribute('aria-checked', 'mixed'); await mixed.click(); await expect(mixed).toBeChecked();
  const switchControl = page.getByRole('switch', { name: 'Themed switch', exact: true });
  await switchControl.click(); await expect(switchControl).toBeChecked();
  const first = page.locator('#theme-range').getByRole('slider', { name: 'Themed range', exact: true }).first();
  await first.evaluate(node => { (window as any).__themeRangeThumb = node; });
  await page.getByRole('button', { name: 'Change themed range', exact: true }).click();
  await expect(first).toHaveAttribute('aria-valuenow', '30'); await first.focus(); await page.keyboard.press('ArrowRight');
  await expect(first).toHaveAttribute('aria-valuenow', '31');
  expect(await first.evaluate(node => node === (window as any).__themeRangeThumb)).toBe(true);
  await expect(page.locator('#theme-range').getByRole('slider').nth(1)).toHaveAttribute('aria-valuenow', '70');
  await page.getByRole('tab', { name: 'Themed tab beta', exact: true }).click();
  await expect(page.getByRole('tabpanel', { name: 'Themed tab beta', exact: true })).toHaveText('Themed panel beta');
  await page.getByRole('link', { name: 'Themed document beta', exact: true }).click();
  await expect(page).toHaveURL(/#theme-range$/);
});

test('modal themed portals preserve inherited and explicit auto gray, custom containers, live appearance and nested focus', async ({ page }) => {
  await page.evaluate(() => {
    const errors: string[] = [];
    Object.assign(window, { __themeLayoutErrors: errors });
    window.addEventListener('error', event => errors.push(event.message));
  });
  await page.getByRole('button', { name: 'Open themed modal', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Themed modal title', exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(node => !!node.closest('#themed-portal-container'))).toBe(true);
  await expect(dialog).toHaveAttribute('aria-describedby', /.+/);
  await expect(dialog).toHaveAccessibleDescription('Themed modal description');
  await page.getByRole('button', { name: 'Open inherited themed popover', exact: true }).click();
  const popover = page.locator('#themed-inherited-popover');
  await expect(popover).toBeVisible();
  await expect(popover).toHaveAccessibleName('Inherited themed popover');
  await expect(popover).not.toHaveAttribute('aria-labelledby');
  await expect(popover).not.toHaveAttribute('aria-describedby');
  await expect(popover).toHaveAttribute('data-accent-color', 'amber');
  await expect(popover).toHaveAttribute('data-gray-color', (await page.locator('#overlay-root-theme').getAttribute('data-gray-color'))!);
  await page.getByRole('textbox', { name: 'Themed nested input', exact: true }).fill('allowed nested focus');
  await expect(page.getByRole('textbox', { name: 'Themed nested input', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Update nested open overlay theme', exact: true }).click();
  await expect(popover).toHaveClass(/\bdark\b/);
  await expect(popover).toHaveAttribute('data-gray-color', 'mauve');
  await page.keyboard.press('Escape'); await expect(popover).not.toBeVisible(); await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open inherited themed popover', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Open explicit auto themed popover', exact: true }).click();
  await expect(page.locator('#themed-auto-popover')).toHaveAttribute('data-gray-color', 'sand');
  await expect(page.locator('#themed-auto-popover')).toHaveAccessibleName('Explicit auto themed popover');
  await expect(page.locator('#themed-auto-popover')).toHaveAccessibleDescription('Explicit popup description.');
  await expect(page.locator('#themed-auto-popover')).toHaveClass(/\blight\b/);
  expect(await page.locator('#themed-auto-popover').evaluate(node => getComputedStyle(node).getPropertyValue('--color-background').trim())).toBe('white');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open themed modal', exact: true })).toBeFocused();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => Reflect.get(window, '__themeLayoutErrors') as string[])).toEqual([]);
});

test('themed alert cancellation, hover and tooltip retain native focus and accessible content', async ({ page }) => {
  await page.getByRole('button', { name: 'Open themed alert', exact: true }).click();
  await expect(page.getByRole('alertdialog', { name: 'Themed alert title', exact: true })).toBeVisible();
  await expect(page.getByRole('alertdialog', { name: 'Themed alert title', exact: true })).toHaveAccessibleDescription('Themed alert description');
  await expect(page.getByRole('button', { name: 'Cancel themed alert', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Cancel themed alert', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open themed alert', exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Themed hover target', exact: true }).hover();
  await expect(page.locator('#themed-hover-content')).toBeVisible();
  await page.getByRole('button', { name: 'Themed tooltip target', exact: true }).focus();
  await expect(page.getByRole('tooltip', { name: 'Themed tooltip details', exact: true })).toBeVisible();
});

test('themed menus propagate content settings into portalled submenus and Select submits the selected native value', async ({ page }) => {
  await page.getByRole('button', { name: 'Open themed dropdown', exact: true }).click();
  await expect(page.getByRole('menuitemcheckbox', { name: 'Themed checked ⌘K', exact: true })).toBeChecked();
  await page.getByRole('menuitem', { name: 'Themed submenu', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  const submenu = page.locator('#themed-submenu-content');
  await expect(submenu).toBeVisible(); await expect(submenu).toHaveAttribute('data-accent-color', 'crimson');
  await expect(submenu).toHaveClass(/rt-variant-soft/); await expect(submenu).toHaveClass(/rt-high-contrast/);
  expect(await submenu.evaluate(node => !!node.closest('#themed-portal-container'))).toBe(true);
  await expect.poll(() => page.getByRole('menuitem', { name: 'Themed nested edit', exact: true }).evaluate(item => {
    const trigger = document.querySelector('#themed-menu-content .rt-BaseMenuSubTrigger')!;
    return Math.abs(item.getBoundingClientRect().top - trigger.getBoundingClientRect().top);
  })).toBeLessThan(1.5);
  for (const width of [700, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: 'Open themed dropdown', exact: true, includeHidden: true }).scrollIntoViewIfNeeded();
    await expect.poll(() => page.getByRole('menuitem', { name: 'Themed nested edit', exact: true }).evaluate(item => {
      const trigger = document.querySelector('#themed-menu-content .rt-BaseMenuSubTrigger')!;
      return Math.abs(item.getBoundingClientRect().top - trigger.getBoundingClientRect().top);
    })).toBeLessThan(1.5);
  }
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Themed context target', exact: true }).click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: 'Themed context edit ⌘E', exact: true })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Themed context submenu', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.getByRole('menuitem', { name: 'Themed context nested edit', exact: true }).evaluate(item => {
    const trigger = document.querySelector('#themed-context-content .rt-BaseMenuSubTrigger')!;
    return Math.abs(item.getBoundingClientRect().top - trigger.getBoundingClientRect().top);
  })).toBeLessThan(1.5);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Themed select', exact: true }).click();
  await page.getByRole('option', { name: 'Themed option beta', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Themed select', exact: true })).toHaveText(/Themed option beta/);
  expect(await page.locator('#themed-select-form').evaluate(form => new FormData(form as HTMLFormElement).get('themed-select'))).toBe('beta');
});

test('ThemePanel ignores legal keyless keydown and preserves caller gap and inert precedence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: 'Mount custom ThemePanel', exact: true }).click();
  await expect.soft(page.locator('#custom-theme-panel-content')).toHaveClass(/\brt-r-gap-7\b/);
  await expect.soft(page.locator('#custom-theme-panel-content')).not.toHaveClass(/\brt-r-gap-5\b/);
  await expect.soft(page.locator('#custom-inert-theme-panel')).not.toHaveAttribute('inert');
  await page.evaluate(() => document.dispatchEvent(new Event('keydown')));
  await expect(page.locator('#native-theme-panel')).toHaveAttribute('inert', '');
  expect(errors).toEqual([]);
});

test('ThemePanel restores shortcut focus, excludes inputs and modifiers, and changes the root rather than its nested preview', async ({ page, context, browserName }) => {
  const panel = page.locator('#native-theme-panel'), root = page.locator('#panel-root-theme');
  const previous = page.locator('#panel-previous-focus');
  await previous.focus();
  for (const modifier of ['Alt', 'Control', 'Shift', 'Meta']) {
    await page.keyboard.press(`${modifier}+t`);
    await expect(panel).toHaveAttribute('inert', '');
  }
  for (const name of ['Panel shortcut text exclusion', 'Panel shortcut editable exclusion', 'Panel shortcut combobox exclusion']) {
    await page.getByLabel(name).focus(); await page.keyboard.press('t');
    await expect(panel).toHaveAttribute('inert', '');
  }
  await previous.focus(); await page.keyboard.press('t');
  await expect(panel).not.toHaveAttribute('inert');
  await expect(panel.getByRole('button', { name: 'Toggle the Theme Panel', exact: true })).toBeFocused();
  await panel.locator('input[name="accentColor"][value="tomato"]').check();
  await expect(root).toHaveAttribute('data-accent-color', 'tomato');
  await expect(root).toHaveAttribute('data-gray-color', 'mauve');
  await panel.locator('input[name="grayColor"][value="sand"]').check();
  await panel.getByRole('radio', { name: 'Dark', exact: true }).check();
  await panel.locator('input[name="radius"][value="full"]').check();
  await panel.locator('input[name="scaling"][value="110%"]').check();
  await panel.getByRole('radio', { name: 'Solid', exact: true }).check();
  await expect(root).toHaveClass(/dark/);
  await expect(root).toHaveAttribute('data-gray-color', 'sand');
  await expect(root).toHaveAttribute('data-radius', 'full');
  await expect(root).toHaveAttribute('data-scaling', '110%');
  await expect(root).toHaveAttribute('data-panel-background', 'solid');
  await expect(panel).toHaveAttribute('data-radius', 'medium');
  await expect(panel).toHaveAttribute('data-scaling', '100%');
  await panel.getByRole('button', { name: 'Learn more about panel background options', exact: true }).click();
  await expect(page.getByText('Whether Card and Table panels are translucent, showing some of the background behind them.', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await panel.getByRole('button', { name: 'Copy Theme', exact: true }).click();
    await expect(panel.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('<Theme appearance="dark" accentColor="tomato" grayColor="sand" panelBackground="solid" radius="full" scaling="110%">');
  }
  await previous.focus(); await page.keyboard.press('t');
  await expect(panel).toHaveAttribute('inert', '');
  await expect(previous).toBeFocused();
});
