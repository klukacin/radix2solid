import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { expect, test } from "@playwright/test";

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
    expect(await states()).toEqual(full);
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
