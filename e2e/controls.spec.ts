import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }, info) => {
  await page.goto(info.project.name === "csr" ? "/csr" : "/");
});

test("icon labels remain accessible while the factory SVG cannot become a second accessible icon", async ({
  page,
}) => {
  const button = page.getByRole("button", {
    name: "Close action",
    exact: true,
  });
  await expect(button).toBeVisible();
  await expect(button.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expect(button.locator("svg")).toHaveAttribute("focusable", "false");
  await page.getByRole("button", { name: "Change icon label" }).click();
  await expect(
    page.getByRole("button", { name: "Dismiss action", exact: true }),
  ).toBeVisible();
});

test("ratio changes resize the actual content box and retain its positioned consumer style", async ({
  page,
}) => {
  const ratio = page.locator("#control-ratio");
  await expect(ratio).toHaveCSS("position", "absolute");
  await expect.poll(async () => (await ratio.boundingBox())?.height).toBe(180);
  await page.getByRole("button", { name: "Change media ratio" }).click();
  await expect.poll(async () => (await ratio.boundingBox())?.height).toBe(120);
});

test("progress boundaries, labels and nested indicators stay reactive and isolated", async ({
  page,
}) => {
  const root = page.getByRole("progressbar", { name: "Transfer", exact: true });
  const indicator = page.locator("#transfer-indicator");
  await expect(root).toHaveAttribute("aria-valuenow", "40");
  await expect(root).toHaveAttribute("aria-valuetext", "40 of 80");
  await expect(indicator).toHaveAttribute("data-state", "loading");
  await page.getByRole("button", { name: "Complete transfer" }).click();
  await expect(root).toHaveAttribute("aria-valuenow", "80");
  await expect(indicator).toHaveAttribute("data-state", "complete");
  await expect(page.locator("#nested-progress-indicator")).toHaveAttribute(
    "data-value",
    "2",
  );
  await page.getByRole("button", { name: "Indeterminate transfer" }).click();
  await expect(root).not.toHaveAttribute("aria-valuenow");
  await expect(root).not.toHaveAttribute("aria-valuetext");
  await expect(indicator).toHaveAttribute("data-state", "indeterminate");
  await page
    .getByRole("button", { name: "Invalid transfer boundaries" })
    .click();
  await expect(root).toHaveAttribute("aria-valuemax", "100");
  await expect(root).not.toHaveAttribute("aria-valuenow");
  await page.getByRole("button", { name: "Zero transfer" }).click();
  await expect(root).toHaveAttribute("aria-valuenow", "0");
  await expect(root).toHaveAttribute("aria-valuetext", "0 of 80");
  await expect(indicator).toHaveAttribute("data-state", "loading");
});

test("separator orientation and decorative semantics follow live props", async ({
  page,
}) => {
  const separator = page.locator("#control-separator");
  await expect(separator).toHaveAttribute("role", "separator");
  await expect(separator).not.toHaveAttribute("aria-orientation");
  await page.getByRole("button", { name: "Vertical separator" }).click();
  await expect(separator).toHaveAttribute("aria-orientation", "vertical");
  await page.getByRole("button", { name: "Decorative separator" }).click();
  await expect(separator).toHaveAttribute("role", "none");
  await expect(separator).not.toHaveAttribute("aria-orientation");
  await expect(separator).toHaveAttribute("data-orientation", "vertical");
});

test("native label activation focuses its input and does not intercept nested button mousedown", async ({
  page,
}) => {
  const input = page.getByRole("textbox", {
    name: "Native text field",
    exact: true,
  });
  await page.getByText("Native text field", { exact: true }).click();
  await expect(input).toBeFocused();
  await page.locator("#control-label").getByRole("button").click();
  await expect(page.locator("#label-events")).toHaveText("click");
  expect(
    await page.locator("#control-label").evaluate(
      (node) =>
        !node.dispatchEvent(
          new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            detail: 2,
          }),
        ),
    ),
  ).toBe(true);
  await expect(page.locator("#label-events")).toHaveText("click,mousedown");
});

test("avatar decodes a real image, uses the latest callback and rejects a stale source completion", async ({
  page,
}) => {
  const image = page.getByRole("img", { name: "Account avatar", exact: true });
  await expect(image).toBeVisible();
  expect(
    await image.evaluate(
      (node) => node instanceof HTMLImageElement && node.naturalWidth,
    ),
  ).toBe(16);
  await expect(page.locator("#avatar-fallback")).not.toBeVisible();
  const pending = Promise.withResolvers<void>();
  await page.route("**/avatar-slow.svg", async (route) => {
    await pending.promise;
    await route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="blue"/></svg>',
    });
  });
  await page.route("**/avatar-broken.svg", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: "not an image" }),
  );
  await page
    .getByRole("button", { name: "Load delayed avatar", exact: true })
    .click();
  await expect(page.locator("#avatar-fallback")).toBeVisible();
  await expect(image).not.toBeVisible();
  await page
    .getByRole("button", { name: "Change avatar callback", exact: true })
    .click();
  await page.getByRole("button", { name: "Break avatar", exact: true }).click();
  await expect(page.locator("#avatar-events")).toContainText("latest:error");
  pending.resolve();
  await page.waitForLoadState("networkidle");
  await expect(image).not.toBeVisible();
  await expect(page.locator("#avatar-events")).not.toContainText(
    "latest:loaded",
  );
  await page.getByRole("button", { name: "Clear avatar", exact: true }).click();
  await expect(page.locator("#avatar-fallback")).toBeVisible();
  await page
    .getByRole("button", { name: "Load good avatar", exact: true })
    .click();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(image).toHaveAttribute("crossorigin", "anonymous");
  await expect(page.locator("#avatar-events")).toContainText("latest:loaded");
  await page
    .getByRole("button", { name: "Remove avatar image", exact: true })
    .click();
  await expect(image).not.toBeVisible();
  await expect(page.locator("#avatar-fallback")).toBeVisible();
});

test("announce shares live regions without losing updates, isolates priorities and cleans only owned regions", async ({
  page,
}) => {
  const polite = page.locator(
    '[data-radix-announce-region][aria-live="polite"]',
  );
  await expect(polite).toHaveCount(1);
  await expect(polite.locator("strong")).toHaveText("Saved draft");
  await expect(polite).toContainText("Sync ready");
  await page
    .getByRole("button", { name: "Update announcement", exact: true })
    .click();
  await expect(polite.locator("strong")).toHaveText("Saved changes");
  await expect(polite.locator("strong")).toHaveAttribute("data-version", "2");
  await page
    .getByRole("button", { name: "Remove first announcement", exact: true })
    .click();
  await expect(polite).toHaveText("Sync ready");
  await page
    .getByRole("button", { name: "Assertive announcement", exact: true })
    .click();
  const alert = page.locator(
    '[data-radix-announce-region][aria-live="assertive"]',
  );
  await expect(alert).toHaveAttribute("role", "alert");
  await expect(alert).toHaveText("Sync ready");
  await expect(polite).toHaveCount(0);
  await page.evaluate(() => {
    const region = document.createElement("div");
    region.setAttribute("data-radix-announce-region-custom", "");
    region.setAttribute("role", "log");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("aria-relevant", "additions text");
    region.append("Host-owned content");
    document.body.append(region);
  });
  await page
    .getByRole("button", { name: "Mount custom announcement", exact: true })
    .click();
  const custom = page.locator("[data-radix-announce-region-custom]");
  await expect(custom).toHaveCount(1);
  await expect(custom).toHaveText("Host-owned contentCustom update");
  await expect(custom.locator("p strong")).toHaveText("Custom update");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(alert).toHaveCount(0);
  await expect(custom).toHaveAttribute("role", "none");
  await expect(custom).toHaveAttribute("aria-live", "off");
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(custom).toHaveAttribute("role", "log");
  await expect(custom).toHaveAttribute("aria-live", "polite");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(custom).toHaveAttribute("role", "none");
  await page
    .getByRole("button", { name: "Remove all announcements", exact: true })
    .click();
  await expect(page.locator("[data-radix-announce-region]")).toHaveCount(0);
  await expect(custom).toHaveText("Host-owned content");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(custom).toHaveAttribute("role", "log");
});

test("avatar fallback delay is owned by its mount and cancels on disposal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await page
    .getByRole("button", { name: "Mount delayed avatar", exact: true })
    .click();
  const fallback = page.locator("#delayed-avatar-fallback");
  await expect(fallback).not.toBeVisible();
  await page.clock.runFor(199);
  await expect(fallback).not.toBeVisible();
  await page.clock.runFor(1);
  await expect(fallback).toBeVisible();
  await page
    .getByRole("button", { name: "Remove delayed avatar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mount delayed avatar", exact: true })
    .click();
  await expect(fallback).not.toBeVisible();
  await page
    .getByRole("button", { name: "Remove delayed avatar", exact: true })
    .click();
  await page.clock.runFor(500);
  await expect(fallback).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("collapsible honors parent authority, callback replacement, cancellation and initial-only defaults", async ({
  page,
}) => {
  const trigger = page.getByRole("button", {
    name: "Controlled disclosure",
    exact: true,
  });
  const content = page.locator('[data-testid="controlled-disclosure-content"]');
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).not.toHaveAttribute("aria-controls");
  await expect(content).toBeHidden();
  await expect(content).toHaveText("");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#disclosure-events")).toHaveText("initial:true");
  await page
    .getByRole("button", { name: "Accept disclosure changes", exact: true })
    .click();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAttribute(
    "aria-controls",
    (await content.getAttribute("id")) ?? "",
  );
  await expect(content).toContainText("Disclosure body");
  await expect(page.locator("#disclosure-events")).toHaveText(
    "initial:true,latest:true",
  );
  await page
    .getByRole("button", { name: "Cancel disclosure clicks", exact: true })
    .click();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#disclosure-events")).toHaveText(
    "initial:true,latest:true",
  );
  await page
    .getByRole("button", { name: "Disable disclosure", exact: true })
    .click();
  await expect(trigger).toBeDisabled();
  const defaulted = page.getByRole("button", {
    name: "Default disclosure",
    exact: true,
  });
  await page
    .getByRole("button", { name: "Change disclosure default", exact: true })
    .click();
  await expect(defaulted).toHaveAttribute("aria-expanded", "false");
  await defaulted.click();
  await expect(defaulted).toHaveAttribute("aria-expanded", "true");
});

test("collapsible measures full dimensions, retains exiting children and handles reopening and native factory targets", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Accept disclosure changes", exact: true })
    .click();
  const trigger = page.getByRole("button", {
    name: "Controlled disclosure",
    exact: true,
  });
  const content = page.locator('[data-testid="controlled-disclosure-content"]');
  await trigger.click();
  await expect(content).toHaveCSS("--radix-collapsible-content-height", "56px");
  await expect(content).toHaveCSS("--radix-collapsible-content-width", "320px");
  await trigger.click();
  await expect(content).toHaveAttribute("data-state", "closed");
  await expect(content).toContainText("Disclosure body");
  await trigger.click();
  await expect(content).toHaveAttribute("data-state", "open");
  await expect(content).toBeVisible();
  await content.evaluate((node) =>
    node.getAnimations().forEach((animation) => animation.finish()),
  );
  await expect(content).toContainText("Disclosure body");
  await trigger.click();
  await expect(content).toContainText("Disclosure body");
  await content.evaluate((node) =>
    node.getAnimations().forEach((animation) => animation.finish()),
  );
  await expect(content).toBeHidden();
  await expect(content).toHaveText("");
  await expect(
    page.getByText("Forced disclosure body", { exact: true }),
  ).toBeVisible();
  const factory = page.getByRole("button", {
    name: "Factory disclosure",
    exact: true,
  });
  await expect(
    page.getByText("Factory disclosure body", { exact: true }),
  ).toHaveCount(0);
  await factory.click();
  await expect(
    page.locator('article[data-testid="factory-disclosure-content"]'),
  ).toHaveText("Factory disclosure body");
  await factory.click();
  await expect(
    page.locator('[data-testid="factory-disclosure-content"]'),
  ).toHaveCount(0);
});

test("single accordion rejects parent requests, closes with one request when collapsible and isolates nested instances", async ({
  page,
}) => {
  const one = page.getByRole("button", { name: "Single One", exact: true });
  await one.click();
  await expect(one).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#accordion-events")).toHaveText("initial:one");
  await page
    .getByRole("button", { name: "Accept accordion changes", exact: true })
    .click();
  await one.click();
  await expect(one).toHaveAttribute("aria-expanded", "true");
  await expect(one).toHaveAttribute("aria-disabled", "true");
  const region = page.getByRole("region", { name: "Single One", exact: true });
  await expect(region).toContainText("Single content one");
  await expect
    .poll(() =>
      region.evaluate(
        (node) =>
          Number.parseFloat(
            getComputedStyle(node).getPropertyValue(
              "--radix-accordion-content-height",
            ),
          ) === node.getBoundingClientRect().height,
      ),
    )
    .toBe(true);
  await one.press("Enter");
  await expect(page.locator("#accordion-events")).toHaveText(
    "initial:one,latest:one",
  );
  await page
    .getByRole("button", { name: "Make single collapsible", exact: true })
    .click();
  await expect(one).not.toHaveAttribute("aria-disabled");
  await page.getByRole("button", { name: "Nested item", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Nested item", exact: true }),
  ).toContainText("Nested content");
  await expect(one).toHaveAttribute("aria-expanded", "true");
  await one.click();
  await expect(one).toHaveAttribute("aria-expanded", "false");
  await expect(region).toHaveCount(0);
  await expect(page.locator("#accordion-events")).toHaveText(
    "initial:one,latest:one,latest:",
  );
});

test("accordion navigation follows current DOM order, disabled state, orientation, inherited RTL and cancellation", async ({
  page,
}) => {
  const one = page.getByRole("button", { name: "Single One", exact: true });
  const three = page.getByRole("button", { name: "Single Three", exact: true });
  await one.focus();
  await one.press("ArrowDown");
  await expect(three).toBeFocused();
  await three.press("ArrowDown");
  await expect(one).toBeFocused();
  await one.press("End");
  await expect(three).toBeFocused();
  await three.press("Home");
  await expect(one).toBeFocused();
  await page
    .getByRole("button", { name: "Reorder accordion items", exact: true })
    .click();
  await one.focus();
  await one.press("Home");
  await expect(three).toBeFocused();
  await three.press("ArrowDown");
  await expect(one).toBeFocused();
  await page
    .getByRole("button", { name: "Horizontal RTL accordion", exact: true })
    .click();
  await one.focus();
  await one.press("ArrowDown");
  await expect(one).toBeFocused();
  await one.press("ArrowRight");
  await expect(three).toBeFocused();
  await three.press("ArrowLeft");
  await expect(one).toBeFocused();
  await page
    .getByRole("button", { name: "Cancel accordion navigation", exact: true })
    .click();
  await one.focus();
  await one.press("Home");
  await expect(one).toBeFocused();
  await page
    .getByRole("button", { name: "Disable accordion", exact: true })
    .click();
  await expect(one).toBeDisabled();
  await expect(three).toBeDisabled();
});

test("multiple accordion preserves independent open items and functional updates in one native event", async ({
  page,
}) => {
  const one = page.getByRole("button", { name: "Multiple One", exact: true });
  const two = page.getByRole("button", { name: "Multiple Two", exact: true });
  await page
    .getByRole("button", { name: "Open both multiple items", exact: true })
    .click();
  await expect(one).toHaveAttribute("aria-expanded", "true");
  await expect(two).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#multiple-accordion-events")).toHaveText(
    "one,one+two",
  );
  await one.click();
  await expect(one).toHaveAttribute("aria-expanded", "false");
  await expect(two).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#multiple-accordion-events")).toHaveText(
    "one,one+two,two",
  );
});

test("checked controls retain parent authority and notify forms without programmatic ancestor clicks", async ({
  page,
}) => {
  const checkbox = page.getByRole("checkbox", {
    name: "Controlled checkbox",
    exact: true,
  });
  await checkbox.click();
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("#checked-events")).toHaveText("initial:true");
  await expect(page.locator("#form-clicks")).toHaveText("0");
  await page
    .getByRole("button", { name: "Set checked programmatically" })
    .click();
  await expect(checkbox).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(() =>
      checkbox.evaluate((node) => {
        const input = node.ownerDocument.querySelector('input[name="checked"]');
        return (
          input instanceof HTMLInputElement &&
          input.checked &&
          input.getBoundingClientRect().width ===
            node.getBoundingClientRect().width
        );
      }),
    )
    .toBe(true);
  await expect(page.locator("#form-changes")).toHaveText(
    "checked:true:false:false",
  );
  await expect(page.locator("#form-clicks")).toHaveText("0");
  await page.getByRole("button", { name: "Accept checked changes" }).click();
  await page.getByText("Controlled checkbox", { exact: true }).click();
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("#checked-events")).toHaveText(
    "initial:true,latest:false",
  );
  await expect(page.locator("#form-clicks")).toHaveText("1");
  await expect(page.locator("#form-changes")).toHaveText(
    "checked:true:false:false,checked:false:false:false",
  );
});

test("mixed checks, external ownership and switches participate in native submission and reset", async ({
  page,
}) => {
  const mixed = page.getByRole("checkbox", {
    name: "Mixed checkbox",
    exact: true,
  });
  const notifications = page.getByRole("switch", {
    name: "Notifications switch",
    exact: true,
  });
  const external = page.getByRole("checkbox", {
    name: "External checkbox",
    exact: true,
  });
  const data = () =>
    page
      .locator("#native-controls-form")
      .evaluate((form) =>
        form instanceof HTMLFormElement
          ? [...new FormData(form).entries()]
          : [],
      );
  await expect(mixed).toHaveAttribute("aria-checked", "mixed");
  expect(await data()).toEqual([
    ["notifications", "enabled"],
    ["external-check", "external"],
    ["external-switch", "on"],
  ]);
  await mixed.click();
  await notifications.click();
  await external.click();
  expect(await data()).toEqual([
    ["mixed", "mixed-value"],
    ["external-switch", "on"],
  ]);
  await page.getByRole("button", { name: "Reset native controls" }).click();
  await expect(mixed).toHaveAttribute("aria-checked", "mixed");
  await expect(notifications).toHaveAttribute("aria-checked", "true");
  await expect(external).toHaveAttribute("aria-checked", "true");
  expect(await data()).toEqual([
    ["notifications", "enabled"],
    ["external-check", "external"],
    ["external-switch", "on"],
  ]);
  await expect(page.getByTestId("switch-thumb")).toHaveAttribute(
    "data-state",
    "checked",
  );
});

test("required checkbox validation, reset cancellation and controlled refusal preserve actual input state", async ({
  page,
}) => {
  const valid = () =>
    page
      .locator("#native-controls-form")
      .evaluate(
        (form) => form instanceof HTMLFormElement && form.checkValidity(),
      );
  expect(await valid()).toBe(false);
  await page
    .getByRole("checkbox", { name: "Required checkbox", exact: true })
    .click();
  expect(await valid()).toBe(true);
  await page
    .getByRole("button", { name: "Set checked programmatically" })
    .click();
  await page.getByRole("button", { name: "Reset native controls" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Controlled checkbox", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.locator('#native-controls-form input[name="checked"]'),
  ).toBeChecked();
  await expect(page.locator("#checked-events")).toHaveText("initial:false");
  await page
    .getByRole("switch", { name: "Notifications switch", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel native reset" }).click();
  await page.getByRole("button", { name: "Reset native controls" }).click();
  await expect(
    page.getByRole("switch", { name: "Notifications switch", exact: true }),
  ).toHaveAttribute("aria-checked", "false");
  await expect(
    page.locator('#native-controls-form input[name="notifications"]'),
  ).not.toBeChecked();
});

test("default values stay initial-only and consumers may cancel or disable checked activation", async ({
  page,
}) => {
  const checkbox = page.getByRole("checkbox", {
    name: "Controlled checkbox",
    exact: true,
  });
  await page.getByRole("button", { name: "Change checked default" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Default checkbox", exact: true }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Accept checked changes" }).click();
  await checkbox.press("Enter");
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await checkbox.press("Space");
  await expect(checkbox).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Cancel checked clicks" }).click();
  await checkbox.click();
  await expect(checkbox).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#checked-events")).toHaveText("latest:true");
  await page.getByRole("button", { name: "Disable checked control" }).click();
  await expect(checkbox).toBeDisabled();
  expect(
    await page
      .locator("#native-controls-form")
      .evaluate(
        (form) =>
          form instanceof HTMLFormElement && new FormData(form).has("checked"),
      ),
  ).toBe(false);
  const split = page.getByRole("checkbox", {
    name: "Split checkbox",
    exact: true,
  });
  await split.click();
  await expect(split).toHaveAttribute("aria-checked", "true");
  const splitSwitch = page.getByRole("switch", {
    name: "Split switch",
    exact: true,
  });
  await splitSwitch.press("Enter");
  await expect(splitSwitch).toHaveAttribute("aria-checked", "true");
  const factory = page.getByRole("checkbox", {
    name: "Factory checkbox",
    exact: true,
  });
  await factory.click();
  await expect(factory).toHaveAttribute("aria-checked", "true");
});

test("stopped checked activation does not suppress a later programmatic form notification", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Accept checked changes" }).click();
  await page.getByRole("button", { name: "Stop checked propagation" }).click();
  await page
    .getByRole("checkbox", { name: "Controlled checkbox", exact: true })
    .click();
  await expect(page.locator("#form-clicks")).toHaveText("0");
  await expect(page.locator("#form-changes")).toHaveText("");
  await page
    .getByRole("button", { name: "Clear checked programmatically" })
    .click();
  await expect(page.locator("#form-changes")).toHaveText(
    "checked:false:false:false",
  );
  await expect(page.locator("#form-clicks")).toHaveText("0");
});

test("radio selection is parent-authoritative, latest, single-change and never programmatically clicks ancestors", async ({
  page,
}) => {
  const one = page.getByRole("radio", { name: "Controlled one", exact: true });
  const three = page.getByRole("radio", {
    name: "Controlled three",
    exact: true,
  });
  await three.click();
  await expect(one).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#radio-events")).toHaveText("initial:three");
  await expect(page.locator("#radio-changes")).toHaveText("");
  await page
    .getByRole("button", { name: "Set radio programmatically" })
    .click();
  await expect(three).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#radio-clicks")).toHaveText("0");
  await expect(page.locator("#radio-changes")).toHaveText("pet:three:true");
  await page.getByRole("button", { name: "Accept radio changes" }).click();
  await one.click();
  await expect(one).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#radio-events")).toHaveText(
    "initial:three,latest:one",
  );
  await expect(page.locator("#radio-clicks")).toHaveText("1");
  await expect(page.locator("#radio-changes")).toHaveText(
    "pet:three:true,pet:one:true",
  );
  await one.click();
  await expect(page.locator("#radio-events")).toHaveText(
    "initial:three,latest:one",
  );
  await page.getByRole("button", { name: "Clear radio selection" }).click();
  await expect(one).toHaveAttribute("aria-checked", "false");
  await expect(three).toHaveAttribute("aria-checked", "false");
  await expect(
    page.getByText("Controlled indicator one", { exact: true }),
  ).not.toBeVisible();
});

test("same-name radio groups retain real form ownership, validation and initial reset including an empty group", async ({
  page,
}) => {
  const data = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((form) =>
        form instanceof HTMLFormElement
          ? [...new FormData(form).entries()]
          : [],
      );
  expect(await data("radio-main")).toEqual([["pet", "one"]]);
  expect(await data("radio-other")).toEqual([["pet", "two"]]);
  expect(
    await page
      .locator("#radio-main")
      .evaluate(
        (form) => form instanceof HTMLFormElement && form.checkValidity(),
      ),
  ).toBe(false);
  await page.getByRole("radio", { name: "External one", exact: true }).click();
  await page.getByRole("radio", { name: "Split radio", exact: true }).click();
  expect(await data("radio-main")).toEqual([
    ["pet", "one"],
    ["empty", "split"],
  ]);
  expect(await data("radio-other")).toEqual([["pet", "one"]]);
  expect(
    await page
      .locator("#radio-main")
      .evaluate(
        (form) => form instanceof HTMLFormElement && form.checkValidity(),
      ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Reset other radio choices", exact: true })
    .click();
  await expect(
    page.getByRole("radio", { name: "External two", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page
    .getByRole("button", { name: "Reset radio choices", exact: true })
    .click();
  await expect(
    page.getByRole("radio", { name: "Split radio", exact: true }),
  ).toHaveAttribute("aria-checked", "false");
  expect(await data("radio-main")).toEqual([["pet", "one"]]);
  expect(await data("radio-other")).toEqual([["pet", "two"]]);
});

test("radio arrows select while ordinary focus and Enter do not; navigation follows DOM order, direction and loop", async ({
  page,
}) => {
  const one = page.getByRole("radio", { name: "Controlled one", exact: true });
  const three = page.getByRole("radio", {
    name: "Controlled three",
    exact: true,
  });
  await page.getByRole("button", { name: "Accept radio changes" }).click();
  await three.focus();
  await expect(one).toHaveAttribute("aria-checked", "true");
  await three.press("Enter");
  await expect(one).toHaveAttribute("aria-checked", "true");
  await one.press("ArrowDown");
  await expect(three).toBeFocused();
  await expect(three).toHaveAttribute("aria-checked", "true");
  await three.press("ArrowDown");
  await expect(one).toBeFocused();
  await page.getByRole("button", { name: "Stop radio looping" }).click();
  await one.press("ArrowUp");
  await expect(one).toBeFocused();
  await page.getByRole("button", { name: "Reorder radio items" }).click();
  await one.press("Home");
  await expect(three).toBeFocused();
  await three.press("End");
  await expect(one).toBeFocused();
  await page.getByRole("button", { name: "Horizontal RTL radio" }).click();
  await one.press("ArrowRight");
  await expect(three).toBeFocused();
  await three.press("ArrowDown");
  await expect(three).toBeFocused();
  await page.getByRole("button", { name: "Cancel radio navigation" }).click();
  await three.press("ArrowLeft");
  await expect(three).toBeFocused();
  await expect(
    page.getByRole("radio", { name: "Nested radio", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Disable radio group" }).click();
  await expect(one).toBeDisabled();
  await expect(three).toBeDisabled();
});

test("radio reset requests once, restores rejected native input state and respects consumer cancellation", async ({
  page,
}) => {
  const three = page.getByRole("radio", {
    name: "Controlled three",
    exact: true,
  });
  const selected = () =>
    page
      .locator("#radio-main")
      .evaluate((form) =>
        form instanceof HTMLFormElement ? new FormData(form).get("pet") : null,
      );
  await page
    .getByRole("button", { name: "Set radio programmatically" })
    .click();
  await page
    .getByRole("button", { name: "Reset radio choices", exact: true })
    .click();
  await expect(three).toHaveAttribute("aria-checked", "true");
  await expect.poll(selected).toBe("three");
  await expect(page.locator("#radio-events")).toHaveText("initial:one");
  await page.getByRole("button", { name: "Accept radio changes" }).click();
  await page.getByRole("button", { name: "Cancel radio reset" }).click();
  await page
    .getByRole("button", { name: "Reset radio choices", exact: true })
    .click();
  await expect(three).toHaveAttribute("aria-checked", "true");
  expect(await selected()).toBe("three");
  await expect(page.locator("#radio-events")).toHaveText("initial:one");
});

test("tabs preserve parent authority, latest requests, manual activation and input blur before content removal", async ({
  page,
}) => {
  const one = page.getByRole("tab", { name: "Document one", exact: true });
  const three = page.getByRole("tab", { name: "Document three", exact: true });
  await three.click();
  await expect(one).toHaveAttribute("aria-selected", "true");
  await expect(three).toHaveAttribute("aria-selected", "false");
  await expect(page.locator("#tab-events")).toHaveText("initial:three");
  await expect(
    page.getByText("Nested tab content", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Accept tab changes" }).click();
  await page.getByRole("textbox", { name: "Tab editor", exact: true }).focus();
  await three.click();
  await expect(three).toBeFocused();
  await expect(three).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#tab-blurs")).toHaveText("1");
  await expect(page.locator("#tab-events")).toHaveText(
    "initial:three,latest:three",
  );
  await expect(
    page.getByRole("textbox", { name: "Tab editor", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("document-three")).toBeVisible();
  await expect(page.getByTestId("forced-tab-content")).toBeVisible();
  await three.press("ArrowRight");
  await expect(one).toBeFocused();
  await expect(three).toHaveAttribute("aria-selected", "true");
  await one.press("Enter");
  await expect(one).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("document-three")).toBeHidden();
});

test("automatic tabs follow live DOM order, RTL, vertical orientation, disabled skipping, looping and cancellation", async ({
  page,
}) => {
  const one = page.getByRole("tab", { name: "Document one", exact: true });
  const three = page.getByRole("tab", { name: "Document three", exact: true });
  await page.getByRole("button", { name: "Accept tab changes" }).click();
  await page.getByRole("button", { name: "Automatic tabs" }).click();
  await one.focus();
  await one.press("ArrowLeft");
  await expect(three).toBeFocused();
  await expect(three).toHaveAttribute("aria-selected", "true");
  await three.press("ArrowLeft");
  await expect(one).toBeFocused();
  await page.getByRole("button", { name: "Stop tab looping" }).click();
  await three.focus();
  await three.press("ArrowLeft");
  await expect(three).toBeFocused();
  await page.getByRole("button", { name: "Reorder tabs" }).click();
  await three.focus();
  await three.press("Home");
  await expect(three).toBeFocused();
  await three.press("End");
  await expect(one).toBeFocused();
  await page.getByRole("button", { name: "Vertical tabs" }).click();
  await one.focus();
  await one.press("ArrowLeft");
  await expect(one).toBeFocused();
  await one.press("ArrowUp");
  await expect(three).toBeFocused();
  await page.getByRole("button", { name: "Cancel tab navigation" }).click();
  await three.focus();
  await three.press("ArrowDown");
  await expect(three).toBeFocused();
});

test("toggle groups support deselection, parent refusal, latest callbacks and synchronous multiple requests without form controls", async ({
  page,
}) => {
  const one = page.getByRole("radio", { name: "Align one", exact: true });
  const three = page.getByRole("radio", { name: "Align three", exact: true });
  await one.click();
  await expect(one).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("#toggle-events")).toHaveText("initial:one");
  await page.getByRole("button", { name: "Accept toggle changes" }).click();
  await one.click();
  await expect(one).toHaveAttribute("aria-checked", "true");
  await expect(one).not.toHaveAttribute("aria-pressed");
  await one.press("ArrowLeft");
  await expect(three).toBeFocused();
  await expect(one).toHaveAttribute("aria-checked", "true");
  await three.press(" ");
  await expect(three).toHaveAttribute("aria-checked", "true");
  await three.click();
  await expect(three).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("#toggle-events")).toHaveText(
    "initial:one,latest:one,latest:three,latest:",
  );
  await page.getByRole("button", { name: "Toggle both formats" }).click();
  await expect(
    page.getByRole("button", { name: "Format bold", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Format italic", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#multiple-toggle-events")).toHaveText(
    "bold,bold+italic",
  );
  await page.getByRole("button", { name: "Toggle both formats" }).click();
  await expect(page.locator("#multiple-toggle-events")).toHaveText(
    "bold,bold+italic,italic,",
  );
  await page.getByRole("button", { name: "Disable alignment toggles" }).click();
  await expect(one).toBeDisabled();
  await expect(three).toBeDisabled();
  const group = page.getByRole("radiogroup", {
    name: "Alignment toggles",
    exact: true,
  });
  await expect(group).toBeVisible();
  await expect(group.locator("input")).toHaveCount(0);
});

test("toolbar shares one ordered roving group across buttons, toggles and links, and only activates links from their own Space key", async ({
  page,
}) => {
  const first = page.getByRole("button", {
    name: "Toolbar first",
    exact: true,
  });
  const bold = page.getByRole("button", { name: "Toolbar bold", exact: true });
  const italic = page.getByRole("button", {
    name: "Toolbar italic",
    exact: true,
  });
  const link = page.locator('a[href="#toolbar-target"]');
  await first.focus();
  await first.press("ArrowLeft");
  await expect(bold).toBeFocused();
  await bold.press(" ");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await bold.press("ArrowLeft");
  await expect(italic).toBeFocused();
  await italic.press("End");
  await expect(link).toBeFocused();
  await link.press(" ");
  await expect(page.locator("#toolbar-clicks")).toHaveText("1");
  await expect(page.locator("#toolbar-divider")).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
  await page.getByRole("button", { name: "Vertical toolbar" }).click();
  await first.focus();
  await first.press("ArrowDown");
  await expect(bold).toBeFocused();
  await expect(page.locator("#toolbar-divider")).not.toHaveAttribute(
    "aria-orientation",
  );
  await page.getByRole("button", { name: "Disable toolbar formats" }).click();
  await first.focus();
  await first.press("ArrowDown");
  await expect(link).toBeFocused();
});

test("opening a dialog focuses its first toggle group instead of skipping to the close button", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Open grouped toggles", exact: true })
    .click();
  await expect(
    page.getByRole("radio", { name: "Dialog choice one", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("radio", { name: "Dialog choice one", exact: true })
    .press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: "Dialog choice two", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Close grouped toggles", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Open grouped toggles", exact: true }),
  ).toBeFocused();
});

test("tab panel editing keeps Space/Enter input while a rich factory trigger still activates", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Tab panel editor",
    exact: true,
  });
  const trigger = page.getByRole("tab", {
    name: "Editable tab two",
    exact: true,
  });
  await editor.fill("draft");
  await editor.press(" ");
  await editor.press("Enter");
  await expect(editor).toHaveValue("draft ");
  await expect(page.locator("#editable-tab-events")).toHaveText("");
  await expect(
    page.getByText("Editable first panel", { exact: true }),
  ).toBeVisible();
  await trigger.focus();
  await trigger.press(" ");
  await expect(trigger).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#editable-tab-events")).toHaveText("two");
  await expect(
    page.getByText("Editable second panel", { exact: true }),
  ).toBeVisible();
});

test("roving keyboard navigation scrolls a long toolbar target into view", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Vertical toolbar", exact: true })
    .click();
  const group = page.getByRole("toolbar", {
    name: "Editor actions",
    exact: true,
  });
  await group.evaluate((node) => {
    Object.assign(node.style, {
      display: "flex",
      flexDirection: "column",
      height: "100px",
      overflow: "auto",
    });
    for (const child of node.querySelectorAll<HTMLElement>("button, a"))
      Object.assign(child.style, { minHeight: "80px", flexShrink: "0" });
  });
  await group
    .getByRole("button", { name: "Toolbar first", exact: true })
    .focus();
  await page.keyboard.press("End");
  await expect(
    group.getByRole("link", { name: "Toolbar link", exact: true }),
  ).toBeFocused();
  await expect
    .poll(() => group.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0);
});
