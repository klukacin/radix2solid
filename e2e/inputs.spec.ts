import { expect, test, type Locator } from '@playwright/test';

// Fixture controls change real parent props/results; outputs record real submit/action events.
async function successfulValues(form: Locator) {
  return form.evaluate((node: HTMLFormElement) => [...new FormData(node)]);
}

async function expectActive(input: Locator, option: Locator) {
  await expect(option).toBeVisible();
  await expect(option).toHaveAttribute('aria-selected', 'true');
  await expect(option).toHaveAttribute('id', /^\S+$/);
  await expect(option).not.toHaveAttribute('id', 'false');
  await expect.poll(async () => input.getAttribute('aria-activedescendant')).toBe(await option.getAttribute('id'));
  expect(await input.evaluate(node => {
    const id = node.getAttribute('aria-activedescendant');
    const active = id && document.getElementById(id);
    return !!active && active.getAttribute('role') === 'option' && active.getClientRects().length > 0;
  })).toBe(true);
  await expect(input).toBeFocused();
}

async function expectNoActive(input: Locator) {
  await expect.poll(() => input.getAttribute('aria-activedescendant')).toBeFalsy();
}

async function expectInvalid(input: Locator) {
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(await input.evaluate((node: HTMLInputElement) => node.checkValidity())).toBe(false);
}

test.describe('native Inputs', () => {
  test.beforeEach(async ({ page }, info) => {
    await page.goto(info.project.name.endsWith('csr') ? '/csr' : '/');
  });

  test('draft-form: an unresolved draft never submits the accepted key', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Draft choice', exact: true });
    // First RED gate: a missing public control, not a missing import or fixture module.
    await expect(input).toBeVisible({ timeout: 2000 });
    const form = page.getByRole('form', { name: 'Draft choice form', exact: true });
    const submitted = page.getByRole('status', { name: 'Draft submissions', exact: true });
    await expect(input).toHaveValue('Alpha');
    expect(await successfulValues(form)).toEqual([['choice', 'alpha']]);
    await input.fill('draft');
    await expectInvalid(input);
    expect(await form.evaluate((node: HTMLFormElement) => new FormData(node).has('choice'))).toBe(false);
    await page.getByRole('button', { name: 'Submit draft choice', exact: true }).click();
    await expect(input).toBeFocused();
    await expect(submitted).toHaveText('0');
    await form.evaluate((node: HTMLFormElement) => node.requestSubmit());
    await expect(input).toBeFocused();
    await expect(submitted).toHaveText('0');
    await input.fill('');
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
    await input.fill('Alpha');
    expect(await input.evaluate((node: HTMLInputElement) => node.checkValidity())).toBe(true);
    await form.evaluate((node: HTMLFormElement) => node.requestSubmit());
    await expect(submitted).toHaveText('1');
    expect(await successfulValues(form)).toEqual([['choice', 'alpha']]);
  });

  for (const kind of ['duplicate choice keys', 'empty choice key']) {
    test(`configuration-errors: rejects ${kind} before rendering a usable chooser`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.getByRole('button', { name: `Render ${kind}`, exact: true }).click();
      await expect.poll(() => errors.some(message => message.includes('unique, nonempty value keys'))).toBe(true);
      await expect(page.getByRole('combobox', { name: 'Invalid configuration choice', exact: true })).toHaveCount(0);
    });
  }

  test('reset-data: explicit initial draft is captured rather than inferred from the selected label', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Server draft choice', exact: true });
    const form = page.getByRole('form', { name: 'Server draft form', exact: true });
    await expect(input).toHaveValue('draft');
    await input.fill('Alpha');
    expect(await successfulValues(form)).toEqual([['server-draft', 'alpha']]);
    await form.evaluate((node: HTMLFormElement) => node.reset());
    await expect(input).toHaveValue('draft');
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
  });

  test('draft-form: optional clear, required null, disabled and readOnly obey native form participation', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Draft choice', exact: true });
    const form = page.getByRole('form', { name: 'Draft choice form', exact: true });
    await page.getByRole('button', { name: 'Clear draft choice', exact: true }).click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    expect(await successfulValues(form)).toEqual([]);
    expect(await input.evaluate((node: HTMLInputElement) => node.checkValidity())).toBe(true);
    await page.getByLabel('Require draft choice', { exact: true }).check();
    await expectInvalid(input);
    await page.getByLabel('Disable draft choice', { exact: true }).check();
    await expect(input).toBeDisabled();
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    expect(await successfulValues(form)).toEqual([]);
    await page.getByLabel('Disable draft choice', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Set draft Alpha', exact: true }).click();
    await page.getByLabel('Read only draft choice', { exact: true }).check();
    await input.focus();
    await input.press('ControlOrMeta+a');
    expect(await input.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd])).toEqual([0, 5]);
    await input.press('Backspace');
    await input.press('ArrowDown');
    await expect(input).toHaveValue('Alpha');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(await successfulValues(form)).toEqual([['choice', 'alpha']]);
    expect(await input.evaluate((node: HTMLInputElement) => node.willValidate)).toBe(false);
    await page.getByRole('button', { name: 'Set draft null', exact: true }).click();
    await expect(input).toHaveValue('');
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(true);
    expect(await successfulValues(form)).toEqual([]);
  });

  test('selection: navigation is active-only, commits once and consumes Enter submission', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Draft choice', exact: true });
    const form = page.getByRole('form', { name: 'Draft choice form', exact: true });
    const list = page.getByRole('listbox', { name: 'Draft suggestions', exact: true });
    // Seed native form history in this case; the custom popup must still own Enter.
    await input.fill('Alpha');
    await page.getByRole('button', { name: 'Submit draft choice', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Draft submissions', exact: true })).toHaveText('1');
    await page.reload();
    await expect(input).toHaveValue('Alpha');
    await expect(page.getByRole('status', { name: 'Draft submissions', exact: true })).toHaveText('0');
    await input.fill('');
    await input.press('ArrowDown');
    await expectActive(input, list.getByRole('option', { name: 'Alpha', exact: true }));
    await input.press('ArrowDown');
    const beta = list.getByRole('option', { name: 'Beta', exact: true });
    await expectActive(input, beta);
    await expect(beta).toHaveAttribute('data-state', 'unchecked');
    expect(await successfulValues(form)).toEqual([]);
    await input.press('Enter');
    await expect(input).toHaveValue('Beta');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expectNoActive(input);
    await expect(input).toBeFocused();
    await expect(page.getByRole('status', { name: 'Draft submissions', exact: true })).toHaveText('0');
    await expect(page.getByRole('status', { name: 'Draft key changes', exact: true })).toHaveText('1');
    expect(await successfulValues(form)).toEqual([['choice', 'beta']]);
    await page.getByRole('button', { name: 'Toggle draft suggestions', exact: true }).click();
    await expect(input).toBeFocused();
    await expect(beta).toHaveAttribute('data-state', 'checked');
    await expectNoActive(input);
    await input.press('Escape');
    await input.press('Enter');
    await expect(page.getByRole('status', { name: 'Draft submissions', exact: true })).toHaveText('1');
  });

  test('controlled-split-acceptance: refused query, key and close remain parent authoritative', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Controlled choice', exact: true });
    const form = page.getByRole('form', { name: 'Controlled choice form', exact: true });
    const list = page.getByRole('listbox', { name: 'Controlled suggestions', exact: true });
    // Defaults: alpha/Alpha/closed; query, key and open proposals all refused.
    await input.fill('Beta');
    await expect(input).toHaveValue('Alpha');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(await successfulValues(form)).toEqual([['controlled-choice', 'alpha']]);
    await page.getByLabel('Accept controlled query', { exact: true }).check();
    await page.getByLabel('Accept controlled open', { exact: true }).check();
    await input.fill('Beta');
    await input.press('ArrowDown');
    await expectActive(input, list.getByRole('option', { name: 'Alpha', exact: true }));
    await input.press('ArrowDown');
    await expectActive(input, list.getByRole('option', { name: 'Beta', exact: true }));
    await input.press('Enter');
    await expect(input).toHaveValue('Beta');
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
    // Own the Escape layer instead of the gallery's permanently open composition dialogs.
    await input.press('ArrowDown');
    await expect(list).toBeVisible();
    await expect(input).toHaveValue('Beta');
    await input.press('Escape');
    await expect(input).toHaveValue('Alpha');
    await page.getByLabel('Accept controlled key', { exact: true }).check();
    await input.fill('Beta');
    await page.getByLabel('Accept controlled query', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Set controlled query Alpha', exact: true }).click();
    // filter=false exposes Beta even while the accepted query is Alpha.
    await page.getByRole('button', { name: 'Open controlled suggestions', exact: true }).click();
    await page.getByLabel('Accept controlled open', { exact: true }).uncheck();
    await list.getByRole('option', { name: 'Beta', exact: true }).click();
    await expect(input).toHaveValue('Alpha');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(list.getByRole('option', { name: 'Beta', exact: true })).toHaveAttribute('data-state', 'checked');
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
    await page.getByRole('button', { name: 'Set controlled query Beta', exact: true }).click();
    expect(await successfulValues(form)).toEqual([['controlled-choice', 'beta']]);
  });

  test('controlled-split-acceptance: late key acceptance requests its label once without render feedback', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Controlled choice', exact: true });
    const form = page.getByRole('form', { name: 'Controlled choice form', exact: true });
    await page.getByLabel('Accept controlled open', { exact: true }).check();
    await page.getByLabel('Defer controlled key', { exact: true }).check();
    await page.getByRole('button', { name: 'Open controlled suggestions', exact: true }).click();
    await page.getByRole('listbox', { name: 'Controlled suggestions', exact: true }).getByRole('option', { name: 'Beta', exact: true }).click();
    await expect(input).toHaveValue('Alpha');
    expect(await successfulValues(form)).toEqual([['controlled-choice', 'alpha']]);
    await page.getByRole('button', { name: 'Clear controlled proposal log', exact: true }).click();
    await page.getByRole('button', { name: 'Apply pending controlled key', exact: true }).click();
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
    const proposals = page.getByRole('status', { name: 'Controlled query proposals', exact: true });
    await expect(proposals).toHaveText('["Beta"]');
    await page.getByRole('button', { name: 'Rerender controlled parent', exact: true }).click();
    await page.getByRole('button', { name: 'Rerender controlled parent', exact: true }).click();
    await expect(proposals).toHaveText('["Beta"]');
    await page.getByRole('button', { name: 'Set controlled query Beta', exact: true }).click();
    expect(await successfulValues(form)).toEqual([['controlled-choice', 'beta']]);
    await page.getByLabel('Accept controlled key', { exact: true }).check();
    await page.getByLabel('Defer controlled key', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Clear controlled proposal log', exact: true }).click();
    await page.getByRole('button', { name: 'Open controlled suggestions', exact: true }).click();
    await page.getByRole('listbox', { name: 'Controlled suggestions', exact: true }).getByRole('option', { name: 'Beta', exact: true }).click();
    await expect(proposals).toHaveText('[]');
    await expect(page.getByRole('status', { name: 'Controlled key proposals', exact: true })).toHaveText('[]');
  });

  test('reset-data: removed or disabled accepted records cannot submit after refused clear', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Controlled choice', exact: true });
    const form = page.getByRole('form', { name: 'Controlled choice form', exact: true });
    const requests = page.getByRole('status', { name: 'Controlled key proposals', exact: true });
    await page.getByRole('button', { name: 'Remove controlled Alpha', exact: true }).click();
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
    await expect(requests).toHaveText('[null]');
    await page.getByRole('button', { name: 'Rerender controlled parent', exact: true }).click();
    await expect(requests).toHaveText('[null]');
    await page.getByRole('button', { name: 'Restore controlled Alpha', exact: true }).click();
    expect(await successfulValues(form)).toEqual([['controlled-choice', 'alpha']]);
    await page.getByRole('button', { name: 'Disable controlled Alpha', exact: true }).click();
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
    await expect(requests).toHaveText('[null,null]');
    await page.getByRole('button', { name: 'Set controlled query Beta', exact: true }).click();
    await page.getByRole('button', { name: 'Restore controlled Alpha', exact: true }).click();
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
  });

  test('reset-data: external form reset restores captured defaults and respects cancellation and refusal', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Reset choice', exact: true });
    const form = page.getByRole('form', { name: 'External choice form', exact: true });
    const decoy = page.getByRole('form', { name: 'Decoy choice form', exact: true });
    // Input receives conflicting form/name through a native target; Root still owns association.
    expect(await input.evaluate((node: HTMLInputElement) => node.form?.getAttribute('aria-label'))).toBe('External choice form');
    await page.getByRole('button', { name: 'Set reset Beta', exact: true }).click();
    await expect(input).toHaveValue('Beta');
    expect(await successfulValues(form)).toEqual([['reset-choice', 'beta']]);
    expect(await successfulValues(decoy)).toEqual([]);
    await page.getByLabel('Prevent choice reset', { exact: true }).check();
    await page.getByRole('button', { name: 'Reset external choice', exact: true }).click();
    await expect(input).toHaveValue('Beta');
    await page.getByLabel('Prevent choice reset', { exact: true }).uncheck();
    await page.getByLabel('Accept choice reset', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Reset external choice', exact: true }).click();
    await expect(input).toHaveValue('Beta');
    expect(await successfulValues(form)).toEqual([['reset-choice', 'beta']]);
    await page.getByLabel('Accept choice reset', { exact: true }).check();
    await input.press('ArrowDown');
    await form.evaluate((node: HTMLFormElement) => node.reset());
    await expect(input).toHaveValue('Alpha');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expectNoActive(input);
    expect(await successfulValues(form)).toEqual([['reset-choice', 'alpha']]);
    await page.getByRole('button', { name: 'Remove reset Alpha', exact: true }).click();
    await form.evaluate((node: HTMLFormElement) => node.reset());
    await expectInvalid(input);
    expect(await successfulValues(form)).toEqual([]);
    await page.getByRole('button', { name: 'Unmount reset choice', exact: true }).click();
    const callbacks = page.getByRole('status', { name: 'Reset callback count', exact: true });
    const before = await callbacks.textContent();
    await form.evaluate((node: HTMLFormElement) => node.reset());
    await expect(callbacks).toHaveText(before!);
  });

  test('reset-data: unmount cancels a reset already queued by the owning form', async ({ page }) => {
    const diagnostics: string[] = [];
    page.on('pageerror', error => diagnostics.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text()); });
    await page.getByRole('button', { name: 'Set reset Beta', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Reset choice', exact: true })).toHaveValue('Beta');
    const callbacks = page.getByRole('status', { name: 'Reset callback count', exact: true });
    const before = await callbacks.textContent();
    await page.getByRole('form', { name: 'External choice form', exact: true }).evaluate((form: HTMLFormElement) => {
      form.reset();
      [...document.querySelectorAll('button')].find(button => button.textContent === 'Unmount reset choice')!.click();
    });
    await expect(page.getByRole('combobox', { name: 'Reset choice', exact: true })).toHaveCount(0);
    await page.evaluate(() => new Promise<void>(resolve => setTimeout(resolve, 0)));
    await expect(callbacks).toHaveText(before!);
    expect(diagnostics).toEqual([]);
  });

  test('reset-data: unknown initial key has no invented label and uncontrolled data loss clears without selecting a neighbor', async ({ page }) => {
    const diagnostics: string[] = [];
    page.on('pageerror', error => diagnostics.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text()); });
    const unknown = page.getByRole('combobox', { name: 'Unknown choice', exact: true });
    await expect(unknown).toHaveValue('');
    await expectInvalid(unknown);
    expect(await successfulValues(page.getByRole('form', { name: 'Unknown choice form', exact: true }))).toEqual([]);
    const draft = page.getByRole('combobox', { name: 'Draft choice', exact: true });
    await page.getByRole('button', { name: 'Remove draft Alpha', exact: true }).click();
    await expect(draft).toHaveValue('');
    expect(await successfulValues(page.getByRole('form', { name: 'Draft choice form', exact: true }))).toEqual([]);
    expect(await draft.evaluate((node: HTMLInputElement) => node.checkValidity())).toBe(true);
    expect(diagnostics).toEqual([]);
  });

  test('active-lifecycle: DOM reorder preserves identity and removal repairs next then previous then none', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Lifecycle choice', exact: true });
    const list = page.getByRole('listbox', { name: 'Lifecycle suggestions', exact: true });
    await input.press('ArrowDown');
    const alpha = list.getByRole('option', { name: 'Alpha', exact: true });
    const beta = list.getByRole('option', { name: 'Beta', exact: true });
    const gamma = list.getByRole('option', { name: 'Gamma', exact: true });
    await input.press('ArrowDown');
    await expectActive(input, beta);
    // Move the real mounted node; no registration/unregistration or parent data reorder.
    await beta.evaluate(node => node.parentElement!.prepend(node));
    await expectActive(input, beta);
    await beta.evaluate(node => node.remove());
    await expectActive(input, alpha);
    await input.press('ArrowDown');
    await expectActive(input, gamma);
    await gamma.evaluate(node => node.remove());
    await expectActive(input, alpha);
    await alpha.evaluate(node => node.remove());
    await expectNoActive(input);
    await input.press('Escape');
    await input.press('ArrowDown');
    await expectActive(input, list.getByRole('option', { name: 'Alpha', exact: true }));
    await input.fill('Gamma');
    await expectActive(input, list.getByRole('option', { name: 'Gamma', exact: true }));
    await input.fill('no matches');
    await expectNoActive(input);
    await expect(page.getByRole('status', { name: 'Lifecycle empty', exact: true })).toBeVisible();
    await expect(list.getByRole('status')).toHaveCount(0);
  });

  test('active-lifecycle: object replacement and data reorder preserve the active key', async ({ page }) => {
    const diagnostics: string[] = [];
    page.on('pageerror', error => diagnostics.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text()); });
    const input = page.getByRole('combobox', { name: 'Lifecycle choice', exact: true });
    const list = page.getByRole('listbox', { name: 'Lifecycle suggestions', exact: true });
    await input.press('ArrowDown');
    await input.press('ArrowDown');
    const beta = list.getByRole('option', { name: 'Beta', exact: true });
    await expectActive(input, beta);
    for (const name of ['Replace choice objects', 'Reverse choice objects']) {
      // Invoke the public parent control without an outside-pointer dismissal.
      await page.getByRole('button', { name, exact: true }).evaluate((button: HTMLButtonElement) => button.click());
      await expectActive(input, beta);
    }
    await page.getByRole('button', { name: 'Show disabled choices only', exact: true }).evaluate((button: HTMLButtonElement) => button.click());
    await expectNoActive(input);
    await expect(page.getByRole('status', { name: 'Lifecycle empty', exact: true })).toBeHidden();
    expect(diagnostics).toEqual([]);
  });

  test('active-lifecycle: opening upward reaches the last result, clamps and scrolls without moving focus', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Lifecycle choice', exact: true });
    await page.getByRole('button', { name: 'Show long choice list', exact: true }).click();
    await input.press('ArrowUp');
    const list = page.getByRole('listbox', { name: 'Lifecycle suggestions', exact: true });
    const last = list.getByRole('option', { name: 'Choice 24', exact: true });
    await expectActive(input, last);
    await expect.poll(() => list.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    const bounds = await last.evaluate(node => {
      const row = node.getBoundingClientRect();
      const viewport = node.closest('[role="listbox"]')!.getBoundingClientRect();
      return { top: row.top, bottom: row.bottom, viewportTop: viewport.top, viewportBottom: viewport.bottom };
    });
    expect(bounds.top).toBeGreaterThanOrEqual(bounds.viewportTop - 0.5);
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewportBottom + 0.5);
    await input.press('ArrowDown');
    await expectActive(input, last);
    await input.press('Escape');
    await input.press('ArrowDown');
    const first = list.getByRole('option', { name: 'Choice 0', exact: true });
    await expectActive(input, first);
    await input.press('ArrowUp');
    await expectActive(input, first);
  });

  test('input-editing: IME and native editing remain native in LTR and RTL and Tab leaves the popup', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Lifecycle choice', exact: true });
    const list = page.getByRole('listbox', { name: 'Lifecycle suggestions', exact: true });
    await input.press('ArrowDown');
    const alpha = list.getByRole('option', { name: 'Alpha', exact: true });
    await expectActive(input, alpha);
    await input.dispatchEvent('compositionstart', { data: '' });
    await input.dispatchEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', isComposing: true });
    await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true });
    await expectActive(input, alpha);
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await input.dispatchEvent('compositionend', { data: '' });
    const keys = ['Home', 'End', 'Shift+ArrowLeft', 'ControlOrMeta+a'];
    const selection = (node: HTMLInputElement) => [node.selectionStart, node.selectionEnd, node.selectionDirection];
    await page.evaluate(() => {
      const reference = document.createElement('input');
      reference.id = 'native-editing-reference';
      reference.style.cssText = 'position:fixed;top:0;left:0';
      document.body.append(reference);
    });
    const reference = page.locator('#native-editing-reference');
    try {
      for (const direction of ['ltr', 'rtl']) await test.step(`native editing parity: ${direction}`, async () => {
        await page.getByRole('button', { name: `Use ${direction.toUpperCase()} inputs`, exact: true }).click();
        await expect(input).toHaveAttribute('aria-expanded', 'false');
        await reference.evaluate((node: HTMLInputElement, dir) => { node.dir = dir; }, direction);
        await reference.fill('Alpha');
        const expected = [];
        for (const key of keys) { await reference.press(key); expected.push(await reference.evaluate(selection)); }
        await input.fill('Alpha');
        await expect(input).toHaveValue('Alpha');
        await expect(input).toHaveAttribute('dir', direction);
        for (const [index, key] of keys.entries()) {
          await input.press(key);
          expect(await input.evaluate(selection), `${direction} ${key}`).toEqual(expected[index]);
          await expect(input).toHaveValue('Alpha');
          await expect(input).toBeFocused();
        }
      });
    } finally { await reference.evaluate(node => node.remove()); }
    await input.press('Tab');
    await expect(page.getByRole('button', { name: 'After lifecycle choice', exact: true })).toBeFocused();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toHaveValue('');
  });
  test('input-editing: shifted vertical arrows match native selection without moving either cursor', async ({ page }) => {
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'shift-selection-reference';
      document.body.append(input);
    });
    const reference = page.locator('#shift-selection-reference');
    const selection = (node: HTMLInputElement) => [node.selectionStart, node.selectionEnd, node.selectionDirection];
    try {
      for (const name of ['Lifecycle choice', 'Command search']) for (const dir of ['ltr', 'rtl']) for (const key of ['Shift+ArrowUp', 'Shift+ArrowDown']) {
        await reference.fill('Hello world');
        await reference.evaluate((node: HTMLInputElement, direction) => { node.dir = direction; node.setSelectionRange(5, 5); }, dir);
        await reference.press(key);
        const expected = await reference.evaluate(selection);
        const input = page.getByRole('combobox', { name, exact: true });
        await input.fill('Hello world');
        await expect(input).toHaveValue('Hello world');
        await input.evaluate((node: HTMLInputElement, direction) => { node.dir = direction; node.setSelectionRange(5, 5); }, dir);
        const active = await input.getAttribute('aria-activedescendant'), expanded = await input.getAttribute('aria-expanded');
        await input.press(key);
        expect(await input.evaluate(selection), `${name} ${dir} ${key}`).toEqual(expected);
        expect(await input.getAttribute('aria-activedescendant')).toBe(active);
        expect(await input.getAttribute('aria-expanded')).toBe(expanded);
        await expect(input).toHaveValue('Hello world');
      }
      await expect(page.getByRole('status', { name: 'Command actions', exact: true })).toHaveText('alpha:0,beta:0');
    } finally { await reference.evaluate(node => node.remove()); }
  });

  test('input-native-targets: child IDs cannot break live list, active-option or group-label relationships', async ({ page }) => {
    for (const [name, results, group, first] of [
      ['Native choice', 'Native suggestions', 'Native choices', 'Native Alpha button'],
      ['Native command search', 'Native command results', 'Native commands', 'Native action button']
    ]) {
      const input = page.getByRole('combobox', { name, exact: true });
      const list = page.getByRole('listbox', { name: results, exact: true });
      await input.press('ArrowDown');
      await expectActive(input, list.getByRole('option', { name: first, exact: true }));
      expect(await input.getAttribute('aria-controls')).toBe(await list.getAttribute('id'));
      expect(await input.evaluate(node => document.getElementById(node.getAttribute('aria-controls')!)?.getAttribute('role'))).toBe('listbox');
      await expect(list.getByRole('group', { name: group, exact: true })).toBeVisible();
    }
  });

  test('empty-results: client settlement distinguishes absent rows from disabled rows', async ({ page }) => {
    for (const family of ['commands', 'choices']) for (const [state, count] of [['populated', 3], ['empty', 0], ['disabled', 1]] as const) {
      const list = page.getByRole('listbox', { name: `Server ${state} ${family}`, exact: true });
      await expect(list.getByRole('option')).toHaveCount(count);
      await expect(page.getByRole('status', { name: `Server ${state} ${family} empty`, exact: true })).toHaveCount(state === 'empty' ? 1 : 0);
      await expect(list.getByRole('status')).toHaveCount(0);
    }
  });


  test('filtering: trimmed case-insensitive matching, replacement filter, duplicate labels and disabled-only results', async ({ page }) => {
    const diagnostics: string[] = [];
    page.on('pageerror', error => diagnostics.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text()); });
    const input = page.getByRole('combobox', { name: 'Lifecycle choice', exact: true });
    const list = page.getByRole('listbox', { name: 'Lifecycle suggestions', exact: true });
    await input.fill('  aL  ');
    await expect(list.getByRole('option')).toHaveCount(1);
    await expect(list.getByRole('option', { name: 'Alpha', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Use suffix choice filter', exact: true }).click();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await input.fill('ta');
    await expect(input).toHaveValue('ta');
    await expect(list.getByRole('option')).toHaveCount(1);
    await expect(list.getByRole('option', { name: 'Beta', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Show disabled choices only', exact: true }).click();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await input.fill('');
    await input.press('ArrowDown');
    await expect(list.getByRole('option')).toHaveCount(1);
    await expectNoActive(input);
    await expect(page.getByRole('status', { name: 'Lifecycle empty', exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'Show duplicate choice labels', exact: true }).click();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await input.press('ArrowDown');
    await expectActive(input, list.getByRole('option', { name: 'Same', exact: true }).first());
    await input.press('ArrowDown');
    await expectActive(input, list.getByRole('option', { name: 'Same', exact: true }).last());
    await input.press('Enter');
    await expect(input).toHaveValue('Same');
    expect(await successfulValues(page.getByRole('form', { name: 'Lifecycle choice form', exact: true }))).toEqual([['lifecycle-choice', 'same-2']]);
    expect(diagnostics).toEqual([]);
  });

  test('input-native-targets: native button and anchor activation commit once and cancellation prevents defaults', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Native choice', exact: true });
    const form = page.getByRole('form', { name: 'Native choice form', exact: true });
    const list = page.getByRole('listbox', { name: 'Native suggestions', exact: true });
    const commits = page.getByRole('status', { name: 'Native choice commits', exact: true });
    await page.getByRole('button', { name: 'Focus native choice ref', exact: true }).click();
    await expect(input).toBeFocused();
    await page.getByLabel('Cancel native input keys', { exact: true }).check();
    await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await page.getByLabel('Cancel native input keys', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Toggle native suggestions', exact: true }).click();
    await expect(input).toBeFocused();
    await list.getByRole('option', { name: 'Native Alpha button', exact: true }).click();
    await expect(commits).toHaveText('1');
    expect(await successfulValues(form)).toEqual([['native-choice', 'alpha']]);
    await page.getByRole('button', { name: 'Toggle native suggestions', exact: true }).click();
    const before = page.url();
    await page.getByLabel('Cancel native choice activation', { exact: true }).check();
    await page.getByRole('button', { name: 'Toggle native suggestions', exact: true }).click();
    await expect(list).toBeVisible();
    await list.getByRole('option', { name: 'Native Beta link', exact: true }).click();
    expect(page.url()).toBe(before);
    await expect(commits).toHaveText('1');
    expect(await successfulValues(form)).toEqual([['native-choice', 'alpha']]);
    await page.getByLabel('Cancel native choice activation', { exact: true }).uncheck();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await input.press('ArrowDown');
    await expectActive(input, list.getByRole('option', { name: 'Native Alpha button', exact: true }));
    await input.press('ArrowDown');
    await expectActive(input, list.getByRole('option', { name: 'Native Beta link', exact: true }));
    await input.press('Enter');
    await expect(commits).toHaveText('2');
    await expect(page.getByRole('status', { name: 'Native choice submissions', exact: true })).toHaveText('0');
    await page.getByRole('button', { name: 'Clear native choice', exact: true }).click();
    await expect(input).toBeFocused();
    expect(await successfulValues(form)).toEqual([]);
  });

  test('touch: scrolling does not select and a trusted tap commits exactly once', async ({ browser, page }) => {
    const context = await browser.newContext({ hasTouch: true });
    try {
      const touch = await context.newPage();
      await touch.goto(page.url());
      const input = touch.getByRole('combobox', { name: 'Native choice', exact: true });
      await touch.getByRole('button', { name: 'Toggle native suggestions', exact: true }).tap();
      const list = touch.getByRole('listbox', { name: 'Native suggestions', exact: true });
      const row = list.getByRole('option', { name: 'Native Alpha button', exact: true });
      await row.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, isPrimary: true, button: 0 });
      await row.dispatchEvent('pointermove', { pointerType: 'touch', pointerId: 1, isPrimary: true, clientY: 100 });
      await row.dispatchEvent('pointercancel', { pointerType: 'touch', pointerId: 1, isPrimary: true });
      await list.evaluate(node => { node.scrollTop = 80; });
      expect(await list.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
      await expect(touch.getByRole('status', { name: 'Native choice commits', exact: true })).toHaveText('0');
      await row.tap();
      await expect(input).toHaveValue('Alpha');
      await expect(touch.getByRole('status', { name: 'Native choice commits', exact: true })).toHaveText('1');
    } finally { await context.close(); }
  });

  test('command-actions: wrapping cursor acts exactly once without selection or form submission', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Command search', exact: true });
    const list = page.getByRole('listbox', { name: 'Command results', exact: true });
    const alpha = list.getByRole('option', { name: 'Run Alpha', exact: true });
    const beta = list.getByRole('option', { name: 'Run Beta', exact: true });
    const actions = page.getByRole('status', { name: 'Command actions', exact: true });
    await input.focus();
    await input.press('ArrowDown');
    await expectActive(input, alpha);
    await input.press('ArrowUp');
    await expectActive(input, beta);
    await input.press('ArrowDown');
    await expectActive(input, alpha);
    await input.press('Enter');
    await expect(actions).toHaveText('alpha:1,beta:0');
    await expect(input).toBeFocused();
    await expect(list).toBeVisible();
    await input.press('Enter');
    await expect(actions).toHaveText('alpha:2,beta:0');
    await input.press('ArrowDown');
    await expectActive(input, beta);
    await expect(alpha).toHaveAttribute('aria-selected', 'false');
    await expect(list.locator('[data-state="checked"]')).toHaveCount(0);
    await beta.click();
    await expect(actions).toHaveText('alpha:2,beta:1');
    await expect(page.getByRole('status', { name: 'Command submissions', exact: true })).toHaveText('0');
    expect(await successfulValues(page.getByRole('form', { name: 'Command form', exact: true }))).toEqual([]);
    await page.getByLabel('Clamp command cursor', { exact: true }).check();
    await input.focus();
    await input.press('ArrowDown');
    await expectActive(input, beta);
    await input.press('ArrowUp');
    await input.press('ArrowUp');
    await expectActive(input, alpha);
  });

  test('command-actions: IME, disabled and empty results never act or accidentally submit', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Command search', exact: true });
    const list = page.getByRole('listbox', { name: 'Command results', exact: true });
    await expect(page.getByRole('status', { name: 'Command loading', exact: true })).toBeVisible();
    await expect(list.getByRole('status')).toHaveCount(0);
    await input.press('ArrowDown');
    await input.dispatchEvent('compositionstart', { data: '' });
    await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
    await input.dispatchEvent('keydown', { key: 'ArrowDown', isComposing: true });
    await expectActive(input, list.getByRole('option', { name: 'Run Alpha', exact: true }));
    await input.dispatchEvent('compositionend', { data: '' });
    await page.getByRole('button', { name: 'Show disabled commands only', exact: true }).click();
    await input.focus();
    await input.press('ArrowDown');
    await expectNoActive(input);
    await expect(page.getByRole('status', { name: 'No commands', exact: true })).toBeHidden();
    await list.getByRole('option', { name: 'Unavailable action', exact: true }).dispatchEvent('click');
    await input.press('Enter');
    await page.getByRole('button', { name: 'Remove all commands', exact: true }).click();
    await input.press('Enter');
    await expect(page.getByRole('status', { name: 'No commands', exact: true })).toBeVisible();
    await expect(list.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('status', { name: 'Command actions', exact: true })).toHaveText('alpha:0,beta:0');
    await expect(page.getByRole('status', { name: 'Command submissions', exact: true })).toHaveText('0');
  });

  test('command-replace: controlled search and caller-ranked replacements repair live active identity', async ({ page }) => {
    const diagnostics: string[] = [];
    page.on('pageerror', error => diagnostics.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text()); });
    const input = page.getByRole('combobox', { name: 'Command search', exact: true });
    const list = page.getByRole('listbox', { name: 'Command results', exact: true });
    await page.getByLabel('Accept command search', { exact: true }).uncheck();
    await input.fill('rejected');
    await expect(input).toHaveValue('');
    await page.getByLabel('Accept command search', { exact: true }).check();
    // Fixture leaves old rows in place until the explicit remote-result delivery.
    await input.fill('remote');
    await expect(input).toHaveValue('remote');
    await expect(list.getByRole('option', { name: 'Run Alpha', exact: true })).toBeVisible();
    await expectActive(input, list.getByRole('option', { name: 'Run Alpha', exact: true }));
    await page.getByRole('button', { name: 'Deliver remote commands', exact: true }).click();
    await input.focus();
    const first = list.getByRole('option', { name: 'Remote first', exact: true });
    const second = list.getByRole('option', { name: 'Remote second', exact: true });
    await expectActive(input, first);
    await input.press('ArrowDown');
    await expectActive(input, second);
    await second.evaluate(node => node.parentElement!.prepend(node));
    await expectActive(input, second);
    await second.evaluate(node => node.remove());
    await expectActive(input, first);
    await first.evaluate(node => node.remove());
    await expectNoActive(input);
    await expect(page.getByRole('status', { name: 'No commands', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Restore initial commands', exact: true }).click();
    await input.focus();
    await input.fill('new query');
    await expectActive(input, list.getByRole('option', { name: 'Run Alpha', exact: true }));
    await expect(list.getByRole('option')).toHaveCount(3);
    await expect(list.getByRole('group', { name: 'Available commands', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Remount command list', exact: true }).click();
    await input.focus();
    await input.press('ArrowDown');
    await expect.poll(() => input.evaluate(node => {
      const id = node.getAttribute('aria-activedescendant');
      return !!id && document.getElementById(id)?.getAttribute('role') === 'option';
    })).toBe(true);
    await input.press('ControlOrMeta+a');
    await input.press('Space');
    await expect(input).toHaveValue(' ');
    expect(diagnostics).toEqual([]);
  });

  test('command-replace: synchronous caller filtering resets after replacement and preserves manual identity afterward', async ({ page }) => {
    const diagnostics: string[] = [];
    page.on('pageerror', error => diagnostics.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text()); });
    const input = page.getByRole('combobox', { name: 'Command search', exact: true });
    const list = page.getByRole('listbox', { name: 'Command results', exact: true });
    await expectNoActive(input);
    await page.getByLabel('Filter command results', { exact: true }).check();
    await input.fill('Beta');
    const beta = list.getByRole('option', { name: 'Run Beta', exact: true });
    await expect(list.getByRole('option')).toHaveCount(1);
    await expectActive(input, beta);
    await input.press('Enter');
    await expect(page.getByRole('status', { name: 'Command actions', exact: true })).toHaveText('alpha:0,beta:1');
    await page.getByLabel('Accept command search', { exact: true }).uncheck();
    await input.fill('Alpha');
    await expect(input).toHaveValue('Beta');
    await expectActive(input, beta);
    await page.getByLabel('Filter command results', { exact: true }).uncheck();
    await input.press('ArrowUp');
    await input.press('ArrowDown');
    await expectActive(input, beta);
    for (const name of ['Replace command objects', 'Reverse command objects']) {
      await page.getByRole('button', { name, exact: true }).click();
      await input.focus();
      await expectActive(input, beta);
    }
    await expect(page.getByRole('status', { name: 'Command submissions', exact: true })).toHaveText('0');
    expect(diagnostics).toEqual([]);
  });

  for (const pending of ['Remove all commands', 'Show disabled commands only']) {
    test(`command-replace: accepted search waits through ${pending} for results without a second query`, async ({ page }) => {
      const input = page.getByRole('combobox', { name: 'Command search', exact: true });
      const list = page.getByRole('listbox', { name: 'Command results', exact: true });
      await page.getByRole('button', { name: 'Remove all commands', exact: true }).click();
      await page.getByRole('button', { name: 'Deliver remote commands', exact: true }).click();
      await expectNoActive(input);
      await page.getByRole('button', { name: pending, exact: true }).click();
      await input.fill('remote');
      await expectNoActive(input);
      await page.getByRole('button', { name: 'Deliver remote commands', exact: true }).click();
      await input.focus();
      await expect(input).toHaveValue('remote');
      await expectActive(input, list.getByRole('option', { name: 'Remote first', exact: true }));
    });
  }

  test('command-native-targets: button and anchor defaults cannot duplicate or bypass cancelled actions', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Native command search', exact: true });
    const list = page.getByRole('listbox', { name: 'Native command results', exact: true });
    const actions = page.getByRole('status', { name: 'Native command actions', exact: true });
    const button = list.getByRole('option', { name: 'Native action button', exact: true });
    const link = list.getByRole('option', { name: 'Native action link', exact: true });
    await page.getByRole('button', { name: 'Focus native command ref', exact: true }).click();
    await expect(input).toBeFocused();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(actions).toHaveText('button:1,link:0');
    await button.click();
    await expect(actions).toHaveText('button:2,link:0');
    await button.focus();
    await button.press('Enter');
    await expect(actions).toHaveText('button:3,link:0');
    const url = page.url();
    await page.getByLabel('Cancel native command action', { exact: true }).check();
    await link.click();
    expect(page.url()).toBe(url);
    await button.click();
    await expect(actions).toHaveText('button:3,link:0');
    await expect(page.getByRole('status', { name: 'Native command submissions', exact: true })).toHaveText('0');
    await page.getByLabel('Cancel native command action', { exact: true }).uncheck();
    // Assistive click without pointerdown must follow the same action path.
    await link.dispatchEvent('click', { detail: 0 });
    await expect(actions).toHaveText('button:3,link:1');
    expect(page.url()).toBe(url);
  });

  test('command-dialog: guarded actions, refused close, Escape and reopen follow the recipe', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open command dialog', exact: true });
    const triggerNode = await trigger.elementHandle();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Command palette', exact: true });
    const input = dialog.getByRole('combobox', { name: 'Palette search', exact: true });
    // The modal correctly hides the background counter from role queries.
    const actions = page.locator('output[aria-label="Palette actions"]');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');
    await dialog.getByLabel('Cancel palette action', { exact: true }).check();
    await dialog.getByRole('option', { name: 'Run palette action', exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(actions).toHaveText('0');
    await dialog.getByLabel('Cancel palette action', { exact: true }).uncheck();
    await dialog.getByLabel('Refuse palette close', { exact: true }).check();
    await dialog.getByRole('option', { name: 'Run palette action', exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(actions).toHaveText('1');
    await input.fill('remember me');
    await dialog.getByLabel('Refuse palette close', { exact: true }).uncheck();
    await input.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');
    await dialog.getByRole('option', { name: 'Open action dialog', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const next = page.getByRole('dialog', { name: 'Action destination', exact: true });
    await expect(next).toBeVisible();
    await expect(next.getByRole('textbox', { name: 'Destination input', exact: true })).toBeFocused();
    expect(await triggerNode!.evaluate(node => node !== node.ownerDocument.activeElement)).toBe(true);
  });

  test('nonmodal-popup: a combobox in Dialog preserves its input focus and outside dismissal does not trap focus', async ({ page }) => {
    await page.getByRole('button', { name: 'Open choice dialog', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Choice dialog', exact: true });
    const input = dialog.getByRole('combobox', { name: 'Dialog choice', exact: true });
    await input.press('ArrowDown');
    const list = page.getByRole('listbox', { name: 'Dialog suggestions', exact: true });
    await expectActive(input, list.getByRole('option', { name: 'Alpha', exact: true }));
    await list.getByRole('option', { name: 'Beta', exact: true }).click();
    await expect(input).toHaveValue('Beta');
    await expect(input).toBeFocused();
    await expect(dialog).toBeVisible();
    await input.fill('draft');
    await dialog.getByRole('button', { name: 'Choice dialog outside popup', exact: true }).click();
    await expect(input).toHaveValue('Beta');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(dialog.getByRole('button', { name: 'Choice dialog outside popup', exact: true })).toBeFocused();
    await expect(dialog).toBeVisible();
  });
});

test('ssr-hydration: data-defined labels and stale-key omission survive node-preserving hydration', async ({ page }, info) => {
  test.skip(info.project.name.endsWith('csr'), 'Server HTML and hydration are SSR-only; interactions run in both projects.');
  const diagnostics: string[] = [];
  page.on('pageerror', error => diagnostics.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text()); });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/(src\/entry-client\.tsx|assets\/.*\.js)(\?.*)?$/, async route => { await held; await route.continue(); });
  try {
    await page.goto('/', { waitUntil: 'commit' });
    const input = page.getByRole('combobox', { name: 'Draft choice', exact: true });
    await expect(input).toBeVisible({ timeout: 2000 });
    await expect(input).toHaveValue('Alpha');
    const form = page.getByRole('form', { name: 'Draft choice form', exact: true });
    expect(await successfulValues(form)).toEqual([['choice', 'alpha']]);
    const unknown = page.getByRole('combobox', { name: 'Unknown choice', exact: true });
    await expect(unknown).toHaveValue('');
    await expect(unknown).toHaveAttribute('aria-invalid', 'true');
    expect(await successfulValues(page.getByRole('form', { name: 'Unknown choice form', exact: true }))).toEqual([]);
    const draft = page.getByRole('combobox', { name: 'Server draft choice', exact: true });
    await expect(draft).toHaveValue('draft');
    await expect(draft).toHaveAttribute('aria-invalid', 'true');
    expect(await successfulValues(page.getByRole('form', { name: 'Server draft form', exact: true }))).toEqual([]);
    const node = await input.elementHandle();
    const id = await input.getAttribute('id');
    expect(id).toBeTruthy();
    await expect(page.getByRole('listbox', { name: 'Draft suggestions', exact: true })).toHaveCount(0);
    const serverLists = await page.locator('[data-server-result]').elementHandles();
    expect(serverLists).toHaveLength(6);
    await expect(page.locator('[data-server-empty]')).toHaveCount(0);
    await expect(page.getByRole('status', { name: 'No commands', exact: true })).toHaveCount(0);
    for (const family of ['commands', 'choices']) for (const [state, count] of [['populated', 3], ['empty', 0], ['disabled', 1]] as const) {
      await expect(page.getByRole('listbox', { name: `Server ${state} ${family}`, exact: true }).getByRole('option')).toHaveCount(count);
    }
    release();
    await page.waitForLoadState('load');
    // The existing gallery ref output is the hydration boundary, not a test-only timer.
    await expect(page.locator('#refs')).toHaveText('same host');
    expect(await input.evaluate((current, server) => current === server, node)).toBe(true);
    await expect(input).toHaveAttribute('id', id!);
    await expect(input).toHaveValue('Alpha');
    await expectInvalid(draft);
    for (const list of serverLists) expect(await list.evaluate(node => node.isConnected)).toBe(true);
    await expect(page.locator('[data-server-empty]')).toHaveCount(2);
    for (const family of ['commands', 'choices']) for (const state of ['populated', 'empty', 'disabled']) {
      await expect(page.getByRole('status', { name: `Server ${state} ${family} empty`, exact: true })).toHaveCount(state === 'empty' ? 1 : 0);
    }
    await page.getByRole('button', { name: 'Toggle draft suggestions', exact: true }).click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(await input.evaluate((current, server) => current === server, node)).toBe(true);
    await expect(input).toHaveAccessibleDescription('Choose an existing item; drafts are not submitted.');
    expect(diagnostics).toEqual([]);
  } finally { release(); }
});
