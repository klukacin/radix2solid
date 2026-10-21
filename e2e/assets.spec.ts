import { expect, test, type Locator } from "@playwright/test";

declare global {
  interface Window {
    __extraIconServer?: Element[];
  }
}

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

test("extra icons render the original 24-grid folder SVGs with reactive title and color, native ref and events, raw download and SSR node identity", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      errors.push(message.text());
  });
  const svgNamespace = "http://www.w3.org/2000/svg";
  const folder = page.locator("#asset-folder");
  const open = page.locator("#asset-folder-open");
  const named = page.getByRole("img", { name: "Project folder", exact: true });
  const strokes = (icon: Locator) =>
    icon
      .locator("path")
      .evaluateAll((paths) => [
        ...new Set(paths.map((path) => getComputedStyle(path).stroke)),
      ]);
  const titleNode = () =>
    folder.evaluate((svg) => {
      const title = svg.querySelector(":scope > title");
      return (
        title && { namespace: title.namespaceURI, text: title.textContent }
      );
    });
  const csr = info.project.name.endsWith("csr");
  let release = () => {};
  if (!csr) {
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      /\/(src\/entry-client\.tsx|assets\/.*\.js)(\?.*)?$/,
      async (route) => {
        await held;
        await route.continue();
      },
    );
  }
  try {
    await page.goto(csr ? "/csr" : "/", { waitUntil: csr ? "load" : "commit" });
    await expect(
      folder,
      "the gallery renders the titled extra FolderIcon",
    ).toBeAttached();
    if (!csr) {
      // Server markup, before any client script runs: namespaced title, image role, decorative sibling.
      expect(await titleNode()).toEqual({
        namespace: svgNamespace,
        text: "Project folder",
      });
      await expect(folder).toHaveAttribute("role", "img");
      await expect(open).toHaveAttribute("aria-hidden", "true");
      await page.evaluate(() => {
        const svg = document.getElementById("asset-folder")!;
        window.__extraIconServer = [
          svg,
          svg.querySelector(":scope > title")!,
          svg.querySelector("path")!,
        ];
      });
      release();
      await page.waitForLoadState("load");
    }
    // The existing gallery ref output is the hydration/mount boundary, not a test-only timer.
    await expect(page.locator("#refs")).toHaveText("same host");
    if (!csr) {
      expect(
        await page.evaluate(() => {
          const svg = document.getElementById("asset-folder");
          return [
            svg,
            svg?.querySelector(":scope > title"),
            svg?.querySelector("path"),
          ].map(
            (node, index) =>
              !!node && node === window.__extraIconServer?.[index],
          );
        }),
        "hydration keeps the server SVG, title and path nodes",
      ).toEqual([true, true, true]);
    }

    await expect(named).toBeVisible();
    expect(
      await folder.evaluate((svg) => ({
        namespace: svg.namespaceURI,
        viewBox: svg.getAttribute("viewBox"),
        width: svg.getAttribute("width"),
        height: svg.getAttribute("height"),
        fill: svg.getAttribute("fill"),
        hidden: svg.getAttribute("aria-hidden"),
      })),
    ).toEqual({
      namespace: svgNamespace,
      viewBox: "0 0 24 24",
      width: "15",
      height: "15",
      fill: "none",
      hidden: null,
    });
    expect(await titleNode()).toEqual({
      namespace: svgNamespace,
      text: "Project folder",
    });
    await expect(open).toHaveAttribute("viewBox", "0 0 24 24");
    await expect(open).toHaveAttribute("width", "15");
    await expect(open).not.toHaveAttribute("role");
    await expect
      .poll(() => strokes(folder), "strokes inherit CSS color")
      .toEqual(["rgb(12, 34, 56)"]);
    await expect.poll(() => strokes(open)).toEqual(["rgb(12, 34, 56)"]);

    // Rendered geometry is the raw downloadable asset, unchanged.
    const download = page.getByRole("link", {
      name: "Download original Folder SVG",
      exact: true,
    });
    await expect(download).toHaveAttribute("download", "folder.svg");
    const raw = await page.evaluate(
      async (href) => {
        const response = await fetch(href);
        const parsed = new DOMParser().parseFromString(
          await response.text(),
          "image/svg+xml",
        );
        const root = parsed.documentElement;
        return {
          ok: response.ok,
          error: !!parsed.querySelector("parsererror"),
          namespace: root.namespaceURI,
          viewBox: root.getAttribute("viewBox"),
          fill: root.getAttribute("fill"),
          paths: [...parsed.querySelectorAll("path")].map((path) =>
            Object.fromEntries(
              [...path.attributes].map((attribute) => [
                attribute.name,
                attribute.value,
              ]),
            ),
          ),
        };
      },
      (await download.getAttribute("href"))!,
    );
    expect(raw).toMatchObject({
      ok: true,
      error: false,
      namespace: svgNamespace,
      viewBox: "0 0 24 24",
      fill: "none",
    });
    expect(raw.paths.length).toBeGreaterThan(0);
    expect(raw.paths.map((path) => path.stroke)).toEqual(
      raw.paths.map(() => "currentColor"),
    );
    const rendered = await folder
      .locator("path")
      .evaluateAll((paths) =>
        paths.map((path) =>
          Object.fromEntries(
            [...path.attributes].map((attribute) => [
              attribute.name,
              attribute.value,
            ]),
          ),
        ),
      );
    expect(rendered).toEqual(
      raw.paths.map((path) => expect.objectContaining(path)),
    );

    const reference = page.locator("#asset-folder-ref");
    await expect(page.locator("#asset-folder-event")).toHaveText("none");
    await expect(reference).toHaveText("none");
    await folder.click();
    await expect(
      page.locator("#asset-folder-event"),
      "native events reach the SVG element",
    ).toHaveText("click svg");
    await expect(
      reference,
      "after mount, the ref node is the live SVG host that received the trusted click",
    ).toHaveText("svg#asset-folder");

    const sizeAndColor = page.getByRole("button", {
      name: "Change icon size and color",
      exact: true,
    });
    await sizeAndColor.click();
    await expect
      .poll(() => strokes(folder), "explicit color replaces currentColor")
      .toEqual(["rgb(255, 99, 71)"]);
    await expect.poll(() => strokes(open)).toEqual(["rgb(12, 34, 56)"]);
    await sizeAndColor.click();
    await expect.poll(() => strokes(folder)).toEqual(["rgb(12, 34, 56)"]);

    const accessibleTitle = page.getByRole("button", {
      name: "Change icon accessible title",
      exact: true,
    });
    await accessibleTitle.click();
    await expect(folder).toHaveAttribute("aria-hidden", "true");
    await expect(folder).not.toHaveAttribute("role");
    await expect(named).toHaveCount(0);
    expect(await titleNode()).toBeNull();
    await accessibleTitle.click();
    await expect(named).toBeVisible();
    await expect(folder).not.toHaveAttribute("aria-hidden");
    expect(
      await titleNode(),
      "a client-created title keeps the SVG namespace",
    ).toEqual({ namespace: svgNamespace, text: "Project folder" });
    if (!csr)
      expect(
        await folder.evaluate((svg) => svg === window.__extraIconServer?.[0]),
      ).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    release();
  }
});
