import { test, expect } from '@playwright/test';

declare global { interface Window { __target?: Element; } }

test.beforeEach(async ({ page }, info) => { await page.goto(info.project.name === 'csr' ? '/csr' : '/'); });

test('controlled rejection, acceptance and callback replacement remain parent-authoritative', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Controlled', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(page.locator('#requests')).toHaveText('old:true');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Replace callback and accept' }).click();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#requests')).toHaveText('old:true,new:true');
});

test('consumer cancellation prevents internal toggling, while Slot still calls child before parent', async ({ page }) => {
  await page.getByRole('button', { name: 'Cancelled' }).click();
  await expect(page.getByRole('button', { name: 'Cancelled' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Slotted cancel' }).click();
  await expect(page.locator('#order')).toHaveText('child,parent');
  await expect(page.getByRole('button', { name: 'Slotted cancel' })).toHaveAttribute('aria-pressed', 'false');
});

test('reactive custom target preserves host identity, both refs and child merge precedence', async ({ page }) => {
  const link = page.getByRole('button', { name: 'Custom target' });
  await expect(link).toContainClass('parent child');
  await expect(link).toHaveAttribute('aria-describedby', 'child-help shared parent-help');
  await expect(link).toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect(link).toHaveCSS('padding-left', '4px');
  await expect(page.locator('#refs')).toHaveText('same host');
  await link.evaluate(node => { window.__target = node; });
  await link.press('Space');
  await expect(link).toHaveAttribute('aria-pressed', 'true');
  await link.press('Enter');
  await expect(link).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Update target' }).click();
  await expect(link).toContainClass('updated child');
  await expect(link).not.toContainClass('parent');
  await expect(link).toHaveAttribute('href', '#updated');
  await expect(link).toHaveAttribute('data-disabled', '');
  await link.evaluate(node => { if (node !== window.__target) throw Error('custom host replaced'); });
  await link.click();
  await expect(link).toHaveAttribute('aria-pressed', 'false');
});

test('undefined defaults survive forwarding and changed defaults never reset user state', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Defaulted' });
  await expect(toggle).toHaveAttribute('type', 'button');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Change default' }).click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

test('Slottable loading content stays inside its sole target and listeners do not duplicate after remount', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Leading Label Trailing' });
  await expect(toggle.locator('[data-leading]')).toHaveCount(1);
  await expect(toggle.locator('[data-trailing]')).toHaveCount(1);
  await toggle.click();
  await expect(page.locator('#remount-requests')).toHaveText('1');
  await page.getByRole('button', { name: 'Remount target' }).click();
  await page.getByRole('button', { name: 'Leading Label Trailing' }).click();
  await expect(page.locator('#remount-requests')).toHaveText('2');
  await page.getByRole('button', { name: 'Load content' }).click();
  await expect(page.getByRole('button', { name: 'Leading Loading Trailing' })).toHaveCount(1);
});

test('missing, multiple and substituted targets fail explicitly before they mount', async ({ page }) => {
  await page.getByRole('button', { name: 'Check invalid composition' }).click();
  await expect(page.locator('#invalid-results')).toHaveText('missing,multiple,substituted');
});

test('bound native handlers retain their data and cancellation through mixed style/class composition', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Bound target' });
  await expect(toggle).toContainClass('parent child badge');
  await expect(toggle).toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect(toggle).toHaveCSS('font-weight', '700');
  await toggle.click();
  await expect(page.locator('#bound-order')).toHaveText('child-data,parent-data');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('native ref consumers run once on unchanged plain, composite and Dialog hosts', async ({ page }) => {
  await expect(page.locator('#ref-calls')).toHaveText('{"plain":1,"parent":1,"child":1,"dialog":1}');
  for (const name of ['Plain ref toggle', 'Composite ref toggle', 'Dialog ref trigger']) {
    const target = page.getByRole('button', { name, exact: true });
    const host = await target.elementHandle();
    await target.click();
    await target.click();
    expect(await target.evaluate((node, original) => original !== null && node === original && original.isConnected, host)).toBe(true);
  }
  await expect(page.locator('#ref-calls')).toHaveText('{"plain":1,"parent":1,"child":1,"dialog":1}');
});

test('replacement native refs initialize the current consumers on the existing hosts', async ({ page }) => {
  const names = ['Plain ref toggle', 'Composite ref toggle', 'Dialog ref trigger'];
  const hosts = await Promise.all(names.map(name => page.getByRole('button', { name, exact: true }).elementHandle()));
  await expect(page.locator('#ref-calls')).toHaveText('{"plain":1,"parent":1,"child":1,"dialog":1}');
  await page.getByRole('button', { name: 'Replace native refs', exact: true }).click();
  for (const [index, name] of names.entries()) {
    const target = page.getByRole('button', { name, exact: true });
    for (const consumer of index === 0 ? ['plain'] : index === 1 ? ['parent', 'child'] : ['dialog']) {
      await expect(target).toHaveAttribute(`data-${consumer}-ref-consumer`, 'replacement');
    }
    expect(await target.evaluate((node, original) => original !== null && node === original && original.isConnected, hosts[index] ?? null)).toBe(true);
    await target.click();
    await target.click();
  }
  await expect(page.locator('#ref-calls')).toHaveText('{"plain":1,"parent":1,"child":1,"dialog":1}');
  await expect(page.locator('#replacement-ref-calls')).toHaveText('{"plain":1,"parent":1,"child":1,"dialog":1}');
});

test('atomic prop updates do not reinitialize unchanged Dialog and Slot ref consumers', async ({ page }) => {
  const names = ['Atomic dialog ref trigger', 'Atomic composite ref toggle'];
  const hosts = await Promise.all(names.map(name => page.getByRole('button', { name, exact: true }).elementHandle()));
  await expect(page.locator('#atomic-ref-calls')).toHaveText('{"dialog":1,"parent":1,"child":1}');
  await page.getByRole('button', { name: 'Update atomic props', exact: true }).click();
  await page.getByRole('button', { name: 'Update atomic props', exact: true }).click();
  for (const [index, name] of names.entries()) {
    const target = page.getByRole('button', { name, exact: true });
    await expect(target).toHaveAttribute('data-version', '2');
    expect(await target.evaluate((node, original) => original !== null && node === original && original.isConnected, hosts[index] ?? null)).toBe(true);
  }
  await expect(page.locator('#atomic-ref-calls')).toHaveText('{"dialog":1,"parent":1,"child":1}');
});
