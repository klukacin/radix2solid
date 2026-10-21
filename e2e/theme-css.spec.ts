import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { expect, test, type Page } from "@playwright/test";

import { accessibilityViolations } from "./accessibility.js";

const consumerRequire = createRequire(
  new URL(
    process.env.GALLERY_PACKED === "1"
      ? "../.artifacts/consumer/package.json"
      : "../package.json",
    import.meta.url,
  ),
);
const cssRoot = new URL(
  "./",
  pathToFileURL(
    consumerRequire.resolve("@wsagency/radix2solid-themes/styles.css"),
  ),
);
const fixtureCss = new URL(
  "../apps/gallery/src/theme-extensions.css",
  import.meta.url,
);
const components = [
  "button",
  "checkbox",
  "radio",
  "text-field",
  "dropdown-menu",
  "dialog",
  "popover",
  "flex",
];
async function applySelectiveCss(
  page: Page,
  componentNames: string[],
): Promise<void> {
  const css = (
    await Promise.all([
      readFile(new URL("tokens.css", cssRoot), "utf8"),
      readFile(new URL("css/common.css", cssRoot), "utf8"),
      ...componentNames.map((name) =>
        readFile(new URL(`css/${name}.css`, cssRoot), "utf8"),
      ),
      readFile(new URL("css/utilities.css", cssRoot), "utf8"),
      readFile(fixtureCss, "utf8"),
    ])
  ).join("\n");
  await page.evaluate(() =>
    document
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => node.remove()),
  );
  await page.addStyleTag({ content: css });
}

for (const [mode, palettes] of [
  ["subset", "all"],
  ["layered", "all"],
  ["subset", "used"],
  ["layered", "used"],
] as const) {
  test(`${mode} component CSS with ${palettes} palettes paints composed controls without aggregate styles`, async ({
    page,
  }, info) => {
    const suffix = mode === "layered" ? ".layer.css" : ".css";
    const tokens =
      palettes === "all"
        ? ["tokens"]
        : [
            "tokens/base",
            "tokens/colors/gray",
            "tokens/colors/jade",
            "tokens/colors/sage",
          ];
    const css = (
      await Promise.all([
        ...tokens.map((name) =>
          readFile(new URL(`${name}${suffix}`, cssRoot), "utf8"),
        ),
        readFile(new URL(`css/common${suffix}`, cssRoot), "utf8"),
        ...components.map((name) =>
          readFile(new URL(`css/${name}${suffix}`, cssRoot), "utf8"),
        ),
        readFile(new URL(`css/utilities${suffix}`, cssRoot), "utf8"),
        readFile(fixtureCss, "utf8"),
      ])
    ).join("\n");
    await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
    const paint = () =>
      page.locator("#theme-extensions").evaluate((root) => {
        const selectors = [
          "#extension-button",
          "#extension-loading",
          "#extension-small",
          "#extension-large",
          "#extension-text-small",
          '[aria-label="Extension checkbox"]',
          '[aria-label="Extension radio"]',
          ".rt-TextFieldRoot",
        ];
        return selectors.map((selector) => {
          const node = root.querySelector<HTMLElement>(selector)!;
          const style = getComputedStyle(node);
          return {
            selector,
            height: node.getBoundingClientRect().height,
            color: style.color,
            background: style.backgroundColor,
            radius: style.borderRadius,
            font: style.fontSize,
            border: style.border,
            shadow: style.boxShadow,
          };
        });
      });
    const states = async () => {
      await page.locator("#extension-button").click();
      const light = await paint();
      await page
        .getByRole("textbox", { name: "Extension field", exact: true })
        .focus();
      await page.keyboard.press("ArrowRight");
      const focus = await paint();
      await page
        .getByRole("button", {
          name: "Toggle extension appearance",
          exact: true,
        })
        .click();
      const dark = await paint();
      await page
        .getByRole("button", {
          name: "Toggle extension appearance",
          exact: true,
        })
        .click();
      return { light, focus, dark };
    };
    const full = await states();
    await page.evaluate(() =>
      document
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach((node) => node.remove()),
    );
    await page.addStyleTag({ content: css });
    const expectedPaint = {
      light: full.light.map((entry) => ({
        ...entry,
        height: expect.closeTo(entry.height, 2),
      })),
      focus: full.focus.map((entry) => ({
        ...entry,
        height: expect.closeTo(entry.height, 2),
      })),
      dark: full.dark.map((entry) => ({
        ...entry,
        height: expect.closeTo(entry.height, 2),
      })),
    };
    expect(await states()).toEqual(expectedPaint);
    const spinner = page.locator("#extension-loading .rt-SpinnerLeaf").first();
    await expect(spinner).toHaveCSS("animation-name", "rt-spinner-leaf-fade");
    await page
      .getByRole("button", { name: "Extension menu", exact: true })
      .click();
    const item = page.getByRole("menuitem", {
      name: "Extension item",
      exact: true,
    });
    await item.hover();
    await expect(item).toHaveCSS("background-color", "rgb(82, 114, 94)");
    await page
      .getByRole("menuitem", { name: "Extension submenu", exact: true })
      .hover();
    await expect(
      page.getByRole("menuitem", {
        name: "Nested extension item",
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 320, height: 800 });
    await expect(page.locator("#extension-responsive")).toHaveCSS(
      "flex-direction",
      "column",
    );
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(page.locator("#extension-responsive")).toHaveCSS(
      "flex-direction",
      "row",
    );
    await page.emulateMedia({ forcedColors: "active" });
    expect(
      await page
        .getByRole("checkbox", { name: "Extension checkbox", exact: true })
        .evaluate((node) => getComputedStyle(node, "::before").borderTopStyle),
    ).toBe("solid");
    await page.emulateMedia({ forcedColors: "none" });
    if (mode === "layered") {
      await page.addStyleTag({
        content: ".rt-Button { background-color: rgb(1, 2, 3); }",
      });
      await expect(page.locator("#extension-button")).toHaveCSS(
        "background-color",
        "rgb(1, 2, 3)",
      );
    }
  });
}

test("calendar selective CSS focus targets", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const calendar = page.locator("#theme-calendar-selective");
  await expect(calendar).toBeVisible();
  await applySelectiveCss(page, ["calendar"]);

  const day = calendar.locator('[data-testid="calendar-focus-day"]');
  const selectedCell = calendar.locator(
    '[data-testid="calendar-selected-day"]',
  );
  const todayCell = calendar.locator('[data-testid="calendar-today-day"]');
  const selected = selectedCell.getByRole("button");
  const today = todayCell.getByRole("button");
  const unavailable = calendar.locator(
    '[data-testid="calendar-unavailable-day"]',
  );
  await expect(unavailable).toBeVisible();
  await expect(unavailable).toHaveAttribute("aria-disabled", "true");
  await expect(unavailable).toHaveAttribute("aria-label", /.+/);
  const unavailablePresentation = await unavailable.evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      visibility: style.visibility,
      opacity: Number.parseFloat(style.opacity),
      fontSize: Number.parseFloat(style.fontSize),
      width: rect.width,
      height: rect.height,
    };
  });
  expect(unavailablePresentation.visibility).toBe("visible");
  expect(unavailablePresentation.opacity).toBeGreaterThan(0);
  expect(unavailablePresentation.fontSize).toBeGreaterThan(0);
  expect(unavailablePresentation.width).toBeGreaterThan(0);
  expect(unavailablePresentation.height).toBeGreaterThan(0);

  const dayStyle = (target: typeof day) =>
    target.evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        radius: style.borderTopLeftRadius,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        width: rect.width,
        height: rect.height,
      };
    });
  const rootStyle = () =>
    calendar.evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return { radius: style.borderTopLeftRadius, height: rect.height };
    });
  const selectedBefore = await dayStyle(selected);
  const todayBefore = await dayStyle(today);
  const rootBefore = await rootStyle();
  for (const target of [day, selected, today]) {
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(0);
    expect(box!.width).toBeGreaterThan(0);
  }

  await page.setViewportSize({ width: 767, height: 800 });
  const compactDay = await dayStyle(selected);
  expect(compactDay.height).toBeLessThan(selectedBefore.height);
  await page.setViewportSize({ width: 1280, height: 800 });
  expect((await dayStyle(selected)).height).toBe(selectedBefore.height);

  await page.getByRole("button", { name: "Toggle calendar radius" }).click();
  const selectedAfterRadius = await dayStyle(selected);
  const rootAfterRadius = await rootStyle();
  expect(Number.parseFloat(selectedAfterRadius.radius)).toBeGreaterThan(
    Number.parseFloat(selectedBefore.radius),
  );
  expect(Number.parseFloat(rootAfterRadius.radius)).toBeGreaterThan(
    Number.parseFloat(rootBefore.radius),
  );

  const beforeCalendar = calendar.locator("#theme-calendar-before");
  const focusProperties = () =>
    day.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        borderStyle: style.borderStyle,
        boxShadow: style.boxShadow,
      };
    });
  await beforeCalendar.focus();
  const unfocusedStyle = await focusProperties();
  await page.keyboard.press("Tab");
  await expect(day).toBeFocused();
  const focusedStyle = await focusProperties();
  expect(focusedStyle).not.toEqual(unfocusedStyle);
  expect(
    Number.parseFloat(focusedStyle.outlineWidth) > 0 ||
      focusedStyle.boxShadow !== "none",
  ).toBe(true);
  const stateStyles = await Promise.all(
    [selected, today].map((node) =>
      node.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          border: style.borderColor,
          fontWeight: style.fontWeight,
        };
      }),
    ),
  );
  expect(stateStyles[0]).not.toEqual(stateStyles[1]);

  await page
    .getByRole("button", { name: "Toggle calendar custom accent" })
    .click();
  const selectedAfterAccent = await dayStyle(selected);
  const todayAfterAccent = await dayStyle(today);
  expect(selectedAfterAccent.backgroundColor).not.toBe(
    selectedAfterRadius.backgroundColor,
  );
  expect(todayAfterAccent.borderColor).not.toBe(todayBefore.borderColor);
  const selectedBeforeScaling = await dayStyle(selected);
  const rootBeforeScaling = await rootStyle();
  await page
    .getByRole("button", { name: "Toggle calendar local scaling" })
    .click();
  const selectedAfterScaling = await dayStyle(selected);
  const rootAfterScaling = await rootStyle();
  expect(selectedAfterScaling.height).toBeGreaterThan(
    selectedBeforeScaling.height,
  );
  expect(Number.parseFloat(selectedAfterScaling.radius)).toBeGreaterThan(
    Number.parseFloat(selectedBeforeScaling.radius),
  );
  expect(rootAfterScaling.height).toBeGreaterThan(rootBeforeScaling.height);
  expect(Number.parseFloat(rootAfterScaling.radius)).toBeGreaterThan(
    Number.parseFloat(rootBeforeScaling.radius),
  );

  const lightForeground = await calendar.evaluate(
    (node) => getComputedStyle(node).color,
  );
  await page
    .getByRole("button", { name: "Toggle calendar dark appearance" })
    .click();
  const darkForeground = await calendar.evaluate(
    (node) => getComputedStyle(node).color,
  );
  expect(darkForeground).not.toBe(lightForeground);
  expect(
    await calendar.evaluate((node) => getComputedStyle(node).direction),
  ).toBe("rtl");
  await beforeCalendar.focus();
  await page.emulateMedia({ forcedColors: "active" });
  const forcedUnfocusedStyle = await focusProperties();
  await page.keyboard.press("Tab");
  await expect(day).toBeFocused();
  const forcedFocusedStyle = await focusProperties();
  expect(forcedFocusedStyle).not.toEqual(forcedUnfocusedStyle);
  expect(
    Number.parseFloat(forcedFocusedStyle.outlineWidth) > 0 ||
      forcedFocusedStyle.borderStyle !== forcedUnfocusedStyle.borderStyle,
  ).toBe(true);

  await page.emulateMedia({ forcedColors: "none" });
  await page.setViewportSize({ width: 320, height: 800 });
  const narrow = await calendar.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
  const narrowDayBox = await day.boundingBox();
  expect(narrowDayBox).not.toBeNull();
  expect(narrowDayBox!.height).toBeGreaterThanOrEqual(24);
  expect(narrowDayBox!.width).toBeGreaterThanOrEqual(24);
  await expect(day).toBeFocused();
  await page.keyboard.press("Tab");
  const calendarAccentToggle = page.getByRole("button", {
    name: "Toggle calendar custom accent",
  });
  await expect(calendarAccentToggle).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(day).toBeFocused();
  await expect(day).toBeInViewport();
  // C4's 400%-equivalent reflow target is a 320x200 CSS viewport.
  await page.setViewportSize({ width: 320, height: 200 });
  const zoomEquivalent = await calendar.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(zoomEquivalent.scrollWidth).toBeLessThanOrEqual(
    zoomEquivalent.clientWidth,
  );
  await page.keyboard.press("Tab");
  await expect(calendarAccentToggle).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(day).toBeFocused();
  const zoomEquivalentDayBox = await day.boundingBox();
  expect(zoomEquivalentDayBox).not.toBeNull();
  expect(zoomEquivalentDayBox!.height).toBeGreaterThanOrEqual(24);
  expect(zoomEquivalentDayBox!.width).toBeGreaterThanOrEqual(24);
  await expect(day).toBeInViewport();
});
test("calendar day contrast across Jade and Tomato appearances", async ({
  page,
}, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  await page.evaluate(() => document.fonts.ready);
  const calendar = page.locator("#theme-calendar-selective");
  const theme = page.locator("#theme-calendar-theme");
  await expect(calendar).toBeVisible();

  expect(
    await accessibilityViolations(page, "#theme-calendar-selective"),
  ).toEqual([]);

  await page
    .getByRole("button", {
      name: "Toggle calendar dark appearance",
      exact: true,
    })
    .click();
  await expect(theme).toHaveClass(/dark/);
  expect(
    await accessibilityViolations(page, "#theme-calendar-selective"),
  ).toEqual([]);

  await page
    .getByRole("button", { name: "Toggle calendar custom accent", exact: true })
    .click();
  expect(
    await accessibilityViolations(page, "#theme-calendar-selective"),
  ).toEqual([]);

  await page
    .getByRole("button", {
      name: "Toggle calendar dark appearance",
      exact: true,
    })
    .click();
  await expect(theme).toHaveClass(/light/);
  expect(
    await accessibilityViolations(page, "#theme-calendar-selective"),
  ).toEqual([]);
});

test("DatePicker selected adjacent-month date keeps selected contrast", async ({
  page,
}, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  await page.evaluate(() => document.fonts.ready);
  const trigger = page.locator("#theme-date-picker-trigger");
  const calendar = page.locator("#theme-date-picker-calendar");

  await trigger.click();
  await calendar
    .getByRole("button", { name: "November 1, 2026", exact: true })
    .click();
  await expect(trigger).toContainText("November 1, 2026");
  await trigger.click();
  await calendar
    .getByRole("button", { name: "Previous month", exact: true })
    .click();

  const adjacentSelected = calendar.getByRole("button", {
    name: "November 1, 2026",
    exact: true,
  });
  await expect(adjacentSelected).toHaveAttribute("data-outside-month", "");
  await expect(adjacentSelected).not.toHaveAttribute("aria-disabled", "true");
  expect(
    await adjacentSelected.evaluate((node) =>
      node.closest('[role="gridcell"]')?.getAttribute("aria-selected"),
    ),
  ).toBe("true");
  expect(
    await accessibilityViolations(page, "#theme-date-picker-calendar"),
  ).toEqual([]);
});

test("date picker nested Theme portal constraints", async ({ page }, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const picker = page.locator("#theme-date-picker-selective");
  await expect(picker).toBeVisible();
  await applySelectiveCss(page, ["date-picker"]);

  const trigger = page.locator("#theme-date-picker-trigger");
  const content = page.locator("#theme-date-picker-content");
  const contentDay = content.locator('[data-testid="date-picker-focus-day"]');
  const beforeTrigger = picker.locator("#theme-date-picker-before");
  const triggerFocusProperties = () =>
    trigger.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        borderStyle: style.borderStyle,
        boxShadow: style.boxShadow,
      };
    });
  await beforeTrigger.focus();
  const unfocusedTriggerStyle = await triggerFocusProperties();
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  const focusedTriggerStyle = await triggerFocusProperties();
  expect(focusedTriggerStyle).not.toEqual(unfocusedTriggerStyle);
  expect(
    Number.parseFloat(focusedTriggerStyle.outlineWidth) > 0 ||
      focusedTriggerStyle.boxShadow !== "none",
  ).toBe(true);
  const triggerBox = await trigger.boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(triggerBox!.height).toBeGreaterThanOrEqual(44);
  expect(triggerBox!.width).toBeGreaterThanOrEqual(44);
  await beforeTrigger.focus();
  await page.emulateMedia({ forcedColors: "active" });
  const forcedUnfocusedTriggerStyle = await triggerFocusProperties();
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  const forcedFocusedTriggerStyle = await triggerFocusProperties();
  expect(forcedFocusedTriggerStyle).not.toEqual(forcedUnfocusedTriggerStyle);
  expect(
    Number.parseFloat(forcedFocusedTriggerStyle.outlineWidth) > 0 ||
      forcedFocusedTriggerStyle.borderStyle !==
        forcedUnfocusedTriggerStyle.borderStyle,
  ).toBe(true);
  await page.emulateMedia({ forcedColors: "none" });
  await trigger.click();
  await expect(content).toBeVisible();
  await expect(contentDay).toBeFocused();
  await expect(contentDay).toBeVisible();
  const dayBox = await contentDay.boundingBox();
  expect(dayBox).not.toBeNull();
  expect(dayBox!.height).toBeGreaterThanOrEqual(44);
  expect(dayBox!.width).toBeGreaterThanOrEqual(44);
  expect(
    await content.evaluate((node) => getComputedStyle(node).direction),
  ).toBe("rtl");

  const calendarSurface = content.locator("#theme-date-picker-calendar");
  const inheritedStyles = await Promise.all([
    contentDay.evaluate((node) => getComputedStyle(node).minBlockSize),
    calendarSurface.evaluate(
      (node) => getComputedStyle(node).borderTopLeftRadius,
    ),
  ]);
  expect(Number.parseFloat(inheritedStyles[0])).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(inheritedStyles[1])).toBeGreaterThan(12);
  const inheritedDayAccent = await contentDay.evaluate(
    (node) => getComputedStyle(node).borderColor,
  );

  const themeContext = await Promise.all([
    picker.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--accent-9").trim(),
    ),
    content.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--accent-9").trim(),
    ),
  ]);
  expect(themeContext[1]).toBe(themeContext[0]);
  expect(
    await contentDay.evaluate((node) => getComputedStyle(node).borderColor),
  ).toBe(inheritedDayAccent);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Toggle date picker custom accent" })
    .click();
  await trigger.click();
  await expect(content).toBeVisible();
  await expect(contentDay).toBeFocused();
  await expect(contentDay).toBeVisible();
  const updatedAccent = await Promise.all([
    picker.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--accent-9").trim(),
    ),
    content.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--accent-9").trim(),
    ),
  ]);
  expect(updatedAccent[0]).not.toBe(themeContext[0]);
  expect(updatedAccent[1]).toBe(updatedAccent[0]);
  expect(
    await contentDay.evaluate((node) => getComputedStyle(node).borderColor),
  ).not.toBe(inheritedDayAccent);
  const portalScaling = await Promise.all([
    picker.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--radix-scaling").trim(),
    ),
    content.evaluate((node) =>
      getComputedStyle(node).getPropertyValue("--radix-scaling").trim(),
    ),
  ]);
  expect(portalScaling[1]).toBe(portalScaling[0]);
  expect(Number.parseFloat(portalScaling[0])).toBeGreaterThan(1);
  const popup = await content.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      maxBlockSize: style.maxBlockSize,
      maxInlineSize: style.maxInlineSize,
      overflowY: style.overflowY,
    };
  });
  expect(popup.maxBlockSize).not.toBe("none");
  expect(popup.maxInlineSize).not.toBe("none");
  expect(["auto", "scroll"]).toContain(popup.overflowY);

  const form = page.locator("#theme-date-picker-form");
  const bridgedInput = page.locator("#theme-date-picker-input");
  await expect(bridgedInput).toHaveAttribute("type", "date");
  await expect(bridgedInput).toHaveAttribute("required", "");
  await expect(trigger).toHaveAccessibleName("Theme appointment date");
  const label = form
    .locator("label")
    .filter({ hasText: "Theme appointment date" });
  await expect(label).toHaveCount(1);
  await expect(label).toHaveAttribute("for", "theme-date-picker-input");
  const validity = await bridgedInput.evaluate(
    (node) => (node as HTMLInputElement).validity.valueMissing,
  );
  expect(validity).toBe(true);
  expect(
    await form.evaluate((node) => (node as HTMLFormElement).checkValidity()),
  ).toBe(false);
  await expect(form.locator("#theme-date-picker-form-validity")).toHaveText(
    "true",
  );
  await expect(trigger).toHaveAttribute("aria-invalid", "true");
  await page.keyboard.press("Escape");
  await label.click();
  await expect(trigger).toBeFocused();
  const formEntries = await form.evaluate((node) => {
    const data = new FormData(node as HTMLFormElement);
    return {
      rootOnly: data.getAll("rootOnlyDate").length,
      explicitBridge: data.getAll("appointmentDate").length,
    };
  });
  expect(formEntries).toEqual({ rootOnly: 0, explicitBridge: 1 });
  expect(await form.locator('input[type="date"]').count()).toBe(1);
  await page.setViewportSize({ width: 320, height: 360 });
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeInViewport();
  const documentScrollBeforeNarrow = await page.evaluate(
    () => document.scrollingElement?.scrollTop ?? 0,
  );
  await trigger.click();
  await expect(content).toBeVisible();
  await expect(contentDay).toBeFocused();
  const narrowPopup = await content.boundingBox();
  expect(narrowPopup).not.toBeNull();
  expect(narrowPopup!.x).toBeGreaterThanOrEqual(0);
  expect(narrowPopup!.x + narrowPopup!.width).toBeLessThanOrEqual(320);
  expect(narrowPopup!.y).toBeGreaterThanOrEqual(0);
  expect(narrowPopup!.y + narrowPopup!.height).toBeLessThanOrEqual(360);
  await expect
    .poll(async () => (await contentDay.boundingBox())?.height ?? 0)
    .toBeGreaterThanOrEqual(24);
  const narrowDayBox = await contentDay.boundingBox();
  expect(narrowDayBox).not.toBeNull();
  expect(narrowDayBox!.height).toBeGreaterThanOrEqual(24);
  expect(narrowDayBox!.width).toBeGreaterThanOrEqual(24);
  const internalScroll = await content.evaluate((node) => ({
    scrollTop: node.scrollTop,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
  }));
  expect(internalScroll.scrollHeight).toBeGreaterThan(
    internalScroll.clientHeight,
  );
  expect(
    await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0),
  ).toBe(documentScrollBeforeNarrow);
  await expect(contentDay).toBeInViewport();
  await page.keyboard.press("ArrowRight");
  const activeNarrowDay = content.locator('[role="grid"] button:focus');
  await expect(activeNarrowDay).toBeEnabled();
  await expect(activeNarrowDay).toBeInViewport();
  expect(
    await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0),
  ).toBe(documentScrollBeforeNarrow);
  await page.keyboard.press("Escape");
  await expect(content).toBeHidden();
  await expect(trigger).toBeFocused();
  // C4's 400%-equivalent reflow target is a 320x200 CSS viewport.
  await page.setViewportSize({ width: 320, height: 200 });
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeInViewport();
  const documentScrollBeforeZoomEquivalent = await page.evaluate(
    () => document.scrollingElement?.scrollTop ?? 0,
  );
  await trigger.click();
  await expect(content).toBeVisible();
  await expect(contentDay).toBeFocused();
  const zoomEquivalentPopup = await content.boundingBox();
  expect(zoomEquivalentPopup).not.toBeNull();
  expect(zoomEquivalentPopup!.x).toBeGreaterThanOrEqual(0);
  expect(
    zoomEquivalentPopup!.x + zoomEquivalentPopup!.width,
  ).toBeLessThanOrEqual(320);
  expect(zoomEquivalentPopup!.y).toBeGreaterThanOrEqual(0);
  expect(
    zoomEquivalentPopup!.y + zoomEquivalentPopup!.height,
  ).toBeLessThanOrEqual(200);
  await expect
    .poll(async () => (await contentDay.boundingBox())?.height ?? 0)
    .toBeGreaterThanOrEqual(24);
  const zoomEquivalentDayBox = await contentDay.boundingBox();
  expect(zoomEquivalentDayBox).not.toBeNull();
  expect(zoomEquivalentDayBox!.height).toBeGreaterThanOrEqual(24);
  expect(zoomEquivalentDayBox!.width).toBeGreaterThanOrEqual(24);
  const zoomEquivalentInternalScroll = await content.evaluate((node) => ({
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
  }));
  expect(zoomEquivalentInternalScroll.scrollHeight).toBeGreaterThan(
    zoomEquivalentInternalScroll.clientHeight,
  );
  expect(
    await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0),
  ).toBe(documentScrollBeforeZoomEquivalent);
  await expect(contentDay).toBeInViewport();
  await page.keyboard.press("ArrowRight");
  const activeZoomEquivalentDay = content.locator('[role="grid"] button:focus');
  await expect(activeZoomEquivalentDay).toBeEnabled();
  await expect(activeZoomEquivalentDay).toBeInViewport();
  expect(
    await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0),
  ).toBe(documentScrollBeforeZoomEquivalent);
});

test("file drop selective CSS and mobile browse", async ({ page }, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const drop = page.locator("#theme-file-drop-selective");
  await expect(drop).toBeVisible();
  await applySelectiveCss(page, ["file-drop"]);

  const input = page.locator("#theme-file-drop-input");
  const browse = page.locator("#theme-file-drop-browse");
  const filename = page.locator("#theme-file-drop-filename");
  await expect(input).toHaveAccessibleName("Theme file drop");
  await expect(input).toHaveAccessibleDescription(/allowed types.*required/i);
  await expect(input).toHaveAttribute("type", "file");
  const error = drop.locator("#theme-file-drop-error");
  await expect(error).toBeVisible();
  const errorId = await error.getAttribute("id");
  const describedBy = await input.getAttribute("aria-describedby");
  expect(errorId).not.toBeNull();
  expect(describedBy?.split(/\s+/)).toContain(errorId);
  const disabledInput = page.locator("#theme-file-drop-disabled-input");
  const disabledBrowse = page.locator("#theme-file-drop-disabled-browse");
  await expect(disabledInput).toBeDisabled();
  await expect(disabledBrowse).toBeDisabled();

  const browseBox = await browse.boundingBox();
  expect(browseBox).not.toBeNull();
  expect(browseBox!.height).toBeGreaterThanOrEqual(44);
  expect(browseBox!.width).toBeGreaterThanOrEqual(44);
  const browseStyle = () =>
    browse.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outline: style.outlineStyle,
        border: style.borderStyle,
        shadow: style.boxShadow,
      };
    });
  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  const unfocusedStyle = await browseStyle();
  await browse.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(input).toBeFocused();
  const visibleFocus = await browseStyle();
  expect(visibleFocus).not.toEqual(unfocusedStyle);
  expect(
    visibleFocus.outline !== "none" ||
      visibleFocus.border !== "none" ||
      visibleFocus.shadow !== "none",
  ).toBe(true);
  await page.emulateMedia({ forcedColors: "active" });
  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  const forcedUnfocused = await browseStyle();
  await browse.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(input).toBeFocused();
  const forcedFocus = await browseStyle();
  expect(forcedFocus).not.toEqual(forcedUnfocused);
  expect(forcedFocus.outline !== "none" || forcedFocus.border !== "none").toBe(
    true,
  );
  await page.emulateMedia({ forcedColors: "none" });
  const selectedFileName =
    "theme-fixture-a-deliberately-long-accepted-filename.txt";
  await input.setInputFiles({
    name: selectedFileName,
    mimeType: "text/plain",
    buffer: Buffer.from("accepted theme file"),
  });
  await expect(filename).toHaveText(selectedFileName);
  await expect(error).toHaveCount(0);
  await expect(input).toHaveAttribute(
    "aria-describedby",
    "theme-file-drop-description",
  );
  await expect(input).toHaveAccessibleDescription(
    new RegExp(`allowed types.*${selectedFileName}`, "i"),
  );
  const selectedFile = await input.evaluateHandle(
    (node) => (node as HTMLInputElement).files?.[0],
  );
  const selectedFileInfo = await input.evaluate((node) => {
    const file = (node as HTMLInputElement).files?.[0];
    return file && { name: file.name, size: file.size, type: file.type };
  });
  expect(selectedFileInfo).toMatchObject({
    name: selectedFileName,
    type: "text/plain",
  });
  const readFormFiles = () =>
    page.locator("#theme-file-drop-form").evaluate((node) =>
      new FormData(node as HTMLFormElement).getAll("themeFiles").map((file) => {
        const selected = file as File;
        return {
          name: selected.name,
          size: selected.size,
          type: selected.type,
        };
      }),
    );
  const selectedFormFiles = await readFormFiles();
  expect(selectedFormFiles).toEqual([selectedFileInfo]);

  const filenameStyle = await filename.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      whiteSpace: style.whiteSpace,
      overflowWrap: style.overflowWrap,
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    };
  });
  expect(["normal", "pre-wrap", "break-spaces"]).toContain(
    filenameStyle.whiteSpace,
  );
  expect(["anywhere", "break-word"]).toContain(filenameStyle.overflowWrap);
  expect(filenameStyle.scrollWidth).toBeLessThanOrEqual(
    filenameStyle.clientWidth,
  );
  const dropSurfaceStyle = () =>
    drop.evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        height: rect.height,
        padding: style.paddingBlockStart,
        color: style.color,
      };
    });
  const surfaceBeforeScaling = await dropSurfaceStyle();
  await page
    .getByRole("button", { name: "Toggle file drop local scaling" })
    .click();
  const surfaceAfterScaling = await dropSurfaceStyle();
  expect(surfaceAfterScaling.height).toBeGreaterThan(
    surfaceBeforeScaling.height,
  );
  expect(surfaceAfterScaling.padding).not.toBe(surfaceBeforeScaling.padding);
  const lightForeground = surfaceAfterScaling.color;
  await page
    .getByRole("button", { name: "Toggle file drop dark appearance" })
    .click();
  expect((await dropSurfaceStyle()).color).not.toBe(lightForeground);
  expect(await drop.evaluate((node) => getComputedStyle(node).direction)).toBe(
    "rtl",
  );
  const icon = drop.locator('[data-testid="file-drop-nested-icon"]');
  const text = drop.locator('[data-testid="file-drop-nested-text"]');
  const transfer = await page.evaluateHandle(() => {
    const input = document.querySelector<HTMLInputElement>(
      "#theme-file-drop-input",
    )!;
    const data = new DataTransfer();
    data.items.add(input.files![0]!);
    return data;
  });
  const rootHandle = await drop.elementHandle();
  const iconHandle = await icon.elementHandle();
  const textHandle = await text.elementHandle();
  expect(rootHandle).not.toBeNull();
  expect(iconHandle).not.toBeNull();
  expect(textHandle).not.toBeNull();
  const changeCount = page.locator("#theme-file-drop-change-count");
  const rejectionCount = page.locator("#theme-file-drop-rejection-count");
  const readDragCounts = async () => [
    await changeCount.innerText(),
    await rejectionCount.innerText(),
  ];
  const countsBeforeDrag = await readDragCounts();
  expect(Number(countsBeforeDrag[0])).toBeGreaterThan(0);
  expect(Number(countsBeforeDrag[1])).toBe(0);
  const idleDragStyle = await drop.evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, border: style.borderColor };
  });
  await drop.dispatchEvent("dragenter", { dataTransfer: transfer });
  await expect(drop).toHaveAttribute("data-dragging", "true");
  expect(await readDragCounts()).toEqual(countsBeforeDrag);
  await icon.dispatchEvent("dragenter", {
    dataTransfer: transfer,
    relatedTarget: rootHandle,
  });
  await expect(drop).toHaveAttribute("data-dragging", "true");
  expect(await readDragCounts()).toEqual(countsBeforeDrag);
  const activeDragStyle = await drop.evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, border: style.borderColor };
  });
  expect(activeDragStyle.background).not.toBe(idleDragStyle.background);
  expect(activeDragStyle.border).not.toBe(idleDragStyle.border);
  await page
    .getByRole("button", { name: "Toggle file drop custom accent" })
    .click();
  const activeDragAfterAccent = await drop.evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, border: style.borderColor };
  });
  expect(activeDragAfterAccent.background).not.toBe(activeDragStyle.background);
  expect(activeDragAfterAccent.border).not.toBe(activeDragStyle.border);
  await expect(drop).toHaveAttribute("data-dragging", "true");
  await text.dispatchEvent("dragenter", {
    dataTransfer: transfer,
    relatedTarget: iconHandle,
  });
  await expect(drop).toHaveAttribute("data-dragging", "true");
  expect(await readDragCounts()).toEqual(countsBeforeDrag);
  await icon.dispatchEvent("dragleave", {
    dataTransfer: transfer,
    relatedTarget: textHandle,
  });
  await expect(drop).toHaveAttribute("data-dragging", "true");
  expect(await readDragCounts()).toEqual(countsBeforeDrag);
  await text.dispatchEvent("dragleave", {
    dataTransfer: transfer,
    relatedTarget: rootHandle,
  });
  await expect(drop).toHaveAttribute("data-dragging", "true");
  expect(await readDragCounts()).toEqual(countsBeforeDrag);
  await drop.dispatchEvent("dragleave", { dataTransfer: transfer });
  await expect(drop).toHaveAttribute("data-dragging", "false");
  expect(await readDragCounts()).toEqual(countsBeforeDrag);
  expect(
    await input.evaluate(
      (node, file) => (node as HTMLInputElement).files?.[0] === file,
      selectedFile,
    ),
  ).toBe(true);
  expect(await readFormFiles()).toEqual(selectedFormFiles);

  await browse.focus();
  await expect(browse).toBeFocused();
  await page.setViewportSize({ width: 320, height: 800 });
  const narrow = await drop.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
  const narrowBrowse = await browse.boundingBox();
  expect(narrowBrowse).not.toBeNull();
  expect(narrowBrowse!.height).toBeGreaterThanOrEqual(24);
  expect(narrowBrowse!.width).toBeGreaterThanOrEqual(24);
  const narrowFilename = await filename.evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  }));
  expect(narrowFilename.scrollWidth).toBeLessThanOrEqual(
    narrowFilename.clientWidth,
  );
  await expect(browse).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(browse).toBeFocused();
  await expect(browse).toBeInViewport();
  // C4's 400%-equivalent reflow target is a 320x200 CSS viewport.
  await page.setViewportSize({ width: 320, height: 200 });
  await browse.scrollIntoViewIfNeeded();
  await expect(browse).toBeInViewport();
  const zoomEquivalent = await drop.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(zoomEquivalent.scrollWidth).toBeLessThanOrEqual(
    zoomEquivalent.clientWidth,
  );
  const zoomEquivalentBrowse = await browse.boundingBox();
  expect(zoomEquivalentBrowse).not.toBeNull();
  expect(zoomEquivalentBrowse!.height).toBeGreaterThanOrEqual(24);
  expect(zoomEquivalentBrowse!.width).toBeGreaterThanOrEqual(24);
  const zoomEquivalentFilename = await filename.evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  }));
  expect(zoomEquivalentFilename.scrollWidth).toBeLessThanOrEqual(
    zoomEquivalentFilename.clientWidth,
  );
  await expect(browse).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(browse).toBeFocused();
  await expect(browse).toBeInViewport();
});
