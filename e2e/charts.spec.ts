import { expect, test } from '@playwright/test';
import axe from 'axe-core';

type MarkGeometry = { d: string | null; box: number[]; matrix: number[]; strokeWidth: string };

const families = [
  ['line', '.recharts-line-curve', 1],
  ['bar', '.recharts-bar-rectangle path', 5],
  ['area', '.recharts-area-curve', 1],
  ['scatter', '.recharts-scatter-symbol path', 5],
  ['funnel', '.recharts-funnel-trapezoid path', 5],
  ['pie', '.recharts-pie-sector .recharts-sector', 5],
  ['radar', '.recharts-radar-polygon path', 1],
  ['radial', '.recharts-radial-bar-sector', 5],
  ['treemap', '.recharts-treemap-depth-1 path', 2],
  ['sankey', 'path.recharts-sankey-link', 2],
  ['sunburst', '.recharts-sunburst path', 2],
] as const;

test('all inherited chart families render finite data geometry and react to replacement data', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  expect(errors).toEqual([]);
  const geometry = (family: string, selector: string) => page.locator(`#chart-${family} ${selector}`).evaluateAll(nodes => nodes.map(node => {
    const shape = node as SVGGraphicsElement;
    const box = shape.getBBox(), matrix = shape.getCTM()!;
    return {
      d: shape.getAttribute('d'),
      box: [box.x, box.y, box.width, box.height],
      matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
      strokeWidth: getComputedStyle(shape).strokeWidth,
    };
  }));
  const before = new Map<string, MarkGeometry[]>();
  for (const [family, selector, count] of families) {
    await expect(page.locator(`#chart-${family} ${selector}`), family).toHaveCount(count);
    const marks = await geometry(family, selector);
    before.set(family, marks);
    for (const mark of marks) {
      expect(mark.d ?? '', family).not.toMatch(/NaN|Infinity|undefined/);
      expect([...mark.box, ...mark.matrix].every(Number.isFinite), family).toBe(true);
      expect(mark.box[2] + mark.box[3], family).toBeGreaterThan(0);
    }
  }
  await page.getByRole('button', { name: 'Update chart data', exact: true }).click();
  for (const [family, selector] of families) {
    await expect.poll(() => geometry(family, selector), { message: family }).not.toEqual(before.get(family));
  }
  expect(errors).toEqual([]);
});

test('fixed server chart geometry hydrates in place and clip references stay unique across charts', async ({ page, request }, info) => {
  test.skip(info.project.name.endsWith('csr'), 'This boundary is SSR-specific.');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
  const html = await (await request.get('/')).text();
  expect(html).toMatch(/recharts-line-curve/);
  expect(html).toMatch(/recharts-sector/);
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'script') {
      await route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    } else await route.continue();
  });
  await page.goto('/');
  await expect(page.locator('#chart-measured svg')).toHaveCount(0);
  const recipeGeometry = () => page.locator('#chart-ssr-recipe').evaluate(root => ({
    ticks: [...root.querySelectorAll('.recharts-cartesian-axis-tick-value')].map(node =>
      [node.textContent, Number(node.getAttribute('x')), Math.round(Number(node.getAttribute('y')))]),
    bars: [...root.querySelectorAll('.recharts-rectangle')].sort((a, b) => a.getAttribute('fill')!.localeCompare(b.getAttribute('fill')!)).map(node =>
      ['x', 'y', 'width', 'height'].map(attribute => Number(node.getAttribute(attribute)))),
  }));
  const serverRecipe = await recipeGeometry();
  expect(serverRecipe.ticks).toEqual([['A', 172.5, 273], ['B', 387.5, 273], ['0', 57, 265], ['15', 57, 187], ['30', 57, 109], ['45', 57, 31], ['50', 57, 5]]);
  expect(serverRecipe.bars).toEqual([[86.5, 213, 172, 52], [301.5, 161, 172, 104], [86.5, 109, 172, 104], [301.5, 5, 172, 156]]);
  const surface = page.locator('#chart-line > .recharts-wrapper > svg.recharts-surface');
  const path = page.locator('#chart-line .recharts-line-curve');
  await expect(surface).toHaveCount(1);
  await expect(path).toHaveCount(1);
  await expect(path).toBeVisible();
  const miniature = page.locator('#chart-line .recharts-brush .recharts-area-curve');
  await expect(miniature).toHaveCount(1);
  const serverMiniatureD = await miniature.getAttribute('d');
  expect(serverMiniatureD).not.toMatch(/NaN|Infinity|undefined/);
  expect(await miniature.evaluate(node => {
    const box = (node as SVGGraphicsElement).getBBox();
    return box.width > 0 && box.height > 0 && Number.isFinite(box.width + box.height);
  })).toBe(true);
  await path.evaluate(node => { Object.assign(window, { serverChartPath: node, serverChartSurface: node.closest('svg') }); });
  await page.unroute('**/*');
  await page.evaluate(async () => {
    const entry = document.querySelector<HTMLScriptElement>('script[type="module"]')!.src;
    // The built entry is runtime-selected; load only after capturing the server node.
    await import(/* @vite-ignore */ entry + '?hydrate-proof');
  });
  await expect(surface).toHaveCount(1);
  await expect(path).toHaveCount(1);
  expect(await surface.evaluate(node => 'serverChartSurface' in window && node === window.serverChartSurface)).toBe(true);
  expect(errors).toEqual([]);
  await expect(page.locator('#chart-measured svg.recharts-surface')).toHaveAttribute('width', '500');
  await expect.poll(recipeGeometry).toEqual(serverRecipe);
  await expect(miniature).toHaveCount(1);
  await expect(miniature).toHaveAttribute('d', serverMiniatureD!);
  const beforeUpdate = await path.getAttribute('d');
  await page.getByRole('button', { name: 'Update chart data', exact: true }).click();
  await expect(path).not.toHaveAttribute('d', beforeUpdate!);
  expect(await path.evaluate(node => 'serverChartPath' in window && window.serverChartPath instanceof SVGPathElement && (!window.serverChartPath.isConnected || node === window.serverChartPath))).toBe(true);
  await expect(surface).toHaveCount(1);
  await expect(path).toHaveCount(1);
  expect(await surface.evaluate(node => 'serverChartSurface' in window && node === window.serverChartSurface)).toBe(true);
  expect(await page.locator('#native-charts').evaluate(root => {
    const ids = [...root.querySelectorAll('[id]')].map(node => node.id);
    return ids.length === new Set(ids).size && [...root.querySelectorAll('[clip-path]')].every(node => {
      const id = node.getAttribute('clip-path')?.match(/url\(#([^)]*)\)/)?.[1];
      return !id || !!node.closest('svg')?.querySelector(`[id="${id}"]`);
    });
  })).toBe(true);
  expect(errors).toEqual([]);
});

test('automatic Cartesian ticks hydrate uniquely and stay correct through resize and data replacement', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
  const ssr = !info.project.name.endsWith('csr');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const ladder = Array.from({ length: 9 }, (_, index) => String(index * 10));
  const root = page.locator('#chart-axis-hydration');
  const surface = root.locator('svg.recharts-surface');
  const geometry = () => root.evaluate(root => {
    const axes = ['xAxis', 'yAxis'].map(axis => [...root.querySelectorAll(`.${axis} .recharts-cartesian-axis-tick`)].map(tick => {
      const label = tick.querySelector<SVGGraphicsElement>('.recharts-cartesian-axis-tick-value')!;
      const line = tick.querySelector('.recharts-cartesian-axis-tick-line')!;
      const box = label.getBBox();
      return {
        label: label.textContent,
        text: ['x', 'y'].map(key => Number(label.getAttribute(key) ?? NaN)),
        box: [box.x, box.y, box.width, box.height],
        line: ['x1', 'y1', 'x2', 'y2'].map(key => Number(line.getAttribute(key) ?? NaN)),
      };
    }));
    const grids = ['vertical', 'horizontal'].map(direction =>
      [...root.querySelectorAll(`.recharts-cartesian-grid-${direction} line`)].map(line =>
        ['x1', 'y1', 'x2', 'y2'].map(key => Number(line.getAttribute(key) ?? NaN))));
    return { axes, grids, curve: root.querySelector('.recharts-line-curve')?.getAttribute('d') };
  });
  if (ssr) {
    await page.route('**/*', async route => {
      if (route.request().resourceType() === 'script') {
        await route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
      } else await route.continue();
    });
  }
  await page.goto(ssr ? '/' : '/csr');
  if (ssr) {
    await expect(surface).toHaveAttribute('width', '240');
    const server = await geometry();
    expect(server.axes[0].map(tick => tick.label)).toEqual(months);
    expect(server.axes[1].map(tick => tick.label)).toEqual(ladder);
    await surface.evaluate(node => { Object.assign(window, { serverAxisSurface: node }); });
    await page.unroute('**/*');
    await page.evaluate(async () => {
      const entry = document.querySelector<HTMLScriptElement>('script[type="module"]')!.src;
      // The built entry is runtime-selected and must load after capturing SSR nodes.
      await import(/* @vite-ignore */ entry + '?axis-hydrate-proof');
    });
  }
  const checkGeometry = async (width: number, height: number, expectedMonths: string[]) => {
    await expect(surface).toHaveCount(1);
    await expect(surface).toHaveAttribute('width', String(width));
    await expect(surface).toHaveAttribute('height', String(height));
    const state = await geometry();
    for (const [axis, expected] of [expectedMonths, ladder].entries()) {
      const ticks = state.axes[axis];
      const labels = ticks.map(tick => tick.label);
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.length).toBeLessThan(expected.length);
      expect(labels).toEqual(expected.filter(label => labels.includes(label)));
      for (const tick of ticks) {
        expect([...tick.text, ...tick.box, ...tick.line].every(Number.isFinite)).toBe(true);
        const [x1, y1, x2, y2] = tick.line;
        if (axis === 0) {
          expect(x1).toBeCloseTo(60 + expected.indexOf(tick.label!) * (width - 70) / 5);
          expect(x2).toBeCloseTo(x1);
          expect(y1).toBeCloseTo(height - 40 + 6);
          expect(y2).toBeCloseTo(height - 40);
        } else {
          expect(y1).toBeCloseTo(height - 40 - Number(tick.label) * (height - 50) / 80);
          expect(y2).toBeCloseTo(y1);
          expect(x1).toBeCloseTo(54);
          expect(x2).toBeCloseTo(60);
        }
      }
    }
    for (const [direction, lines] of state.grids.entries()) {
      expect(lines.length).toBeGreaterThan(0);
      const coordinates = lines.map(line => line[direction]);
      expect(new Set(coordinates).size).toBe(coordinates.length);
      for (const [x1, y1, x2, y2] of lines) {
        expect([x1, y1, x2, y2].every(Number.isFinite)).toBe(true);
        if (direction === 0) {
          expect(x1).toBeCloseTo(x2);
          expect(y1).toBeCloseTo(10);
          expect(y2).toBeCloseTo(height - 40);
          const index = (x1 - 60) * 5 / (width - 70);
          expect(index).toBeCloseTo(Math.round(index));
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThanOrEqual(5);
        } else {
          expect(y1).toBeCloseTo(y2);
          expect(x1).toBeCloseTo(60);
          expect(x2).toBeCloseTo(width - 10);
          const index = (height - 40 - y1) * 8 / (height - 50);
          expect(index).toBeCloseTo(Math.round(index));
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThanOrEqual(8);
        }
      }
    }
    expect(state.curve).toBeTruthy();
    expect(state.curve).not.toMatch(/NaN|Infinity|undefined/);
    return state;
  };
  await expect(surface).toHaveAttribute('width', '500');
  await expect.poll(async () => (await geometry()).axes[0].length).toBeLessThan(6);
  await expect.poll(async () => (await geometry()).axes[1].length).toBeLessThan(9);
  const wide = await checkGeometry(500, 120, months);
  if (ssr) expect(await surface.evaluate(node => 'serverAxisSurface' in window && node === window.serverAxisSurface)).toBe(true);
  await root.evaluate(node => { node.style.width = '180px'; node.style.height = '90px'; });
  await expect(surface).toHaveAttribute('width', '180');
  for (const axis of [0, 1]) {
    await expect.poll(async () => (await geometry()).axes[axis].length).toBeLessThan(wide.axes[axis].length);
  }
  await checkGeometry(180, 90, months);
  await root.evaluate(node => { node.style.width = '500px'; node.style.height = '120px'; });
  await expect.poll(geometry).toEqual(wide);
  await checkGeometry(500, 120, months);
  if (ssr) expect(await surface.evaluate(node => 'serverAxisSurface' in window && node === window.serverAxisSurface)).toBe(true);
  await page.getByRole('button', { name: 'Update chart data', exact: true }).click();
  await expect(root.locator('.recharts-line-curve')).not.toHaveAttribute('d', wide.curve!);
  const updated = await checkGeometry(500, 120, ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  expect(updated.axes[0].some(tick => months.includes(tick.label!))).toBe(false);
  expect(errors).toEqual([]);
});

test('responsive composition resizes real geometry, exposes tooltip payload and disposes mounted charts', async ({ page }, info) => {
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const surface = page.locator('#chart-responsive svg.recharts-surface').first();
  await expect(surface).toHaveAttribute('width', '500');
  const curve = page.locator('#chart-responsive .recharts-line-curve');
  const original = await curve.getAttribute('d');
  await page.getByRole('button', { name: 'Resize chart parent', exact: true }).click();
  await expect(surface).toHaveAttribute('width', '650');
  await expect(curve).not.toHaveAttribute('d', original!);
  await expect(page.locator('#chart-resizes')).toHaveText('650:300');
  await expect(page.locator('#chart-measured svg.recharts-surface')).toHaveAttribute('width', '650');
  await expect(page.locator('#chart-responsive')).toContainText('Revenue');
  await expect(page.locator('#chart-responsive .recharts-legend-item')).toHaveCount(3);
  await page.locator('#chart-responsive .recharts-line-dots circle').nth(1).hover();
  await expect(page.locator('#chart-tooltip-target #chart-custom-tooltip')).toContainText('Beta:');
  await expect(page.locator('#chart-tooltip-target #chart-custom-tooltip')).toContainText('30');
  await surface.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#chart-custom-tooltip')).toContainText(/Alpha|Beta/);
  await page.getByRole('button', { name: 'Toggle chart mounting', exact: true }).click();
  await expect(page.locator('#native-charts svg')).toHaveCount(0);
  await expect(page.locator('#chart-custom-tooltip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle chart mounting', exact: true }).click();
  await expect(surface).toHaveCount(1);
  await expect(surface).toHaveAttribute('width', '650');
});

test('Brush keyboard range synchronizes peer data while panorama and isolated chart keep full data', async ({ page }, info) => {
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const isolated = await page.locator('#chart-area .recharts-area-curve').getAttribute('d');
  const peer = page.locator('#chart-bar .recharts-bar-rectangle');
  const before = await peer.count();
  const miniature = page.locator('#chart-line .recharts-brush .recharts-area-curve');
  await expect(miniature).toHaveCount(1);
  const fullRangePath = await miniature.getAttribute('d');
  expect(fullRangePath).toMatch(/[MLC]/);
  expect(fullRangePath).not.toMatch(/NaN|Infinity|undefined/);
  const miniatureBox = await miniature.evaluate(node => {
    const box = (node as SVGGraphicsElement).getBBox();
    return [box.width, box.height];
  });
  expect(miniatureBox.every(value => Number.isFinite(value) && value > 0)).toBe(true);
  await expect(page.locator('#chart-line > .recharts-wrapper > svg.recharts-surface')).toHaveCount(1);
  await expect(page.locator('#chart-line .recharts-brush svg.recharts-surface')).toHaveCount(1);
  await expect(page.locator('#chart-line svg.recharts-surface')).toHaveCount(2);
  const traveller = page.locator('#chart-line .recharts-brush-traveller').first();
  await traveller.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#chart-range')).toHaveText('1:4');
  await expect.poll(() => peer.count()).toBeLessThan(before);
  await expect(page.locator('#chart-area .recharts-area-curve')).toHaveAttribute('d', isolated!);
  await expect(miniature).toHaveCount(1);
  await expect(miniature).toHaveAttribute('d', fullRangePath!);
  await expect(page.locator('#chart-range-events')).toHaveText('1');
  await traveller.scrollIntoViewIfNeeded();
  const handle = (await traveller.boundingBox())!;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 110, handle.y + handle.height / 2, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('#chart-range')).toHaveText('2:4');
  await expect(peer).toHaveCount(3);
  await expect(miniature).toHaveAttribute('d', fullRangePath!);
  await expect(page.locator('#chart-area .recharts-area-curve')).toHaveAttribute('d', isolated!);
  const callbacks = Number(await page.locator('#chart-range-events').textContent());
  await page.getByRole('button', { name: 'Toggle chart mounting', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle chart mounting', exact: true }).click();
  await traveller.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#chart-range')).toHaveText('1:4');
  await expect(page.locator('#chart-range-events')).toHaveText(String(callbacks + 1));
  await expect(peer).toHaveCount(4);
  await expect(miniature).toHaveAttribute('d', fullRangePath!);
  await expect(page.locator('#chart-area .recharts-area-curve')).toHaveAttribute('d', isolated!);
});

test('keyed Cells keep current data order, paint, custom-shape payload and one event after reorder and replacement', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const marks = page.locator('#chart-cells [data-cell-row]');
  const painted = () => marks.evaluateAll(nodes => nodes.map(node => [
    node.getAttribute('data-cell-row'), getComputedStyle(node.querySelector('path')!).fill,
  ]));
  await expect.poll(painted).toEqual([['Red', 'rgb(204, 51, 51)'], ['Green', 'rgb(51, 153, 68)'], ['Blue', 'rgb(51, 85, 204)']]);
  await expect(page.locator('#chart-cells .recharts-errorBar')).toHaveCount(3);
  await page.locator('#chart-cells [data-cell-row="Green"] path').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#chart-cell-event')).toHaveText('Green:1:1');
  await page.getByRole('button', { name: 'Reorder keyed Cells', exact: true }).click();
  await expect.poll(painted).toEqual([['Blue', 'rgb(51, 85, 204)'], ['Red', 'rgb(204, 51, 51)'], ['Green', 'rgb(51, 153, 68)']]);
  await page.locator('#chart-cells [data-cell-row="Green"] path').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#chart-cell-event')).toHaveText('Green:2:2');
  await page.getByRole('button', { name: 'Replace keyed Cell', exact: true }).click();
  await expect.poll(painted).toEqual([['Blue', 'rgb(51, 85, 204)'], ['Green', 'rgb(51, 153, 68)'], ['Purple', 'rgb(153, 51, 204)']]);
  await expect(page.locator('#chart-cells .recharts-errorBar')).toHaveCount(3);
  await page.locator('#chart-cells [data-cell-row="Purple"] path').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#chart-cell-event')).toHaveText('Purple:2:3');
  await page.getByRole('button', { name: 'Toggle chart mounting', exact: true }).click();
  await expect(marks).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle chart mounting', exact: true }).click();
  await expect(marks).toHaveCount(3);
  await page.locator('#chart-cells [data-cell-row="Purple"] path').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#chart-cell-event')).toHaveText('Purple:2:4');
  expect(errors).toEqual([]);
});

test('animation uses real intermediate frames, completes once, and exposes accessible chart keyboard content', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const surface = page.locator('#chart-responsive .recharts-wrapper > svg.recharts-surface');
  await expect(surface.locator('title')).toHaveText('Revenue overview');
  await expect(surface.locator('desc')).toHaveText('Five categories of revenue');
  await expect(surface).toHaveAttribute('tabindex', '0');
  await page.getByRole('button', { name: 'Update chart data', exact: true }).click();
  await expect(page.locator('#chart-animation-events')).toHaveText('0:0');
  await page.getByRole('button', { name: 'Enable chart animation', exact: true }).click();
  await expect(page.locator('#chart-animation-events')).toHaveText('1:1');
  const frames = await page.evaluate(async () => {
    const samples: string[] = [];
    const start = performance.now();
    [...document.querySelectorAll<HTMLButtonElement>('#native-charts button')].find(button => button.textContent === 'Animate chart update')!.click();
    while (performance.now() - start < 700) {
      const frame = Promise.withResolvers<number>();
      requestAnimationFrame(frame.resolve);
      await frame.promise;
      const path = document.querySelector('#chart-responsive .recharts-line-curve');
      samples.push((path?.getAttribute('d') ?? '') + '|' + (path?.getAttribute('stroke-dasharray') ?? ''));
    }
    return samples;
  });
  expect(new Set(frames).size).toBeGreaterThan(2);
  expect(frames.join('')).not.toMatch(/NaN|Infinity|undefined/);
  expect(frames.at(-1)).toBe(frames.at(-2));
  await expect(page.locator('#chart-animation-events')).toHaveText('2:2');
  await surface.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#chart-custom-tooltip')).toContainText('Alpha:');
  await page.evaluate(axe.source);
  const violations = await page.evaluate(async () => {
    const result = await (window as unknown as { axe: typeof axe }).axe.run('#native-charts');
    return result.violations.filter(item => item.impact === 'critical' || item.impact === 'serious').map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }));
  });
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('automatic animation respects reduced motion and immediately uses final updated geometry', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const curve = page.locator('#chart-responsive .recharts-line-curve');
  const initial = await curve.getAttribute('d');
  await page.getByRole('button', { name: 'Enable chart animation', exact: true }).click();
  await page.getByRole('button', { name: 'Animate chart update', exact: true }).click();
  await expect(curve).not.toHaveAttribute('d', initial!);
  await expect(page.locator('#chart-animation-events')).toHaveText('0:0');
  const final = await curve.getAttribute('d');
  await page.evaluate(async () => {
    for (let index = 0; index < 2; index++) {
      const frame = Promise.withResolvers<number>();
      requestAnimationFrame(frame.resolve);
      await frame.promise;
    }
  });
  await expect(curve).toHaveAttribute('d', final!);
  await expect(curve).not.toHaveAttribute('stroke-dasharray', /.+/);
});

test('tooltip synchronization follows index and reordered values without activating isolated charts', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const point = page.locator('#chart-line .recharts-line-dots circle').nth(1);
  await point.hover();
  await expect(page.locator('#chart-source-tooltip')).toHaveText('Beta:30');
  await expect(page.locator('#chart-peer-tooltip')).toHaveText('Beta:30');
  await expect(page.locator('#chart-isolated-tooltip')).toHaveText('');
  await page.getByRole('button', { name: 'Use value synchronization', exact: true }).click();
  await point.hover();
  await expect(page.locator('#chart-peer-tooltip')).toHaveText('Beta:30');
  await expect(page.locator('#chart-bar .recharts-xAxis-ticks text')).toHaveText(['Epsilon', 'Delta', 'Gamma', 'Beta', 'Alpha']);
  await expect(page.locator('#chart-isolated-tooltip')).toHaveText('');
  await page.getByRole('button', { name: 'Toggle chart mounting', exact: true }).click();
  await expect(page.locator('#chart-source-tooltip')).toHaveCount(0);
  await expect(page.locator('#chart-peer-tooltip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle chart mounting', exact: true }).click();
  await point.hover();
  await expect(page.locator('#chart-source-tooltip')).toHaveText('Beta:30');
  await expect(page.locator('#chart-peer-tooltip')).toHaveText('Beta:30');
  await expect(page.locator('#chart-isolated-tooltip')).toHaveText('');
  expect(errors).toEqual([]);
});
