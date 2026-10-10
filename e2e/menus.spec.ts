import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, info) => {
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
});

test('AlertDialog parent authority, latest callbacks, Cancel focus and blocked outside dismissal survive cancelled action and Escape', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open destructive alert', exact: true });
  await trigger.click({ timeout: 3000 });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#alert-requests')).toHaveText('old:true');
  await page.getByLabel('Accept alert requests', { exact: true }).check();
  await page.getByRole('button', { name: 'Replace alert callback', exact: true }).click();
  await trigger.click();
  const alert = page.getByRole('alertdialog', { name: 'Delete the draft?', exact: true });
  await expect(alert).toBeVisible();
  await expect(alert).toHaveAccessibleDescription('This action permanently removes this draft.');
  await expect(alert.getByRole('button', { name: 'Keep draft', exact: true })).toBeFocused();
  await expect(page.locator('#alert-requests')).toHaveText('old:true,latest:true');
  await page.locator('[data-alert-overlay]').click({ position: { x: 5, y: 5 } });
  await expect(alert).toBeVisible();
  await expect(page.locator('#alert-requests')).toHaveText('old:true,latest:true');
  await alert.getByLabel('Prevent destructive action', { exact: true }).check();
  await alert.getByRole('button', { name: 'Delete draft', exact: true }).click();
  await expect(alert).toBeVisible();
  await alert.getByLabel('Prevent alert Escape', { exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(alert).toBeVisible();
  await alert.getByRole('button', { name: 'Keep draft', exact: true }).click();
  await expect(alert).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('#alert-requests')).toHaveText('old:true,latest:true,latest:false');
  await trigger.click();
  await expect(alert.getByRole('button', { name: 'Keep draft', exact: true })).toBeFocused();
  await alert.getByLabel('Prevent destructive action', { exact: true }).uncheck();
  await alert.getByRole('button', { name: 'Delete draft', exact: true }).click();
  await expect(alert).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('#alert-requests')).toHaveText('old:true,latest:true,latest:false,latest:true,latest:false');
});

test('HoverCard delayed requests retain parent authority and latest callbacks; content has no tab stops or focus restoration', async ({ page }) => {
  const trigger = page.getByRole('link', { name: 'Preview profile', exact: true });
  const content = page.locator('[data-profile-preview]');
  await trigger.hover();
  await expect(page.locator('#hover-requests')).toHaveText('old:true');
  await expect(content).toHaveCount(0);
  await page.getByRole('button', { name: 'Replace hover callback', exact: true }).click();
  await page.getByLabel('Accept hover requests', { exact: true }).check();
  await trigger.hover();
  await expect(content).toBeVisible();
  await expect(page.locator('#hover-requests')).toHaveText('old:true,latest:true');
  await expect(content.getByRole('link', { name: 'Profile details', exact: true })).toHaveAttribute('tabindex', '-1');
  await content.hover();
  await expect(content).toBeVisible();
  await trigger.focus();
  await page.keyboard.press('Escape');
  await expect(content).toHaveCount(0);
  await page.waitForTimeout(150);
  await expect(content).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('#hover-requests')).toHaveText('old:true,latest:true,latest:false');
});

test('A default-open portalled HoverCard preserves parent autofocus, Tab scope, branch focus and top-only Escape', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open preview dialog', exact: true });
  await trigger.click({ timeout: 3000 });
  const dialog = page.getByRole('dialog', { name: 'Preview ownership dialog', exact: true });
  const first = dialog.getByRole('button', { name: 'Preview dialog first', exact: true });
  const close = dialog.getByRole('button', { name: 'Close preview dialog', exact: true });
  await expect(first).toBeFocused();
  await expect(page.locator('[data-nested-preview]')).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  const field = page.getByRole('textbox', { name: 'Preview branch field', exact: true });
  await field.focus();
  await expect(field).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-nested-preview]')).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Nested profile preview', exact: true })).not.toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('HoverCard contains a trusted text drag, retains a selection after leaving, and restores body selection styles', async ({ page }) => {
  await page.getByLabel('Accept hover requests', { exact: true }).check();
  await page.getByRole('link', { name: 'Preview profile', exact: true }).hover();
  const content = page.locator('[data-profile-preview]');
  const text = content.getByText('Profile preview text can be selected.', { exact: true });
  await expect(text).toBeVisible();
  const before = await page.evaluate(() => {
    document.body.style.userSelect = 'all';
    document.body.style.webkitUserSelect = 'all';
    return [document.body.style.userSelect, document.body.style.webkitUserSelect];
  });
  const box = (await text.boundingBox())!;
  await page.mouse.move(box.x + 3, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(() => page.evaluate(() => document.body.style.userSelect)).toBe('none');
  await page.mouse.move(box.x + box.width - 3, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => document.getSelection()?.toString())).toContain('Profile preview');
  await expect.poll(() => page.evaluate(() => [document.body.style.userSelect, document.body.style.webkitUserSelect])).toEqual(before);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(150);
  await expect(content).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(content).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => [document.body.style.userSelect, document.body.style.webkitUserSelect])).toEqual(before);
});

test('Tooltip delay and provider warmup link one visible description, keep current IDs, and close a sibling on keyboard focus', async ({ page }) => {
  const alpha = page.getByRole('button', { name: 'Tooltip alpha', exact: true });
  const beta = page.getByRole('button', { name: 'Tooltip beta', exact: true });
  await alpha.hover();
  const content = page.locator('[data-tooltip-alpha]');
  await expect(content).toBeVisible();
  await expect(alpha).toHaveAttribute('data-state', 'delayed-open');
  await expect(alpha).toHaveAccessibleDescription('Existing hint. Alpha tooltip description.');
  await expect(content).toHaveAttribute('role', 'tooltip');
  await expect(content.locator('[data-tooltip-child]')).toHaveCount(1);
  await page.locator('#replace-tooltip-id').evaluate((node: HTMLButtonElement) => node.click());
  await expect(content).toHaveAttribute('id', 'live-tooltip-two');
  await expect(alpha).toHaveAttribute('aria-describedby', 'tooltip-extra-description live-tooltip-two');
  await beta.focus();
  await expect(page.locator('[data-tooltip-beta]')).toBeVisible();
  await expect(content).toHaveCount(0);
  await expect(beta).toHaveAttribute('data-state', 'instant-open');
  await expect(beta).toBeFocused();
  await expect(alpha).toHaveAttribute('aria-describedby', 'tooltip-extra-description');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-tooltip-beta]')).toHaveCount(0);
  await expect(beta).toBeFocused();
});

test('Tooltip pointer transit survives its gap and closes outside the actual flipped placement', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Tooltip alpha', exact: true });
  await page.evaluate(() => { document.body.style.paddingBottom = '100vh'; });
  await trigger.evaluate(node => node.scrollIntoView({ block: 'start' }));
  await trigger.hover();
  const content = page.locator('[data-tooltip-alpha]');
  await expect(content).toBeVisible();
  await expect(content).toHaveAttribute('data-side', 'bottom');
  const from = (await trigger.boundingBox())!;
  const to = (await content.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await expect(content).toBeVisible();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2, { steps: 12 });
  await expect(content).toBeVisible();
  await page.mouse.move(5, 5, { steps: 10 });
  await expect(content).toHaveCount(0);
});

test('Tooltip labelled native factory renders its child once and never writes button MIME defaults onto an anchor', async ({ page }) => {
  const trigger = page.getByRole('link', { name: 'Labelled tooltip anchor', exact: true });
  await trigger.focus();
  await expect(trigger).toHaveAttribute('type', 'text/html');
  await expect(trigger).toHaveAccessibleDescription('Detailed labelled description.');
  const content = page.locator('[data-labelled-tooltip]');
  await expect(content).toBeVisible();
  await expect(content.locator('[data-labelled-child]')).toHaveCount(1);
  await expect(content).not.toHaveAttribute('role', 'tooltip');
  await expect(content.locator('[role="tooltip"]')).toHaveText('Detailed labelled description.');
  await page.keyboard.press('Escape');
  await expect(content).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Tooltip alpha', exact: true }).focus();
  await trigger.focus();
  await expect(content).toBeVisible();
  await page.evaluate(() => window.scrollBy(0, -60));
  await expect(content).toHaveCount(0);
});

test('Tooltip zero skip interval never warms another trigger and disabled hoverable content closes on leave', async ({ page }) => {
  await page.getByLabel('Disable tooltip warmup', { exact: true }).check();
  await page.getByLabel('Disable hoverable tooltip content', { exact: true }).check();
  const alpha = page.getByRole('button', { name: 'Tooltip alpha', exact: true });
  const beta = page.getByRole('button', { name: 'Tooltip beta', exact: true });
  await alpha.hover();
  await expect(page.locator('[data-tooltip-alpha]')).toBeVisible();
  await expect(alpha).toHaveAttribute('data-state', 'delayed-open');
  await beta.hover();
  await expect(page.locator('[data-tooltip-alpha]')).toHaveCount(0);
  await expect(page.locator('[data-tooltip-beta]')).toBeVisible();
  await expect(beta).toHaveAttribute('data-state', 'delayed-open');
  await page.mouse.move(5, 5);
  await expect(page.locator('[data-tooltip-beta]')).toHaveCount(0);
});

test('Tooltip pending keyboard activation is cancelled by Escape without reopening or moving focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Tooltip alpha', exact: true });
  await trigger.focus();
  await page.keyboard.press('Escape');
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
  await expect(page.locator('[data-tooltip-alpha]')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('Tooltip trusted touch does not open a hover preview, while subsequent keyboard focus still opens and dismisses it', async ({ browser }, info) => {
  const context = await browser.newContext({ hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto(info.project.name.endsWith('csr') ? 'http://127.0.0.1:4147/csr' : 'http://127.0.0.1:4147/');
    const alpha = page.getByRole('button', { name: 'Tooltip alpha', exact: true });
    await alpha.tap();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
    await expect(page.locator('[data-tooltip-alpha]')).toHaveCount(0);
    const beta = page.getByRole('button', { name: 'Tooltip beta', exact: true });
    await beta.focus();
    await expect(page.locator('[data-tooltip-beta]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-tooltip-beta]')).toHaveCount(0);
    await expect(beta).toBeFocused();
  } finally {
    await context.close();
  }
});

test('Tooltip controlled requests use the current callback and parent authority while forceMount retains closed content', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Controlled tooltip', exact: true });
  const content = page.locator('[data-controlled-tooltip]');
  const mounted = await content.elementHandle();
  await expect(content).toBeHidden();
  await trigger.focus();
  await expect(page.locator('#tooltip-requests')).toHaveText('old:true');
  await expect(content).toBeHidden();
  await page.getByLabel('Accept tooltip requests', { exact: true }).check();
  await page.getByRole('button', { name: 'Replace tooltip callback', exact: true }).click();
  await trigger.focus();
  await expect(content).toBeVisible();
  await expect(trigger).toHaveAccessibleDescription('Controlled tooltip description.');
  await expect(page.locator('#tooltip-requests')).toHaveText('old:true,latest:true');
  await page.locator('#tooltip-accept').evaluate((input: HTMLInputElement) => input.click());
  await page.keyboard.press('Escape');
  await expect(page.locator('#tooltip-requests')).toHaveText('old:true,latest:true,latest:false');
  await expect(content).toBeVisible();
  await page.locator('#tooltip-accept').evaluate((input: HTMLInputElement) => input.click());
  await page.keyboard.press('Escape');
  await expect(content).toBeHidden();
  await expect(content).toHaveCount(1);
  expect(await mounted!.evaluate(node => node.isConnected)).toBe(true);
  await expect(trigger).toBeFocused();
});

test('Tooltip nested in a modal preserves parent focus ownership and consumer-cancelled Escape dismisses only the correct layer', async ({ page }) => {
  const opener = page.getByRole('button', { name: 'Open tooltip dialog', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Tooltip ownership dialog', exact: true });
  const trigger = dialog.getByRole('button', { name: 'Dialog tooltip trigger', exact: true });
  const content = page.locator('[data-modal-tooltip]');
  await expect(trigger).toBeFocused();
  await expect(content).toBeVisible();
  await expect(trigger).toHaveAccessibleDescription('Modal tooltip description.');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('checkbox', { name: 'Prevent tooltip Escape', exact: true })).toBeFocused();
  await expect(content).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toBeFocused();
  await expect(content).toBeVisible();
  await page.locator('#tooltip-cancel-escape').evaluate((input: HTMLInputElement) => input.click());
  await page.keyboard.press('Escape');
  await expect(content).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.locator('#tooltip-cancel-escape').evaluate((input: HTMLInputElement) => input.click());
  await page.keyboard.press('Escape');
  await expect(content).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => ({ overflow: document.body.style.overflow, pointer: document.body.style.pointerEvents }))).toEqual({ overflow: '', pointer: '' });
});

test('Dropdown keyboard focus, typeahead, cancelled selection state and nested dismissal are native', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open native dropdown', exact: true, includeHidden: true });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Native actions', exact: true });
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const subtrigger = menu.getByRole('menuitem', { name: 'More actions', exact: true });
  await expect(subtrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(menu.getByRole('menuitem', { name: 'Alpha action', exact: true })).toBeFocused();
  await page.keyboard.press('b');
  await expect(menu.getByRole('menuitem', { name: 'Beta action', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const checkbox = menu.getByRole('menuitemcheckbox', { name: 'Keep menu checked', exact: true });
  await expect(checkbox).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await expect(menu).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  const second = menu.getByRole('menuitemradio', { name: 'Second choice', exact: true });
  await expect(second).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('menuitemradio', { name: 'First choice', exact: true })).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  const submenu = page.getByRole('menu', { name: 'More native actions', exact: true });
  await expect(submenu.getByRole('menuitem', { name: 'Nested action', exact: true })).toBeFocused();
  await expect(subtrigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(submenu).toBeHidden();
  await expect(subtrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(menu.getByRole('menuitem', { name: 'More actions', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(submenu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#menu-selections')).toHaveText('nested');
});

test('ContextMenu retains controlled authority and current callbacks while reopening at a new pointer position', async ({ page }) => {
  const target = page.locator('[data-context-trigger]');
  await target.click({ button: 'right', position: { x: 100, y: 10 } });
  await expect(page.getByRole('menu', { name: 'Context actions', exact: true })).toBeHidden();
  await expect(page.locator('#context-requests')).toHaveText('old:true');
  await page.getByLabel('Accept context requests', { exact: true }).check();
  await page.getByRole('button', { name: 'Replace context callback', exact: true }).click();
  await target.click({ button: 'right', position: { x: 100, y: 10 } });
  const menu = page.getByRole('menu', { name: 'Context actions', exact: true });
  await expect(menu).toBeVisible();
  const before = await menu.boundingBox();
  await target.click({ button: 'right', position: { x: 10, y: 25 } });
  await expect.poll(async () => (await menu.boundingBox())!.x).not.toBe(before!.x);
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Context action', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(page.locator('#context-requests')).toHaveText('old:true,latest:true,latest:false');
  await expect(page.locator('#menu-selections')).toHaveText('context');
});

test('Menubar skips disabled triggers, switches open menus, closes submenus backwards and restores the active trigger', async ({ page }) => {
  const bar = page.getByRole('menubar', { name: 'Native menu bar', exact: true });
  const file = bar.getByRole('menuitem', { name: 'File menu', exact: true });
  await file.focus();
  await page.keyboard.press('ArrowDown');
  const fileMenu = page.getByRole('menu', { name: 'File actions', exact: true });
  await expect(fileMenu.getByRole('menuitem', { name: 'File action', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const editMenu = page.getByRole('menu', { name: 'Edit actions', exact: true });
  await expect(fileMenu).toBeHidden();
  await expect(editMenu).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(editMenu).toBeHidden();
  await expect(fileMenu).toBeVisible();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowRight');
  const nested = page.getByRole('menuitem', { name: 'File nested action', exact: true });
  await expect(nested).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(nested).toBeHidden();
  await expect(fileMenu.getByRole('menuitem', { name: 'File submenu', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(fileMenu).toBeHidden();
  await expect(file).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(bar.getByRole('menuitem', { name: 'Edit menu', exact: true })).toBeFocused();
});

test('Menu repeated-character typeahead follows current DOM order, skips disabled items and ignores descendant Enter activation', async ({ page }) => {
  await page.getByRole('button', { name: 'Open native dropdown', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Native actions', exact: true });
  for (const name of ['Beta action', 'Bravo action', 'Berlin action', 'Beta action']) {
    await page.keyboard.press('b');
    await expect(menu.getByRole('menuitem', { name, exact: true })).toBeFocused();
  }
  await menu.locator('[data-menu-berlin]').evaluate(node => node.parentElement!.insertBefore(node, node.parentElement!.querySelector('[data-menu-beta]')));
  await page.keyboard.press('Home');
  await page.keyboard.press('b');
  await expect(menu.getByRole('menuitem', { name: 'Berlin action', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('menuitem', { name: 'Berlin action', exact: true })).toBeFocused();
  const editor = menu.getByRole('textbox', { name: 'Menu editor', exact: true });
  await editor.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(editor).toBeFocused();
  await expect(page.locator('#menu-selections')).toHaveText('');
});

test('RTL Menu and Menubar use logical submenu and trigger directions', async ({ page }) => {
  await page.getByRole('button', { name: 'Use RTL menus', exact: true }).click();
  await page.getByRole('button', { name: 'Open native dropdown', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Native actions', exact: true });
  const subtrigger = menu.getByRole('menuitem', { name: 'More actions', exact: true });
  await subtrigger.focus();
  await page.keyboard.press('ArrowLeft');
  const nested = page.getByRole('menuitem', { name: 'Nested action', exact: true });
  await expect(nested).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(nested).toBeHidden();
  await expect(subtrigger).toBeFocused();
  await page.keyboard.press('Escape');
  const bar = page.getByRole('menubar', { name: 'Native menu bar', exact: true });
  await bar.getByRole('menuitem', { name: 'File menu', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(bar.getByRole('menuitem', { name: 'Edit menu', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Edit action', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('menu', { name: 'File actions', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(bar.getByRole('menuitem', { name: 'File menu', exact: true })).toBeFocused();
});

test('Menu pointer grace follows actual flipped submenu placement and releases focus when returning to a sibling', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open native dropdown', exact: true });
  await trigger.evaluate(node => Object.assign(node.style, { position: 'fixed', right: '4px', top: '50px' }));
  await trigger.click();
  const menu = page.getByRole('menu', { name: 'Native actions', exact: true });
  const subtrigger = menu.getByRole('menuitem', { name: 'More actions', exact: true });
  await subtrigger.hover();
  const submenu = page.getByRole('menu', { name: 'More native actions', exact: true });
  await expect(submenu).toBeVisible();
  await expect(submenu).toHaveAttribute('data-side', 'left');
  const parent = await subtrigger.boundingBox(), child = await submenu.boundingBox();
  await page.mouse.move(parent!.x + 2, parent!.y + parent!.height / 2);
  await page.mouse.move(child!.x + child!.width - 2, parent!.y + parent!.height / 2, { steps: 3 });
  await expect(submenu).toBeVisible();
  await submenu.getByRole('menuitem', { name: 'Nested action', exact: true }).hover();
  await expect(submenu.getByRole('menuitem', { name: 'Nested action', exact: true })).toBeFocused();
  await menu.getByRole('menuitem', { name: 'Beta action', exact: true }).hover();
  await expect(submenu).toBeHidden();
  await expect(menu.getByRole('menuitem', { name: 'Beta action', exact: true })).toBeFocused();
});

test('Menu release on a different item selects it on successive cancelled selections without stale press ownership', async ({ page }) => {
  await page.getByRole('button', { name: 'Open native dropdown', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Native actions', exact: true });
  const checkbox = menu.getByRole('menuitemcheckbox', { name: 'Keep menu checked', exact: true });
  const first = menu.getByRole('menuitem', { name: 'Alpha action', exact: true });
  const second = menu.getByRole('menuitemradio', { name: 'Second choice', exact: true });
  const checkedBox = await checkbox.boundingBox(), firstBox = await first.boundingBox(), secondBox = await second.boundingBox();
  await page.mouse.move(checkedBox!.x + checkedBox!.width / 2, checkedBox!.y + checkedBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(secondBox!.x + secondBox!.width / 2, secondBox!.y + secondBox!.height / 2);
  await page.mouse.up();
  await expect(second).toHaveAttribute('aria-checked', 'true');
  await expect(checkbox).toHaveAttribute('aria-checked', 'false');
  // Start outside the text selected by the first drag; native text dragging cancels the pointer stream.
  await page.mouse.move(firstBox!.x + firstBox!.width / 2, firstBox!.y + firstBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(checkedBox!.x + checkedBox!.width / 2, checkedBox!.y + checkedBox!.height / 2);
  await page.mouse.up();
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await expect(menu).toBeVisible();
});

test('Context long press preserves parent authority and cancels moved or released contact before its deadline', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const target = page.locator('[data-context-trigger]');
  const box = await target.boundingBox();
  const point = { clientX: box!.x + 10, clientY: box!.y + 10 };
  const menu = page.getByRole('menu', { name: 'Context actions', exact: true });
  await target.dispatchEvent('pointerdown', { ...point, pointerType: 'touch' });
  await page.clock.runFor(700);
  await expect(menu).toBeHidden();
  await expect(page.locator('#context-requests')).toHaveText('old:true');
  await target.dispatchEvent('pointerup', { ...point, pointerType: 'touch' });
  await page.getByLabel('Accept context requests', { exact: true }).check();
  await page.getByRole('button', { name: 'Replace context callback', exact: true }).click();
  for (const cancellation of ['pointermove', 'pointerup', 'pointercancel']) {
    await target.dispatchEvent('pointerdown', { ...point, pointerType: 'pen' });
    await page.clock.runFor(699);
    await expect(menu).toBeHidden();
    await target.dispatchEvent(cancellation, { ...point, pointerType: 'pen' });
    await page.clock.runFor(1);
    await expect(page.locator('#context-requests')).toHaveText('old:true');
  }
  await target.dispatchEvent('pointerdown', { ...point, pointerType: 'pen' });
  await page.clock.runFor(699);
  await expect(menu).toBeHidden();
  await page.clock.runFor(1);
  await expect(menu).toBeVisible();
  await expect(page.locator('#context-requests')).toHaveText('old:true,latest:true');
  await target.dispatchEvent('pointerup', { ...point, pointerType: 'pen' });
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.locator('#context-requests')).toHaveText('old:true,latest:true,latest:false');
});

test('NavigationMenu keyboard entry, RTL DOM-order focus and cancelled native selection retain root authority', async ({ page }) => {
  const docs = page.getByRole('button', { name: 'Navigation docs', exact: true });
  await expect(docs).toBeVisible({ timeout: 2000 });
  await docs.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('link', { name: 'Current navigation page', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Navigation guides', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(docs).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(docs).toHaveAttribute('aria-expanded', 'true');
  const first = page.getByRole('link', { name: 'First document', exact: true });
  await page.keyboard.press('ArrowDown');
  await expect(first).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Second document', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(docs).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(docs).toHaveAttribute('aria-expanded', 'false');
  await expect(docs).toBeFocused();
  await page.getByRole('button', { name: 'Reverse navigation direction', exact: true }).click();
  await docs.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('link', { name: 'Current navigation page', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Navigation guides', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('link', { name: 'Guide document', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Allow subnavigation toggle', { exact: true })).toBeFocused();
});

test('NavigationMenu delayed hover, warm switching, leave cancellation and manual activation use owned timers', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const docs = page.getByRole('button', { name: 'Navigation docs', exact: true });
  const guides = page.getByRole('button', { name: 'Navigation guides', exact: true });
  await docs.hover();
  await page.clock.runFor(199);
  await expect(docs).toHaveAttribute('aria-expanded', 'false');
  await page.clock.runFor(1);
  await expect(docs).toHaveAttribute('aria-expanded', 'true');
  await guides.hover();
  await expect(guides).toHaveAttribute('aria-expanded', 'true');
  await page.locator('[data-nav-guides]').hover();
  await page.clock.runFor(150);
  await expect(guides).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#after-navigation').hover();
  await page.clock.runFor(149);
  await expect(guides).toHaveAttribute('aria-expanded', 'true');
  await page.clock.runFor(1);
  await expect(guides).toHaveAttribute('aria-expanded', 'false');
  await page.clock.runFor(300);
  await docs.hover();
  await page.clock.runFor(100);
  await page.locator('#after-navigation').hover();
  await page.clock.runFor(200);
  await expect(docs).toHaveAttribute('aria-expanded', 'false');
  await page.getByLabel('Manual navigation activation', { exact: true }).check();
  await docs.hover();
  await page.clock.runFor(1000);
  await expect(docs).toHaveAttribute('aria-expanded', 'false');
  await docs.click();
  await expect(docs).toHaveAttribute('aria-expanded', 'true');
});

test('NavigationMenu parent refusal, latest callbacks, viewport geometry and asChild decoration preserve live semantics', async ({ page }) => {
  const docs = page.getByRole('button', { name: 'Navigation docs', exact: true });
  await page.getByLabel('Accept navigation requests', { exact: true }).uncheck();
  await docs.focus();
  await page.keyboard.press('Enter');
  await expect(docs).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#navigation-requests')).toHaveText('old:docs');
  await page.getByRole('button', { name: 'Replace navigation callback', exact: true }).click();
  await page.getByLabel('Accept navigation requests', { exact: true }).check();
  await docs.focus();
  await page.keyboard.press('Enter');
  await expect(docs).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#navigation-requests')).toHaveText('old:docs,latest:docs');
  const viewport = page.locator('section[data-nav-viewport]');
  await expect(viewport.locator('[data-nav-decoration]')).toHaveText('Viewport decoration');
  await expect(viewport.locator('[data-nav-docs]')).toBeVisible();
  await expect(viewport).toHaveCSS('--radix-navigation-menu-viewport-width', '274px');
  await expect(viewport).toHaveCSS('--radix-navigation-menu-viewport-height', '194px');
  const indicator = page.locator('[data-nav-indicator]');
  await expect(indicator).toHaveAttribute('data-state', 'visible');
  const firstPosition = await indicator.evaluate(node => node.style.transform);
  const draft = page.getByRole('textbox', { name: 'Persistent navigation draft', exact: true });
  await draft.fill('preserved owner');
  await page.getByRole('button', { name: 'Navigation guides', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(viewport.locator('[data-nav-guides]')).toBeVisible();
  await expect(viewport).toHaveCSS('--radix-navigation-menu-viewport-width', '394px');
  await expect.poll(() => indicator.evaluate(node => node.style.transform)).not.toBe(firstPosition);
  await expect(page.locator('[data-nav-guides]')).toHaveAttribute('data-motion', 'from-end');
  await page.keyboard.press('Escape');
  await expect(viewport).toBeHidden();
});

test('NavigationMenu Sub inherits manual mode, keeps selected triggers open by default and allows explicit toggling', async ({ page }) => {
  await page.getByLabel('Manual navigation activation', { exact: true }).check();
  await page.getByRole('button', { name: 'Navigation docs', exact: true }).click();
  const basic = page.getByRole('button', { name: 'Basic subnavigation', exact: true });
  const advanced = page.getByRole('button', { name: 'Advanced subnavigation', exact: true });
  await expect(basic).toHaveAttribute('aria-expanded', 'true');
  await basic.click();
  await expect(basic).toHaveAttribute('aria-expanded', 'true');
  await advanced.hover();
  await page.waitForTimeout(250);
  await expect(advanced).toHaveAttribute('aria-expanded', 'false');
  await advanced.click();
  await expect(advanced).toHaveAttribute('aria-expanded', 'true');
  await advanced.click();
  await expect(advanced).toHaveAttribute('aria-expanded', 'true');
  await page.getByLabel('Allow subnavigation toggle', { exact: true }).check();
  await expect(page.getByRole('button', { name: 'Navigation docs', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Navigation docs', exact: true }).click();
  await advanced.click();
  await advanced.click();
  await expect(advanced).toHaveAttribute('aria-expanded', 'false');
});

test('NavigationMenu inline vertical entry and bubbling selected Link restore only navigation-owned focus', async ({ page }) => {
  const inline = page.getByRole('button', { name: 'Inline navigation trigger', exact: true });
  await inline.focus();
  await page.keyboard.press('ArrowRight');
  const link = page.getByRole('link', { name: 'Inline document', exact: true });
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(inline).toHaveAttribute('aria-expanded', 'false');
  await expect(inline).toBeFocused();
  await page.getByLabel('Cancel navigation selection', { exact: true }).uncheck();
  const docs = page.getByRole('button', { name: 'Navigation docs', exact: true });
  await docs.click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(docs).toHaveAttribute('aria-expanded', 'false');
  await expect(docs).toBeFocused();
});

test('outside pointer reaches submenu and modal root in one interaction', async ({ page }) => {
  await page.getByRole('button', { name: 'Open native dropdown', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await page.getByRole('menuitem', { name: 'More actions', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  const menu = page.getByRole('menu', { name: 'Native actions', exact: true });
  const submenu = page.getByRole('menu', { name: 'More native actions', exact: true });
  await expect(submenu).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(submenu).toHaveCount(0);
  await expect(menu).toHaveCount(0);
});

test('keyboard Menu End scrolls the focused item into a short viewport', async ({ page }) => {
  await page.getByRole('button', { name: 'Open native dropdown', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Native actions', exact: true });
  await menu.evaluate(node => Object.assign(node.style, { maxHeight: '100px', overflow: 'auto' }));
  await page.keyboard.press('End');
  const last = menu.getByRole('menuitem', { name: 'Embedded editor', exact: false });
  await expect(last).toBeFocused();
  await expect.poll(() => menu.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await last.evaluate(node => {
    const item = node.getBoundingClientRect(), viewport = node.closest('[role="menu"]')!.getBoundingClientRect();
    return item.top >= viewport.top && item.bottom <= viewport.bottom;
  })).toBe(true);
});

test('NavigationMenu Sub renders its native host and honors its own manual activation', async ({ page }) => {
  await page.clock.install();
  await page.getByLabel('Manual subnavigation activation', { exact: true }).check();
  await page.getByRole('button', { name: 'Navigation docs', exact: true }).focus();
  await page.keyboard.press('Enter');
  const host = page.locator('[data-nav-sub]');
  await expect(host).toHaveJSProperty('tagName', 'DIV');
  await expect(host).toHaveAttribute('data-orientation', 'horizontal');
  const advanced = page.getByRole('button', { name: 'Advanced subnavigation', exact: true });
  await advanced.hover();
  await page.clock.runFor(250);
  await expect(advanced).toHaveAttribute('aria-expanded', 'false');
  await advanced.click();
  await expect(advanced).toHaveAttribute('aria-expanded', 'true');
});

test('NavigationMenu viewport removal disposes its parked content before reopening', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Navigation docs', exact: true });
  await trigger.click();
  await page.getByRole('textbox', { name: 'Persistent navigation draft', exact: true }).fill('old owner');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-nav-viewport]')).toHaveCount(0);
  await trigger.click();
  await expect(page.getByRole('textbox', { name: 'Persistent navigation draft', exact: true })).toHaveValue('');
});

test('NavigationMenu keyboard End reveals an offscreen trigger', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Native site navigation', exact: true });
  const list = nav.locator('ul').first();
  await list.evaluate(node => {
    Object.assign(node.style, { width: '100px', overflow: 'auto' });
    for (const item of node.children) (item as HTMLElement).style.flex = '0 0 180px';
  });
  await nav.getByRole('button', { name: 'Navigation docs', exact: true }).focus();
  await page.keyboard.press('End');
  const last = nav.getByRole('button', { name: 'Navigation guides', exact: true });
  await expect(last).toBeFocused();
  await expect.poll(() => list.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
});
