import { expect, test } from "@playwright/test";
import axe from "axe-core";

type MarkGeometry = {
  d: string | null;
  box: number[];
  matrix: number[];
  strokeWidth: string;
};

const families = [
  ["line", ".recharts-line-curve", 1],
  ["bar", ".recharts-bar-rectangle path", 5],
  ["area", ".recharts-area-curve", 1],
  ["scatter", ".recharts-scatter-symbol path", 5],
  ["funnel", ".recharts-funnel-trapezoid path", 5],
  ["pie", ".recharts-pie-sector .recharts-sector", 5],
  ["radar", ".recharts-radar-polygon path", 1],
  ["radial", ".recharts-radial-bar-sector", 5],
  ["treemap", ".recharts-treemap-depth-1 path", 2],
  ["sankey", "path.recharts-sankey-link", 2],
  ["sunburst", ".recharts-sunburst path", 2],
] as const;

test("all inherited chart families render finite data geometry and react to replacement data", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  expect(errors).toEqual([]);
  const geometry = (family: string, selector: string) =>
    page.locator(`#chart-${family} ${selector}`).evaluateAll((nodes) =>
      nodes.map((node) => {
        const shape = node as SVGGraphicsElement;
        const box = shape.getBBox(),
          matrix = shape.getCTM()!;
        return {
          d: shape.getAttribute("d"),
          box: [box.x, box.y, box.width, box.height],
          matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
          strokeWidth: getComputedStyle(shape).strokeWidth,
        };
      }),
    );
  const before = new Map<string, MarkGeometry[]>();
  for (const [family, selector, count] of families) {
    await expect(
      page.locator(`#chart-${family} ${selector}`),
      family,
    ).toHaveCount(count);
    const marks = await geometry(family, selector);
    before.set(family, marks);
    for (const mark of marks) {
      expect(mark.d ?? "", family).not.toMatch(/NaN|Infinity|undefined/);
      expect([...mark.box, ...mark.matrix].every(Number.isFinite), family).toBe(
        true,
      );
      expect(mark.box[2] + mark.box[3], family).toBeGreaterThan(0);
    }
  }
  await page
    .getByRole("button", { name: "Update chart data", exact: true })
    .click();
  for (const [family, selector] of families) {
    await expect
      .poll(() => geometry(family, selector), { message: family })
      .not.toEqual(before.get(family));
  }
  expect(errors).toEqual([]);
});

test("fixed server chart geometry hydrates in place and clip references stay unique across charts", async ({
  page,
  request,
}, info) => {
  test.skip(
    info.project.name.endsWith("csr"),
    "This boundary is SSR-specific.",
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  const html = await (await request.get("/")).text();
  expect(html).toMatch(/recharts-line-curve/);
  expect(html).toMatch(/recharts-sector/);
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      await route.fulfill({
        status: 200,
        contentType: "text/javascript",
        body: "",
      });
    } else await route.continue();
  });
  await page.goto("/");
  await expect(page.locator("#chart-measured svg")).toHaveCount(0);
  const recipeGeometry = () =>
    page.locator("#chart-ssr-recipe").evaluate((root) => ({
      ticks: [
        ...root.querySelectorAll(".recharts-cartesian-axis-tick-value"),
      ].map((node) => [
        node.textContent,
        Number(node.getAttribute("x")),
        Math.round(Number(node.getAttribute("y"))),
      ]),
      bars: [...root.querySelectorAll(".recharts-rectangle")]
        .sort((a, b) =>
          a.getAttribute("fill")!.localeCompare(b.getAttribute("fill")!),
        )
        .map((node) =>
          ["x", "y", "width", "height"].map((attribute) =>
            Number(node.getAttribute(attribute)),
          ),
        ),
    }));
  const serverRecipe = await recipeGeometry();
  expect(serverRecipe.ticks).toEqual([
    ["A", 172.5, 273],
    ["B", 387.5, 273],
    ["0", 57, 265],
    ["15", 57, 187],
    ["30", 57, 109],
    ["45", 57, 31],
    ["50", 57, 5],
  ]);
  expect(serverRecipe.bars).toEqual([
    [86.5, 213, 172, 52],
    [301.5, 161, 172, 104],
    [86.5, 109, 172, 104],
    [301.5, 5, 172, 156],
  ]);
  const surface = page.locator(
    "#chart-line > .recharts-wrapper > svg.recharts-surface",
  );
  const path = page.locator("#chart-line .recharts-line-curve");
  await expect(surface).toHaveCount(1);
  await expect(path).toHaveCount(1);
  await expect(path).toBeVisible();
  const miniature = page.locator(
    "#chart-line .recharts-brush .recharts-area-curve",
  );
  await expect(miniature).toHaveCount(1);
  const serverMiniatureD = await miniature.getAttribute("d");
  expect(serverMiniatureD).not.toMatch(/NaN|Infinity|undefined/);
  expect(
    await miniature.evaluate((node) => {
      const box = (node as SVGGraphicsElement).getBBox();
      return (
        box.width > 0 &&
        box.height > 0 &&
        Number.isFinite(box.width + box.height)
      );
    }),
  ).toBe(true);
  await path.evaluate((node) => {
    Object.assign(window, {
      serverChartPath: node,
      serverChartSurface: node.closest("svg"),
    });
  });
  await page.unroute("**/*");
  await page.evaluate(async () => {
    const entry = document.querySelector<HTMLScriptElement>(
      'script[type="module"]',
    )!.src;
    // The built entry is runtime-selected; load only after capturing the server node.
    await import(/* @vite-ignore */ entry + "?hydrate-proof");
  });
  await expect(surface).toHaveCount(1);
  await expect(path).toHaveCount(1);
  expect(
    await surface.evaluate(
      (node) =>
        "serverChartSurface" in window && node === window.serverChartSurface,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await expect(
    page.locator("#chart-measured svg.recharts-surface"),
  ).toHaveAttribute("width", "500");
  await expect.poll(recipeGeometry).toEqual(serverRecipe);
  await expect(miniature).toHaveCount(1);
  await expect(miniature).toHaveAttribute("d", serverMiniatureD!);
  const beforeUpdate = await path.getAttribute("d");
  await page
    .getByRole("button", { name: "Update chart data", exact: true })
    .click();
  await expect(path).not.toHaveAttribute("d", beforeUpdate!);
  expect(
    await path.evaluate(
      (node) =>
        "serverChartPath" in window &&
        window.serverChartPath instanceof SVGPathElement &&
        (!window.serverChartPath.isConnected ||
          node === window.serverChartPath),
    ),
  ).toBe(true);
  await expect(surface).toHaveCount(1);
  await expect(path).toHaveCount(1);
  expect(
    await surface.evaluate(
      (node) =>
        "serverChartSurface" in window && node === window.serverChartSurface,
    ),
  ).toBe(true);
  expect(
    await page.locator("#native-charts").evaluate((root) => {
      const ids = [...root.querySelectorAll("[id]")].map((node) => node.id);
      return (
        ids.length === new Set(ids).size &&
        [...root.querySelectorAll("[clip-path]")].every((node) => {
          const id = node
            .getAttribute("clip-path")
            ?.match(/url\(#([^)]*)\)/)?.[1];
          return !id || !!node.closest("svg")?.querySelector(`[id="${id}"]`);
        })
      );
    }),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("automatic Cartesian ticks hydrate uniquely and stay correct through resize and data replacement", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  const ssr = !info.project.name.endsWith("csr");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const ladder = Array.from({ length: 9 }, (_, index) => String(index * 10));
  const root = page.locator("#chart-axis-hydration");
  const surface = root.locator("svg.recharts-surface");
  const geometry = () =>
    root.evaluate((root) => {
      const axes = ["xAxis", "yAxis"].map((axis) =>
        [
          ...root.querySelectorAll(`.${axis} .recharts-cartesian-axis-tick`),
        ].map((tick) => {
          const label = tick.querySelector<SVGGraphicsElement>(
            ".recharts-cartesian-axis-tick-value",
          )!;
          const line = tick.querySelector(
            ".recharts-cartesian-axis-tick-line",
          )!;
          const box = label.getBBox();
          return {
            label: label.textContent,
            text: ["x", "y"].map((key) =>
              Number(label.getAttribute(key) ?? NaN),
            ),
            box: [box.x, box.y, box.width, box.height],
            line: ["x1", "y1", "x2", "y2"].map((key) =>
              Number(line.getAttribute(key) ?? NaN),
            ),
          };
        }),
      );
      const grids = ["vertical", "horizontal"].map((direction) =>
        [
          ...root.querySelectorAll(
            `.recharts-cartesian-grid-${direction} line`,
          ),
        ].map((line) =>
          ["x1", "y1", "x2", "y2"].map((key) =>
            Number(line.getAttribute(key) ?? NaN),
          ),
        ),
      );
      return {
        axes,
        grids,
        curve: root.querySelector(".recharts-line-curve")?.getAttribute("d"),
      };
    });
  if (ssr) {
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "script") {
        await route.fulfill({
          status: 200,
          contentType: "text/javascript",
          body: "",
        });
      } else await route.continue();
    });
  }
  await page.goto(ssr ? "/" : "/csr");
  if (ssr) {
    await expect(surface).toHaveAttribute("width", "240");
    const server = await geometry();
    expect(server.axes[0].map((tick) => tick.label)).toEqual(months);
    expect(server.axes[1].map((tick) => tick.label)).toEqual(ladder);
    await surface.evaluate((node) => {
      Object.assign(window, { serverAxisSurface: node });
    });
    await page.unroute("**/*");
    await page.evaluate(async () => {
      const entry = document.querySelector<HTMLScriptElement>(
        'script[type="module"]',
      )!.src;
      // The built entry is runtime-selected and must load after capturing SSR nodes.
      await import(/* @vite-ignore */ entry + "?axis-hydrate-proof");
    });
  }
  const checkGeometry = async (
    width: number,
    height: number,
    expectedMonths: string[],
  ) => {
    await expect(surface).toHaveCount(1);
    await expect(surface).toHaveAttribute("width", String(width));
    await expect(surface).toHaveAttribute("height", String(height));
    const state = await geometry();
    for (const [axis, expected] of [expectedMonths, ladder].entries()) {
      const ticks = state.axes[axis];
      const labels = ticks.map((tick) => tick.label);
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.length).toBeLessThan(expected.length);
      expect(labels).toEqual(
        expected.filter((label) => labels.includes(label)),
      );
      for (const tick of ticks) {
        expect(
          [...tick.text, ...tick.box, ...tick.line].every(Number.isFinite),
        ).toBe(true);
        const [x1, y1, x2, y2] = tick.line;
        if (axis === 0) {
          expect(x1).toBeCloseTo(
            60 + (expected.indexOf(tick.label!) * (width - 70)) / 5,
          );
          expect(x2).toBeCloseTo(x1);
          expect(y1).toBeCloseTo(height - 40 + 6);
          expect(y2).toBeCloseTo(height - 40);
        } else {
          expect(y1).toBeCloseTo(
            height - 40 - (Number(tick.label) * (height - 50)) / 80,
          );
          expect(y2).toBeCloseTo(y1);
          expect(x1).toBeCloseTo(54);
          expect(x2).toBeCloseTo(60);
        }
      }
    }
    for (const [direction, lines] of state.grids.entries()) {
      expect(lines.length).toBeGreaterThan(0);
      const coordinates = lines.map((line) => line[direction]);
      expect(new Set(coordinates).size).toBe(coordinates.length);
      for (const [x1, y1, x2, y2] of lines) {
        expect([x1, y1, x2, y2].every(Number.isFinite)).toBe(true);
        if (direction === 0) {
          expect(x1).toBeCloseTo(x2);
          expect(y1).toBeCloseTo(10);
          expect(y2).toBeCloseTo(height - 40);
          const index = ((x1 - 60) * 5) / (width - 70);
          expect(index).toBeCloseTo(Math.round(index));
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThanOrEqual(5);
        } else {
          expect(y1).toBeCloseTo(y2);
          expect(x1).toBeCloseTo(60);
          expect(x2).toBeCloseTo(width - 10);
          const index = ((height - 40 - y1) * 8) / (height - 50);
          expect(index).toBeCloseTo(Math.round(index));
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThanOrEqual(8);
        }
      }
    }
    expect(state.curve).toBeTruthy();
    expect(state.curve).not.toMatch(/NaN|Infinity|undefined/);
    return state;
  };
  await expect(surface).toHaveAttribute("width", "500");
  await expect
    .poll(async () => (await geometry()).axes[0].length)
    .toBeLessThan(6);
  await expect
    .poll(async () => (await geometry()).axes[1].length)
    .toBeLessThan(9);
  const wide = await checkGeometry(500, 120, months);
  if (ssr)
    expect(
      await surface.evaluate(
        (node) =>
          "serverAxisSurface" in window && node === window.serverAxisSurface,
      ),
    ).toBe(true);
  await root.evaluate((node) => {
    node.style.width = "180px";
    node.style.height = "90px";
  });
  await expect(surface).toHaveAttribute("width", "180");
  for (const axis of [0, 1]) {
    await expect
      .poll(async () => (await geometry()).axes[axis].length)
      .toBeLessThan(wide.axes[axis].length);
  }
  await checkGeometry(180, 90, months);
  await root.evaluate((node) => {
    node.style.width = "500px";
    node.style.height = "120px";
  });
  await expect.poll(geometry).toEqual(wide);
  await checkGeometry(500, 120, months);
  if (ssr)
    expect(
      await surface.evaluate(
        (node) =>
          "serverAxisSurface" in window && node === window.serverAxisSurface,
      ),
    ).toBe(true);
  await page
    .getByRole("button", { name: "Update chart data", exact: true })
    .click();
  await expect(root.locator(".recharts-line-curve")).not.toHaveAttribute(
    "d",
    wide.curve!,
  );
  const updated = await checkGeometry(500, 120, [
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]);
  expect(updated.axes[0].some((tick) => months.includes(tick.label!))).toBe(
    false,
  );
  expect(errors).toEqual([]);
});

test("responsive composition resizes real geometry, exposes tooltip payload and disposes mounted charts", async ({
  page,
}, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const surface = page
    .locator("#chart-responsive svg.recharts-surface")
    .first();
  await expect(surface).toHaveAttribute("width", "500");
  const curve = page.locator("#chart-responsive .recharts-line-curve");
  const original = await curve.getAttribute("d");
  await page
    .getByRole("button", { name: "Resize chart parent", exact: true })
    .click();
  await expect(surface).toHaveAttribute("width", "650");
  await expect(curve).not.toHaveAttribute("d", original!);
  await expect(page.locator("#chart-resizes")).toHaveText("650:300");
  await expect(
    page.locator("#chart-measured svg.recharts-surface"),
  ).toHaveAttribute("width", "650");
  await expect(page.locator("#chart-responsive")).toContainText("Revenue");
  await expect(
    page.locator("#chart-responsive .recharts-legend-item"),
  ).toHaveCount(3);
  await page
    .locator("#chart-responsive .recharts-line-dots circle")
    .nth(1)
    .hover();
  await expect(
    page.locator("#chart-tooltip-target #chart-custom-tooltip"),
  ).toContainText("Beta:");
  await expect(
    page.locator("#chart-tooltip-target #chart-custom-tooltip"),
  ).toContainText("30");
  await surface.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#chart-custom-tooltip")).toContainText(
    /Alpha|Beta/,
  );
  await page
    .getByRole("button", { name: "Toggle chart mounting", exact: true })
    .click();
  await expect(page.locator("#native-charts svg")).toHaveCount(0);
  await expect(page.locator("#chart-custom-tooltip")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Toggle chart mounting", exact: true })
    .click();
  await expect(surface).toHaveCount(1);
  await expect(surface).toHaveAttribute("width", "650");
});

test("Brush keyboard range synchronizes peer data while panorama and isolated chart keep full data", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const isolated = await page
    .locator("#chart-area .recharts-area-curve")
    .getAttribute("d");
  const peer = page.locator("#chart-bar .recharts-bar-rectangle");
  const before = await peer.count();
  const miniature = page.locator(
    "#chart-line .recharts-brush .recharts-area-curve",
  );
  await expect(miniature).toHaveCount(1);
  const fullRangePath = await miniature.getAttribute("d");
  expect(fullRangePath).toMatch(/[MLC]/);
  expect(fullRangePath).not.toMatch(/NaN|Infinity|undefined/);
  const miniatureBox = await miniature.evaluate((node) => {
    const box = (node as SVGGraphicsElement).getBBox();
    return [box.width, box.height];
  });
  expect(
    miniatureBox.every((value) => Number.isFinite(value) && value > 0),
  ).toBe(true);
  await expect(
    page.locator("#chart-line > .recharts-wrapper > svg.recharts-surface"),
  ).toHaveCount(1);
  await expect(
    page.locator("#chart-line .recharts-brush svg.recharts-surface"),
  ).toHaveCount(1);
  await expect(page.locator("#chart-line svg.recharts-surface")).toHaveCount(2);
  const traveller = page
    .locator("#chart-line .recharts-brush-traveller")
    .first();
  await traveller.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#chart-range")).toHaveText("1:4");
  await expect.poll(() => peer.count()).toBeLessThan(before);
  await expect(
    page.locator("#chart-area .recharts-area-curve"),
  ).toHaveAttribute("d", isolated!);
  await expect(miniature).toHaveCount(1);
  await expect(miniature).toHaveAttribute("d", fullRangePath!);
  await expect(page.locator("#chart-range-events")).toHaveText("1");
  await traveller.scrollIntoViewIfNeeded();
  const handle = (await traveller.boundingBox())!;
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handle.x + handle.width / 2 + 110,
    handle.y + handle.height / 2,
    { steps: 3 },
  );
  await page.mouse.up();
  await expect(page.locator("#chart-range")).toHaveText("2:4");
  await expect(peer).toHaveCount(3);
  await expect(miniature).toHaveAttribute("d", fullRangePath!);
  await expect(
    page.locator("#chart-area .recharts-area-curve"),
  ).toHaveAttribute("d", isolated!);
  const callbacks = Number(
    await page.locator("#chart-range-events").textContent(),
  );
  await page
    .getByRole("button", { name: "Toggle chart mounting", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Toggle chart mounting", exact: true })
    .click();
  await traveller.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#chart-range")).toHaveText("1:4");
  await expect(page.locator("#chart-range-events")).toHaveText(
    String(callbacks + 1),
  );
  await expect(peer).toHaveCount(4);
  await expect(miniature).toHaveAttribute("d", fullRangePath!);
  await expect(
    page.locator("#chart-area .recharts-area-curve"),
  ).toHaveAttribute("d", isolated!);
  expect(errors).toEqual([]);
});

test("keyed Cells keep current data order, paint, custom-shape payload and one event after reorder and replacement", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const marks = page.locator("#chart-cells [data-cell-row]");
  const painted = () =>
    marks.evaluateAll((nodes) =>
      nodes.map((node) => [
        node.getAttribute("data-cell-row"),
        getComputedStyle(node.querySelector("path")!).fill,
      ]),
    );
  await expect.poll(painted).toEqual([
    ["Red", "rgb(204, 51, 51)"],
    ["Green", "rgb(51, 153, 68)"],
    ["Blue", "rgb(51, 85, 204)"],
  ]);
  await expect(page.locator("#chart-cells .recharts-errorBar")).toHaveCount(3);
  await page
    .locator('#chart-cells [data-cell-row="Green"] path')
    .click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#chart-cell-event")).toHaveText("Green:1:1");
  await page
    .getByRole("button", { name: "Reorder keyed Cells", exact: true })
    .click();
  await expect.poll(painted).toEqual([
    ["Blue", "rgb(51, 85, 204)"],
    ["Red", "rgb(204, 51, 51)"],
    ["Green", "rgb(51, 153, 68)"],
  ]);
  await page
    .locator('#chart-cells [data-cell-row="Green"] path')
    .click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#chart-cell-event")).toHaveText("Green:2:2");
  await page
    .getByRole("button", { name: "Replace keyed Cell", exact: true })
    .click();
  await expect.poll(painted).toEqual([
    ["Blue", "rgb(51, 85, 204)"],
    ["Green", "rgb(51, 153, 68)"],
    ["Purple", "rgb(153, 51, 204)"],
  ]);
  await expect(page.locator("#chart-cells .recharts-errorBar")).toHaveCount(3);
  await page
    .locator('#chart-cells [data-cell-row="Purple"] path')
    .click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#chart-cell-event")).toHaveText("Purple:2:3");
  await page
    .getByRole("button", { name: "Toggle chart mounting", exact: true })
    .click();
  await expect(marks).toHaveCount(0);
  await page
    .getByRole("button", { name: "Toggle chart mounting", exact: true })
    .click();
  await expect(marks).toHaveCount(3);
  await page
    .locator('#chart-cells [data-cell-row="Purple"] path')
    .click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#chart-cell-event")).toHaveText("Purple:2:4");
  expect(errors).toEqual([]);
});

test("animation uses real intermediate frames, completes once, and exposes accessible chart keyboard content", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const surface = page.locator(
    "#chart-responsive .recharts-wrapper > svg.recharts-surface",
  );
  await expect(surface.locator("title")).toHaveText("Revenue overview");
  await expect(surface.locator("desc")).toHaveText(
    "Five categories of revenue",
  );
  await expect(surface).toHaveAttribute("tabindex", "0");
  await page
    .getByRole("button", { name: "Update chart data", exact: true })
    .click();
  await expect(page.locator("#chart-animation-events")).toHaveText("0:0");
  await page
    .getByRole("button", { name: "Enable chart animation", exact: true })
    .click();
  await expect(page.locator("#chart-animation-events")).toHaveText("1:1");
  const frames = await page.evaluate(async () => {
    const samples: string[] = [];
    const start = performance.now();
    [...document.querySelectorAll<HTMLButtonElement>("#native-charts button")]
      .find((button) => button.textContent === "Animate chart update")!
      .click();
    while (performance.now() - start < 700) {
      const frame = Promise.withResolvers<number>();
      requestAnimationFrame(frame.resolve);
      await frame.promise;
      const path = document.querySelector(
        "#chart-responsive .recharts-line-curve",
      );
      samples.push(
        (path?.getAttribute("d") ?? "") +
          "|" +
          (path?.getAttribute("stroke-dasharray") ?? ""),
      );
    }
    return samples;
  });
  expect(new Set(frames).size).toBeGreaterThan(2);
  expect(frames.join("")).not.toMatch(/NaN|Infinity|undefined/);
  expect(frames.at(-1)).toBe(frames.at(-2));
  await expect(page.locator("#chart-animation-events")).toHaveText("2:2");
  await surface.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#chart-custom-tooltip")).toContainText("Alpha:");
  await page.evaluate(axe.source);
  const violations = await page.evaluate(async () => {
    const result = await (window as unknown as { axe: typeof axe }).axe.run(
      "#native-charts",
    );
    return result.violations
      .filter((item) => item.impact === "critical" || item.impact === "serious")
      .map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      }));
  });
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("automatic animation respects reduced motion and immediately uses final updated geometry", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const curve = page.locator("#chart-responsive .recharts-line-curve");
  const initial = await curve.getAttribute("d");
  await page
    .getByRole("button", { name: "Enable chart animation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Animate chart update", exact: true })
    .click();
  await expect(curve).not.toHaveAttribute("d", initial!);
  await expect(page.locator("#chart-animation-events")).toHaveText("0:0");
  const final = await curve.getAttribute("d");
  await page.evaluate(async () => {
    for (let index = 0; index < 2; index++) {
      const frame = Promise.withResolvers<number>();
      requestAnimationFrame(frame.resolve);
      await frame.promise;
    }
  });
  await expect(curve).toHaveAttribute("d", final!);
  await expect(curve).not.toHaveAttribute("stroke-dasharray", /.+/);
});

test("tooltip synchronization follows index and reordered values without activating isolated charts", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const point = page.locator("#chart-line .recharts-line-dots circle").nth(1);
  await point.hover();
  await expect(page.locator("#chart-source-tooltip")).toHaveText("Beta:30");
  await expect(page.locator("#chart-peer-tooltip")).toHaveText("Beta:30");
  await expect(page.locator("#chart-isolated-tooltip")).toHaveText("");
  await page
    .getByRole("button", { name: "Use value synchronization", exact: true })
    .click();
  await point.hover();
  await expect(page.locator("#chart-peer-tooltip")).toHaveText("Beta:30");
  await expect(
    page.locator("#chart-bar .recharts-xAxis-ticks text"),
  ).toHaveText(["Epsilon", "Delta", "Gamma", "Beta", "Alpha"]);
  await expect(page.locator("#chart-isolated-tooltip")).toHaveText("");
  await page
    .getByRole("button", { name: "Toggle chart mounting", exact: true })
    .click();
  await expect(page.locator("#chart-source-tooltip")).toHaveCount(0);
  await expect(page.locator("#chart-peer-tooltip")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Toggle chart mounting", exact: true })
    .click();
  await point.hover();
  await expect(page.locator("#chart-source-tooltip")).toHaveText("Beta:30");
  await expect(page.locator("#chart-peer-tooltip")).toHaveText("Beta:30");
  await expect(page.locator("#chart-isolated-tooltip")).toHaveText("");
  expect(errors).toEqual([]);
});

test("selected Charts controlled Brush retains drag and replacement indices", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const travellers = page.locator(
    "#chart-selected-brush .recharts-brush-traveller",
  );
  await expect(travellers).toHaveCount(2);
  const values = () =>
    travellers.evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute("aria-valuenow"))),
    );
  for (const traveller of await travellers.all()) {
    await expect(traveller).toHaveAttribute(
      "aria-label",
      "Min value: Category 3, Max value: Category 6",
    );
  }
  const initial = await values();
  expect(initial[0]).toBeCloseTo(5 + (485 * 3) / 9);
  expect(initial[1]).toBeCloseTo(5 + (485 * 6) / 9);
  const curve = page.locator("#chart-selected-brush .recharts-line-curve");
  const beforeReplacement = await curve.getAttribute("d");
  await page
    .getByRole("button", { name: "Replace selected chart data", exact: true })
    .click();
  await expect(curve).not.toHaveAttribute("d", beforeReplacement!);
  await expect.poll(values).toEqual(initial);
  for (const traveller of await travellers.all()) {
    await expect(traveller).toHaveAttribute(
      "aria-label",
      "Min value: Category 3, Max value: Category 6",
    );
  }
  const slide = page.locator("#chart-selected-brush .recharts-brush-slide");
  await slide.scrollIntoViewIfNeeded();
  const box = (await slide.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + (initial[1] - initial[0]) / 3,
    box.y + box.height / 2,
    { steps: 4 },
  );
  const during = await values();
  expect(during).not.toEqual(initial);
  await page.mouse.up();
  await expect
    .poll(async () => (await values()).map((value) => Math.round(value * 1e6)))
    .toEqual(during.map((value) => Math.round(value * 1e6)));
  expect(
    await travellers.evaluateAll((nodes) =>
      nodes.map((node) =>
        Number(node.querySelector("rect")?.getAttribute("x")),
      ),
    ),
  ).toEqual(await values());
  const selection = (await travellers
    .first()
    .getAttribute("aria-label"))!.match(
    /^Min value: Category (\d+), Max value: Category (\d+)$/,
  );
  expect(selection).not.toBeNull();
  const nextIndex = Number(selection![1]) + 1;
  expect(nextIndex).toBeLessThan(Number(selection![2]));
  await travellers.first().press("ArrowRight");
  await expect
    .poll(async () => (await values())[0])
    .toBeCloseTo(5 + (485 * nextIndex) / 9, 6);
  expect((await values())[1]).toBeCloseTo(during[1], 6);
  expect(errors).toEqual([]);
});

test("selected Charts active bars clear on leave and replacement", async ({
  page,
}, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const root = page.locator("#chart-selected-active");
  await root.scrollIntoViewIfNeeded();
  const bars = root.locator(".recharts-bar-rectangle .recharts-rectangle");
  const boxes = await bars.evaluateAll((nodes) =>
    nodes.slice(0, 2).map((node) => {
      const box = node.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        shapeX: node.getAttribute("x"),
      };
    }),
  );
  expect(boxes).toHaveLength(2);
  expect(boxes[0].shapeX).not.toBe(boxes[1].shapeX);
  const activate = async (index: number) => {
    const box = boxes[index];
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  };
  const active = root.locator(".selected-active-bar");
  const activeLayer = active.locator(
    'xpath=ancestor::*[starts-with(@class, "recharts-zIndex-layer_")][1]',
  );
  await activate(0);
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("x", boxes[0].shapeX!);
  await expect(activeLayer.locator(".recharts-active-bar")).toHaveCount(1);
  await expect(activeLayer.locator(".recharts-inactive-bar")).toHaveCount(0);
  await activate(1);
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("x", boxes[1].shapeX!);
  await expect(activeLayer.locator(".recharts-active-bar")).toHaveCount(1);
  await expect(activeLayer.locator(".recharts-inactive-bar")).toHaveCount(0);
  await page.mouse.move(0, 0);
  await expect(
    page.locator("#chart-selected-active .selected-active-bar"),
  ).toHaveCount(0);
  await activate(0);
  await expect(
    page.locator("#chart-selected-active .selected-active-bar"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Replace selected chart data", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(
    page.locator("#chart-selected-active .selected-active-bar"),
  ).toHaveCount(0);
  await expect(
    page.locator("#chart-selected-active .recharts-bar-rectangle"),
  ).toHaveCount(0);
});

test("selected Charts tooltip uses missing-label index fallback", async ({
  page,
}, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  await expect(
    page.locator(
      "#chart-selected-tooltip .recharts-xAxis .recharts-cartesian-axis-tick-value",
    ),
  ).toHaveText(["Page A", "NonExistent", "Page C", "Page B"]);
  await expect(page.locator("#selected-tooltip-payload")).toHaveAttribute(
    "data-label",
    "NonExistent",
  );
  await expect(
    page.locator('#selected-tooltip-payload [data-series="uv"]'),
  ).toHaveText("20");
  await expect(
    page.locator('#selected-tooltip-payload [data-series="pv"]'),
  ).toHaveText("200");
});

test("selected Charts polar tooltip selects the wrapping sector", async ({
  page,
}, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const surface = page.locator("#chart-selected-wrap svg.recharts-surface");
  await surface.scrollIntoViewIfNeeded();
  const box = (await surface.boundingBox())!;
  const ticks = surface.locator(".recharts-polar-angle-axis-tick-value");
  await expect(ticks).toHaveText(["a", "b", "c", "d"]);
  const tickAngles = await ticks.evaluateAll((nodes) =>
    nodes.map((node) => {
      const x = Number(node.getAttribute("x")),
        y = Number(node.getAttribute("y"));
      return ((Math.atan2(200 - y, x - 200) * 180) / Math.PI + 360) % 360;
    }),
  );
  [356, 86, 176, 266].forEach((expected, index) =>
    expect(tickAngles[index]).toBeCloseTo(expected, 6),
  );
  for (const angle of [357, 358, 359.9, 20, 100, 200, 300, 330]) {
    const radians = (angle * Math.PI) / 180;
    await page.mouse.move(
      box.x + 200 + Math.cos(radians) * 100,
      box.y + 200 - Math.sin(radians) * 100,
    );
    const tooltip = page.locator("#selected-wrap-payload");
    const index = angle === 100 ? 1 : angle === 200 ? 2 : angle === 300 ? 3 : 0;
    await expect(tooltip).toHaveText(["a", "b", "c", "d"][index]);
    // The public label clamps a missing (-1) index to zero; the anchor must also select the sector.
    await expect
      .poll(() =>
        tooltip.evaluate((node) => {
          const x = Number(node.getAttribute("data-x")),
            y = Number(node.getAttribute("data-y"));
          return ((Math.atan2(200 - y, x - 200) * 180) / Math.PI + 360) % 360;
        }),
      )
      .toBeCloseTo([356, 86, 176, 266][index], 6);
    const radius = await tooltip.evaluate((node) =>
      Math.hypot(
        Number(node.getAttribute("data-x")) - 200,
        Number(node.getAttribute("data-y")) - 200,
      ),
    );
    // At most 1 CSS px of pointer quantization per axis gives a Euclidean/radius error of at most √2.
    expect(Math.abs(radius - 100)).toBeLessThanOrEqual(Math.SQRT2);
  }
});

test("selected Charts measured auto-xaxis uses ticks and actual string label without oscillation", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const jsxLabel = page.locator("#chart-selected-axis-jsx .selected-jsx-label");
  await expect(jsxLabel).toHaveText("JSX categories");
  const initialLabelWidth = await jsxLabel.evaluate(
    (node) => (node as SVGGraphicsElement).getBBox().width,
  );
  await page
    .getByRole("button", { name: "Replace selected chart data", exact: true })
    .click();
  await expect(jsxLabel).toHaveText("JSX categories 1");
  await expect(jsxLabel).toBeVisible();
  expect(await jsxLabel.evaluate((node) => node.namespaceURI)).toBe(
    "http://www.w3.org/2000/svg",
  );
  await expect
    .poll(() =>
      jsxLabel.evaluate((node) => (node as SVGGraphicsElement).getBBox().width),
    )
    .toBeGreaterThan(initialLabelWidth);
  await page
    .getByRole("button", { name: "Toggle unsupported axis label", exact: true })
    .click();
  await expect(jsxLabel).toHaveCount(0);
  await expect(
    page.locator("#chart-selected-axis-jsx .recharts-label"),
  ).toHaveCount(0);
  await expect(page.locator("#chart-selected-axis-jsx")).not.toContainText(
    "Unsupported raw label",
  );
  await expect(page.locator("#chart-selected-axis-jsx")).not.toContainText(
    "[object HTMLCollection]",
  );
  await page
    .getByRole("button", { name: "Toggle unsupported axis label", exact: true })
    .click();
  await expect(jsxLabel).toHaveText("JSX categories 1");
  for (const kind of [
    "plain",
    "string",
    "multiline",
    "numeric",
    "function",
    "jsx",
  ]) {
    const root = page.locator(`#chart-selected-axis-${kind}`);
    const geometry = () =>
      root.evaluate((node) => {
        const ticks = [
          ...node.querySelectorAll(".recharts-cartesian-axis-tick-value"),
        ];
        const label = node.querySelector(".recharts-label");
        const height = Math.round(
          Math.max(
            ...ticks.map((tick) => tick.getBoundingClientRect().height),
          ) +
            6 +
            2 +
            (label ? label.getBoundingClientRect().height + 5 : 0),
        );
        return {
          expected: height,
          plot: Number(
            node.querySelector("clipPath rect")?.getAttribute("height"),
          ),
          tickCount: ticks.length,
          labelHeight: label?.getBoundingClientRect().height ?? 0,
        };
      });
    await expect.poll(async () => (await geometry()).tickCount).toBe(10);
    if (kind === "jsx") {
      // JSX is created by the supported render function, not treated as a settings bag.
      await expect(root.locator(".recharts-label")).toHaveCount(0);
      await expect(root.locator(".selected-jsx-label")).toHaveCount(1);
      await expect(root).not.toContainText("[object HTMLCollection]");
    }
    if (kind === "plain" || kind === "string" || kind === "multiline") {
      if (kind === "string")
        expect((await geometry()).labelHeight).toBeGreaterThan(0);
      await expect
        .poll(async () => {
          const g = await geometry();
          return g.plot + g.expected;
        })
        .toBe(290);
      expect((await geometry()).expected).toBeGreaterThan(30);
    } else await expect.poll(async () => (await geometry()).plot).toBe(260);
    const before = await geometry();
    await page
      .getByRole("button", { name: "Replace selected chart data", exact: true })
      .click();
    await expect.poll(geometry).toEqual(before);
    await page
      .getByRole("button", { name: "Replace selected chart data", exact: true })
      .click();
    await expect.poll(geometry).toEqual(before);
    if (kind === "plain") {
      let previous = await geometry();
      for (const [button, property, value] of [
        ["Enlarge selected axis font", "font-size", "40px"],
        ["Space selected axis letters", "letter-spacing", "2px"],
      ] as const) {
        await page.getByRole("button", { name: button, exact: true }).click();
        await expect(
          root.locator(".recharts-cartesian-axis-tick-value").first(),
        ).toHaveCSS(property, value);
        await expect
          .poll(async () => {
            const g = await geometry();
            return g.plot + g.expected;
          })
          .toBe(290);
        const current = await geometry();
        expect(current.expected).toBeGreaterThan(previous.expected);
        expect(current.tickCount).toBe(previous.tickCount);
        previous = current;
      }
    }
  }
  expect(errors).toEqual([]);
});

test("selected Charts rendered Pie Label Area and bar geometry matches selected contracts", async ({
  page,
}, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  await expect(page.locator(".selected-pie-label")).toHaveText(
    "pie:102.5:161:78:156",
  );
  await expect(page.locator(".selected-pie-label")).toHaveAttribute(
    "x",
    "102.5",
  );
  await expect(page.locator(".selected-pie-label")).toHaveAttribute("y", "161");
  await page
    .getByRole("button", { name: "Zero selected Pie data", exact: true })
    .click();
  await expect(
    page.locator("#chart-selected-pie .recharts-sector"),
  ).toHaveCount(0);
  await expect(page.locator(".selected-pie-label")).toHaveText(
    "pie:102.5:161:78:156",
  );
  await expect(page.locator(".selected-pie-label")).toHaveAttribute(
    "x",
    "102.5",
  );
  await expect(page.locator(".selected-pie-label")).toHaveAttribute("y", "161");
  await expect(page.locator(".selected-zero-pie-label")).toHaveText("0");
  await expect(page.locator(".selected-zero-pie-label")).toHaveAttribute(
    "x",
    "102.5",
  );
  await expect(page.locator(".selected-zero-pie-label")).toHaveAttribute(
    "y",
    "161",
  );
  for (const explicit of [false, true]) {
    const custom = page.locator(
      `#chart-selected-label-${explicit} .selected-custom-label`,
    );
    await expect(custom).toHaveText(
      explicit ? "label:17:23:start:end" : "label:150:150:absent:absent",
    );
    const nested = page.locator(
      `#chart-selected-label-${explicit} .recharts-label`,
    );
    await expect(nested).toHaveAttribute(
      "text-anchor",
      explicit ? "start" : "middle",
    );
  }
  const paths = await page
    .locator("#chart-selected-null .recharts-area-curve")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")!));
  expect(paths).toHaveLength(3);
  for (const path of paths) {
    expect(path).toMatch(/^M5,/);
    expect(path.match(/[MLCQ]/g)).toHaveLength(2);
  }
  const floating = await page
    .locator("#chart-selected-bars-true .recharts-rectangle")
    .evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute("width"))),
    );
  expect(floating).toEqual([10, 10, 10, 10, 10]);
});

test("selected Charts clamped paired bars preserve the configured gap", async ({
  page,
}, info) => {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const bars = await page
    .locator("#chart-selected-bars-false .recharts-rectangle")
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        x: Number(node.getAttribute("x")),
        width: Number(node.getAttribute("width")),
        fill: node.getAttribute("fill"),
      })),
    );
  expect(bars).toHaveLength(4);
  const first = bars.filter((bar) => bar.fill === "#123456"),
    second = bars.filter((bar) => bar.fill === "#654321");
  expect(first).toHaveLength(2);
  expect(second).toHaveLength(2);
  first.forEach((bar, index) => {
    expect(bar.width).toBe(20);
    expect(second[index].width).toBe(20);
    expect(second[index].x - bar.x - bar.width).toBe(7);
  });
});

test("selected Charts Legend owners preserve legacy placement and positioned cleanup", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  const root = page.locator("#chart-selected-legend-legacy");
  const legend = root.locator(".recharts-legend-wrapper");
  await expect(legend).toHaveCount(1);
  await expect(legend.locator(".recharts-legend-item")).toHaveText("value");
  await expect(legend.locator(".recharts-legend-item")).toHaveCSS(
    "display",
    "inline-block",
  );
  expect(
    await legend.evaluate((node) => {
      const style = (node as HTMLElement).style;
      return {
        placement: [style.left, style.bottom, style.width, style.transform],
        outsideSvg: node.closest("svg") === null,
      };
    }),
  ).toEqual({ placement: ["5px", "5px", "490px", ""], outsideSvg: true });
  await expect
    .poll(async () => (await legend.boundingBox())?.height ?? 0)
    .toBeGreaterThan(0);
  await expect
    .poll(async () =>
      Math.round(
        Number(await root.locator("clipPath rect").getAttribute("height")) +
          (await legend.boundingBox())!.height,
      ),
    )
    .toBe(490);

  const positions = ["top", "bottom", "left", "right", "insideBottomRight"];
  const primary = (position: string) =>
    page.locator(
      `#chart-selected-legend-${position} .recharts-legend-wrapper:has([data-legend-owner="primary:${position}"])`,
    );
  const plots: (string | null)[][] = [];
  const originalNodes = [];
  for (const position of positions) {
    const wrapper = primary(position);
    await expect(wrapper).toHaveCount(1);
    await expect(wrapper.locator("[data-legend-owner]")).toHaveText("value");
    expect(await wrapper.evaluate((node) => node.closest("svg") === null)).toBe(
      true,
    );
    const plot = page.locator(
      `#chart-selected-legend-${position} clipPath rect`,
    );
    if (position === "insideBottomRight") {
      await expect(plot).toHaveAttribute("width", "490");
      await expect(plot).toHaveAttribute("height", "490");
    } else {
      const axis =
        position === "left" || position === "right" ? "width" : "height";
      await expect
        .poll(async () =>
          Math.round(
            Number(await plot.getAttribute(axis)) +
              (await wrapper.boundingBox())![axis] +
              10,
          ),
        )
        .toBe(490);
    }
    plots.push([
      await plot.getAttribute("width"),
      await plot.getAttribute("height"),
    ]);
    originalNodes.push((await wrapper.elementHandle())!);
  }
  const extra = page.locator(
    '#chart-selected-legend-insideBottomRight .recharts-legend-wrapper:has([data-legend-owner="secondary:insideTopLeft"])',
  );
  await expect(extra).toHaveCount(1);
  const extraNode = (await extra.elementHandle())!;
  await expect(
    page.locator(
      "#chart-selected-legend-insideBottomRight .recharts-legend-wrapper",
    ),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Toggle selected Legends", exact: true })
    .click();
  for (const position of positions) {
    await expect(primary(position)).toHaveCount(0);
    const plot = page.locator(
      `#chart-selected-legend-${position} clipPath rect`,
    );
    await expect(plot).toHaveAttribute("width", "490");
    await expect(plot).toHaveAttribute("height", "490");
  }
  for (const node of originalNodes)
    expect(await node.evaluate((element) => element.isConnected)).toBe(false);
  await expect(legend).toHaveCount(1);
  await expect(extra).toHaveCount(1);
  expect(
    await extra.evaluate((node, original) => node === original, extraNode),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Toggle additional Legend", exact: true })
    .click();
  await expect(
    page.locator(
      "#chart-selected-legend-insideBottomRight .recharts-legend-wrapper",
    ),
  ).toHaveCount(0);
  expect(await extraNode.evaluate((node) => node.isConnected)).toBe(false);
  await page
    .getByRole("button", { name: "Toggle selected Legends", exact: true })
    .click();
  for (const [index, position] of positions.entries()) {
    await expect(primary(position)).toHaveCount(1);
    await expect(
      page.locator(
        `#chart-selected-legend-${position} .recharts-legend-wrapper`,
      ),
    ).toHaveCount(1);
    const plot = page.locator(
      `#chart-selected-legend-${position} clipPath rect`,
    );
    await expect
      .poll(async () => [
        await plot.getAttribute("width"),
        await plot.getAttribute("height"),
      ])
      .toEqual(plots[index]);
  }
  await page
    .getByRole("button", { name: "Toggle additional Legend", exact: true })
    .click();
  await expect(extra).toHaveCount(1);
  await expect(
    page.locator(
      "#chart-selected-legend-insideBottomRight .recharts-legend-wrapper",
    ),
  ).toHaveCount(2);
  expect(
    await extra.evaluate((node, original) => node === original, extraNode),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("selected Charts legend-placement and accessible SVG hydrate in place before measurement", async ({
  page,
}, info) => {
  test.skip(
    info.project.name.endsWith("csr"),
    "Captures server nodes before loading the real entry.",
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script")
      await route.fulfill({
        status: 200,
        contentType: "text/javascript",
        body: "",
      });
    else await route.continue();
  });
  await page.goto("/");
  for (const kind of [
    "plain",
    "string",
    "multiline",
    "function",
    "jsx",
    "numeric",
  ]) {
    await expect(
      page.locator(`#chart-selected-axis-${kind} clipPath rect`),
    ).toHaveAttribute("height", "260");
  }
  const jsxLabel = page.locator("#chart-selected-axis-jsx .selected-jsx-label");
  await expect(jsxLabel).toHaveText("JSX categories");
  expect(
    await jsxLabel.evaluate(
      (node) =>
        node.namespaceURI === "http://www.w3.org/2000/svg" &&
        node.closest("svg")?.namespaceURI === node.namespaceURI,
    ),
  ).toBe(true);
  const placements = [
    ["top", 5, 250, 0.5, 1],
    ["bottom", 495, 250, 0.5, 0],
    ["left", 250, 5, 1, 0.5],
    ["right", 250, 495, 0, 0.5],
    ["insideBottomRight", 485, 485, 1, 1],
  ] as const;
  for (const [position, top, left, xFraction, yFraction] of placements) {
    const wrapper = page.locator(
      `#chart-selected-legend-${position} .recharts-legend-wrapper:has([data-legend-owner="primary:${position}"])`,
    );
    const anchor = await wrapper.evaluate(
      (node, [xFraction, yFraction]) => {
        const box = node.getBoundingClientRect();
        const chart = node
          .closest(".recharts-wrapper")!
          .getBoundingClientRect();
        return [
          box.top - chart.top + box.height * yFraction,
          box.left - chart.left + box.width * xFraction,
        ];
      },
      [xFraction, yFraction],
    );
    // Compare the rendered anchor within half a CSS pixel, not equivalent CSS serializations.
    expect(anchor[0]).toBeCloseTo(top, 0);
    expect(anchor[1]).toBeCloseTo(left, 0);
    await expect(wrapper.locator(".recharts-legend-item").first()).toHaveCSS(
      "display",
      position === "left" || position === "right" ? "block" : "inline-block",
    );
    await expect(wrapper.locator(".recharts-legend-item").first()).toHaveCSS(
      "white-space",
      "nowrap",
    );
  }
  await expect(
    page.locator(
      "#chart-selected-legend-insideBottomRight .recharts-legend-wrapper",
    ),
  ).toHaveCount(2);
  await expect(
    page.locator('[data-legend-owner="secondary:insideTopLeft"]'),
  ).toHaveText("value");
  const sankey = page.locator("#chart-selected-sankey svg");
  await expect(sankey).toHaveAttribute("role", "application");
  await expect(sankey).toHaveAttribute("tabindex", "0");
  await expect(sankey.locator("title")).toHaveText("Selected flows");
  await expect(sankey.locator("desc")).toHaveText("Source sends ten units");
  // Every server node must be claimed before measurement; reactive descendants may change afterward.
  await page.evaluate(() => {
    const roots = [
      ...document.querySelectorAll('[id^="chart-selected-"]'),
    ].filter((root) => root.id !== "chart-selected-legend-legacy");
    const serverLabel = document.querySelector(
      "#chart-selected-axis-jsx .selected-jsx-label",
    )!;
    const labelClaim = { beforeMeasurement: false };
    const nodes = roots.flatMap((root) => [
      ...root.querySelectorAll(
        "svg, .recharts-legend-wrapper, .recharts-cartesian-axis-tick-value, .selected-pie-label, .selected-custom-label",
      ),
    ]);
    const placementProperties = [
      "top",
      "left",
      "right",
      "bottom",
      "width",
      "height",
      "transform",
    ] as const;
    const snapshots = nodes.map((node) => {
      const placementStyle =
        node instanceof HTMLElement && node.matches(".recharts-legend-wrapper")
          ? node.style
          : undefined;
      return {
        node,
        placementStyle,
        placement: placementStyle
          ? placementProperties.map((property) => placementStyle[property])
          : undefined,
        persistent: node.matches(
          ".recharts-legend-wrapper, svg:not(.recharts-legend-wrapper svg)",
        ),
      };
    });
    const firstReads: boolean[] = [];
    const seen = new Set<Element>();
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      const snapshot = snapshots.find((item) => item.node === this);
      if (snapshot && !seen.has(this)) {
        seen.add(this);
        if (firstReads.length === 0) {
          labelClaim.beforeMeasurement =
            serverLabel.isConnected &&
            serverLabel ===
              document.querySelector(
                "#chart-selected-axis-jsx .selected-jsx-label",
              );
        }
        const claimed = snapshots.every(
          (item) =>
            item.node.isConnected &&
            ((firstReads.length > 0 && item.node !== this) ||
              item.placement === undefined ||
              placementProperties.every(
                (property, index) =>
                  item.placementStyle?.[property] === item.placement?.[index],
              )),
        );
        firstReads.push(claimed);
      }
      return original.call(this);
    };
    Object.assign(window, {
      selectedSnapshots: snapshots,
      selectedFirstReads: firstReads,
      selectedLabelClaim: labelClaim,
      selectedOriginalRect: original,
    });
  });
  await page.unroute("**/*");
  await page.evaluate(async () => {
    const entry = document.querySelector<HTMLScriptElement>(
      'script[type="module"]',
    )!.src;
    // The built entry URL is discovered from server HTML, not known at author time.
    await import(/* @vite-ignore */ entry + "?selected-hydration");
  });
  await expect(jsxLabel).toHaveText("JSX categories");
  await expect(
    page.locator(
      "#chart-selected-axis-plain .recharts-cartesian-axis-tick-value",
    ),
  ).toHaveCount(10);
  expect(
    await page.evaluate(() => {
      const state = window as unknown as {
        selectedSnapshots: { node: Element; persistent: boolean }[];
        selectedFirstReads: boolean[];
        selectedLabelClaim: { beforeMeasurement: boolean };
        selectedOriginalRect: typeof Element.prototype.getBoundingClientRect;
      };
      Element.prototype.getBoundingClientRect = state.selectedOriginalRect;
      const roots = [
        ...document.querySelectorAll('[id^="chart-selected-"]'),
      ].filter((root) => root.id !== "chart-selected-legend-legacy");
      const current = roots.flatMap((root) => [
        ...root.querySelectorAll(
          "svg:not(.recharts-legend-wrapper svg), .recharts-legend-wrapper",
        ),
      ]);
      const persistent = state.selectedSnapshots.filter(
        (item) => item.persistent,
      );
      const originals = new Set(persistent.map((item) => item.node));
      return {
        nodes:
          current.length === persistent.length &&
          current.every((node) => originals.has(node)) &&
          persistent.every((item) => item.node.isConnected),
        measured: state.selectedFirstReads.length > 0,
        firstClaim: state.selectedFirstReads.every(Boolean),
        labelClaim: state.selectedLabelClaim.beforeMeasurement,
      };
    }),
  ).toEqual({
    nodes: true,
    measured: true,
    firstClaim: true,
    labelClaim: true,
  });
  for (const [position, top, left] of placements) {
    const wrapper = page.locator(
      `#chart-selected-legend-${position} .recharts-legend-wrapper:has([data-legend-owner="primary:${position}"])`,
    );
    await expect
      .poll(() =>
        wrapper.evaluate((node, p) => {
          const style = (node as HTMLElement).style,
            box = node.getBoundingClientRect();
          return [
            Math.round(
              parseFloat(style.top) -
                (p === "top" ? box.height : p === "bottom" ? -box.height : 0),
            ),
            Math.round(
              parseFloat(style.left) -
                (p === "left" ? box.width : p === "right" ? -box.width : 0),
            ),
          ];
        }, position),
      )
      .toEqual([top, left]);
    const plot = page.locator(
      `#chart-selected-legend-${position} clipPath rect`,
    );
    if (position === "insideBottomRight") {
      await expect(plot).toHaveAttribute("width", "490");
      await expect(plot).toHaveAttribute("height", "490");
    } else {
      await expect
        .poll(async () => {
          const box = await wrapper.boundingBox();
          const axis =
            position === "left" || position === "right" ? "width" : "height";
          return Math.round(
            Number(await plot.getAttribute(axis)) + box![axis] + 10,
          );
        })
        .toBe(490);
    }
  }
  await expect(sankey).toHaveAttribute("role", "application");
  await expect(sankey.locator("title")).toHaveText("Selected flows");
  await expect(sankey).toHaveAttribute("tabindex", "0");
  await expect(sankey.locator("desc")).toHaveText("Source sends ten units");
  const initialLabelWidth = await jsxLabel.evaluate(
    (node) => (node as SVGGraphicsElement).getBBox().width,
  );
  await page
    .getByRole("button", { name: "Replace selected chart data", exact: true })
    .click();
  await expect(jsxLabel).toHaveText("JSX categories 1");
  await expect(jsxLabel).toBeVisible();
  expect(await jsxLabel.evaluate((node) => node.namespaceURI)).toBe(
    "http://www.w3.org/2000/svg",
  );
  await expect
    .poll(() =>
      jsxLabel.evaluate((node) => (node as SVGGraphicsElement).getBBox().width),
    )
    .toBeGreaterThan(initialLabelWidth);
  expect(errors).toEqual([]);
});
test("CSR shape callbacks preserve object-valued chart row data and update geometry", async ({
  page,
}, info) => {
  test.skip(
    !info.project.name.endsWith("csr"),
    "This regression is CSR-specific.",
  );
  await page.goto("/csr");
  // Vite transforms this test TSX in-browser; Node cannot import it statically.
  await page.evaluate(async (moduleUrl) => {
    const fixture: unknown = await import(moduleUrl);
    if (
      fixture &&
      typeof fixture === "object" &&
      "mountChartShapeDataAttrs" in fixture &&
      typeof fixture.mountChartShapeDataAttrs === "function"
    ) {
      fixture.mountChartShapeDataAttrs(document.body);
    }
  }, "/src/test-chart-shape-data-attrs.tsx");

  const initialGeometry = new Map<string, string>();
  for (const family of ["bar", "pie", "funnel"]) {
    await expect(
      page.locator(
        `#chart-shape-data-attrs-${family}-custom [data-shape-probe="true"]`,
      ),
    ).toHaveCount(1);
    const initialMark = page.locator(
      `#chart-shape-data-attrs-${family}-default path[data-chart-label="retained"]`,
    );
    await expect(initialMark).toHaveCount(1);
    await expect(initialMark).toHaveAttribute(
      "data-chart-probe",
      "[object Object]",
    );
    expect(await initialMark.getAttribute("value")).toBeNull();
    const initialD = await initialMark.getAttribute("d");
    if (!initialD) throw new Error(`${family} initial mark has no geometry.`);
    initialGeometry.set(family, initialD);
  }
  const coercionHint = await page.evaluate(async (moduleUrl) => {
    const fixture: unknown = await import(moduleUrl);
    if (
      !fixture ||
      typeof fixture !== "object" ||
      !("getDataAttributeCoercionHint" in fixture) ||
      typeof fixture.getDataAttributeCoercionHint !== "function"
    ) {
      throw new Error("Data attribute coercion hint is unavailable.");
    }
    return fixture.getDataAttributeCoercionHint();
  }, "/src/test-chart-shape-data-attrs.tsx");
  expect(coercionHint).toBe("string");
  await page.evaluate(async (moduleUrl) => {
    const fixture: unknown = await import(moduleUrl);
    if (
      !fixture ||
      typeof fixture !== "object" ||
      !("updateChartShapeDataAttrs" in fixture) ||
      typeof fixture.updateChartShapeDataAttrs !== "function"
    ) {
      throw new Error("Chart shape fixture update function is unavailable.");
    }
    fixture.updateChartShapeDataAttrs();
  }, "/src/test-chart-shape-data-attrs.tsx");
  for (const family of ["bar", "pie", "funnel"]) {
    await expect(
      page.locator(
        `#chart-shape-data-attrs-${family}-custom [data-shape-probe="false"]`,
      ),
    ).toHaveCount(1);
    const updatedMark = page.locator(
      `#chart-shape-data-attrs-${family}-default path[data-chart-label="updated"]`,
    );
    await expect(updatedMark).toHaveCount(1);
    await expect(updatedMark).toHaveAttribute(
      "data-chart-probe",
      "[object Object]",
    );
    const updatedD = await updatedMark.getAttribute("d");
    if (!updatedD) throw new Error(`${family} updated mark has no geometry.`);
    expect(updatedD).not.toBe(initialGeometry.get(family));
  }
});
