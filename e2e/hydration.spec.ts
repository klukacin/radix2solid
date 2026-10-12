import { test, expect } from '@playwright/test';

declare global { interface Window { __serverNodes?: Element[]; __serverIds?: string[]; __serverSecond?: Element | null; } }

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
  });
  const serverIds = await page.evaluate(() => window.__serverIds);
  expect(serverIds).toHaveLength(2);
  expect(new Set(serverIds).size).toBe(2);
  release();
  await expect(page.locator('#refs')).toHaveText('same host');
  // Check hydration before the outside click intentionally disposes open navigation content.
  expect(await page.evaluate(() => window.__serverNodes?.every(node => node.isConnected && document.querySelector(`#${node.closest('[id^="root-"]')?.id}`)?.contains(node)))).toBe(true);
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-id-proof]')].map(node => node.id))).toEqual(serverIds);
  const inline = page.locator('[data-inline-navigation]');
  await expect(inline).toBeVisible();
  const native = page.getByRole('button', { name: 'Second root' });
  await native.click();
  await expect(native).toHaveAttribute('aria-pressed', 'true');
  await expect(inline).toHaveCount(0);
  expect(await native.evaluate(node => node === window.__serverSecond)).toBe(true);
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-id-proof]')].map(node => node.id))).toEqual(serverIds);
  await expect(page.locator('#root-a [data-id-proof]')).toHaveAttribute('aria-describedby', `${serverIds?.[0]}-description`);
  expect(problems).toEqual([]);
});
