import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
});

test("closed Select typeahead uses detached options and latest controlled authority, without leaking same-value user origin", async ({
  page,
}) => {
  const trigger = page.getByRole("combobox", { name: "Fruit", exact: true });
  await expect(trigger).toContainText("Apple");
  await trigger.focus();
  await page.keyboard.press("b");
  await expect(page.locator("#select-requests")).toHaveText("old:banana");
  await expect(trigger).toContainText("Apple");
  await page.getByLabel("Accept select requests", { exact: true }).check();
  await page
    .getByRole("button", { name: "Replace select callback", exact: true })
    .click();
  await trigger.focus();
  await page.keyboard.press("b");
  await expect(page.locator("#select-value")).toHaveText("banana");
  await expect(page.locator("#select-requests")).toHaveText(
    "old:banana,latest:banana",
  );
  await expect(page.locator('select[name="fruit"]')).toHaveValue("banana");
  await expect(page.locator("#select-form-changes")).toHaveText("1");
  await page.keyboard.press("b");
  await expect(page.locator("#select-value")).toHaveText("blueberry");
  await trigger.press("Enter");
  await expect(
    page.getByRole("option", { name: "Blueberry", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toBeFocused();
  await page
    .getByRole("button", { name: "Set fruit programmatically", exact: true })
    .click();
  await expect(page.locator('select[name="fruit"]')).toHaveValue("cherry");
  await expect(page.locator("#select-form-changes")).toHaveText("2");
  await page.getByLabel("Stop select propagation", { exact: true }).check();
  await trigger.focus();
  await trigger.press("Enter");
  await expect(
    page.getByRole("option", { name: "Cherry", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("option", { name: "Apple", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toContainText("Apple");
  await expect(page.locator('select[name="fruit"]')).toHaveValue("apple");
  await expect(page.locator("#select-form-changes")).toHaveText("2");
});

test("item aligned Select skips disabled focus, blocks Tab, selects with keyboard, restores focus and allows an explicit empty item", async ({
  page,
}) => {
  await page.getByLabel("Accept select requests", { exact: true }).check();
  const trigger = page.getByRole("combobox", { name: "Fruit", exact: true });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const list = page.getByRole("listbox");
  const apple = page.getByRole("option", { name: "Apple", exact: true });
  await expect(apple).toBeFocused();
  await expect(apple).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Tab");
  await expect(apple).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("option", { name: "Banana", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(list).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Banana");
  await trigger.press("Enter");
  await page.keyboard.press("End");
  await expect(
    page.getByRole("option", { name: "Clear fruit", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toContainText("Choose fruit");
  await expect(trigger).toHaveAttribute("data-placeholder", "");
  await expect(page.locator('select[name="fruit"]')).toHaveValue("");
  expect(
    await page.locator('select[name="fruit"] option[value=""]').count(),
  ).toBe(1);
  expect(
    await page
      .locator('select[name="fruit"]')
      .evaluate((node: HTMLSelectElement) => node.checkValidity()),
  ).toBe(false);
  await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
});

test("Select external native form retains initial reset, cancellation and controlled refusal while programmatic updates do not bubble", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Set fruit programmatically", exact: true })
    .click();
  await expect(page.locator('select[name="fruit"]')).toHaveValue("cherry");
  await expect(page.locator("#select-form-changes")).toHaveText("0");
  expect(
    await page
      .locator("#select-form")
      .evaluate((form: HTMLFormElement) => [...new FormData(form)]),
  ).toEqual([
    ["fruit", "cherry"],
    ["split", "split"],
  ]);
  await page.getByLabel("Cancel select reset", { exact: true }).check();
  await page.getByRole("button", { name: "Reset fruit", exact: true }).click();
  await expect(page.locator('select[name="fruit"]')).toHaveValue("cherry");
  await expect(page.locator("#select-requests")).toHaveText("");
  await page.getByLabel("Cancel select reset", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Reset fruit", exact: true }).click();
  await expect(page.locator("#select-requests")).toHaveText("old:apple");
  await expect(page.locator('select[name="fruit"]')).toHaveValue("cherry");
  await page.getByLabel("Accept select requests", { exact: true }).check();
  await page.getByRole("button", { name: "Reset fruit", exact: true }).click();
  await expect(page.locator('select[name="fruit"]')).toHaveValue("apple");
  await expect(
    page.getByRole("combobox", { name: "Fruit", exact: true }),
  ).toContainText("Apple");
  await page.getByLabel("Accept select requests", { exact: true }).uncheck();
  await page
    .locator('select[name="fruit"]')
    .evaluate((node: HTMLSelectElement) => {
      node.value = "banana";
      node.dispatchEvent(new Event("change", { bubbles: true }));
    });
  await expect(page.locator('select[name="fruit"]')).toHaveValue("apple");
  await expect(
    page.getByRole("combobox", { name: "Fruit", exact: true }),
  ).toContainText("Apple");
  await expect(page.locator("#select-requests")).toHaveText(
    "old:apple,old:apple,old:banana",
  );
});

test("Select popper and RTL retain real geometry and scrolling controls without trapping descendant keys", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Use popper select", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use RTL select", exact: true })
    .click();
  const trigger = page.getByRole("combobox", { name: "Fruit", exact: true });
  await trigger.focus();
  await trigger.press("Enter");
  const content = page.locator("[data-fruit-content]");
  await expect(content).toHaveAttribute("dir", "rtl");
  const geometry = await content.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      width: rect.width,
      left: rect.left,
      right: rect.right,
      windowWidth: innerWidth,
    };
  });
  expect(geometry.width).toBeGreaterThan(100);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.windowWidth);
  const viewport = content.locator("[data-radix-select-viewport]");
  const down = content.getByText("▼", { exact: true });
  await down.hover();
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0);
  await page.getByRole("option", { name: "Apple", exact: true }).hover();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("option", { name: "Clear fruit", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const inline = page.getByRole("combobox", {
    name: "Inline select",
    exact: true,
  });
  await inline.focus();
  await inline.press("Enter");
  const descendant = page.getByLabel("Select descendant", { exact: true });
  await descendant.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(
    page.getByRole("combobox", {
      name: "Inline select",
      exact: true,
      includeHidden: true,
    }),
  ).toContainText("First inline");
  await page.keyboard.press("Escape");
});

test("Select mouse release opens without choosing the item underneath and pointer selection retains native form value", async ({
  page,
}) => {
  await page.getByLabel("Accept select requests", { exact: true }).check();
  const trigger = page.getByRole("combobox", { name: "Fruit", exact: true });
  await trigger.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.locator("#select-requests")).toHaveText("");
  const list = page.getByRole("listbox"),
    viewport = list.locator("[data-radix-select-viewport]");
  const initialHeight = (await list.boundingBox())!.height;
  await viewport.hover();
  await page.mouse.wheel(0, 200);
  await list.getByText("▼", { exact: true }).hover();
  await expect
    .poll(async () => (await list.boundingBox())!.height)
    .toBeGreaterThan(initialHeight + 100);
  await page.mouse.move(0, 0);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect((await list.boundingBox())!.height).toBeGreaterThan(
    initialHeight + 100,
  );
  await page.getByRole("option", { name: "Banana", exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toContainText("Banana");
  await expect(page.locator('select[name="fruit"]')).toHaveValue("banana");
  await expect(page.locator("#select-form-changes")).toHaveText("1");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
});

test("Select trusted touch and synthetic pen sequences open on click rather than pointerdown and select once", async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ hasTouch: true });
  try {
    const touch = await context.newPage();
    await touch.goto(page.url());
    await touch.getByLabel("Accept select requests", { exact: true }).check();
    await touch.getByRole("combobox", { name: "Fruit", exact: true }).tap();
    await expect(touch.getByRole("listbox")).toBeVisible();
    await expect(touch.locator("#select-requests")).toHaveText("");
    await touch.getByRole("option", { name: "Banana", exact: true }).tap();
    await expect(touch.getByRole("listbox")).toHaveCount(0);
    await expect(touch.locator("#select-requests")).toHaveText("old:banana");
    await expect(touch.locator('select[name="fruit"]')).toHaveValue("banana");
  } finally {
    await context.close();
  }
  await page.getByLabel("Accept select requests", { exact: true }).check();
  const trigger = page.getByRole("combobox", { name: "Fruit", exact: true });
  await trigger.dispatchEvent("pointerdown", { pointerType: "pen", button: 0 });
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await trigger.dispatchEvent("pointerup", { pointerType: "pen", button: 0 });
  await trigger.dispatchEvent("click");
  const banana = page.getByRole("option", { name: "Banana", exact: true });
  await banana.dispatchEvent("pointerdown", { pointerType: "pen", button: 0 });
  await banana.dispatchEvent("pointerup", { pointerType: "pen", button: 0 });
  await expect(page.getByRole("listbox")).toBeVisible();
  await banana.dispatchEvent("click");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.locator("#select-requests")).toHaveText("old:banana");
  await expect(page.locator('select[name="fruit"]')).toHaveValue("banana");
});

test("Select keyboard Home and End reveal viewport boundaries including padding", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Use popper select", exact: true })
    .click();
  const trigger = page.getByRole("combobox", { name: "Fruit", exact: true });
  const apple = page.getByRole("option", { name: "Apple", exact: true });
  await trigger.press("Enter");
  await expect(apple).toBeFocused();
  const viewport = page.locator(
    "[data-fruit-content] [data-radix-select-viewport]",
  );
  await viewport.evaluate((node) => {
    node.style.padding = "24px 0";
  });
  await page.keyboard.press("End");
  await expect(
    page.getByRole("option", { name: "Clear fruit", exact: true }),
  ).toBeFocused();
  await expect
    .poll(() =>
      viewport.evaluate((node) =>
        Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop),
      ),
    )
    .toBeLessThan(1);
  await page.keyboard.press("Home");
  await expect(apple).toBeFocused();
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
});
