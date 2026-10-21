import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
});

test("responsive CSS honors every threshold and live size, color, margin and typography context", async ({
  page,
}) => {
  const box = page.locator("#theme-responsive-box");
  for (const [width, expected] of [
    [519, 120],
    [520, 160],
    [767, 160],
    [768, 200],
    [1023, 200],
    [1024, 240],
    [1279, 240],
    [1280, 280],
    [1639, 280],
    [1640, 320],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(box).toHaveCSS("width", `${expected}px`);
  }
  const button = page.getByRole("button", {
    name: "Responsive button",
    exact: true,
  });
  await page.setViewportSize({ width: 900, height: 900 });
  await expect(button).toHaveCSS("height", "32px");
  await expect(page.locator("#themes-root .rt-CalloutText")).toHaveCSS(
    "font-size",
    "14px",
  );
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(button).toHaveCSS("height", "40px");
  await expect(page.locator("#themes-root .rt-CalloutText")).toHaveCSS(
    "font-size",
    "16px",
  );
  await page
    .getByRole("button", { name: "Change responsive theme props", exact: true })
    .click();
  await expect(button).toHaveCSS("height", "48px");
  await expect(button).toHaveAttribute("data-accent-color", "tomato");
  await expect(button).toHaveCSS("margin-left", "33px");
  await page.setViewportSize({ width: 519, height: 900 });
  await expect(button).toHaveCSS("margin-left", "-12px");
  await page.getByText("Native label target", { exact: true }).click();
  await expect(page.locator("#theme-label-input")).toBeFocused();
});

test("live Theme settings preserve resolved gray inheritance, explicit backgrounds and real layout scale", async ({
  page,
}) => {
  const root = page.locator("#themes-root");
  const nested = page.locator("#theme-nested");
  await expect(root).toHaveAttribute("data-gray-color", "slate");
  await expect(nested).toHaveAttribute("data-gray-color", "slate");
  await expect(page.locator("#theme-nested-auto")).toHaveAttribute(
    "data-gray-color",
    "olive",
  );
  await expect(page.locator("#theme-nested-auto")).toHaveAttribute(
    "data-has-background",
    "true",
  );
  await page.getByRole("button", { name: "Theme accent", exact: true }).click();
  await expect(root).toHaveAttribute("data-accent-color", "tomato");
  await expect(root).toHaveAttribute("data-gray-color", "mauve");
  await expect(nested).toHaveAttribute("data-gray-color", "mauve");
  await page
    .getByRole("button", { name: "Theme appearance", exact: true })
    .click();
  await expect(root).toHaveClass(/\bdark\b/);
  await expect(page.locator("#theme-context-settings")).toHaveText(
    "dark/tomato/mauve/medium/100%",
  );
  await page.getByRole("button", { name: "Theme radius", exact: true }).click();
  await expect(root).toHaveAttribute("data-radius", "full");
  const control = page.getByRole("button", {
    name: "Responsive button",
    exact: true,
  });
  const before = await control.evaluate(
    (node) => node.getBoundingClientRect().height,
  );
  await page
    .getByRole("button", { name: "Theme scaling", exact: true })
    .click();
  await expect(root).toHaveAttribute("data-scaling", "110%");
  await expect
    .poll(() =>
      control.evaluate(
        (node) => Math.round(node.getBoundingClientRect().height * 10) / 10,
      ),
    )
    .toBe(Math.round(before * 1.1 * 10) / 10);
  await expect(page.locator("#theme-context-settings")).toHaveText(
    "dark/tomato/mauve/full/110%",
  );
});

test("loading preserves host, name and dimensions while disabled override and inert Skeleton are usable", async ({
  page,
}) => {
  const button = page.getByRole("button", { name: "Save theme", exact: true });
  const before = await button.boundingBox();
  await button.evaluate((node) => {
    (window as any).__themeLoadingHost = node;
  });
  const skeleton = page.locator("#theme-skeleton-button");
  await skeleton.evaluate((node) => {
    (window as any).__themeSkeletonHost = node;
  });
  await expect(skeleton).toHaveAttribute("inert", "");
  await expect(skeleton).toHaveAttribute("aria-hidden", "true");
  await page
    .getByRole("button", { name: "Toggle themed loading", exact: true })
    .click();
  await expect(button).toBeDisabled();
  await expect(button).toHaveAccessibleName("Save theme");
  expect(
    await button.evaluate(
      (node) => node === (window as any).__themeLoadingHost,
    ),
  ).toBe(true);
  const after = await button.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
  await page
    .getByRole("button", { name: "Loading override", exact: true })
    .click();
  await expect(page.locator("#theme-loading-requests")).toHaveText("1");
  await expect(
    page.getByRole("button", { name: "Confirm theme", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Toggle themed skeleton", exact: true })
    .click();
  expect(
    await skeleton.evaluate(
      (node) => node === (window as any).__themeSkeletonHost,
    ),
  ).toBe(true);
  await expect(skeleton).not.toHaveAttribute("inert");
  await expect(skeleton).not.toHaveAttribute("aria-hidden");
  await skeleton.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#theme-loading-requests")).toHaveText("2");
  await page
    .getByRole("button", { name: "Toggle themed loading", exact: true })
    .click();
  await expect(button).toBeEnabled();
  await expect(page.locator("#theme-spinner")).toHaveCount(0);
  await expect(
    page.getByText("Spinner content", { exact: true }),
  ).toBeVisible();
});

test("Avatar recovers image failure, Progress changes determinate state, Table is semantic and RTL scroll ref is viewport", async ({
  page,
}) => {
  await expect(
    page.getByRole("img", { name: "Themed avatar", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Toggle themed avatar failure", exact: true })
    .click();
  await expect(page.locator("#themes-root .rt-AvatarFallback")).toHaveText(
    "TS",
  );
  await page
    .getByRole("button", { name: "Toggle themed avatar failure", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Themed avatar", exact: true }),
  ).toBeVisible();
  const progress = page.getByRole("progressbar", {
    name: "Theme upload",
    exact: true,
  });
  await expect(progress).toHaveAttribute("aria-valuenow", "25");
  await page
    .getByRole("button", { name: "Toggle themed progress", exact: true })
    .click();
  await expect(progress).toHaveAttribute("data-state", "indeterminate");
  await expect(progress).not.toHaveAttribute("aria-valuenow");
  await page
    .getByRole("button", { name: "Toggle themed progress", exact: true })
    .click();
  await expect(progress).toHaveAttribute("aria-valuenow", "75");
  await expect(
    page
      .locator("#theme-table")
      .getByRole("columnheader", { name: "Component", exact: true }),
  ).toHaveAttribute("scope", "col");
  await expect(
    page
      .locator("#theme-table")
      .getByRole("rowheader", { name: "Text", exact: true }),
  ).toHaveAttribute("scope", "row");
  const viewport = page.locator("#theme-scroll-viewport");
  await expect(viewport).toHaveAttribute("data-radix-scroll-area-viewport", "");
  await expect(viewport.locator("..")).toHaveAttribute("dir", "rtl");
  await expect(viewport).toHaveCSS("overflow-x", "scroll");
  await expect(viewport).toHaveCSS("overflow-y", "scroll");
  await page
    .getByRole("button", { name: "Scroll referenced viewport", exact: true })
    .click();
  await expect
    .poll(() => viewport.evaluate((node) => [node.scrollLeft, node.scrollTop]))
    .toEqual([-150, 60]);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`forced-color loading in ${colorScheme} hides bare label paint and keeps a contrasting visible spinner and accessible name`, async ({
    page,
  }) => {
    await page.emulateMedia({
      forcedColors: "active",
      colorScheme,
      reducedMotion: "reduce",
    });
    await page
      .getByRole("button", { name: "Toggle themed loading", exact: true })
      .click();
    const button = page.locator("#theme-loading-button");
    await expect(button).toBeDisabled();
    await expect(button).toHaveAccessibleName("Save theme");
    await expect
      .soft(button.locator(".rt-ButtonContent"))
      .toHaveCSS("color", "rgba(0, 0, 0, 0)");
    await expect(button.locator(".rt-Spinner")).toBeVisible();
    const paint = await button
      .locator(".rt-SpinnerLeaf")
      .evaluateAll((nodes) => {
        const probe = document.createElement("span");
        probe.style.cssText =
          "position: absolute; color: CanvasText; background-color: Canvas; forced-color-adjust: none";
        document.body.append(probe);
        try {
          const palette = getComputedStyle(probe);
          const canvasText = palette.color;
          const canvas = palette.backgroundColor;
          const painted = nodes.some((node) => {
            const style = getComputedStyle(node, "::before");
            const leaf = getComputedStyle(node);
            const spinner = getComputedStyle(node.closest(".rt-Spinner")!);
            const rect = node.getBoundingClientRect();
            return (
              style.backgroundColor === canvasText &&
              style.content !== "none" &&
              style.display !== "none" &&
              style.visibility === "visible" &&
              parseFloat(style.width) > 0 &&
              parseFloat(style.height) > 0 &&
              rect.width > 0 &&
              rect.height > 0 &&
              parseFloat(style.opacity) > 0 &&
              parseFloat(leaf.opacity) > 0 &&
              parseFloat(spinner.opacity) > 0
            );
          });
          return { canvasText, canvas, painted };
        } finally {
          probe.remove();
        }
      });
    expect(
      paint.canvasText,
      "system foreground contrasts with the forced-color canvas",
    ).not.toBe(paint.canvas);
    expect(
      paint.painted,
      "a visible spinner leaf paints the system foreground rather than the canvas",
    ).toBe(true);
  });
}

test("forced colors retain control boundaries, selected markers and keyboard focus", async ({
  page,
}) => {
  await expect(page.locator("#theme-input-ref")).toHaveText("input");
  await page.emulateMedia({ forcedColors: "active" });
  const theme = page.locator("#interactive-theme");
  for (const [selector, pseudo] of [
    [".rt-SliderTrack", null],
    [".rt-SliderThumb", "::after"],
    ['.rt-BaseCheckboxRoot[data-state="unchecked"]', "::before"],
    [".rt-BaseRadioRoot", "::before"],
    [".rt-SwitchRoot", "::before"],
    [".rt-SwitchThumb", null],
    [".rt-TextFieldRoot", null],
    [".rt-TextAreaRoot", null],
    [".rt-SegmentedControlIndicator", "::before"],
  ] as const) {
    const painted = await theme
      .locator(selector)
      .first()
      .evaluate((node, pseudo) => {
        const style = getComputedStyle(node, pseudo);
        return (
          (style.borderTopStyle !== "none" &&
            parseFloat(style.borderTopWidth) > 0) ||
          (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0)
        );
      }, pseudo);
    expect(painted, `${selector} has a visible forced-color boundary`).toBe(
      true,
    );
  }
  const selectedRadio = theme.getByRole("radio", {
    name: "Native radio alpha",
    exact: true,
  });
  expect(
    await selectedRadio.evaluate(
      (node) =>
        getComputedStyle(node, "::after").backgroundColor !==
        getComputedStyle(node, "::before").backgroundColor,
    ),
    "selected radio dot contrasts with its surface",
  ).toBe(true);
  const selectedCheckbox = theme
    .locator('.rt-BaseCheckboxRoot[data-state="checked"]')
    .first();
  expect(
    await selectedCheckbox.evaluate(
      (node) =>
        getComputedStyle(node.querySelector("svg")!).color !==
        getComputedStyle(node, "::before").backgroundColor,
    ),
    "selected checkbox mark contrasts with its surface",
  ).toBe(true);
  const thumb = theme
    .getByRole("slider", { name: "Themed range", exact: true })
    .first();
  const unfocusedOutline = await thumb.evaluate((node) =>
    parseFloat(getComputedStyle(node, "::after").outlineWidth),
  );
  await thumb.focus();
  await thumb.press("ArrowRight");
  await expect(thumb).toHaveAttribute("aria-valuenow", "21");
  expect(
    await thumb.evaluate(
      (node) =>
        node.matches(":focus-visible") &&
        parseFloat(getComputedStyle(node, "::after").outlineWidth),
    ),
    "keyboard focus remains visible without box shadows",
  ).toBeGreaterThan(unfocusedOutline);
});
