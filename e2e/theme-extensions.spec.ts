import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
});

test("custom palette identity colors real controls and survives built-in transitions and portal relocation", async ({
  page,
}) => {
  await expect(page.locator("#extension-button")).toHaveCSS(
    "background-color",
    "rgb(82, 114, 94)",
  );
  await page
    .getByRole("button", { name: "Toggle extension accent", exact: true })
    .click();
  await expect(page.locator("#extension-explicit")).toHaveCSS(
    "background-color",
    "rgb(82, 114, 94)",
  );
  await page
    .getByRole("button", { name: "Toggle extension accent", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Extension dialog", exact: true })
    .click();
  const dialog = page.locator("#extension-dialog");
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((node) => !!node.closest("#extension-portals")),
  ).toBe(true);
  await expect(page.locator("#extension-dialog-button")).toHaveCSS(
    "background-color",
    "rgb(82, 114, 94)",
  );
  await page
    .getByRole("button", {
      name: "Replace open extension palette",
      exact: true,
    })
    .click();
  await expect(page.locator("#extension-dialog-button")).toHaveCSS(
    "background-color",
    "color(display-p3 0.624 0.313 0.708)",
  );
  expect(
    (await page.locator("#extension-dialog-button").boundingBox())?.height,
  ).toBeCloseTo(36.8, 1);
  await page
    .getByRole("button", { name: "Extension nested popover", exact: true })
    .click();
  await expect(
    page
      .locator("#extension-popover")
      .getByRole("button", { name: "Nested custom action", exact: true }),
  ).toHaveCSS("background-color", "color(display-p3 0.624 0.313 0.708)");
  await expect(page.locator("#extension-popover-tone")).toHaveCSS(
    "color",
    "color(display-p3 0.543 0.263 0.619)",
  );
  await page
    .getByRole("button", { name: "Darken open extension palette", exact: true })
    .click();
  await expect(page.locator("#extension-popover-tone")).toHaveCSS(
    "color",
    "color(display-p3 0.86 0.602 0.933)",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Close extension dialog", exact: true })
    .click();
  await expect(page.locator("#extension-independent button")).toHaveCSS(
    "background-color",
    "rgb(82, 114, 94)",
  );
  await page
    .getByRole("button", { name: "Extension menu", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Extension item", exact: true })
    .hover();
  await expect(
    page.getByRole("menuitem", { name: "Extension item", exact: true }),
  ).toHaveCSS("background-color", "color(display-p3 0.624 0.313 0.708)");
  await page
    .getByRole("menuitem", { name: "Extension submenu", exact: true })
    .hover();
  await page
    .getByRole("menuitem", { name: "Nested extension item", exact: true })
    .hover();
  await expect(
    page.getByRole("menuitem", { name: "Nested extension item", exact: true }),
  ).toHaveCSS("background-color", "color(display-p3 0.624 0.313 0.708)");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
});

test("percentage branches stay absolute and preserve application CSS and legacy preset sizing", async ({
  page,
}) => {
  for (const [id, height] of [
    ["extension-button", 36.8],
    ["extension-small", 28.8],
    ["extension-large", 38.4],
    ["extension-override-button", 41.6],
    ["extension-inline-button", 40],
    ["extension-legacy", 28.8],
  ] as const) {
    await expect
      .poll(async () => (await page.locator("#" + id).boundingBox())?.height)
      .toBeCloseTo(height, 1);
  }
  await expect(page.locator("#extension-text-small")).toHaveCSS(
    "font-size",
    "12.6px",
  );
  await expect(page.locator("#extension-text-large")).toHaveCSS(
    "font-size",
    "16.8px",
  );
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.locator("#extension-responsive")).toHaveCSS(
    "flex-direction",
    "column",
  );
  expect(
    await page
      .locator("#theme-extensions")
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.locator("#extension-responsive")).toHaveCSS(
    "flex-direction",
    "row",
  );
});

test("ThemePanel copies the portable identity and exact percentage without changing sibling roots", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "Mount extension ThemePanel", exact: true })
    .click();
  await page.locator("#extension-button").focus();
  await page.keyboard.press("t");
  await expect(
    page.locator('#extension-panel input[name="scaling"][value="115%"]'),
  ).toBeChecked();
  await expect(
    page.locator('#extension-panel input[name="accentColor"][value="custom"]'),
  ).toBeChecked();
  await page
    .locator("#extension-panel")
    .getByRole("button", { name: "Copy Theme", exact: true })
    .click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('customAccent="calm"');
  expect(copied).toContain('scaling="115%"');
  expect(
    (await page.locator("#extension-independent button").boundingBox())?.height,
  ).toBeCloseTo(28.8, 1);
});
