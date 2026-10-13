import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, info) => {
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
});

test('a portalled nonmodal Popover stays inside modal focus and scroll ownership, and Escape restores each trigger', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) problems.push(message.text()); });
  await page.getByRole('button', { name: 'Open layered dialog', exact: true }).click({ timeout: 3000 });
  const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open nested popover', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Open nested popover', exact: true }).click();
  const popover = page.getByRole('dialog', { name: 'Nested popover', exact: true });
  await expect(popover).toBeVisible();
  await expect(popover.getByRole('textbox', { name: 'Branch field' })).toBeFocused();
  await popover.getByRole('button', { name: 'Branch last', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(popover.getByRole('textbox', { name: 'Branch field' })).toBeFocused();
  const scroll = popover.locator('[data-branch-scroll]');
  await scroll.hover();
  await page.mouse.wheel(0, 150);
  await expect.poll(() => scroll.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  const arrow = popover.locator('[data-layer-arrow]');
  await expect.poll(async () => {
    const [content, tip] = await Promise.all([popover.boundingBox(), arrow.boundingBox()]);
    return Math.round(content!.y - tip!.y - tip!.height);
  }).toBe(0);
  await popover.getByRole('button', { name: 'Place popover above', exact: true }).click();
  await expect(popover).toHaveAttribute('data-side', 'top');
  await expect.poll(async () => {
    const [content, tip] = await Promise.all([popover.boundingBox(), arrow.boundingBox()]);
    return Math.round(tip!.y - content!.y - content!.height);
  }).toBe(0);
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open nested popover', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open layered dialog', exact: true })).toBeFocused();
  await expect.poll(() => page.evaluate(() => [document.body.style.pointerEvents, document.body.style.overflow])).toEqual(['', '']);
  const placements = await page.locator('#layer-placements').textContent();
  await page.setViewportSize({ width: 1100, height: 700 });
  await page.evaluate(() => {
    const { promise, resolve } = Promise.withResolvers<void>();
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    return promise;
  });
  await expect(page.locator('#layer-placements')).toHaveText(placements!);
  expect(problems).toEqual([]);
});

test('controlled refusal and callback replacement remain authoritative; live labels and cancellable dismissal preserve ARIA', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open layered dialog', exact: true });
  await page.getByLabel('Accept dialog requests', { exact: true }).uncheck();
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#layer-requests')).toHaveText('old:true');
  await page.getByRole('button', { name: 'Replace dialog callback', exact: true }).click();
  await page.getByLabel('Accept dialog requests', { exact: true }).check();
  await trigger.click();
  const dialog = page.locator('[data-layer="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#layer-requests')).toHaveText('old:true,new:true');
  const title = await dialog.getByRole('heading', { name: 'Layered dialog' }).getAttribute('id');
  const description = await dialog.getByText('Modal ownership includes descendant portals.', { exact: true }).getAttribute('id');
  await expect(dialog).toHaveAttribute('aria-labelledby', title!);
  await expect(dialog).toHaveAttribute('aria-describedby', `layer-help ${description}`);
  await dialog.getByRole('button', { name: 'Toggle dialog labels', exact: true }).click();
  await expect(dialog).not.toHaveAttribute('aria-labelledby');
  await expect(dialog).toHaveAttribute('aria-describedby', 'layer-help');
  await dialog.getByRole('button', { name: 'Toggle dialog labels', exact: true }).click();
  await expect(dialog).toHaveAttribute('aria-labelledby', title!);
  await expect(dialog).toHaveAttribute('aria-describedby', `layer-help ${description}`);
  await dialog.getByLabel('Cancel Escape', { exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Cancel outside dismissal', { exact: true }).check();
  await page.locator('[data-layer-overlay]').click({ position: { x: 5, y: 5 } });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#outside-target')).toHaveText('overlay');
  await expect(page.locator('#layer-requests')).toHaveText('old:true,new:true');
  await dialog.getByLabel('Cancel outside dismissal', { exact: true }).uncheck();
  await page.locator('[data-layer-overlay]').click({ position: { x: 5, y: 5 } });
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('#layer-requests')).toHaveText('old:true,new:true,new:false');
});

test('autofocus events have the real content target and cancellation prevents both initial and restored focus', async ({ page }) => {
  await page.getByLabel('Cancel open autofocus', { exact: true }).check();
  await page.getByLabel('Cancel close autofocus', { exact: true }).check();
  const trigger = page.getByRole('button', { name: 'Open layered dialog', exact: true, includeHidden: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('#layer-focus-events')).toHaveText('open:dialog');
  await dialog.getByRole('button', { name: 'Open nested popover', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).not.toBeFocused();
  await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true);
  await expect(page.locator('#layer-focus-events')).toHaveText('open:dialog,close:dialog');
  await page.getByLabel('Cancel open autofocus', { exact: true }).uncheck();
  await page.getByLabel('Cancel close autofocus', { exact: true }).uncheck();
  await trigger.click();
  await expect(dialog.getByRole('button', { name: 'Open nested popover', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('independent roots share the modal stack; focused removal recovers and final close restores existing body styles', async ({ page }) => {
  await page.evaluate(() => {
    document.body.style.pointerEvents = 'auto';
    document.body.style.overflow = 'scroll';
    document.body.style.paddingRight = '7px';
    document.querySelector('#root-b')!.setAttribute('aria-hidden', 'false');
  });
  await page.getByRole('button', { name: 'Open layered dialog', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
  await dialog.getByRole('textbox', { name: 'Removable focus', exact: true }).focus();
  await page.keyboard.press('Delete');
  await expect(dialog.getByRole('textbox', { name: 'Removable focus', exact: true })).toHaveCount(0);
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Open nested popover', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Open independent root', exact: true }).click();
  const independent = page.getByRole('dialog', { name: 'Independent dialog', exact: true });
  await expect(independent).toBeVisible();
  await expect(independent.getByRole('button', { name: 'Close independent dialog', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(independent).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open independent root', exact: true })).toBeFocused();
  await expect.poll(() => page.evaluate(() => [document.body.style.pointerEvents, document.body.style.overflow])).toEqual(['none', 'hidden']);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => [document.body.style.pointerEvents, document.body.style.overflow, document.body.style.paddingRight])).toEqual(['auto', 'scroll', '7px']);
  await expect(page.locator('#root-b')).toHaveAttribute('aria-hidden', 'false');
});

for (const mode of ['custom', 'shadow'] as const) {
  test(`${mode} container preserves portal context, focus, scroll and top-only Escape`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Portal container', exact: true }).selectOption(mode);
    await page.getByRole('button', { name: 'Open layered dialog', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
    await dialog.getByRole('button', { name: 'Open nested popover', exact: true }).click();
    const popover = page.getByRole('dialog', { name: 'Nested popover', exact: true });
    await expect(popover).toBeVisible();
    expect(await popover.evaluate((node, mode) => mode === 'shadow'
      ? node.getRootNode() === document.querySelector('[data-shadow-container]')!.shadowRoot
      : document.querySelector('[data-custom-container]')!.contains(node), mode)).toBe(true);
    await expect(popover.getByRole('textbox', { name: 'Branch field', exact: true })).toBeFocused();
    const scroll = popover.locator('[data-branch-scroll]');
    await scroll.hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => scroll.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Open nested popover', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
}

test('opening pointer cannot dismiss its new layer; capture, bubble and mouse-down interception suppress outside dismissal', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open standalone popover', exact: true });
  const popover = page.getByRole('dialog', { name: 'Standalone popover', exact: true });
  for (const mode of ['capture', 'bubble', 'mousedown']) {
    await page.getByRole('combobox', { name: 'Interception', exact: true }).selectOption(mode);
    await trigger.hover();
    await page.mouse.down();
    await expect(popover).toHaveCount(0);
    await page.mouse.up();
    await expect(popover).toBeVisible();
    await page.getByRole('button', { name: 'Outside interceptor', exact: true }).click();
    await expect(popover).toBeVisible();
    await page.getByRole('button', { name: 'Outside normal', exact: true }).click();
    await expect(popover).toBeHidden();
    await expect(page.getByRole('button', { name: 'Outside normal', exact: true })).toBeFocused();
  }
});

test('right and control clicks do not dismiss a modal; nonmodal right-click dismissal does not steal focus', async ({ page }) => {
  await page.getByRole('button', { name: 'Open layered dialog', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
  const overlay = page.locator('[data-layer-overlay]');
  await overlay.click({ button: 'right', position: { x: 5, y: 5 } });
  await expect(dialog).toBeVisible();
  await overlay.click({ modifiers: ['Control'], position: { x: 5, y: 5 } });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#layer-requests')).toHaveText('old:true');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open standalone popover', exact: true }).click();
  const standalone = page.getByRole('dialog', { name: 'Standalone popover', exact: true });
  await expect(standalone).toBeVisible();
  await page.getByRole('button', { name: 'Outside normal', exact: true }).click({ button: 'right' });
  await expect(standalone).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open standalone popover', exact: true })).not.toBeFocused();
});

test('exit presence survives child events and close-reopen; real animation end and cancellation dispose it', async ({ page }) => {
  await page.getByLabel('Animate exit', { exact: true }).check();
  const trigger = page.getByRole('button', { name: 'Open layered dialog', exact: true });
  await trigger.click();
  const dialog = page.locator('[data-layer="dialog"]');
  await dialog.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
  const original = await dialog.elementHandle();
  // Hold the real exit animation so close→reopen never races its 200ms duration on slow runners.
  await dialog.evaluate(node => { node.style.animationPlayState = 'paused'; });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveAttribute('data-state', 'closed');
  await expect(dialog).toBeAttached();
  await dialog.getByRole('button', { name: 'Open nested popover', exact: true }).dispatchEvent('animationend', { animationName: 'layerExit', bubbles: true });
  await expect(dialog).toBeAttached();
  await trigger.click();
  await expect(dialog).toHaveAttribute('data-state', 'open');
  expect(await dialog.evaluate((node, previous) => node === previous, original)).toBe(true);
  await dialog.evaluate(node => { node.style.removeProperty('animation-play-state'); });
  await dialog.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await trigger.click();
  await dialog.evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
  await dialog.evaluate(node => { node.style.animationPlayState = 'paused'; });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveAttribute('data-state', 'closed');
  await dialog.evaluate(node => node.getAnimations().forEach(animation => animation.cancel()));
  await expect(dialog).toHaveCount(0);
  await original?.dispose();
});

test('roving focus dispatches a targeted entry event and follows current DOM order, disabled items and reactive RTL', async ({ page }) => {
  await page.getByRole('button', { name: 'Open layered dialog', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
  const group = dialog.getByRole('toolbar', { name: 'Layer options', exact: true });
  const a = group.getByRole('button', { name: 'Roving A', exact: true });
  const b = group.getByRole('button', { name: 'Roving B', exact: true });
  await group.evaluate(node => node.focus());
  await expect(a).toBeFocused();
  await expect(page.locator('#layer-focus-events')).toHaveText('open:dialog,roving:roving');
  await page.keyboard.press('ArrowRight');
  await expect(b).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(a).toBeFocused();
  await dialog.getByRole('button', { name: 'Reverse DOM options', exact: true }).click();
  await a.focus();
  await page.keyboard.press('Home');
  await expect(b).toBeFocused();
  await page.keyboard.press('End');
  await expect(a).toBeFocused();
  await dialog.getByRole('button', { name: 'Reverse direction', exact: true }).click();
  await a.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(b).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(a).toBeFocused();
});

test('explicit scope resolves its outer compound through a nested default provider', async ({ page }) => {
  await page.getByRole('button', { name: 'Open outer scoped dialog', exact: true }).click();
  const outer = page.getByRole('dialog', { name: 'Outer scoped dialog', exact: true });
  const inner = page.getByRole('dialog', { name: 'Inner unscoped dialog', exact: true });
  await expect(outer).toBeVisible();
  await expect(inner).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(outer).toHaveCount(0);
  await page.getByRole('button', { name: 'Open inner unscoped dialog', exact: true }).click();
  await expect(inner).toBeVisible();
  await expect(outer).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(inner).toHaveCount(0);
});

test('force-mounted default-open portal mounts only on the client and stops ownership when closed', async ({ page }) => {
  await page.getByRole('button', { name: 'Mount default-open portal', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Default-open client portal', exact: true });
  await expect(dialog).toBeVisible();
  const original = await dialog.elementHandle();
  await dialog.getByRole('button', { name: 'Close default-open portal', exact: true }).click();
  await expect(page.locator('[data-server-portal]')).toHaveAttribute('data-state', 'closed');
  await expect(page.locator('[data-server-portal]')).toBeHidden();
  expect(await page.locator('[data-server-portal]').evaluate((node, previous) => node === previous, original)).toBe(true);
  await expect.poll(() => page.evaluate(() => [document.body.style.pointerEvents, document.body.style.overflow])).toEqual(['', '']);
  await original?.dispose();
});

test.describe('trusted touch', () => {
  test.use({ hasTouch: true });
  test('trusted nested taps preserve opening interactions and reach each outside boundary', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open layered dialog', exact: true });
    await trigger.tap();
    const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Open nested popover', exact: true }).tap();
    const popover = page.getByRole('dialog', { name: 'Nested popover', exact: true });
    await expect(popover).toBeVisible();
    await page.locator('[data-layer-overlay]').tap({ position: { x: 5, y: 5 } });
    await expect(popover).toBeHidden();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(() => [document.body.style.pointerEvents, document.body.style.overflow])).toEqual(['', '']);
  });
  test('outside swipe is not a click; portalled branch scroll works under a modal and outside tap dismisses', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Trusted swipes require the Chromium-only CDP input protocol; taps are checked separately in every engine.');
    const session = await context.newCDPSession(page);
    await page.getByRole('button', { name: 'Open standalone popover', exact: true }).tap();
    const standalone = page.getByRole('dialog', { name: 'Standalone popover', exact: true });
    await expect(standalone).toBeVisible();
    const outside = page.getByRole('button', { name: 'Outside normal', exact: true });
    await outside.scrollIntoViewIfNeeded();
    const outsideBox = (await outside.boundingBox())!;
    const before = await page.evaluate(() => scrollY);
    const x = outsideBox.x + outsideBox.width / 2;
    const y = Math.min(outsideBox.y + outsideBox.height / 2, 590);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (const offset of [20, 40, 60, 80]) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + offset }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before);
    await expect(standalone).toBeVisible();
    await outside.tap();
    await expect(standalone).toBeHidden();
    await page.getByRole('button', { name: 'Open layered dialog', exact: true }).tap();
    const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
    await dialog.getByRole('button', { name: 'Open nested popover', exact: true }).tap();
    const popover = page.getByRole('dialog', { name: 'Nested popover', exact: true });
    const scroll = popover.locator('[data-branch-scroll]');
    await expect(scroll).toBeInViewport({ ratio: 1 });
    const box = (await scroll.boundingBox())!;
    const branchX = box.x + box.width / 2;
    const branchY = box.y + box.height / 2;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: branchX, y: branchY }] });
    for (const offset of [20, 40, 60, 75]) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: branchX, y: branchY - offset }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => scroll.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await expect(popover).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await session.detach();
  });
});

test('a nested native render root retains modal portal ownership and disposes its portal with its host', async ({ page }) => {
  await page.getByRole('button', { name: 'Open layered dialog', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Layered dialog', exact: true });
  const trigger = dialog.getByRole('button', { name: 'Open nested render-root popover', exact: true });
  await trigger.click();
  const popover = page.getByRole('dialog', { name: 'Nested render-root popover', exact: true });
  await expect(popover).toBeVisible();
  expect(await popover.evaluate(node => document.querySelector('[data-layer="dialog"]')!.contains(node))).toBe(false);
  await expect(popover.getByRole('textbox', { name: 'Nested root field', exact: true })).toBeFocused();
  const scroll = popover.locator('[data-nested-root-scroll]');
  await scroll.hover();
  await page.mouse.wheel(0, 120);
  await expect.poll(() => scroll.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await popover.getByRole('button', { name: 'Close parent from nested root', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(popover.getByRole('textbox', { name: 'Nested root field', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(popover).toBeVisible();
  await popover.getByRole('button', { name: 'Close parent from nested root', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(popover).toHaveCount(0);
  await expect(page.locator('[data-nested-render-root]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => [document.body.style.pointerEvents, document.body.style.overflow])).toEqual(['', '']);
});

test('owning overlay and authorized ancestors scroll while the background stays locked', async ({ page }) => {
  await page.getByRole('button', { name: 'Open scrollable overlay', exact: true }).click();
  const overlay = page.locator('[data-scrollable-overlay]');
  await overlay.hover({ position: { x: 10, y: 200 } });
  const background = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => overlay.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(background);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
});

for (const interaction of ['pointer', 'focus'] as const) {
  test(`nonmodal outside ${interaction} reaches every outside layer but owned child focus stays inside its parent`, async ({ page }) => {
    await page.getByRole('button', { name: 'Open standalone popover', exact: true }).click();
    await page.getByRole('button', { name: 'Open second standalone popover', exact: true }).click();
    const parent = page.getByRole('dialog', { name: 'Standalone popover', exact: true });
    const child = page.getByRole('dialog', { name: 'Second standalone popover', exact: true });
    await expect(page.getByRole('textbox', { name: 'Second standalone field', exact: true })).toBeFocused();
    await expect(parent).toBeVisible();
    const outside = page.getByRole('button', { name: 'Outside normal', exact: true });
    if (interaction === 'pointer') await outside.click();
    else await outside.focus();
    await expect(child).toHaveCount(0);
    await expect(parent).toHaveCount(0);
    await expect(outside).toBeFocused();
  });
}
