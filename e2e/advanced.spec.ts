import { expect, test, type Page } from '@playwright/test';
import { accessibilityViolations } from './accessibility.js';

test.beforeEach(async ({ page }, info) => { await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/'); });

async function copyText(page: Page, text: string) {
  expect(await page.evaluate(value => {
    const source = document.createElement('textarea'); source.value = value; document.body.append(source); source.select();
    const copied = document.execCommand('copy'); source.remove(); return copied;
  }, text)).toBe(true);
}

test('password mouse reveal preserves native value, selection and focus; prevented external submission still masks', async ({ page }) => {
  const input = page.getByLabel('Secret', { exact: true });
  await expect(input).toHaveAttribute('type', 'password');
  await input.focus();
  await input.evaluate(node => (node as HTMLInputElement).setSelectionRange(2, 8));
  await page.getByRole('button', { name: 'Reveal secret', exact: true }).click();
  await expect(input).toHaveAttribute('type', 'text');
  await expect(input).toBeFocused();
  await expect.poll(() => input.evaluate(node => [(node as HTMLInputElement).selectionStart, (node as HTMLInputElement).selectionEnd])).toEqual([2, 8]);
  await expect(input).toHaveValue('selection-secret');
  await expect(page.locator('[data-password-icon]')).toHaveAttribute('id', 'password-visible-icon');
  await page.getByRole('button', { name: 'Submit secret', exact: true }).click();
  await expect(input).toHaveAttribute('type', 'password');
  await expect(page.locator('#password-submissions')).toHaveText('selection-secret');
  await expect(input).toHaveValue('selection-secret');
});

test('password visibility remains parent-authoritative with latest callbacks and native single-target factories', async ({ page }) => {
  const input = page.getByLabel('Controlled secret', { exact: true });
  const toggle = page.getByRole('button', { name: 'Controlled visibility', exact: true });
  await toggle.click();
  await expect(input).toHaveAttribute('type', 'password');
  await expect(page.locator('#password-requests')).toHaveText('old:true');
  await page.getByRole('button', { name: 'Replace password callback', exact: true }).click();
  await page.getByLabel('Accept password requests', { exact: true }).check();
  await toggle.focus(); await toggle.press('Enter');
  await expect(input).toHaveAttribute('type', 'text');
  await expect(toggle).toBeFocused();
  await expect(page.locator('#password-requests')).toHaveText('old:true,latest:true');
  await toggle.press('Enter');
  await expect(input).toHaveAttribute('type', 'password');
  await expect(page.locator('#password-requests')).toHaveText('old:true,latest:true,latest:false');
  await page.getByRole('button', { name: 'Update password input ID', exact: true }).click();
  await expect(input).toHaveAttribute('id', 'updated-controlled-secret');
  await expect(toggle).toHaveAttribute('aria-controls', 'updated-controlled-secret');
});

test('password cancelled reset and activation preserve visibility, while pointer cancellation does not steal later keyboard focus', async ({ page }) => {
  const input = page.getByLabel('Secret', { exact: true });
  await page.getByLabel('Cancel password toggle', { exact: true }).check();
  await page.getByRole('button', { name: 'Reveal secret', exact: true }).click();
  await expect(input).toHaveAttribute('type', 'password');
  await page.getByLabel('Cancel password toggle', { exact: true }).uncheck();
  const reveal = page.getByRole('button', { name: 'Reveal secret', exact: true });
  await input.focus();
  await reveal.dispatchEvent('pointerdown', { pointerType: 'mouse', button: 0, pointerId: 1 });
  await reveal.dispatchEvent('pointercancel', { pointerType: 'mouse', pointerId: 1 });
  await reveal.focus(); await reveal.press('Enter');
  await expect(input).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Hide secret', exact: true })).toBeFocused();
  await page.getByLabel('Cancel password reset', { exact: true }).check();
  await page.getByRole('button', { name: 'Reset secret', exact: true }).click();
  await expect(input).toHaveAttribute('type', 'text');
  await page.getByLabel('Cancel password reset', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Reset secret', exact: true }).click();
  await expect(input).toHaveAttribute('type', 'password');
});

test('OTP sanitizes overflow paste and autofill once, submits committed aggregate in callback-before-submit order and resets with cancellation', async ({ page }) => {
  const first = page.getByRole('group', { name: 'Verification code', exact: true }).getByLabel('Code 1', { exact: true }), last = page.getByLabel('Code 4', { exact: true });
  await copyText(page, '1a2 345'); await first.press('Control+V');
  await expect(first).toHaveValue('1'); await expect(last).toHaveValue('4'); await expect(last).toBeFocused();
  await expect(page.locator('[data-otp-aggregate]')).toHaveValue('1234');
  await expect(page.locator('#otp-events')).toHaveText('auto:1234,submit:1234');
  await first.fill('9876');
  await first.dispatchEvent('change');
  await expect(last).toHaveValue('6'); await expect(last).toBeFocused();
  await expect(page.locator('#otp-events')).toHaveText('auto:1234,submit:1234,auto:9876,submit:9876');
  await page.getByLabel('Cancel code reset', { exact: true }).check();
  await page.getByRole('button', { name: 'Reset code', exact: true }).click(); await expect(first).toHaveValue('9');
  await page.getByLabel('Cancel code reset', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Reset code', exact: true }).click(); await expect(first).toHaveValue('');
});

test('OTP native keys, IME, validation modes, readOnly and disabled preserve aggregate and directional focus', async ({ page }) => {
  const first = page.getByLabel('Code 1', { exact: true }), second = page.getByLabel('Code 2', { exact: true });
  await first.fill('a'); await expect(page.locator('#otp-invalid')).toHaveText('a');
  await first.fill('1'); await expect(second).toBeFocused();
  await second.fill('2'); await page.getByLabel('Code 3', { exact: true }).fill('3');
  await second.focus(); await second.press('Delete'); await expect(second).toHaveValue('3'); await expect(second).toBeFocused();
  await second.press('Backspace'); await expect(first).toBeFocused(); await expect(first).toHaveValue('1');
  await first.press('1'); await expect(second).toBeFocused(); await expect(page.locator('[data-otp-aggregate]')).toHaveValue('1');
  await page.getByLabel('Code 3', { exact: true }).click(); await expect(second).toBeFocused();
  await page.getByLabel('RTL code', { exact: true }).check(); await first.focus(); await first.press('ArrowLeft'); await expect(second).toBeFocused();
  await first.focus(); await first.press('Control+Backspace'); await expect(first).toHaveValue('');
  await first.fill('8'); await first.focus();
  await first.evaluate(node => {
    node.dispatchEvent(new ClipboardEvent('cut', { bubbles: true, cancelable: true }));
    (node as HTMLInputElement).value = '';
    node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteByCut' }));
  });
  await expect(first).toHaveValue(''); await expect(first).toBeFocused();
  await first.fill('1'); await page.getByLabel('Vertical code', { exact: true }).check(); await first.focus();
  await first.evaluate(node => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (node as HTMLInputElement).value = '7';
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await expect(page.locator('[data-otp-aggregate]')).toHaveValue('1');
  await first.dispatchEvent('keydown', { key: 'ArrowDown', isComposing: true });
  await expect(first).toBeFocused();
  await first.dispatchEvent('compositionend', { data: '7' }); await expect(first).toHaveValue('7'); await expect(second).toBeFocused();
  await page.getByLabel('Code validation', { exact: true }).selectOption('alpha');
  await first.fill('A'); await expect(first).toHaveValue('A');
  await page.getByLabel('Code validation', { exact: true }).selectOption('alphanumeric');
  await second.fill('2'); await expect(second).toHaveValue('2');
  await page.getByLabel('Code validation', { exact: true }).selectOption('none');
  await copyText(page, 'x-y zX!'); await first.press('Control+V');
  await expect(page.locator('[data-otp-aggregate]')).toHaveValue('XYZX');
  await page.getByLabel('Read-only code', { exact: true }).check();
  await first.evaluate(node => { (node as HTMLInputElement).value = 'Z'; node.dispatchEvent(new InputEvent('input', { bubbles: true })); });
  await expect(page.locator('[data-otp-aggregate]')).toHaveValue('XYZX');
  await page.getByLabel('Disable code', { exact: true }).check(); await expect(first).toBeDisabled();
  expect(await page.locator('#otp-form').evaluate(node => new FormData(node as HTMLFormElement).has('code'))).toBe(false);
});

test('OTP controlled refusal restores native input, accepts sanitized requests, and forwards real target factories', async ({ page }) => {
  const first = page.getByLabel('Controlled code 1', { exact: true });
  await first.fill('9'); await expect(first).toHaveValue('1'); await expect(page.locator('#otp-requests')).toHaveText('92');
  await page.getByLabel('Accept code requests', { exact: true }).check();
  await first.fill('9'); await expect(first).toHaveValue('9');
  await expect(page.getByLabel('Controlled code 2', { exact: true })).toHaveValue('2');
  await expect(page.locator('#controlled-code')).toHaveJSProperty('tagName', 'DIV');
});

test('slider steps from offset values, crosses or constrains thumbs, commits native form values and honors cancelled reset', async ({ page }) => {
  const lower = page.getByRole('slider', { name: 'Lower level', exact: true }), upper = page.getByRole('slider', { name: 'Upper level', exact: true });
  const offset = page.getByRole('slider', { name: 'Offset level', exact: true });
  await offset.focus(); await offset.press('ArrowRight'); await expect(offset).toHaveAttribute('aria-valuenow', '51000');
  await offset.press('ArrowLeft'); await expect(offset).toHaveAttribute('aria-valuenow', '46000');
  await offset.press('End'); await expect(offset).toHaveAttribute('aria-valuenow', '101000');
  await offset.press('Home'); await expect(offset).toHaveAttribute('aria-valuenow', '1000');
  await lower.focus(); await lower.press('ArrowRight'); await expect(lower).toHaveAttribute('aria-valuenow', '30');
  await expect(page.locator('#slider-events')).toHaveText('change:30:80,commit:30:80');
  await lower.press('Shift+ArrowRight'); await expect(lower).toHaveAttribute('aria-valuenow', '80'); await expect(upper).toHaveAttribute('aria-valuenow', '100'); await expect(upper).toBeFocused();
  await page.getByRole('button', { name: 'Submit slider', exact: true }).click();
  await expect(page.locator('#slider-events')).toContainText('submit:80:100');
  await page.getByLabel('Cancel slider reset', { exact: true }).check();
  await page.getByRole('button', { name: 'Reset slider', exact: true }).click(); await expect(upper).toHaveAttribute('aria-valuenow', '100');
  await page.getByLabel('Cancel slider reset', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Reset slider', exact: true }).click(); await expect(lower).toHaveAttribute('aria-valuenow', '20'); await expect(upper).toHaveAttribute('aria-valuenow', '80');
  await page.getByLabel('Preserve thumb order', { exact: true }).check();
  await lower.focus(); await lower.press('Shift+ArrowRight'); await expect(lower).toHaveAttribute('aria-valuenow', '70'); await expect(upper).toHaveAttribute('aria-valuenow', '80'); await expect(lower).toBeFocused();
  await page.getByLabel('Disable slider', { exact: true }).check();
  await expect(lower).toHaveAttribute('aria-disabled', 'true');
  expect(await page.locator('#slider-form').evaluate(node => new FormData(node as HTMLFormElement).getAll('levels[]'))).toEqual([]);
});

test('slider pointer capture, RTL and inversion agree with geometry; controlled requests cannot mutate native values', async ({ page }) => {
  const root = page.locator('[data-slider-root]'), lower = page.getByRole('slider', { name: 'Lower level', exact: true }), upper = page.getByRole('slider', { name: 'Upper level', exact: true });
  await page.getByLabel('RTL slider', { exact: true }).check(); await lower.focus(); await lower.press('ArrowLeft'); await expect(lower).toHaveAttribute('aria-valuenow', '30');
  const rtlRoot = (await root.boundingBox())!, rtlThumb = (await lower.boundingBox())!;
  expect(Math.abs(rtlThumb.x + rtlThumb.width / 2 - (rtlRoot.x + rtlRoot.width - 10 - (rtlRoot.width - 20) * .3))).toBeLessThan(1);
  await page.getByLabel('Invert slider', { exact: true }).check(); await lower.press('ArrowRight'); await expect(lower).toHaveAttribute('aria-valuenow', '40');
  const box = (await root.boundingBox())!;
  await page.mouse.move(box.x + box.width * .8, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width * .9, box.y + box.height / 2); await page.mouse.up();
  await expect(upper).toHaveAttribute('aria-valuenow', '90'); await expect(upper).toBeFocused();
  await expect(page.locator('#slider-events')).toContainText('commit:40:90');
  const vertical = page.getByRole('slider', { name: 'Vertical level', exact: true });
  await vertical.focus(); await vertical.press('ArrowDown'); await expect(vertical).toHaveAttribute('aria-valuenow', '31');
  const verticalRoot = (await page.locator('[data-vertical-slider]').boundingBox())!, verticalThumb = (await vertical.boundingBox())!;
  expect(Math.abs(verticalThumb.y + verticalThumb.height / 2 - (verticalRoot.y + 10 + (verticalRoot.height - 20) * .31))).toBeLessThan(1);
  await page.mouse.click(verticalRoot.x + 10, verticalRoot.y + verticalRoot.height * .7);
  await expect(vertical).toHaveAttribute('aria-valuenow', '70');
  const controlled = page.getByRole('slider', { name: 'Controlled level', exact: true });
  await controlled.focus(); await controlled.press('ArrowRight'); await expect(controlled).toHaveAttribute('aria-valuenow', '25'); await expect(page.locator('[data-controlled-level]')).toHaveValue('25');
  await expect(page.locator('#slider-requests')).toHaveText('26');
  await page.getByLabel('Accept slider requests', { exact: true }).check();
  await controlled.focus(); await controlled.press('ArrowRight'); await expect(controlled).toHaveAttribute('aria-valuenow', '26'); await expect(page.locator('[data-controlled-level]')).toHaveValue('26');
});

test('scroll area keeps its factory on the native viewport, measures explicit content, and synchronizes native scrolling and axis visibility', async ({ page }) => {
  const problems: string[] = [], warnings: string[] = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') problems.push(message.text());
    else if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.reload();
  await page.evaluate(() => { window.addEventListener('error', event => { document.documentElement.dataset.scrollAreaError = event.message; }); });
  const viewport = page.getByLabel('Scrollable content', { exact: true }), y = page.locator('[data-scroll-y]'), x = page.locator('[data-scroll-x]');
  await expect(viewport).toHaveAttribute('id', 'factory-scroll-viewport');
  await expect(viewport).toHaveAttribute('data-radix-scroll-area-viewport', '');
  expect(await viewport.evaluate(node => node.firstElementChild?.getAttribute('data-radix-scroll-area-content'))).toBe('');
  await expect(page.getByLabel('Explicit scroll content', { exact: true }).locator(':scope > [data-explicit-scroll-content]')).toHaveCount(1);
  await expect(y).toBeVisible(); await expect(x).toBeVisible(); await expect(page.locator('[data-scroll-corner]')).toBeVisible();
  await viewport.hover(); await page.mouse.wheel(60, 90);
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  await viewport.evaluate(node => { (node as HTMLElement).style.height = '70px'; });
  const thumb = page.locator('[data-scroll-thumb-y]');
  const expectedThumbHeight = await viewport.evaluate(node => Math.max(18, document.querySelector<HTMLElement>('[data-scroll-y]')!.clientHeight * node.clientHeight / node.scrollHeight));
  await expect.poll(() => thumb.evaluate(node => node.getBoundingClientRect().height)).toBeCloseTo(expectedThumbHeight, 1);
  await expect.poll(() => thumb.evaluate(node => getComputedStyle(node).transform)).not.toBe('none');
  await page.getByLabel('Horizontal scrollbar', { exact: true }).uncheck();
  await expect(x).toHaveCount(0); await expect(page.locator('[data-scroll-corner]')).toHaveCount(0);
  await expect.poll(() => viewport.evaluate(node => getComputedStyle(node).overflowX)).toBe('hidden');
  await page.getByLabel('Scrollbar visibility', { exact: true }).selectOption('auto');
  await page.getByLabel('Overflow scroll content', { exact: true }).uncheck();
  await expect(y).toHaveCount(0);
  await page.getByLabel('Overflow scroll content', { exact: true }).check(); await expect(y).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.scrollAreaError)).toBeUndefined();
  await test.info().attach('scroll-area-browser-warnings', { body: JSON.stringify(warnings), contentType: 'application/json' });
  expect(problems).toEqual([]);
});

test('text-only scroll viewports accept keyboard focus and native arrow scrolling', async ({ page }) => {
  const viewport = page.getByLabel('Explicit scroll content', { exact: true });
  await viewport.focus();
  await expect(viewport).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  const themed = page.locator('#theme-scroll-viewport');
  await themed.focus();
  await expect(themed).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => themed.evaluate(node => node.scrollLeft)).toBeLessThan(0);
});

test('scroll area restores body selection and viewport behavior after drag and active-drag disposal, and scroll visibility expires', async ({ page }) => {
  const viewport = page.getByLabel('Scrollable content', { exact: true }), thumb = page.locator('[data-scroll-thumb-y]');
  await viewport.evaluate(node => { document.body.style.webkitUserSelect = 'text'; (node as HTMLElement).style.scrollBehavior = 'smooth'; });
  await thumb.scrollIntoViewIfNeeded();
  const box = (await thumb.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 50); await page.mouse.up();
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(200);
  expect(await viewport.evaluate(node => [document.body.style.webkitUserSelect, (node as HTMLElement).style.scrollBehavior])).toEqual(['text', 'smooth']);
  const moved = (await thumb.boundingBox())!;
  await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2); await page.mouse.down();
  expect(await page.evaluate(() => document.body.style.webkitUserSelect)).toBe('none');
  await page.getByRole('button', { name: 'Toggle scroll area', exact: true }).focus(); await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.body.style.webkitUserSelect)).toBe('text'); await page.mouse.up();
  await page.keyboard.press('Enter');
  await page.getByLabel('Scrollbar visibility', { exact: true }).selectOption('scroll');
  await expect(page.locator('[data-scroll-y]')).toHaveCount(0);
  await viewport.evaluate(node => { node.scrollTop = 100; });
  await expect(page.locator('[data-scroll-y]')).toBeVisible();
  await page.mouse.move(0, 0); await page.getByLabel('Scrollbar visibility', { exact: true }).focus();
  await expect(page.locator('[data-scroll-y]')).toHaveCount(0);
});

test('scroll area hover remains visible inside the root and RTL scrollbar wheels use native negative offsets without scrolling the page', async ({ page }) => {
  const viewport = page.getByLabel('Scrollable content', { exact: true }), y = page.locator('[data-scroll-y]'), x = page.locator('[data-scroll-x]');
  await page.getByLabel('Scrollbar visibility', { exact: true }).selectOption('hover'); await expect(y).toHaveCount(0);
  await viewport.hover(); await expect(y).toBeVisible(); await y.hover();
  const pageTop = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 80); await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(pageTop);
  await viewport.hover(); await page.waitForTimeout(150); await expect(y).toBeVisible();
  await page.mouse.move(0, 0); await expect(y).toHaveCount(0);
  await page.getByLabel('Scrollbar visibility', { exact: true }).selectOption('always');
  await page.getByLabel('RTL scroll area', { exact: true }).check();
  await x.hover(); await page.mouse.wheel(-60, 0);
  await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBeLessThan(0);
  await expect.poll(() => viewport.evaluate(node => {
    const bar = document.querySelector<HTMLElement>('[data-scroll-x]')!, thumb = document.querySelector<HTMLElement>('[data-scroll-thumb-x]')!, b = bar.getBoundingClientRect(), t = thumb.getBoundingClientRect();
    const travel = b.width - t.width, maximum = node.scrollWidth - node.clientWidth;
    return Math.abs(t.x - b.x - (1 + node.scrollLeft / maximum) * travel);
  })).toBeLessThan(1);
});

test('form native constraints precede custom matching, expose described errors and focus the first invalid associated control', async ({ page }) => {
  const email = page.getByLabel('Validation email', { exact: true });
  await page.getByRole('button', { name: 'Submit validation form', exact: true }).click();
  await expect(email).toBeFocused(); await expect(page.getByText('Email required', { exact: true })).toBeVisible();
  await expect(page.locator('#form-matches')).toHaveText('');
  await expect.poll(() => email.evaluate(node => (node.getAttribute('aria-describedby') ?? '').split(/\s+/).map(id => document.getElementById(id)?.textContent))).toEqual(['A native email address', 'Email required']);
  await email.fill('not-an-email'); await email.press('Tab');
  await expect(page.getByText('Email type mismatch', { exact: true })).toBeVisible(); await expect(page.locator('#form-matches')).toHaveText('');
  await email.fill('taken@example.test'); await email.press('Tab');
  await expect(page.getByText('Email unavailable', { exact: true })).toBeVisible();
  await expect.poll(() => email.evaluate(node => (node as HTMLInputElement).validity.customError)).toBe(true);
  await page.getByLabel('Reject matching form data', { exact: true }).check();
  await email.fill('available@example.test'); await expect(page.locator('#email-validity')).toHaveText('untouched'); await email.press('Tab');
  await expect(page.getByText('Email unavailable', { exact: true })).toBeVisible();
});

test('form calls Promise-returning matchers once and rejects stale results after edit, reset and disposal', async ({ page }) => {
  const email = page.getByLabel('Validation email', { exact: true });
  await email.fill('remote-old@example.test'); await email.press('Tab');
  await expect(page.locator('#form-matches')).toHaveText('remote-old@example.test');
  await email.fill('remote-new@example.test'); await email.press('Tab');
  await expect(page.locator('#form-matches')).toHaveText('remote-old@example.test,remote-new@example.test');
  await page.getByRole('button', { name: 'Accept newest email', exact: true }).click();
  await page.getByRole('button', { name: 'Reject oldest email', exact: true }).click();
  await expect(page.locator('#email-validity')).toHaveText('valid'); await expect(page.getByText('Remote email unavailable', { exact: true })).toHaveCount(0);
  await email.fill('remote-current@example.test'); await email.press('Tab');
  await page.getByRole('button', { name: 'Reject oldest email', exact: true }).click();
  await expect(page.getByText('Remote email unavailable', { exact: true })).toBeVisible(); await expect(page.locator('#email-validity')).toHaveText('invalid');
  expect(await email.evaluate(node => (node as HTMLInputElement).validity.customError)).toBe(true);
  await email.fill('remote-reset@example.test'); await email.press('Tab');
  await page.getByRole('button', { name: 'Reset validation form', exact: true }).click();
  await page.getByRole('button', { name: 'Reject oldest email', exact: true }).click();
  await expect(email).toHaveValue(''); await expect(page.locator('#email-validity')).toHaveText('untouched');
  await email.fill('remote-dispose@example.test'); await email.press('Tab');
  await page.getByRole('button', { name: 'Toggle validation field', exact: true }).click();
  await page.getByRole('button', { name: 'Reject oldest email', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle validation field', exact: true }).click();
  await expect(page.locator('#email-validity')).toHaveText('untouched'); await expect(page.getByText('Remote email unavailable', { exact: true })).toHaveCount(0);
});

test('form server errors clear even on prevented submission, cancelled reset retains validation, and explicit names preserve native factories', async ({ page }) => {
  await expect(page.getByLabel('Explicit form field', { exact: true })).toHaveValue('outside');
  await expect(page.getByLabel('Native default choice', { exact: true })).toBeChecked();
  await page.getByLabel('Native default choice', { exact: true }).uncheck();
  const email = page.getByLabel('Validation email', { exact: true });
  await email.fill('taken@example.test'); await email.press('Tab');
  await page.getByLabel('Cancel validation reset', { exact: true }).check();
  await page.getByRole('button', { name: 'Reset validation form', exact: true }).click();
  await expect(email).toHaveValue('taken@example.test'); await expect(page.getByText('Email unavailable', { exact: true })).toBeVisible();
  await expect(page.locator('#form-events')).toHaveText('');
  await email.fill('accepted@example.test'); await email.press('Tab');
  await page.getByLabel('Second required field', { exact: true }).fill('second'); await page.getByLabel('Explicit form field', { exact: true }).fill('outside');
  await expect(page.getByText('Outside field instructions', { exact: true })).toBeVisible();
  await expect.poll(() => page.getByLabel('Explicit form field', { exact: true }).evaluate(node => document.getElementById(node.getAttribute('aria-describedby')!)?.textContent)).toBe('Outside field instructions');
  await page.getByRole('button', { name: 'Set server error', exact: true }).click();
  await expect(email).toHaveAttribute('aria-invalid', 'true'); await expect(page.getByText('Server email error', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit validation form', exact: true }).click();
  await expect(page.locator('#form-events')).toHaveText('submit:accepted@example.test,clear');
  await expect(page.getByText('Server email error', { exact: true })).toHaveCount(0); await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  expect(await email.evaluate(node => node.tagName)).toBe('INPUT');
  await page.getByLabel('Cancel validation reset', { exact: true }).uncheck(); await page.getByRole('button', { name: 'Reset validation form', exact: true }).click();
  await expect(page.locator('#email-validity')).toHaveText('untouched'); await expect(page.locator('#form-events')).toHaveText('submit:accepted@example.test,clear,clear');
  await expect(page.getByLabel('Explicit form field', { exact: true })).toHaveValue('outside');
  await expect(page.getByLabel('Native default choice', { exact: true })).toBeChecked();
});

test('form native default props update reset baselines without replacing dirty values', async ({ page }) => {
  const text = page.getByLabel('Explicit form field', { exact: true });
  const checkbox = page.getByLabel('Native default choice', { exact: true });
  await text.fill('user draft');
  await checkbox.uncheck();
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Change native form defaults', exact: true }).click();
    await expect(text).toHaveValue('user draft');
    await expect(checkbox).not.toBeChecked();
  }
  await page.getByRole('button', { name: 'Reset validation form', exact: true }).click();
  await expect(text).toHaveValue('revised');
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  expect(await page.locator('#validation-form').evaluate(form => new FormData(form as HTMLFormElement).get('choice'))).toBe('revised');
});

test('form focuses an invalid externally associated native control outside the form subtree', async ({ page }) => {
  await page.getByLabel('Validation email', { exact: true }).fill('valid@example.test');
  await page.getByLabel('Second required field', { exact: true }).fill('second');
  await page.getByLabel('Require external validation field', { exact: true }).check();
  const external = page.getByLabel('External validation field', { exact: true });
  expect(await external.evaluate(node => ({ associated: (node as HTMLInputElement).form?.id, nested: document.getElementById('validation-form')!.contains(node) }))).toEqual({ associated: 'validation-form', nested: false });
  await page.getByRole('button', { name: 'Submit validation form', exact: true }).click();
  await expect(external).toBeFocused();
});

test('toast hotkey and native tab order visit newest roots first, focused Escape closes only its toast, and modal branches remain accessible', async ({ page }) => {
  await page.getByRole('button', { name: 'Show stacked notifications', exact: true }).click();
  const first = page.locator('[data-toast-first]'), second = page.locator('[data-toast-second]');
  await expect(first).toBeVisible(); await expect(second).toBeVisible();
  await page.keyboard.press('F8'); await expect(page.locator('[data-toast-viewport]')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(second).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Dismiss second notification', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(first).toBeFocused();
  await first.press('Escape'); await expect(first).toHaveCount(0); await expect(second).toBeVisible();
  await page.getByRole('button', { name: 'Open notification dialog', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Notification dialog', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss second notification', exact: true }).click();
  await expect(second).toHaveCount(0); await expect(page.getByRole('dialog', { name: 'Notification dialog', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close notification dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Show stacked notifications', exact: true }).click();
  await page.getByLabel('Cancel notification Escape', { exact: true }).check(); await first.focus(); await first.press('Escape');
  await expect(first).toBeVisible(); await expect(second).toBeVisible();
  await page.getByLabel('Cancel notification Escape', { exact: true }).uncheck(); await page.getByRole('button', { name: 'After notifications', exact: true }).focus();
  await page.keyboard.press('Escape'); await expect(second).toHaveCount(0); await expect(first).toBeVisible();
});

test('toast announces priority and action alternatives without hidden or close text, while parent rejection remains authoritative', async ({ page }) => {
  await page.getByRole('button', { name: 'Show stacked notifications', exact: true }).click();
  const assertiveAnnouncement = page.locator('[role="status"][aria-live="assertive"]').filter({ hasText: 'First notification' });
  await expect(assertiveAnnouncement).toContainText('Undo from history');
  await expect(assertiveAnnouncement).not.toContainText('Hidden announcement');
  await expect(assertiveAnnouncement).not.toContainText('Close');
  await expect(page.locator('[role="status"][aria-live="polite"]').filter({ hasText: 'Second notification' })).toContainText('Saved second record');
  await page.getByRole('button', { name: 'Show controlled notification', exact: true }).click();
  await page.getByRole('button', { name: 'Dismiss controlled notification', exact: true }).click();
  await expect(page.locator('[data-toast-controlled]')).toBeVisible(); await expect(page.locator('#toast-requests')).toHaveText('false');
  await page.getByLabel('Accept notification requests', { exact: true }).check();
  await page.getByRole('button', { name: 'Dismiss controlled notification', exact: true }).click();
  await expect(page.locator('[data-toast-controlled]')).toHaveCount(0); await expect(page.locator('#toast-requests')).toHaveText('false,false');
});

test('toast Infinity-to-finite duration stays paused by focus then resumes its remaining native timer', async ({ page }) => {
  await page.getByRole('button', { name: 'Show timed notification', exact: true }).click();
  const timed = page.locator('[data-toast-timed]');
  await page.getByRole('button', { name: 'Use finite notification duration', exact: true }).focus();
  await page.getByRole('button', { name: 'Use finite notification duration', exact: true }).press('Enter');
  await page.mouse.move(0, 0); await page.waitForTimeout(1100);
  await expect(timed).toBeVisible(); await expect(page.locator('#toast-events')).toHaveText('pause');
  await page.getByRole('button', { name: 'After notifications', exact: true }).focus();
  await expect(page.locator('#toast-events')).toHaveText('pause,resume'); await expect(timed).toHaveCount(0);
  await page.getByRole('button', { name: 'Show timed notification', exact: true }).click();
  await page.getByRole('button', { name: 'Use provider notification duration', exact: true }).focus();
  await page.getByRole('button', { name: 'Use provider notification duration', exact: true }).press('Enter');
  await page.mouse.move(0, 0); await page.getByRole('button', { name: 'After notifications', exact: true }).focus();
  await page.waitForTimeout(1100); await expect(timed).toBeVisible();
});

test('toast native swipe cancellation preserves open state, and a subsequent accepted swipe closes only that toast', async ({ page }) => {
  await page.getByRole('button', { name: 'Show stacked notifications', exact: true }).click();
  await page.getByLabel('Cancel notification swipe', { exact: true }).check();
  const first = page.locator('[data-toast-first]');
  const swipe = async () => { const box = (await first.boundingBox())!; await page.mouse.move(box.x + 20, box.y + 10); await page.mouse.down(); await page.mouse.move(box.x + 100, box.y + 10, { steps: 5 }); await page.mouse.up(); };
  await swipe(); await expect(first).toBeVisible(); await expect(page.locator('#toast-events')).toContainText('end'); await expect(first).not.toHaveAttribute('data-swipe', 'end');
  await expect(page.locator('#toast-events')).not.toContainText('click');
  await page.getByLabel('Cancel notification swipe', { exact: true }).uncheck(); await swipe();
  await expect(first).toHaveCount(0); await expect(page.locator('[data-toast-second]')).toBeVisible();
});

test('toast document branches release references when their layer deactivates before branch disposal', async ({ page }) => {
  await page.getByRole('button', { name: 'Check notification branch cleanup', exact: true }).click();
  await expect(page.locator('#toast-branch-cleanup')).toHaveText('released');
});

test('settled native gallery and an open modal retain accessible roles, names and keyboard regions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
  await expect(page.locator('#refs')).toHaveText('same host');
  await page.evaluate(() => document.fonts.ready);
  expect(await accessibilityViolations(page)).toEqual([]);
  await page.getByRole('button', { name: 'Open layered dialog', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Layered dialog', exact: true })).toBeVisible();
  expect(await accessibilityViolations(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open layered dialog', exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test('Toast presence removal empties collection tab proxies and pointer ownership', async ({ page }) => {
  await page.getByRole('button', { name: 'Show stacked notifications', exact: true }).click();
  await page.getByRole('button', { name: 'Dismiss first notification', exact: true }).click();
  await page.getByRole('button', { name: 'Dismiss second notification', exact: true }).click();
  const region = page.getByRole('region', { name: 'Notifications (F8)', exact: true });
  await expect(region.locator('li')).toHaveCount(0);
  await expect(region.locator(':scope > span[aria-hidden="true"]')).toHaveCount(2);
  for (const proxy of await region.locator(':scope > span[aria-hidden="true"]').all()) await expect(proxy).toHaveAttribute('tabindex', '-1');
  await expect(region).toHaveCSS('pointer-events', 'none');
});

test('async server-invalid response focuses the first invalid field and resubmission keeps submit focus', async ({ page }) => {
  await page.getByLabel('Validation email', { exact: true }).fill('accepted@example.test');
  await page.getByLabel('Second required field', { exact: true }).fill('second');
  await page.getByLabel('Validation email', { exact: true }).evaluate(node => { node.parentElement!.style.paddingBottom = '1500px'; });
  await page.getByLabel('Reject validation submission asynchronously', { exact: true }).check();
  const submit = page.getByRole('button', { name: 'Submit validation form', exact: true });
  await submit.click();
  const email = page.getByLabel('Validation email', { exact: true });
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();
  await expect(email).toBeInViewport();
  await page.getByLabel('Reject validation submission asynchronously', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Set server error', exact: true }).click();
  await submit.click();
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await expect(submit).toBeFocused();
});

test('mounting an unrelated function matcher retains published field validity and errors', async ({ page }) => {
  const email = page.getByLabel('Validation email', { exact: true });
  await email.fill('taken@example.test');
  await email.press('Tab');
  await expect(page.getByText('Email unavailable', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle unrelated email matcher', exact: true }).click();
  await expect(page.locator('#email-validity')).toHaveText('invalid');
  await expect(page.getByText('Email unavailable', { exact: true })).toBeVisible();
  expect(await email.evaluate(node => (node as HTMLInputElement).validity.customError)).toBe(true);
  await page.getByRole('button', { name: 'Toggle unrelated email matcher', exact: true }).click();
  await expect(page.getByText('Email unavailable', { exact: true })).toBeVisible();
});

test('OTP typed advance reveals an offscreen input', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Verification code', exact: true });
  await group.evaluate(node => {
    Object.assign(node.style, { display: 'flex', width: '100px', overflow: 'auto' });
    for (const input of node.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')) Object.assign(input.style, { width: '100px', flexShrink: '0' });
  });
  await group.getByLabel('Code 1', { exact: true }).pressSequentially('1');
  await expect(group.getByLabel('Code 2', { exact: true })).toBeFocused();
  await expect.poll(() => group.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  await expect.poll(() => group.getByLabel('Code 2', { exact: true }).evaluate(node => {
    const target = node.getBoundingClientRect(), viewport = node.closest('[role="group"]')!.getBoundingClientRect();
    const x = (target.left + target.right) / 2, y = (target.top + target.bottom) / 2;
    return x >= viewport.left && x <= viewport.right && y >= viewport.top && y <= viewport.bottom;
  })).toBe(true);
});

test('OTP rapid repeated typing preserves every entered digit', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Verification code', exact: true });
  await group.getByLabel('Code 1', { exact: true }).pressSequentially('11', { delay: 0 });
  await expect(page.locator('[data-otp-aggregate]')).toHaveValue('11');
  await expect(group.getByLabel('Code 1', { exact: true })).toHaveValue('1');
  await expect(group.getByLabel('Code 2', { exact: true })).toHaveValue('1');
  await expect(group.getByLabel('Code 3', { exact: true })).toBeFocused();
});

test('OTP pending reveal preserves a consumer focus transfer', async ({ page }) => {
  const first = page.getByRole('group', { name: 'Verification code', exact: true }).getByLabel('Code 1', { exact: true });
  await first.focus();
  await first.evaluate(node => {
    (node as HTMLInputElement).value = '1';
    node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '1' }));
    node.ownerDocument.querySelector<HTMLButtonElement>('#otp-form button[type="submit"]')!.focus();
  });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  await expect(page.locator('[data-otp-aggregate]')).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Submit code', exact: true })).toBeFocused();
});

test('Form root suppresses native invalid UI for an ordinary descendant input', async ({ page }) => {
  expect(await page.locator('#validation-form').evaluate(form => {
    const input = document.createElement('input');
    input.required = true;
    input.name = 'ordinary';
    form.append(input);
    let prevented = false;
    input.addEventListener('invalid', event => { prevented = event.defaultPrevented; });
    input.checkValidity();
    input.remove();
    return prevented;
  })).toBe(true);
});

test('required delete confirmation blocks unchecked submit and serializes checked primitive and themed values', async ({ page }) => {
  for (const kind of ['primitive', 'themed']) {
    const form = page.locator(`#${kind}-confirm-form`);
    const checkbox = form.getByRole('checkbox');
    const output = page.locator(`#${kind}-confirmations`);
    await page.getByRole('button', { name: `Submit ${kind} confirmation`, exact: true }).click();
    await expect(output).toHaveText('');
    expect(await form.evaluate(node => (node as HTMLFormElement).checkValidity())).toBe(false);
    await checkbox.click();
    await page.getByRole('button', { name: `Submit ${kind} confirmation`, exact: true }).click();
    await expect(output).toHaveText('delete');
    expect(await form.evaluate(node => [...new FormData(node as HTMLFormElement).entries()])).toEqual([['confirm', 'delete']]);
    await page.getByRole('button', { name: `Reset ${kind} confirmation`, exact: true }).click();
    await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await page.getByRole('button', { name: `Submit ${kind} confirmation`, exact: true }).click();
    await expect(output).toHaveText('delete');
    expect(await form.evaluate(node => [...new FormData(node as HTMLFormElement).entries()])).toEqual([]);
  }
});
