import { expect, test, type Locator, type Page } from '@playwright/test';

type SplitterEvent = [kind: 'change' | 'commit' | 'collapse', value: number | boolean];

declare global {
  interface Window {
    __splitterPointerId?: number;
    __splitterServerNodes?: Element[];
    __splitterServerStyles?: (string | null)[];
  }
}

const pixelName = 'Pixel workspace';
const pixelHandle = (page: Page) => page.getByRole('separator', { name: pixelName, exact: true });
const primary = (page: Page, id = 'pixel') => page.locator(`#splitter-${id}-primary`);
const secondary = (page: Page, id = 'pixel') => page.locator(`#splitter-${id}-secondary`);
const root = (page: Page, id = 'pixel') => page.locator(`#splitter-${id}`);
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const events = async (page: Page, id = 'pixel'): Promise<SplitterEvent[]> => JSON.parse(await page.locator(`#splitter-${id}-events`).innerText());

async function extent(node: Locator, axis: 'width' | 'height' = 'width') {
  const box = await node.boundingBox();
  expect(box, 'the real panel must have a layout rectangle').not.toBeNull();
  return box![axis];
}

async function expectSize(node: Locator, size: number, axis: 'width' | 'height' = 'width') {
  await expect.poll(async () => Math.abs(await extent(node, axis) - size)).toBeLessThan(0.75);
}

async function orderedAria(handle: Locator) {
  const values = await handle.evaluate(node => ['aria-valuemin', 'aria-valuenow', 'aria-valuemax'].map(key => {
    const value = node.getAttribute(key);
    return value === null ? NaN : Number(value);
  }));
  expect(values.every(Number.isFinite)).toBe(true);
  expect(values[0]).toBeLessThanOrEqual(values[1]!);
  expect(values[1]).toBeLessThanOrEqual(values[2]!);
}

async function startDrag(page: Page, handle = pixelHandle(page)) {
  await handle.scrollIntoViewIfNeeded();
  await handle.evaluate(node => node.addEventListener('pointerdown', event => {
    window.__splitterPointerId = (event as PointerEvent).pointerId;
  }, { once: true }));
  const box = (await handle.boundingBox())!;
  // Deliberately start near an edge of a thick handle, not its center.
  const point = { x: box.x + 2, y: box.y + box.height / 2 };
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  expect(await handle.evaluate(node => node.hasPointerCapture(window.__splitterPointerId!))).toBe(true);
  return point;
}

// The fixture uses a 1080px border box, 2px borders, 8px padding,
// a 20px handle and two 20px gaps: exactly 1000px remains for the panels.
// All logging below records real callbacks; rectangle/focus assertions are the oracle.
test.describe('native Splitter', () => {
  test.beforeEach(async ({ page }, info) => {
    await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  });

  test('splitter-geometry: named separator controls real constrained panels', async ({ page }) => {
    const handle = pixelHandle(page);
    // The representative RED must fail here, rather than on an import or fixture timeout.
    await expect(handle).toBeVisible({ timeout: 1500 });
    await expect(handle).toHaveAttribute('aria-controls', 'splitter-pixel-primary');
    await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    await expect(handle).toHaveAttribute('tabindex', '0');
    await expect(handle).toHaveAttribute('aria-valuenow', '400');
    await expect(handle).toHaveAttribute('aria-valuemin', '300');
    await expect(handle).toHaveAttribute('aria-valuemax', '700');
    await expect(handle).toHaveAttribute('aria-valuetext', /400.*(px|pixel)/i);
    await expectSize(primary(page), 400);
    await expectSize(secondary(page), 600);
    const boxes = await Promise.all([root(page), primary(page), handle, secondary(page)].map(node => node.boundingBox()));
    const [outer, first, divider, last] = boxes.map(box => box!);
    expect(first.x - outer.x).toBeCloseTo(10, 1);
    expect(divider.x - first.x - first.width).toBeCloseTo(20, 1);
    expect(divider.width).toBeCloseTo(20, 1);
    expect(last.x - divider.x - divider.width).toBeCloseTo(20, 1);
    expect(outer.x + outer.width - last.x - last.width).toBeCloseTo(10, 1);
    await orderedAria(handle);
    expect(await events(page)).toEqual([]);
  });

  test('splitter-geometry: percentage CSS gaps use actual space without callbacks', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toHaveAttribute('aria-valuemax', '700');
    await root(page).evaluate(node => { node.style.columnGap = '10%'; });
    await expectSize(primary(page), 400); await expectSize(secondary(page), 428);
    await expect(handle).toHaveAttribute('aria-valuemin', '128');
    await expect(handle).toHaveAttribute('aria-valuemax', '528');
    const [first, divider, last] = await Promise.all([primary(page), handle, secondary(page)].map(node => node.boundingBox()));
    expect(divider!.x - first!.x - first!.width).toBeCloseTo(106, 1);
    expect(last!.x - divider!.x - divider!.width).toBeCloseTo(106, 1);
    expect(await events(page)).toEqual([]);
  });

  test('splitter-geometry: inherited gaps invalidate transformed roots and zero-width handles', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toHaveAttribute('aria-valuemax', '700');
    const position = await root(page).evaluate(node => getComputedStyle(node).position);
    await root(page).evaluate(node => {
      node.style.gap = 'var(--splitter-test-gap, 20px)';
      node.style.transform = 'scale(0.5)'; node.style.transformOrigin = '0 0';
    });
    await expectSize(primary(page), 200);
    await root(page).evaluate(node => { node.parentElement!.style.setProperty('--splitter-test-gap', '40px'); });
    await expectSize(secondary(page), 280);
    await expect(handle).toHaveAttribute('aria-valuenow', '400');
    await expect(handle).toHaveAttribute('aria-valuemin', '260');
    await expect(handle).toHaveAttribute('aria-valuemax', '660');
    await handle.evaluate(node => { node.style.width = '0px'; });
    await expectSize(secondary(page), 290);
    await root(page).evaluate(node => { node.parentElement!.style.setProperty('--splitter-test-gap', '60px'); });
    await expectSize(handle, 0); await expectSize(secondary(page), 270);
    await expect(handle).toHaveAttribute('aria-valuemax', '640');
    expect(await root(page).evaluate(node => getComputedStyle(node).position)).toBe(position);
    expect(await root(page).evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await events(page)).toEqual([]);
  });

  test('splitter-composition: custom target provider, real refs and single host survive updates', async ({ page }) => {
    await expect(pixelHandle(page)).toBeVisible({ timeout: 1500 });
    await expect(page.locator('#splitter-host-context')).toHaveText('inside splitter host');
    await expect(page.locator('#splitter-pixel-refs')).toHaveText('actual hosts');
    await expect(root(page)).toHaveCount(1); await expect(primary(page)).toHaveJSProperty('tagName', 'ARTICLE');
    const hosts = await Promise.all([root(page), primary(page), pixelHandle(page)].map(node => node.elementHandle()));
    const measurement = await root(page).locator(':scope > [aria-hidden="true"][inert]').elementHandle();
    expect(measurement).not.toBeNull();
    await pixelHandle(page).focus(); await pixelHandle(page).press('ArrowRight');
    await expectSize(primary(page), 410);
    expect(await hosts[0]!.evaluate(node => node === document.querySelector('#splitter-pixel'))).toBe(true);
    expect(await hosts[1]!.evaluate(node => node === document.querySelector('#splitter-pixel-primary'))).toBe(true);
    expect(await hosts[2]!.evaluate(node => node === document.querySelector('[data-splitter-custom-handle]'))).toBe(true);
    await button(page, 'Unmount pixel splitter').click();
    await expect(root(page)).toHaveCount(0);
    for (const host of hosts) expect(await host!.evaluate(node => node.isConnected)).toBe(false);
    expect(await measurement!.evaluate(node => node.parentElement)).toBeNull();
    await button(page, 'Remount pixel splitter').click();
    await expect(root(page)).toHaveCount(1);
    await expect(primary(page)).toHaveJSProperty('tagName', 'ARTICLE');
    await expect(page.locator('#splitter-host-context')).toHaveText('inside splitter host');
    const selectors = ['#splitter-pixel', '#splitter-pixel-primary', '[data-splitter-custom-handle]'];
    for (const [index, host] of hosts.entries()) {
      expect(await host!.evaluate((node, selector) => !node.isConnected && document.querySelector(selector) !== node, selectors[index]!)).toBe(true);
    }
    await expectSize(primary(page), 410);
    await pixelHandle(page).focus(); await pixelHandle(page).press('ArrowRight');
    await expectSize(primary(page), 420);
  });

  test('splitter-configuration: invalid rendered parts and props fail at the component boundary', async ({ page }) => {
    await expect(pixelHandle(page)).toBeVisible({ timeout: 1500 });
    for (const kind of ['missing-px-size', 'negative-size', 'nonfinite-size', 'percent-over-100', 'zero-step', 'reversed-bounds', 'collapsed-rail', 'secondary-collapse', 'noncollapsible', 'duplicate-primary', 'missing-secondary', 'wrong-order', 'unnamed-handle']) {
      await page.getByLabel('Splitter configuration', { exact: true }).selectOption(kind);
      await expect(page.locator('#splitter-configuration-error'), kind).toContainText('Splitter');
      await expect(page.getByRole('separator', { name: 'Configuration workspace', exact: true })).toHaveCount(0);
    }
    await page.getByLabel('Splitter configuration', { exact: true }).selectOption('valid-false-collapsed');
    await expect(page.locator('#splitter-configuration-error')).toHaveCount(0);
    const valid = page.getByRole('separator', { name: 'Configuration workspace', exact: true });
    await expect(valid).toHaveAttribute('aria-valuenow', '40');
    await valid.focus(); await valid.press('ArrowRight'); await expect(valid).toHaveAttribute('aria-valuenow', '41');
  });

  for (const state of ['overflow', 'underflow'] as const) {
    test(`splitter-geometry: percentage ${state} retains absolute bounds instead of normalizing fractions`, async ({ page }) => {
      const handle = page.getByRole('separator', { name: 'Percentage workspace', exact: true });
      await expect(handle).toBeVisible({ timeout: 1500 });
      await button(page, `Set percentage ${state}`).click();
      await expect(root(page, 'percent')).toHaveAttribute('data-constraint-state', state);
      await expectSize(primary(page, 'percent'), state === 'overflow' ? 600 : 200);
      await expectSize(secondary(page, 'percent'), state === 'overflow' ? 500 : 300);
      await expect(handle).toHaveAttribute('aria-disabled', 'true'); await orderedAria(handle);
      await handle.focus(); await handle.press('Enter'); await handle.press('ArrowRight');
      expect(await events(page, 'percent')).toEqual([]);
      await root(page, 'percent').evaluate(node => {
        node.style.gap = 'var(--splitter-test-gap, 20px)';
        node.parentElement!.style.setProperty('--splitter-test-gap', '40px');
      });
      await expectSize(primary(page, 'percent'), state === 'overflow' ? 576 : 192);
      await expectSize(secondary(page, 'percent'), state === 'overflow' ? 480 : 288);
      await expect(root(page, 'percent')).toHaveAttribute('data-constraint-state', state);
      await expect(handle).toHaveAttribute('aria-disabled', 'true');
      expect(await events(page, 'percent')).toEqual([]);
    });
  }

  for (const example of [
    { id: 'percent', name: 'Percentage workspace', axis: 'width' as const, orientation: 'vertical', now: '40', min: '30', max: '70' },
    { id: 'vertical', name: 'Vertical workspace', axis: 'height' as const, orientation: 'horizontal', now: '400', min: '300', max: '700' },
    { id: 'rtl', name: 'RTL workspace', axis: 'width' as const, orientation: 'vertical', now: '400', min: '300', max: '700' }
  ]) {
    test(`splitter-geometry: ${example.id} uses the same available space and both-pane bounds`, async ({ page }) => {
      const handle = page.getByRole('separator', { name: example.name, exact: true });
      await expect(handle).toBeVisible({ timeout: 1500 });
      await expectSize(primary(page, example.id), 400, example.axis);
      await expectSize(secondary(page, example.id), 600, example.axis);
      await expect(handle).toHaveAttribute('aria-orientation', example.orientation);
      await expect(handle).toHaveAttribute('aria-valuenow', example.now);
      await expect(handle).toHaveAttribute('aria-valuemin', example.min);
      await expect(handle).toHaveAttribute('aria-valuemax', example.max);
      await orderedAria(handle);
      if (example.id === 'rtl') {
        const first = (await primary(page, example.id).boundingBox())!, divider = (await handle.boundingBox())!;
        expect(first.x - divider.x - divider.width).toBeCloseTo(20, 1);
        const before = divider.x;
        await handle.focus(); await handle.press('ArrowRight');
        await expectSize(primary(page, example.id), 390);
        expect((await handle.boundingBox())!.x).toBeCloseTo(before + 10, 1);
      } else if (example.id === 'vertical') {
        await handle.focus(); await handle.press('ArrowDown');
        await expectSize(primary(page, example.id), 410, 'height');
        await expectSize(secondary(page, example.id), 590, 'height');
      } else {
        await expect(handle).toHaveAttribute('aria-valuetext', /40.*(%|percent)/i);
        await handle.focus(); await handle.press('ArrowRight');
        await expectSize(primary(page, example.id), 410);
        expect(await events(page, example.id)).toEqual([['change', 41], ['commit', 41]]);
      }
      if (example.id !== 'percent') {
        const before = await events(page, example.id);
        const accepted = example.id === 'rtl' ? 390 : 410;
        expect(before).toEqual([['change', accepted], ['commit', accepted]]);
        await root(page, example.id).evaluate(node => { node.style.gap = 'var(--splitter-test-gap, 20px)'; });
        await root(page, example.id).evaluate(node => { node.parentElement!.style.setProperty('--splitter-test-gap', '40px'); });
        await expectSize(primary(page, example.id), example.id === 'rtl' ? 390 : 410, example.axis);
        await expectSize(secondary(page, example.id), example.id === 'rtl' ? 570 : 550, example.axis);
        await orderedAria(handle);
        expect(await events(page, example.id)).toEqual(before);
        for (const boundary of [
          { key: 'Home', attribute: 'aria-valuemin', primary: 260, secondary: 700 },
          { key: 'End', attribute: 'aria-valuemax', primary: 660, secondary: 300 }
        ]) {
          await handle.press(boundary.key);
          await expectSize(primary(page, example.id), boundary.primary, example.axis);
          await expectSize(secondary(page, example.id), boundary.secondary, example.axis);
          await orderedAria(handle);
          const [now, bound] = await handle.evaluate((node, attribute) => ['aria-valuenow', attribute].map(name => Number(node.getAttribute(name))), boundary.attribute);
          expect(now).toBe(bound);
          expect(Math.abs(now! - await extent(primary(page, example.id), example.axis))).toBeLessThan(0.75);
          before.push(['change', now!], ['commit', now!]);
          expect(await events(page, example.id)).toEqual(before);
        }
      }
    });
  }

  test('splitter-geometry: measurement clamps then restores the retained controlled request without callbacks', async ({ page }) => {
    await expect(pixelHandle(page)).toBeVisible({ timeout: 1500 });
    await button(page, 'Set pixel size to 700').click();
    await expectSize(primary(page), 700);
    await button(page, 'Narrow pixel container').click();
    await expectSize(primary(page), 500); await expectSize(secondary(page), 300);
    await expect(pixelHandle(page)).toHaveAttribute('aria-valuenow', '500');
    await button(page, 'Restore pixel container').click();
    await expectSize(primary(page), 700); await expectSize(secondary(page), 300);
    expect(await events(page)).toEqual([]);
  });

  for (const state of ['overflow', 'underflow', 'zero'] as const) {
    test(`splitter-geometry: ${state} preserves bounds and rejects all handle actions`, async ({ page }) => {
      const handle = pixelHandle(page);
      await expect(handle).toBeVisible({ timeout: 1500 });
      await button(page, `Set pixel ${state}`).click();
      await expect(handle).toHaveAttribute('aria-disabled', 'true');
      await expect(handle).toHaveAttribute('tabindex', '0');
      if (state === 'overflow') {
        await expect(root(page)).toHaveAttribute('data-constraint-state', 'overflow');
        await expectSize(primary(page), 600); await expectSize(secondary(page), 500);
      } else if (state === 'underflow') {
        await expect(root(page)).toHaveAttribute('data-constraint-state', 'underflow');
        await expectSize(primary(page), 200); await expectSize(secondary(page), 300);
      }
      const before = [await extent(primary(page)), await extent(secondary(page))];
      expect(before.every(size => Number.isFinite(size) && size >= 0)).toBe(true);
      await orderedAria(handle);
      await handle.focus(); await expect(handle).toBeFocused();
      for (const key of ['ArrowRight', 'Home', 'End', 'Enter']) await handle.press(key);
      const box = (await handle.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down(); await page.mouse.move(box.x + 80, box.y + box.height / 2); await page.mouse.up();
      await expectSize(primary(page), before[0]!); await expectSize(secondary(page), before[1]!);
      expect(await events(page)).toEqual([]);
    });
  }

  test('splitter-controlled: keyboard proposals clamp, commit accepted geometry once and suppress no-ops', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toBeVisible({ timeout: 1500 });
    await handle.focus(); await handle.press('ArrowRight');
    await expectSize(primary(page), 410);
    await handle.press('Shift+ArrowRight'); await expectSize(primary(page), 510);
    await handle.press('End'); await expectSize(primary(page), 700);
    await handle.press('End'); await handle.press('Home'); await expectSize(primary(page), 300);
    expect(await events(page)).toEqual([['change', 410], ['commit', 410], ['change', 510], ['commit', 510], ['change', 700], ['commit', 700], ['change', 300], ['commit', 300]]);
    await button(page, 'Set pixel size to 400.5').click();
    await handle.focus(); await handle.press('ArrowRight');
    await expectSize(primary(page), 410.5);
    expect((await events(page)).slice(-2)).toEqual([['change', 410.5], ['commit', 410.5]]);
  });

  test('splitter-controlled: refusal leaves geometry unchanged and later gestures can repeat a proposal', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toBeVisible({ timeout: 1500 });
    await button(page, 'Refuse pixel requests').click();
    for (let gesture = 0; gesture < 2; gesture++) {
      const point = await startDrag(page);
      // Overshoot the 700px maximum from 400px without leaving the browser viewport.
      await page.mouse.move(point.x + 350, point.y);
      await expectSize(primary(page), 400);
      await expect(handle).toHaveAttribute('aria-valuenow', '400');
      await page.mouse.up();
    }
    expect(await events(page)).toEqual([['change', 700], ['change', 700]]);
    await handle.focus(); await handle.press('ArrowRight');
    await expectSize(primary(page), 400);
    expect(await events(page)).toEqual([['change', 700], ['change', 700], ['change', 410]]);
    await button(page, 'Accept pixel requests').click();
    await handle.focus(); await handle.press('End');
    await expectSize(primary(page), 700);
    expect((await events(page)).slice(-2)).toEqual([['change', 700], ['commit', 700]]);
  });

  test('splitter-controlled: acceptance after completion changes layout without retroactive commit', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toBeVisible({ timeout: 1500 });
    await button(page, 'Delay pixel requests').click();
    await handle.focus(); await handle.press('ArrowRight');
    await expectSize(primary(page), 400);
    expect(await events(page)).toEqual([['change', 410]]);
    await button(page, 'Apply delayed pixel request').click();
    await expectSize(primary(page), 410);
    expect(await events(page)).toEqual([['change', 410]]);
  });

  test('splitter-controlled: commit reports the parent accepted size rather than its different proposal', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toBeVisible({ timeout: 1500 });
    await button(page, 'Round pixel acceptance to 25').click();
    await handle.focus(); await handle.press('ArrowRight');
    await expectSize(primary(page), 425); await expectSize(secondary(page), 575);
    await expect(handle).toHaveAttribute('aria-valuenow', '425');
    expect(await events(page)).toEqual([['change', 410], ['commit', 425]]);
  });

  test('splitter-collapse: uncontrolled percentage collapse retains its accepted expanded size', async ({ page }) => {
    const handle = page.getByRole('separator', { name: 'Percentage workspace', exact: true });
    await expect(handle).toBeVisible({ timeout: 1500 });
    await button(page, 'Allow percentage collapse space').click();
    await handle.focus(); await handle.press('ArrowRight');
    await expectSize(primary(page, 'percent'), 410);
    await handle.press('Enter');
    await expectSize(primary(page, 'percent'), 20); await expectSize(secondary(page, 'percent'), 980);
    await expect(handle).toHaveAttribute('aria-valuenow', '2');
    await handle.press('Enter'); await expectSize(primary(page, 'percent'), 410);
    expect(await events(page, 'percent')).toEqual([['change', 41], ['commit', 41], ['collapse', true], ['collapse', false]]);
  });

  test('splitter-gestures: thick handle uses relative movement and capture outside it commits once', async ({ page }) => {
    await expect(pixelHandle(page)).toBeVisible({ timeout: 1500 });
    const point = await startDrag(page);
    await expectSize(primary(page), 400);
    expect(await events(page)).toEqual([]);
    await page.mouse.move(point.x + 137, point.y);
    await expectSize(primary(page), 537); await expectSize(secondary(page), 463);
    await expect(pixelHandle(page)).toBeFocused();
    expect(await events(page)).toEqual([['change', 537]]);
    await page.mouse.up();
    expect(await events(page)).toEqual([['change', 537], ['commit', 537]]);
    expect(await pixelHandle(page).evaluate(node => node.hasPointerCapture(window.__splitterPointerId!))).toBe(false);
  });

  for (const cancellation of ['pointercancel', 'lostpointercapture'] as const) {
    test(`splitter-gestures: ${cancellation} retains accepted live geometry without commit`, async ({ page }) => {
      const handle = pixelHandle(page);
      await expect(handle).toBeVisible({ timeout: 1500 });
      const point = await startDrag(page);
      await page.mouse.move(point.x + 50, point.y); await expectSize(primary(page), 450);
      if (cancellation === 'lostpointercapture') {
        await handle.evaluate(node => node.releasePointerCapture(window.__splitterPointerId!));
      } else {
        const pointerId = await page.evaluate(() => window.__splitterPointerId);
        await handle.dispatchEvent('pointercancel', { pointerId, pointerType: 'mouse', isPrimary: true });
      }
      await page.mouse.move(point.x + 100, point.y); await page.mouse.up();
      await expectSize(primary(page), 450);
      expect(await events(page)).toEqual([['change', 450]]);
      expect(await handle.evaluate(node => node.hasPointerCapture(window.__splitterPointerId!))).toBe(false);
      await handle.focus(); await handle.press('ArrowRight'); await expectSize(primary(page), 460);
    });
  }

  for (const change of ['Narrow pixel container', 'Rotate pixel axis', 'Reverse pixel direction', 'Convert pixel units', 'Constrain pixel maximum', 'Set pixel size to 700', 'Disable pixel splitter', 'Unmount pixel splitter']) {
    test(`splitter-gestures: ${change} terminates a stale drag without a commit`, async ({ page }) => {
      const handle = pixelHandle(page);
      await expect(handle).toBeVisible({ timeout: 1500 });
      const point = await startDrag(page);
      await page.mouse.move(point.x + 50, point.y); await expectSize(primary(page), 450);
      // Native programmatic button activation avoids creating a second pointer gesture.
      await button(page, change).evaluate(node => (node as HTMLButtonElement).click());
      if (change === 'Unmount pixel splitter') {
        await expect(handle).toHaveCount(0);
      } else {
        await expect.poll(() => handle.evaluate(node => node.hasPointerCapture(window.__splitterPointerId!))).toBe(false);
        const before = await primary(page).boundingBox();
        await page.mouse.move(point.x + 100, point.y); await page.mouse.up();
        const after = await primary(page).boundingBox();
        expect(after!.width).toBeCloseTo(before!.width, 1);
        expect(after!.height).toBeCloseTo(before!.height, 1);
      }
      await page.mouse.up();
      expect(await events(page)).toEqual([['change', 450]]);
    });
  }

  test('splitter-gestures: secondary buttons and unrelated pointers cannot start or alter capture', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toBeVisible({ timeout: 1500 });
    await handle.click({ button: 'right' });
    await expectSize(primary(page), 400); expect(await events(page)).toEqual([]);
    await handle.dispatchEvent('pointerdown', { pointerId: 99, pointerType: 'touch', isPrimary: false, button: 0 });
    await handle.dispatchEvent('pointermove', { pointerId: 99, pointerType: 'touch', isPrimary: false, clientX: 900 });
    await expectSize(primary(page), 400);
    const point = await startDrag(page);
    await handle.dispatchEvent('pointermove', { pointerId: 99, pointerType: 'touch', isPrimary: false, clientX: 900 });
    await handle.dispatchEvent('pointerup', { pointerId: 99, pointerType: 'touch', isPrimary: false });
    await expectSize(primary(page), 400);
    await page.mouse.move(point.x + 50, point.y); await page.mouse.up();
    await expectSize(primary(page), 450);
    expect(await events(page)).toEqual([['change', 450], ['commit', 450]]);
  });

  test('splitter-gestures: panel scrolling and nested gestures remain local, including nested disposal', async ({ page }) => {
    const handle = pixelHandle(page), nested = page.getByRole('separator', { name: 'Nested workspace', exact: true });
    await expect(handle).toBeVisible({ timeout: 1500 });
    const documentStyle = await page.evaluate(() => [document.documentElement.style.cursor, document.body.style.cursor]);
    const nestedBefore = await extent(primary(page, 'nested'));
    const point = await startDrag(page, nested);
    await page.mouse.move(point.x + 25, point.y); await page.mouse.up();
    await expectSize(primary(page, 'nested'), nestedBefore + 25);
    await expectSize(primary(page), 400); expect(await events(page)).toEqual([]);
    const scroll = page.getByRole('region', { name: 'Scrollable primary content', exact: true });
    await page.getByRole('textbox', { name: 'Pixel draft', exact: true }).focus();
    await page.keyboard.press('Tab'); await expect(scroll).toBeFocused();
    // WebKit animates keyboard scrolling and loses a Home pressed mid-animation, so let PageDown end first.
    const pageDown = await scroll.evaluateHandle(node => ({ ended: new Promise<number>(resolve => node.addEventListener('scrollend', () => resolve(node.scrollTop), { once: true })) }));
    await page.keyboard.press('PageDown');
    expect(await pageDown.evaluate(state => state.ended)).toBeGreaterThan(0);
    await pageDown.dispose();
    await page.keyboard.press('Home');
    await expect.poll(() => scroll.evaluate(node => node.scrollTop)).toBe(0);
    await scroll.hover(); await page.mouse.wheel(0, 150);
    await expect.poll(() => scroll.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    expect(await scroll.evaluate(node => getComputedStyle(node).touchAction)).not.toBe('none');
    await expect(scroll).toBeFocused();
    await expectSize(primary(page), 400); expect(await events(page)).toEqual([]);
    expect(await page.evaluate(() => [document.documentElement.style.cursor, document.body.style.cursor])).toEqual(documentStyle);
    await button(page, 'Unmount nested splitter').click(); await expect(nested).toHaveCount(0);
    await handle.focus(); await handle.press('ArrowRight'); await expectSize(primary(page), 410);
    expect(await events(page)).toEqual([['change', 410], ['commit', 410]]);
  });

  test('splitter-keyboard: native focus, unrelated shortcuts and consumer cancellation are preserved', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toBeVisible({ timeout: 1500 });
    await button(page, 'Before pixel handle').focus(); await page.keyboard.press('Tab');
    await expect(handle).toBeFocused();
    for (const key of ['ArrowUp', 'ArrowDown', 'Control+ArrowRight', 'Meta+ArrowRight', 'Alt+ArrowRight']) await handle.press(key);
    expect(await handle.evaluate(node => [
      { key: 'ArrowUp' }, { key: 'ArrowDown' }, { key: 'ArrowRight', ctrlKey: true },
      { key: 'ArrowRight', metaKey: true }, { key: 'ArrowRight', altKey: true }
    ].map(init => node.dispatchEvent(new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true }))))).toEqual([true, true, true, true, true]);
    const defaultAllowed = await handle.evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', isComposing: true, bubbles: true, cancelable: true })));
    expect(defaultAllowed).toBe(true);
    await expectSize(primary(page), 400); expect(await events(page)).toEqual([]);
    await button(page, 'Cancel pixel interactions').click();
    await handle.focus(); await handle.press('ArrowRight'); await handle.press('Enter');
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + box.height / 2); await page.mouse.up();
    await expectSize(primary(page), 400); expect(await events(page)).toEqual([]);
    await button(page, 'Disable pixel splitter').click(); await expect(handle).toHaveAttribute('tabindex', '-1');
    await expect(handle).toHaveAttribute('aria-disabled', 'true');
  });

  test('splitter-collapse: accepted collapse retains a mounted inert rail and evacuates only actual pane focus', async ({ page }) => {
    const handle = pixelHandle(page), input = page.getByLabel('Pixel draft', { exact: true });
    await expect(handle).toBeVisible({ timeout: 1500 });
    await input.fill('retained draft');
    const inputNode = await input.elementHandle();
    await input.focus();
    await button(page, 'Collapse pixel externally').evaluate(node => (node as HTMLButtonElement).click());
    await expect(handle).toBeFocused(); await expectSize(primary(page), 20); await expectSize(secondary(page), 700);
    await expect(handle).toHaveAttribute('aria-valuenow', '20');
    expect(await input.evaluate(node => node.isConnected)).toBe(true);
    expect(await input.evaluate(node => !!node.closest('[inert]'))).toBe(true);
    await input.evaluate(node => (node as HTMLInputElement).focus()); await expect(handle).toBeFocused();
    await page.keyboard.press('Tab'); await expect(input).not.toBeFocused();
    await handle.focus();
    await orderedAria(handle);
    for (const key of ['ArrowRight', 'Home', 'End']) await handle.press(key);
    await expectSize(primary(page), 20); expect(await events(page)).toEqual([]);
    await button(page, 'Set pixel size to 700').click();
    await button(page, 'Constrain pixel maximum').click();
    await button(page, 'Restore pixel externally').click();
    await expectSize(primary(page), 500); await expect(input).toHaveValue('retained draft');
    expect(await inputNode!.evaluate(node => node === document.querySelector('input[aria-label="Pixel draft"]'))).toBe(true);
    expect(await events(page)).toEqual([]);
    await button(page, 'Outside pixel focus').focus();
    await button(page, 'Collapse pixel externally').evaluate(node => (node as HTMLButtonElement).click());
    await expect(button(page, 'Outside pixel focus')).toBeFocused();
  });

  test('splitter-collapse: refused and accepted Enter proposals never produce size events', async ({ page }) => {
    const handle = pixelHandle(page);
    await expect(handle).toBeVisible({ timeout: 1500 });
    // Remove the secondary maximum so the 20px collapsed rail remains feasible.
    await button(page, 'Allow pixel collapse space').click();
    await button(page, 'Refuse pixel collapse').click();
    await handle.focus(); await handle.press('Enter');
    await expectSize(primary(page), 400); await expect(handle).toBeFocused();
    expect(await events(page)).toEqual([['collapse', true]]);
    await button(page, 'Accept pixel collapse').click();
    await handle.focus(); await handle.press('Enter'); await expectSize(primary(page), 20); await expectSize(secondary(page), 980);
    for (const key of ['ArrowRight', 'Home', 'End']) await handle.press(key);
    const point = await startDragWithoutCapture(page, handle);
    await page.mouse.move(point.x + 50, point.y); await page.mouse.up(); await expectSize(primary(page), 20);
    await handle.focus(); await handle.press('Enter'); await expectSize(primary(page), 400);
    expect(await events(page)).toEqual([['collapse', true], ['collapse', true], ['collapse', false]]);
  });

  for (const blocked of ['Disable pixel splitter', 'Set pixel overflow', 'Set pixel zero']) {
    test(`splitter-collapse: programmatic collapse and restore still work after ${blocked}`, async ({ page }) => {
      const handle = pixelHandle(page), input = page.getByLabel('Pixel draft', { exact: true });
      await expect(handle).toBeVisible({ timeout: 1500 });
      await input.focus();
      await button(page, blocked).evaluate(node => (node as HTMLButtonElement).click());
      await button(page, 'Collapse pixel externally').evaluate(node => (node as HTMLButtonElement).click());
      await expectSize(primary(page), 20); await expect(handle).toBeFocused();
      await expect(handle).toHaveAttribute('aria-disabled', 'true');
      await handle.press('Enter'); await expectSize(primary(page), 20);
      await button(page, 'Restore pixel externally').click();
      await expectSize(primary(page), blocked === 'Set pixel overflow' ? 600 : 400);
      await expect(input).toBeVisible(); expect(await events(page)).toEqual([]);
    });
  }
});

async function startDragWithoutCapture(page: Page, handle: Locator) {
  await handle.scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!;
  const point = { x: box.x + 2, y: box.y + box.height / 2 };
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  return point;
}

test('splitter-ssr: original panels and CSS survive hydration before measured ARIA reconciles', async ({ page }, info) => {
  test.skip(info.project.name.endsWith('csr'), 'SSR identity is covered on the existing server route');
  const problems: string[] = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) problems.push(message.text()); });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/(src\/entry-client\.tsx|assets\/.*\.js)(\?.*)?$/, async route => { await held; await route.continue(); });
  try {
    await page.goto('/', { waitUntil: 'commit' });
    const handle = pixelHandle(page);
    await expect(handle).toBeVisible({ timeout: 1500 });
    await expect(handle).toHaveAttribute('aria-disabled', 'true');
    await expectSize(primary(page), 400); await expectSize(secondary(page), 600);
    await expectSize(primary(page, 'percent'), 400); await expectSize(secondary(page, 'percent'), 600);
    await expectSize(primary(page, 'default'), 500); await expectSize(secondary(page, 'default'), 500);
    await expectSize(primary(page, 'initial-collapse'), 20); await expectSize(secondary(page, 'initial-collapse'), 980);
    await expect(page.getByLabel('Initially collapsed draft', { exact: true })).toBeHidden();
    await expectSize(primary(page, 'reconcile'), 100); await expectSize(secondary(page, 'reconcile'), 700);
    await expect(page.getByRole('separator', { name: 'Reconciled workspace', exact: true })).toHaveAttribute('aria-valuenow', '100');
    await orderedAria(handle);
    await page.evaluate(() => {
      window.__splitterServerNodes = [...document.querySelectorAll('#splitter-pixel, #splitter-pixel-primary, #splitter-pixel > [role="separator"], #splitter-pixel-secondary, #splitter-percent, #splitter-percent-primary, #splitter-percent > [role="separator"], #splitter-percent-secondary')];
      window.__splitterServerStyles = window.__splitterServerNodes.map(node => node.getAttribute('style'));
    });
    expect(await page.evaluate(() => window.__splitterServerNodes!.length)).toBe(8);
    release();
    // Client startup (module evaluation and hydration of the whole gallery) uses the test budget; the 5s checks below cover measurement only.
    await page.locator('#refs').filter({ hasText: /^same host$/ }).waitFor();
    await expect(handle).toHaveAttribute('aria-disabled', 'false');
    await expect(handle).toHaveAttribute('aria-valuemin', '300');
    await expect(handle).toHaveAttribute('aria-valuemax', '700');
    expect(await page.evaluate(() => window.__splitterServerNodes!.every(node => node.isConnected && (node.id ? document.getElementById(node.id) === node : node.parentElement?.querySelector('[role="separator"]') === node)))).toBe(true);
    // Measurement may replace provisional panel sizing; structural Root/Handle CSS must not be replaced.
    expect(await page.evaluate(() => window.__splitterServerNodes!.filter((_, index) => index % 2 === 0).map(node => node.getAttribute('style')))).toEqual(await page.evaluate(() => window.__splitterServerStyles!.filter((_, index) => index % 2 === 0)));
    await expect(page.locator('#splitter-host-context')).toHaveText('inside splitter host');
    await expect(page.locator('#splitter-pixel-refs')).toHaveText('actual hosts');
    await expectSize(primary(page), 400); await expectSize(secondary(page), 600);
    await expectSize(primary(page, 'reconcile'), 300); await expectSize(secondary(page, 'reconcile'), 700);
    await expect(page.getByRole('separator', { name: 'Reconciled workspace', exact: true })).toHaveAttribute('aria-valuenow', '300');
    expect(await events(page)).toEqual([]); expect(await events(page, 'percent')).toEqual([]);
    await handle.focus(); await handle.press('ArrowRight');
    await expectSize(primary(page), 410); await expectSize(secondary(page), 590);
    expect(await events(page)).toEqual([['change', 410], ['commit', 410]]);
    expect(problems).toEqual([]);
  } finally {
    release();
  }
});
