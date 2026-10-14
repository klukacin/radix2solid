import { test, expect } from '@playwright/test';

declare global { interface Window { __serverNodes?: Element[]; __serverIds?: string[]; __serverSecond?: Element | null; __serverSlotDialogs?: (Element | null)[]; __serverAvatarTrigger?: (Element | null)[]; } }

// Slot-backed Dialog content with lazy children, through a native target and through a custom component target
// that renders its own context provider and a named host with an intermediate wrapper: ARIA links to the generated
// Title/Description IDs.
const slotDialogs = ['[data-slot-dialog]', '[data-slot-custom-dialog]'];
const slotDialogLinks = (selectors: string[]) => selectors.map(selector => {
  const dialog = document.querySelector(selector);
  const context = dialog?.querySelector('[data-slot-context]');
  return {
    role: dialog?.getAttribute('role'),
    labelledby: dialog?.getAttribute('aria-labelledby'), titleId: dialog?.querySelector('h2')?.id,
    describedby: dialog?.getAttribute('aria-describedby'), descriptionId: dialog?.querySelector('p')?.id,
    context: context && { id: context.id, text: context.textContent }
  };
});

test('packed server renders without window and hydrates two CSP roots without replacing nodes or IDs', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) problems.push(message.text()); });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/(src\/entry-client\.tsx|assets\/.*\.js)(\?.*)?$/, async route => { await held; await route.continue(); });
  const response = await page.goto('/', { waitUntil: 'commit' });
  expect(response?.headers()['content-security-policy']).toContain("'nonce-");
  await page.waitForSelector('#root-b button');
  await page.evaluate(() => {
    window.__serverNodes = [...document.querySelectorAll('#root-a button, #root-a a, #root-b button')];
    window.__serverIds = [...document.querySelectorAll('[data-id-proof]')].map(node => node.id);
    window.__serverSecond = document.querySelector('#root-b [data-id-proof]');
    window.__serverSlotDialogs = ['[data-slot-dialog]', '[data-slot-custom-dialog]'].map(selector => document.querySelector(selector));
    const button = document.querySelector('button[aria-label="Slot avatar menu"]');
    window.__serverAvatarTrigger = [button, button?.querySelector('.rt-AvatarRoot') ?? null];
  });
  const serverIds = await page.evaluate(() => window.__serverIds);
  expect(serverIds).toHaveLength(2);
  expect(new Set(serverIds).size).toBe(2);
  const serverSlotDialogs = await page.evaluate(slotDialogLinks, slotDialogs);
  for (const dialog of serverSlotDialogs) {
    expect(dialog.role).toBe('dialog');
    expect(dialog.titleId).toBeTruthy();
    expect(dialog.descriptionId).toBeTruthy();
    expect(dialog.labelledby).toBe(dialog.titleId);
    expect(dialog.describedby).toBe(dialog.descriptionId);
  }
  expect(serverSlotDialogs[0].context).toBeNull();
  expect(serverSlotDialogs[1].context?.text).toBe('inside');
  expect(serverSlotDialogs[1].context?.id).toBeTruthy();
  expect(new Set(serverSlotDialogs.flatMap(dialog => [dialog.titleId, dialog.descriptionId])).size).toBe(4);
  expect(await page.evaluate(() => window.__serverAvatarTrigger?.map(node => node?.tagName ?? null)), 'server renders the Avatar inside the IconButton trigger').toEqual(['BUTTON', 'SPAN']);
  release();
  await expect(page.locator('#refs')).toHaveText('same host');
  // Check hydration before the outside click intentionally disposes open navigation content.
  expect(await page.evaluate(() => window.__serverNodes?.every(node => node.isConnected && document.querySelector(`#${node.closest('[id^="root-"]')?.id}`)?.contains(node)))).toBe(true);
  expect(await page.evaluate(selectors => selectors.map((selector, index) => document.querySelector(selector) === window.__serverSlotDialogs?.[index]), slotDialogs)).toEqual([true, true]);
  expect(await page.evaluate(slotDialogLinks, slotDialogs)).toEqual(serverSlotDialogs);
  await expect(page.locator('[data-slot-custom-dialog]')).toHaveAccessibleName('Hydrated custom slot title');
  await expect(page.locator('[data-slot-custom-dialog]')).toHaveAccessibleDescription('Hydrated custom slot description');
  expect(await page.evaluate(() => {
    const button = document.querySelector('button[aria-label="Slot avatar menu"]');
    return [button, button?.querySelector('.rt-AvatarRoot') ?? null].map((node, index) => node !== null && node === window.__serverAvatarTrigger?.[index]);
  }), 'the IconButton trigger and its Avatar keep their server nodes').toEqual([true, true]);
  const inline = page.locator('[data-inline-navigation]');
  await expect(inline).toBeVisible();
  const namedDialog = page.locator('[data-slot-custom-dialog]');
  await expect(namedDialog).toHaveAccessibleName('Hydrated custom slot title');
  await namedDialog.getByRole('button', { name: 'Toggle slot dialog label', exact: true }).click();
  await expect(inline).toHaveCount(0);
  await expect(namedDialog).toHaveAccessibleName('Explicit slot dialog');
  await expect(namedDialog).not.toHaveAttribute('aria-labelledby');
  await expect(namedDialog).not.toHaveAttribute('aria-describedby');
  await namedDialog.getByRole('button', { name: 'Toggle slot dialog label', exact: true }).click();
  await expect(namedDialog).toHaveAccessibleName('Hydrated custom slot title');
  await expect(namedDialog).toHaveAccessibleDescription('Hydrated custom slot description');
  await expect(namedDialog).toHaveAttribute('aria-labelledby', serverSlotDialogs[1].titleId!);
  await expect(namedDialog).toHaveAttribute('aria-describedby', serverSlotDialogs[1].descriptionId!);
  await expect(namedDialog.locator('[data-slot-context]')).toHaveText('inside');
  expect(await namedDialog.evaluate(node => node === window.__serverSlotDialogs?.[1])).toBe(true);
  expect((await page.evaluate(slotDialogLinks, slotDialogs))[1]).toEqual(serverSlotDialogs[1]);
  const avatarMenu = page.getByRole('button', { name: 'Slot avatar menu', exact: true });
  await avatarMenu.click();
  await expect(page.getByRole('menuitem', { name: 'Slot avatar action', exact: true }), 'the hydrated trigger opens its menu').toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menuitem', { name: 'Slot avatar action', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-id-proof]')].map(node => node.id))).toEqual(serverIds);
  const native = page.getByRole('button', { name: 'Second root' });
  await native.click();
  await expect(native).toHaveAttribute('aria-pressed', 'true');
  await expect(inline).toHaveCount(0);
  expect(await native.evaluate(node => node === window.__serverSecond)).toBe(true);
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-id-proof]')].map(node => node.id))).toEqual(serverIds);
  await expect(page.locator('#root-a [data-id-proof]')).toHaveAttribute('aria-describedby', `${serverIds?.[0]}-description`);
  expect(problems).toEqual([]);
});
