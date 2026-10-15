import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
});

test("native icons keep reactive size, color, accessible titles and independent SVG mask references", async ({
  page,
}) => {
  const icon = page.locator("#asset-accessibility");
  await expect(
    page.getByRole("img", { name: "Accessible person", exact: true }),
  ).toBeVisible();
  await expect(icon).toHaveAttribute("width", "15");
  await expect(icon.locator("path").first()).toHaveCSS(
    "fill",
    "rgb(12, 34, 56)",
  );
  await expect(page.locator("#asset-check")).toHaveAttribute("width", "23");
  await expect(page.locator("#asset-check")).toHaveAttribute("height", "19");
  await expect(
    page.getByRole("img", { name: "Completed", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#asset-slash")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator("#asset-slash path")).toHaveCSS(
    "stroke",
    "rgb(128, 0, 128)",
  );
  await expect(
    page.getByRole("img", { name: "Sketch logo", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#asset-ref")).toHaveText("svg");
  await page
    .getByRole("button", { name: "Change icon size and color", exact: true })
    .click();
  await expect(icon).toHaveAttribute("width", "32");
  await expect(icon).toHaveAttribute("height", "32");
  await expect(icon.locator("path").first()).toHaveCSS(
    "fill",
    "rgb(255, 99, 71)",
  );
  await page
    .getByRole("button", { name: "Change icon accessible title", exact: true })
    .click();
  await expect(icon).toHaveAttribute("aria-hidden", "true");
  await expect(
    page.getByRole("img", { name: "Accessible person", exact: true }),
  ).toHaveCount(0);
  const backgrounds = await page
    .locator("#asset-light, #asset-dark")
    .evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).backgroundColor),
    );
  expect(backgrounds[0]).not.toBe(backgrounds[1]);
  const masks = await page
    .locator("#asset-panel-left, #asset-panel-right")
    .evaluateAll((nodes) =>
      nodes.map((svg) => {
        const id = svg.querySelector("mask")!.id;
        const reference = svg
          .querySelector("path[mask]")!
          .getAttribute("mask")!
          .slice(5, -1);
        return {
          id,
          ownsReference: svg.contains(document.getElementById(reference)),
        };
      }),
    );
  expect(masks[0].id).not.toBe(masks[1].id);
  expect(masks.map((mask) => mask.ownsReference)).toEqual([true, true]);
});
