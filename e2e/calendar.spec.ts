import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const calendar = (page: Page, id: string) => page.locator(`#${id}`);
const day = (grid: Locator, label: string) => grid.getByRole('button', { name: label, exact: true });

const runtimeDiagnostics = new WeakMap<Page, string[]>();

function captureDiagnostics(page: Page, collected?: string[]): string[] {
  const existing = runtimeDiagnostics.get(page);
  if (existing) return existing;
  const problems = collected ?? [];
  runtimeDiagnostics.set(page, problems);
  page.on('pageerror', error => problems.push(error.message));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) problems.push(message.text()); });
  return problems;
}

test.beforeEach(async ({ page }) => {
  captureDiagnostics(page);
});

test.afterEach(async ({ page }, info) => {
  const problems = runtimeDiagnostics.get(page);
  if (!problems) return;
  await info.attach('calendar-browser-diagnostics', { body: JSON.stringify(problems), contentType: 'application/json' });
  expect(problems).toEqual([]);
});

test('calendar independent selection month and cursor', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-independent');
  const grid = fixture.getByRole('grid');
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await day(grid, 'October 18, 2026').focus();
  await page.keyboard.press('ArrowRight');
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await expect(day(grid, 'October 19, 2026')).toBeFocused();
  await day(grid, 'October 19, 2026').click();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-19');
  const nextMonth = fixture.getByRole('button', { name: 'Next month', exact: true });
  await nextMonth.click();
  await expect(nextMonth).toBeFocused();
  await expect(fixture.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-19');
  expect(problems).toEqual([]);
});

test('calendar changed bounds controlled fallback', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const uncontrolled = calendar(page, 'calendar-bounds-uncontrolled');
  await uncontrolled.getByRole('button', { name: 'Change bounds', exact: true }).click();
  await expect(uncontrolled.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  await expect(uncontrolled.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await expect(day(uncontrolled.getByRole('grid'), 'November 18, 2026')).toHaveAttribute('tabindex', '0');
  const fixture = calendar(page, 'calendar-bounds');
  const grid = fixture.getByRole('grid');
  await fixture.getByRole('button', { name: 'Change bounds', exact: true }).click();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await expect(fixture.getByRole('heading', { name: 'October 2026', exact: true })).toBeVisible();
  await expect(grid).toHaveAttribute('tabindex', '0');
  const boundedDays = await grid.getByRole('button').all();
  expect(boundedDays).toHaveLength(42);
  for (const boundedDay of boundedDays) await expect(boundedDay).toHaveAttribute('aria-disabled', 'true');
  await grid.focus();
  await fixture.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(fixture.locator('output[aria-label="Requested month"]')).toHaveText('2026-11');
  await expect(fixture.getByRole('heading', { name: 'October 2026', exact: true })).toBeVisible();
  expect(problems).toEqual([]);
});
test('calendar focused controlled bounds fallback moves focus to grid', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-bounds');
  const grid = fixture.getByRole('grid');
  const focusedDay = day(grid, 'October 18, 2026');
  await expect(focusedDay).toBeVisible();
  await focusedDay.focus();
  await expect(focusedDay).toBeFocused();
  await fixture.getByRole('button', { name: 'Change bounds', exact: true }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(fixture.getByRole('heading', { name: 'October 2026', exact: true })).toBeVisible();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await expect(grid).toHaveAttribute('tabindex', '0');
  await expect(grid).toBeFocused();
  expect(problems).toEqual([]);
});
test('calendar week-start update recovers focus when it removes the focused date', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-week-start-focus-recovery');
  const grid = fixture.getByRole('grid');
  const leadingDay = day(grid, 'September 27, 2026');
  await expect(leadingDay).toBeVisible();
  await fixture.getByRole('button', { name: 'Focus leading day', exact: true }).click();
  await expect(leadingDay).toBeFocused();

  await fixture.getByRole('button', { name: 'Set Monday week start', exact: true }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(leadingDay).toHaveCount(0);
  await expect(fixture.getByRole('heading', { name: 'October 2026', exact: true })).toBeVisible();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-09-27');
  const focusableDay = grid.locator('button[tabindex="0"]');
  await expect(focusableDay).toHaveCount(1);
  await expect(focusableDay).toBeFocused();
  await expect(focusableDay).not.toHaveAttribute('aria-disabled', 'true');

  const restoreOutside = fixture.getByRole('button', { name: 'Restore Sunday week start', exact: true });
  await restoreOutside.click();
  await expect(restoreOutside).toBeFocused();
  await expect(leadingDay).toBeVisible();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-09-27');
  expect(problems).toEqual([]);
});




test('calendar all unavailable and RTL', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-unavailable-rtl');
  const grid = fixture.getByRole('grid');
  const accepted = fixture.getByLabel('Accepted date');
  const unavailable = day(grid, 'October 18, 2026');
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  await unavailable.focus();
  await expect(unavailable).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(accepted).toHaveText('2026-10-18');
  await page.keyboard.press('ArrowLeft');
  await expect(day(grid, 'October 19, 2026')).toBeFocused();
  await fixture.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(fixture.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  await expect(accepted).toHaveText('2026-10-18');
  expect(problems).toEqual([]);
});

test('calendar hydration date-only timezone', async ({ browser, page: fixturePage }, info) => {
  test.skip(info.project.name.endsWith('csr'), 'server markup identity is exercised in SSR projects');
  const problems = captureDiagnostics(fixturePage);
  const context = await browser.newContext({ baseURL: info.project.use.baseURL as string, timezoneId: 'Pacific/Kiritimati' });
  const page = await context.newPage();
  captureDiagnostics(page, problems);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/(src\/entry-client\.tsx|assets\/.*\.js)(\?.*)?$/, async route => { await held; await route.continue(); });
  try {
    await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/', { waitUntil: 'commit' });
    const fixture = calendar(page, 'calendar-hydration');
    const grid = fixture.getByRole('grid');
    const date = day(grid, 'October 18, 2026');
    await expect(date).toBeVisible();
    await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-18');
    await page.evaluate(() => {
      const root = document.querySelector('#calendar-hydration')!;
      (window as typeof window & { __calendarServerGrid?: Element; __calendarServerDay?: Element }).__calendarServerGrid = root.querySelector('[role="grid"]')!;
      (window as typeof window & { __calendarServerGrid?: Element; __calendarServerDay?: Element }).__calendarServerDay = root.querySelector('[aria-label="October 18, 2026"]')!;
    });
    release();
    await page.waitForLoadState('load');
    await expect(page.locator('#refs')).toHaveText('same host');
    await day(grid, 'October 18, 2026').focus();
    await page.keyboard.press('ArrowRight');
    await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-18');
    await expect(day(grid, 'October 19, 2026')).toBeFocused();
    await day(grid, 'October 19, 2026').click();
    await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-10-19');
    await expect(day(grid, 'October 19, 2026')).toBeFocused();
    expect(await page.evaluate(() => {
      const state = window as typeof window & { __calendarServerGrid?: Element; __calendarServerDay?: Element };
      return state.__calendarServerGrid === document.querySelector('#calendar-hydration [role=\"grid\"]')
        && state.__calendarServerDay === document.querySelector('#calendar-hydration [aria-label=\"October 18, 2026\"]');
    })).toBe(true);
    await expect(day(grid, 'October 18, 2026')).toHaveAttribute('aria-label', 'October 18, 2026');
  } finally {
    release();
    await context.close();
  }
  expect(problems).toEqual([]);
});
test('calendar week and year keyboard navigation moves focus without selecting', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-independent');
  const grid = fixture.getByRole('grid');
  const accepted = fixture.getByLabel('Accepted date');
  await day(grid, 'October 18, 2026').focus();
  await page.keyboard.press('Home');
  await expect(day(grid, 'October 18, 2026')).toBeFocused();
  await page.keyboard.press('End');
  await expect(day(grid, 'October 24, 2026')).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(fixture.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  await expect(day(grid, 'November 24, 2026')).toBeFocused();
  await page.keyboard.press('Shift+PageUp');
  await expect(fixture.getByRole('heading', { name: 'November 2025', exact: true })).toBeVisible();
  await expect(day(grid, 'November 24, 2025')).toBeFocused();
  await expect(accepted).toHaveText('2026-10-18');
  expect(problems).toEqual([]);
});

test('calendar cancellation refs and disposal', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-cancellation');
  const grid = fixture.getByRole('grid');
  const current = day(grid, 'October 18, 2026');
  await current.focus();
  await page.keyboard.press('ArrowRight');
  await expect(day(grid, 'October 18, 2026')).toBeFocused();
  await fixture.getByRole('button', { name: 'Focus October 19 via Calendar Day ref', exact: true }).click();
  await expect(day(grid, 'October 19, 2026')).toBeFocused();
  const outside = fixture.getByRole('button', { name: 'Outside focus', exact: true });
  await fixture.getByRole('button', { name: 'Remove focused calendar', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
  await expect(grid).toHaveCount(0);
  await outside.focus();
  await expect(outside).toBeFocused();
  expect(problems).toEqual([]);
});
test('calendar configuration and instance isolation', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const first = calendar(page, 'calendar-instance-one');
  const second = calendar(page, 'calendar-instance-two');
  const firstHeading = first.getByRole('heading');
  const firstGrid = first.getByRole('grid');
  const secondGrid = second.getByRole('grid');
  await expect(firstHeading).toHaveText('October 2026');
  await expect(second.getByRole('heading', { name: 'octubre de 2026', exact: true })).toBeVisible();
  await expect(first.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await expect(second.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await day(firstGrid, 'October 18, 2026').focus();
  await page.keyboard.press('ArrowRight');
  await expect(day(firstGrid, 'October 19, 2026')).toBeFocused();
  await expect(day(secondGrid, '18 de octubre de 2026')).toHaveAttribute('tabindex', '0');
  const weekdayBefore = await firstGrid.getByRole('columnheader').first().textContent();
  await first.getByRole('button', { name: 'Change locale, week start and direction', exact: true }).click();
  await expect(firstHeading).toHaveText('octobre 2026');
  await expect(firstGrid.getByRole('columnheader').first()).not.toHaveText(weekdayBefore ?? '');
  await expect(first.locator('[dir="rtl"]')).toHaveCount(1);
  await expect(first.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await expect(second.getByLabel('Accepted date')).toHaveText('2026-10-18');
  const invalidBounds = calendar(page, 'calendar-invalid-bounds');
  await expect(invalidBounds.getByRole('grid')).toBeVisible();
  await invalidBounds.getByRole('button', { name: 'Set reversed bounds', exact: true }).click();
  await expect(invalidBounds.getByRole('alert')).toBeVisible();
  expect(problems).toEqual([]);
});

test('calendar controlled adjacent-day navigation requests November without moving Oct 31 focus', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-refused-day-navigation');
  const grid = fixture.getByRole('grid');
  const october31 = day(grid, 'October 31, 2026');
  await october31.focus();
  await page.keyboard.press('ArrowRight');
  await expect(fixture.locator('output[aria-label="Requested month"]')).toHaveText('2026-11');
  await expect(fixture.getByRole('heading', { name: 'October 2026', exact: true })).toBeVisible();
  await expect(october31).toBeFocused();
  await expect(day(grid, 'November 1, 2026')).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('calendar external month updates do not steal unrelated focus', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-external-month');
  const outside = fixture.getByRole('button', { name: 'Outside month focus', exact: true });
  await outside.focus();
  await fixture.getByRole('button', { name: 'Set external month to November', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
  await expect(fixture.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  await expect(outside).toBeFocused();
  expect(problems).toEqual([]);
});

test('calendar root disabled and read-only policies', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const disabled = calendar(page, 'calendar-disabled');
  const disabledGrid = disabled.getByRole('grid');
  const disabledDate = day(disabledGrid, 'October 18, 2026');
  await expect(disabledDate).toBeDisabled();
  await disabledDate.click({ force: true });
  const disabledNext = disabled.getByRole('button', { name: 'Next month', exact: true });
  await expect(disabledNext).toBeDisabled();
  await disabledNext.click({ force: true });
  await expect(disabled.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await expect(disabled.getByRole('heading', { name: 'October 2026', exact: true })).toBeVisible();

  const readOnly = calendar(page, 'calendar-readonly');
  const readOnlyGrid = readOnly.getByRole('grid');
  const readOnlyDate = day(readOnlyGrid, 'October 18, 2026');
  await expect(readOnlyDate).not.toBeDisabled();
  await readOnlyDate.focus();
  await page.keyboard.press('ArrowRight');
  await expect(day(readOnlyGrid, 'October 19, 2026')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(readOnly.getByLabel('Accepted date')).toHaveText('2026-10-18');
  await readOnly.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(readOnly.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  await expect(readOnly.getByLabel('Accepted date')).toHaveText('2026-10-18');
  expect(problems).toEqual([]);
});

test('calendar ignores modified and composing arrow keys, honors cancellation, slots, and early years', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const policy = calendar(page, 'calendar-key-policy');
  const policyGrid = policy.getByRole('grid');
  const october18 = day(policyGrid, 'October 18, 2026');
  const october19 = day(policyGrid, 'October 19, 2026');
  await october18.focus();
  await october18.dispatchEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true });
  await expect(october18).toBeFocused();
  await october18.dispatchEvent('keydown', { key: 'ArrowRight', isComposing: true, bubbles: true, cancelable: true });
  await expect(october18).toBeFocused();
  await policy.getByRole('button', { name: 'Cancel next calendar key', exact: true }).click();
  await october18.focus();
  await october18.dispatchEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
  await expect(october18).toBeFocused();
  await expect(october19).not.toBeFocused();

  const slots = calendar(page, 'calendar-slots');
  const slottedDay = slots.locator('#calendar-slot-day');
  await expect(slottedDay).toHaveAttribute('aria-label', 'October 18, 2026');
  await expect(slottedDay).toHaveAttribute('tabindex', '0');
  await slottedDay.focus();
  await expect(slottedDay).toBeFocused();
  await slottedDay.click();
  await expect(slots.getByLabel('Accepted date')).toHaveText('2026-10-18');

  const earlyYear = calendar(page, 'calendar-early-year');
  await expect(earlyYear.getByRole('heading', { name: 'February 99', exact: true })).toBeVisible();
  await expect(day(earlyYear.getByRole('grid'), 'February 28, 99')).toHaveAttribute('aria-label', 'February 28, 99');
  expect(problems).toEqual([]);
});

test('calendar initial month follows a distinct controlled selected date', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-value-derived-month');
  await expect(fixture.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-11-12');
  expect(problems).toEqual([]);
});

test('calendar accepted adjacent-month navigation focuses the target after render', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-accepted-adjacent-navigation');
  const grid = fixture.getByRole('grid');
  await day(grid, 'October 31, 2026').focus();
  await page.keyboard.press('ArrowRight');
  await expect(fixture.locator('output[aria-label="Requested month"]')).toHaveText('2026-11');
  await expect(fixture.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  await expect(day(grid, 'November 1, 2026')).toBeFocused();
  const next = fixture.getByRole('button', { name: 'Next month', exact: true });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(fixture.getByRole('heading', { name: 'December 2026', exact: true })).toBeVisible();
  await expect(next).toBeFocused();
  expect(problems).toEqual([]);
});
test('calendar retains focus on the same adjacent date across a Grid remount', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-same-date-remount');
  const grid = fixture.getByRole('grid');
  const originalDay = day(grid, 'November 1, 2026');
  const originalNode = await originalDay.elementHandle();
  await originalDay.focus();
  await expect(originalDay).toBeFocused();
  await fixture.getByRole('button', { name: 'Next month', exact: true }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(fixture.getByRole('heading', { name: 'November 2026', exact: true })).toBeVisible();
  expect(await originalNode!.evaluate(node => node.isConnected)).toBe(false);
  await expect(day(grid, 'November 1, 2026')).toBeFocused();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-11-01');
  expect(problems).toEqual([]);
});


test('calendar repairs a short-month cursor to an in-month date before adjacent dates', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-short-month-repair');
  const grid = fixture.getByRole('grid');
  await day(grid, 'January 31, 2025').focus();
  await fixture.getByRole('button', { name: 'Set February 2025 month', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
  await expect(fixture.getByRole('heading', { name: 'February 2025', exact: true })).toBeVisible();
  await expect(day(grid, 'February 28, 2025')).toBeFocused();
  expect(problems).toEqual([]);
});

test('calendar controlled month keeps an allowed selected adjacent day as cursor when no in-month day is allowed', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-controlled-adjacent-day');
  const grid = fixture.getByRole('grid');
  await expect(fixture.getByRole('heading', { name: 'October 2026', exact: true })).toBeVisible();
  await expect(fixture.getByLabel('Accepted date')).toHaveText('2026-11-01');
  await expect(day(grid, 'November 1, 2026')).toHaveAttribute('tabindex', '0');
  await expect(day(grid, 'November 1, 2026')).not.toHaveAttribute('aria-disabled', 'true');
  expect(problems).toEqual([]);
});

test('calendar localizes visible and grid-record day labels separately from full date aria labels', async ({ page }, info) => {
  const problems = captureDiagnostics(page);
  await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  const fixture = calendar(page, 'calendar-arabic-day-label');
  const date = fixture.getByRole('grid').locator('[aria-current="date"]');
  const expected = await page.evaluate(() => {
    const value = new Date(0);
    value.setUTCFullYear(2026, 9, 18);
    value.setUTCHours(12, 0, 0, 0);
    const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('ar-EG', {
      calendar: 'gregory', timeZone: 'UTC', ...options
    }).format(value);
    return { day: format({ day: 'numeric' }), full: format({ month: 'long', day: 'numeric', year: 'numeric' }) };
  });
  await expect(date).toHaveText(expected.day);
  await expect(date).toHaveAttribute('data-calendar-record-label', expected.day);
  await expect(date).toHaveAttribute('aria-label', expected.full);
  expect(problems).toEqual([]);
});
