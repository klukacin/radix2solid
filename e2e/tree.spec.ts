import { expect, test, type Locator, type Page } from "@playwright/test";

// Future Trees fixture contract and acceptance mapping: task-3-report.md.
// Only browser-visible controls are used; no product or fixture module imports.
const workspace = (page: Page) =>
  page.getByRole("tree", { name: "Workspace", exact: true });
const row = (tree: Locator, key: string) =>
  tree.locator(`[data-tree-key="${key}"]`);
const control = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
// External prop changes must not move focus merely because a test clicks a control.
const update = async (page: Page, name: string) =>
  control(page, name).evaluate((button: HTMLButtonElement) => button.click());

async function expectLog(page: Page, id: string, values: unknown[]) {
  await expect(page.locator(`#${id}`)).toHaveText(JSON.stringify(values));
}

async function expectHierarchy(tree: Locator) {
  const projects = row(tree, "projects"),
    docs = row(tree, "docs"),
    guide = row(tree, "guide");
  await expect(projects).toHaveAttribute("aria-expanded", "true");
  await expect(docs).toHaveAttribute("aria-expanded", "true");
  await expect(projects.locator('[role="group"]').first()).toContainText(
    "Guide",
  );
  await expect(docs.locator('[role="group"]').first()).toContainText("Guide");
  await expect(guide).toHaveAccessibleName("Guide");
  await expect(guide).toHaveAttribute("aria-selected", "true");
  await expect(guide).not.toHaveAttribute("aria-expanded");
  await expect(row(tree, "archive")).toHaveAttribute("aria-expanded", "false");
  await expect(row(tree, "public")).toHaveAttribute("aria-level", "2");
  await expect(row(tree, "public")).toHaveAttribute("aria-posinset", "4");
  await expect(row(tree, "public")).toHaveAttribute("aria-setsize", "-1");
  await expect(row(tree, "api")).toHaveAttribute("aria-level", "3");
  await expect(row(tree, "api")).toHaveAttribute("aria-posinset", "2");
  await expect(row(tree, "api")).toHaveAttribute("aria-setsize", "8");
}

test.describe("native Tree", () => {
  test.beforeEach(async ({ page }, info) => {
    await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
    // Behavioral RED must be the missing public control, not a missing import or fixture route.
    await expect(workspace(page)).toBeVisible({ timeout: 2000 });
  });

  test("tree-keys: named hierarchy exposes selected state, branch semantics and partial metadata", async ({
    page,
  }) => {
    const tree = workspace(page);
    await expectHierarchy(tree);
    await expect(
      tree.getByRole("treeitem", { name: "Report", exact: true }),
    ).toHaveCount(2);
    await expect(row(tree, "alpha")).not.toHaveAttribute("aria-expanded");
    await expect(row(tree, "alpine")).not.toHaveAttribute("aria-expanded");
    await expectLog(page, "tree-selection-requests", []);
    await expectLog(page, "tree-expansion-requests", []);
    await expectLog(page, "tree-activations", []);
  });

  for (const invalid of ["empty", "duplicate"]) {
    test(`tree-keys: registered ${invalid} keys report a configuration error`, async ({
      page,
    }) => {
      await control(page, `Mount ${invalid} tree keys`).click();
      await expect(page.locator("#tree-key-error")).toContainText(
        invalid === "empty" ? /non.?empty|empty/i : /duplicate|unique/i,
      );
      // An isolated real error boundary keeps the ordinary tree usable.
      await row(workspace(page), "guide").focus();
      await page.keyboard.press("ArrowDown");
      await expect(row(workspace(page), "api")).toBeFocused();
    });
  }

  test("tree-navigation: arrows move real focus through enabled preorder without selecting or wrapping", async ({
    page,
  }) => {
    const tree = workspace(page);
    await control(page, "Before workspace tree").focus();
    await page.keyboard.press("Tab");
    await expect(row(tree, "guide")).toBeFocused();
    await page.keyboard.press("Home");
    for (const key of [
      "projects",
      "docs",
      "guide",
      "api",
      "notes",
      "public",
      "archive",
      "alpha",
      "alpine",
      "zulu",
    ]) {
      await expect(row(tree, key)).toBeFocused();
      await page.keyboard.press("ArrowDown");
    }
    await expect(row(tree, "zulu")).toBeFocused();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowUp");
    await expect(row(tree, "projects")).toBeFocused();
    await page.keyboard.press("End");
    await expect(row(tree, "zulu")).toBeFocused();
    await expect(row(tree, "guide")).toHaveAttribute("aria-selected", "true");
    await expectLog(page, "tree-selection-requests", []);
    await expectLog(page, "tree-activations", []);
    await expectLog(page, "tree-expansion-requests", []);
    await page.keyboard.press("Tab");
    await expect(control(page, "After workspace tree")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(row(tree, "zulu")).toBeFocused();
  });

  for (const dir of ["ltr", "rtl"]) {
    test(`tree-navigation: ${dir} logical branch keys expand, enter, ascend and collapse only branches`, async ({
      page,
    }) => {
      const tree = workspace(page);
      if (dir === "rtl") await control(page, "Use RTL tree").click();
      const open = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const close = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
      await row(tree, "archive").focus();
      await page.keyboard.press(open);
      await expect(row(tree, "archive")).toBeFocused();
      await expect(row(tree, "archive")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await page.keyboard.press(open);
      await expect(row(tree, "archived")).toBeFocused();
      await page.keyboard.press(open);
      await expect(row(tree, "archived")).toBeFocused();
      await page.keyboard.press(close);
      await expect(row(tree, "archive")).toBeFocused();
      await page.keyboard.press(close);
      await expect(row(tree, "archive")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expectLog(page, "tree-expansion-requests", [
        ["projects", "docs", "locked", "archive"],
        ["projects", "docs", "locked"],
      ]);
      await expectLog(page, "tree-selection-requests", []);
      await expectLog(page, "tree-activations", []);
    });
  }

  test("tree-navigation: disabled parent is skipped but its enabled descendant remains traversable", async ({
    page,
  }) => {
    const tree = workspace(page);
    await row(tree, "notes").focus();
    await page.keyboard.press("ArrowDown");
    await expect(row(tree, "public")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(row(tree, "public")).toBeFocused();
    // The disabled top-level parent has no enabled ancestor to move to.
    await row(tree, "locked").click({ force: true, position: { x: 4, y: 4 } });
    await expect(row(tree, "locked")).not.toBeFocused();
    await expect(row(tree, "locked")).toHaveAttribute("aria-expanded", "true");
    await expectLog(page, "tree-selection-requests", []);
    await expectLog(page, "tree-activations", []);
    await expectLog(page, "tree-expansion-requests", []);
  });

  test("tree-navigation: explicit textValue, repeated prefixes, expiry and blur reset govern typeahead", async ({
    page,
  }) => {
    await page.clock.install();
    const tree = workspace(page);
    await row(tree, "archive").focus();
    await page.keyboard.press("a");
    await expect(row(tree, "alpha")).toBeFocused();
    await page.keyboard.press("a");
    await expect(row(tree, "alpine")).toBeFocused();
    await page.keyboard.press("a");
    await expect(row(tree, "api")).toBeFocused();
    await page.clock.runFor(1000);
    await page.keyboard.press("z");
    await expect(row(tree, "zulu")).toBeFocused();
    await control(page, "After workspace tree").focus();
    await row(tree, "zulu").focus();
    await page.keyboard.press("g");
    await expect(row(tree, "guide")).toBeFocused();
    await expectLog(page, "tree-selection-requests", []);
    await expectLog(page, "tree-activations", []);
    await expectLog(page, "tree-expansion-requests", []);
  });

  test("tree-navigation: modifiers, IME and consumer cancellation do not trigger built-in actions", async ({
    page,
  }) => {
    const tree = workspace(page),
      guide = row(tree, "guide");
    await guide.focus();
    for (const key of ["Control+a", "Meta+a", "Alt+a"])
      await page.keyboard.press(key);
    await expect(guide).toBeFocused();
    await guide.evaluate((node) => {
      node.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true }),
      );
      for (const key of ["a", "Enter", " "])
        node.dispatchEvent(
          new KeyboardEvent("keydown", {
            key,
            isComposing: true,
            bubbles: true,
            cancelable: true,
          }),
        );
      node.dispatchEvent(
        new CompositionEvent("compositionend", { bubbles: true }),
      );
    });
    await expect(guide).toBeFocused();
    await page.getByLabel("Cancel tree keys", { exact: true }).check();
    await guide.focus();
    for (const key of ["ArrowDown", "a", "Enter", "Space"])
      await page.keyboard.press(key);
    await expect(guide).toBeFocused();
    await expectLog(page, "tree-selection-requests", []);
    await expectLog(page, "tree-activations", []);
    await expectLog(page, "tree-expansion-requests", []);
  });

  test("tree-actions: Space selects without activation and Enter activates once without implicit expansion", async ({
    page,
  }) => {
    const tree = workspace(page);
    await row(tree, "api").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Space");
    await expectLog(page, "tree-selection-requests", ["api"]);
    await expectLog(page, "tree-activations", []);
    await row(tree, "archive").focus();
    await page.keyboard.press("Enter");
    await expectLog(page, "tree-activations", ["archive"]);
    await expectLog(page, "tree-selection-requests", ["api", "archive"]);
    await expect(row(tree, "archive")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expectLog(page, "tree-expansion-requests", []);
    await row(tree, "guide").click();
    await expectLog(page, "tree-activations", ["archive", "guide"]);
    await expectLog(page, "tree-selection-requests", [
      "api",
      "archive",
      "guide",
    ]);
  });

  test("tree-actions: cancellation and controlled refusal leave accepted selection and expansion authoritative", async ({
    page,
  }) => {
    const tree = workspace(page);
    await page.getByLabel("Cancel tree activation", { exact: true }).check();
    await row(tree, "api").focus();
    await page.keyboard.press("Enter");
    await expectLog(page, "tree-activations", ["api"]);
    await expectLog(page, "tree-selection-requests", []);
    await expect(row(tree, "guide")).toHaveAttribute("aria-selected", "true");
    await page.getByLabel("Cancel tree activation", { exact: true }).uncheck();
    await page.getByLabel("Accept tree selection", { exact: true }).uncheck();
    await page.getByLabel("Accept tree expansion", { exact: true }).uncheck();
    await row(tree, "api").focus();
    await page.keyboard.press("Space");
    await expect(row(tree, "api")).toHaveAttribute("aria-selected", "false");
    await expect(row(tree, "guide")).toHaveAttribute("aria-selected", "true");
    await row(tree, "archive").focus();
    await page.keyboard.press("ArrowRight");
    await expect(row(tree, "archive")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expectLog(page, "tree-selection-requests", ["api"]);
    await expectLog(page, "tree-expansion-requests", [
      ["projects", "docs", "locked", "archive"],
    ]);
    await update(page, "Select API externally");
    await expect(row(tree, "api")).toHaveAttribute("aria-selected", "true");
    await expect(row(tree, "archive")).toBeFocused();
    await update(page, "Clear tree selection");
    await expect(tree.locator('[aria-selected="true"]')).toHaveCount(0);
    await expectLog(page, "tree-selection-requests", ["api"]);
  });

  test("tree-actions: none mode consumes Space, preserves the key and omits selection semantics", async ({
    page,
  }) => {
    const tree = workspace(page);
    await control(page, "Use action-only tree").click();
    await expect(tree.locator("[aria-selected]")).toHaveCount(0);
    await row(tree, "api").focus();
    await page.keyboard.press("Space");
    await expectLog(page, "tree-activations", []);
    await page.keyboard.press("Enter");
    await expectLog(page, "tree-activations", ["api"]);
    await expectLog(page, "tree-selection-requests", []);
    await control(page, "Use single-selection tree").click();
    await expect(row(tree, "guide")).toHaveAttribute("aria-selected", "true");
    await expect(row(tree, "api")).toHaveAttribute("aria-selected", "false");
  });

  test("tree-actions: expansion de-duplicates keys, preserves order and suppresses leaf/no-op notifications", async ({
    page,
  }) => {
    const tree = workspace(page);
    await control(page, "Set duplicate tree expansions").click();
    await row(tree, "archive").focus();
    await page.keyboard.press("ArrowRight");
    await expectLog(page, "tree-expansion-requests", [
      ["locked", "projects", "docs", "archive"],
    ]);
    await page.keyboard.press("ArrowRight");
    await expect(row(tree, "archived")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expectLog(page, "tree-expansion-requests", [
      ["locked", "projects", "docs", "archive"],
    ]);
  });

  for (const target of ["button", "link"]) {
    for (const key of ["Enter", "Space"]) {
      test(`tree-actions: native ${target} ${key} handles activation and selection exactly once`, async ({
        page,
      }) => {
        const tree = page.getByRole("tree", {
          name: "Native targets",
          exact: true,
        });
        const item = row(tree, target);
        await expect(item).toHaveJSProperty(
          "tagName",
          target === "button" ? "BUTTON" : "A",
        );
        await expect(page.locator("#tree-native-refs")).toHaveText("BUTTON,A");
        await item.scrollIntoViewIfNeeded();
        await item.focus();
        await expect(item).toBeFocused();
        await expect(item).toBeInViewport({ ratio: 1 });
        const scroll = await page.evaluate(() => scrollY);
        const url = page.url();
        await page.keyboard.press(key);
        await expectLog(
          page,
          "tree-native-activations",
          key === "Enter" ? [target] : [],
        );
        await expectLog(page, "tree-native-selection-requests", [target]);
        await expect(item).toHaveAttribute("aria-selected", "true");
        if (key === "Space") {
          expect(page.url()).toBe(url);
          expect(await page.evaluate(() => scrollY)).toBe(scroll);
          await page.keyboard.press("Space");
          await expectLog(page, "tree-native-selection-requests", [target]);
          await expectLog(page, "tree-native-activations", []);
        }
      });
    }
  }

  test("tree-actions: native cancellation blocks selection and anchor default without duplicate activation", async ({
    page,
  }) => {
    const tree = page.getByRole("tree", {
      name: "Native targets",
      exact: true,
    });
    await page
      .getByLabel("Cancel native tree activation", { exact: true })
      .check();
    const url = page.url();
    await row(tree, "link").focus();
    await page.keyboard.press("Enter");
    await expectLog(page, "tree-native-activations", ["link"]);
    await expectLog(page, "tree-native-selection-requests", []);
    expect(page.url()).toBe(url);
    await row(tree, "button").focus();
    await page.keyboard.press("Enter");
    await expectLog(page, "tree-native-activations", ["link", "button"]);
    await expectLog(page, "tree-native-selection-requests", []);
    await row(tree, "link").click();
    expect(page.url()).toBe(url);
    await expectLog(page, "tree-native-activations", [
      "link",
      "button",
      "link",
    ]);
    await expectLog(page, "tree-native-selection-requests", []);
  });

  test("tree-actions: ExpandTrigger native Enter, Space and click toggle only its own branch", async ({
    page,
  }) => {
    const tree = workspace(page),
      trigger = tree.getByRole("button", {
        name: "Expand Archive",
        exact: true,
      });
    await expect(trigger).toHaveAttribute("tabindex", "-1");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(row(tree, "archive")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(row(tree, "archive")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await trigger.click();
    await expect(row(tree, "archive")).toHaveAttribute("aria-expanded", "true");
    await expectLog(page, "tree-expansion-requests", [
      ["projects", "docs", "locked", "archive"],
      ["projects", "docs", "locked"],
      ["projects", "docs", "locked", "archive"],
    ]);
    await expectLog(page, "tree-activations", []);
    await expectLog(page, "tree-selection-requests", []);
  });

  test("tree-actions: native key and disclosure cancellation suppress primitive and browser defaults", async ({
    page,
  }) => {
    const native = page.getByRole("tree", {
      name: "Native targets",
      exact: true,
    });
    await page.getByLabel("Cancel native tree keys", { exact: true }).check();
    await row(native, "link").focus();
    const url = page.url(),
      scroll = await page.evaluate(() => scrollY);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(page.url()).toBe(url);
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    await expectLog(page, "tree-native-activations", []);
    await expectLog(page, "tree-native-selection-requests", []);
    await page.getByLabel("Cancel tree disclosure", { exact: true }).check();
    const trigger = workspace(page).getByRole("button", {
      name: "Expand Archive",
      exact: true,
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await trigger.click();
    await expect(row(workspace(page), "archive")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expectLog(page, "tree-expansion-requests", []);
    await expectLog(page, "tree-activations", []);
  });

  test("tree-repair: DOM-only reorder preserves node identity and updates keyboard order", async ({
    page,
  }) => {
    const tree = workspace(page),
      guide = row(tree, "guide");
    const identity = await guide.elementHandle();
    await guide.focus();
    await guide.evaluate((node) => {
      const api = node.parentElement!.querySelector('[data-tree-key="api"]')!;
      node.parentElement!.insertBefore(api, node);
    });
    await expect(guide).toBeFocused();
    expect(
      await guide.evaluate((node, original) => node === original, identity),
    ).toBe(true);
    await page.keyboard.press("ArrowUp");
    await expect(row(tree, "api")).toBeFocused();
    await expect(guide).toHaveAttribute("aria-selected", "true");
    await expectLog(page, "tree-selection-requests", []);
  });

  test("tree-repair: refused collapse preserves focus; accepted force-mounted collapse repairs to branch", async ({
    page,
  }) => {
    const tree = workspace(page);
    await page.getByLabel("Accept tree expansion", { exact: true }).uncheck();
    await row(tree, "guide").focus();
    await update(page, "Request Docs collapse");
    await expect(row(tree, "guide")).toBeFocused();
    await expect(row(tree, "docs")).toHaveAttribute("aria-expanded", "true");
    await expectLog(page, "tree-expansion-requests", [["projects", "locked"]]);
    await page.getByLabel("Accept tree expansion", { exact: true }).check();
    await row(tree, "guide").focus();
    await update(page, "Request Docs collapse");
    await expect(row(tree, "docs")).toBeFocused();
    await expect(row(tree, "guide")).toHaveCount(1);
    await expect(row(tree, "guide")).not.toHaveAttribute("tabindex", "0");
    await page.keyboard.press("ArrowDown");
    await expect(row(tree, "notes")).toBeFocused();
    await update(page, "Expand Docs externally");
    await expect(row(tree, "guide")).toHaveAttribute("aria-selected", "true");
    await expect(row(tree, "notes")).toBeFocused();
    await expectLog(page, "tree-selection-requests", []);
  });

  test("tree-repair: exiting descendants leave navigation before their animation unmounts them", async ({
    page,
  }) => {
    const tree = workspace(page);
    await control(page, "Use exiting Docs group").click();
    await row(tree, "guide").focus();
    await update(page, "Request Docs collapse");
    await expect(row(tree, "docs")).toBeFocused();
    await expect(row(tree, "guide")).toHaveCount(1);
    await expect(row(tree, "guide")).not.toHaveAttribute("tabindex", "0");
    await page.keyboard.press("ArrowDown");
    await expect(row(tree, "notes")).toBeFocused();
    await row(tree, "docs")
      .locator('[role="group"]')
      .first()
      .evaluate((node) => {
        for (const animation of node.getAnimations()) animation.finish();
      });
    await expect(row(tree, "guide")).toHaveCount(0);
    await expect(row(tree, "notes")).toBeFocused();
  });

  test("tree-repair: collapse of a disabled parent focuses the next enabled node outside its subtree", async ({
    page,
  }) => {
    const tree = workspace(page);
    await row(tree, "public").focus();
    await update(page, "Collapse Locked externally");
    await expect(row(tree, "archive")).toBeFocused();
    await expectLog(page, "tree-selection-requests", []);
  });

  test("tree-repair: collapse skips a disabled branch for its nearest enabled ancestor", async ({
    page,
  }) => {
    const tree = workspace(page);
    await update(page, "Disable Docs");
    await row(tree, "guide").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(row(tree, "projects")).toBeFocused();
    await row(tree, "guide").focus();
    await update(page, "Collapse Docs externally");
    await expect(row(tree, "projects")).toBeFocused();
    await expectLog(page, "tree-selection-requests", []);
  });

  test("tree-repair: a disabled ancestor chain is skipped for the next node outside a collapsed subtree", async ({
    page,
  }) => {
    const tree = workspace(page);
    await update(page, "Disable Docs");
    await update(page, "Disable Projects");
    await row(tree, "guide").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(row(tree, "guide")).toBeFocused();
    await update(page, "Collapse Docs externally");
    await expect(row(tree, "notes")).toBeFocused();
    await expectLog(page, "tree-selection-requests", []);
  });

  test("tree-repair: removal skips disabled ancestors and uses the surviving next item", async ({
    page,
  }) => {
    const tree = workspace(page);
    await update(page, "Disable Docs");
    await update(page, "Disable Projects");
    await row(tree, "guide").focus();
    await update(page, "Remove Guide");
    await expect(row(tree, "api")).toBeFocused();
    await expect(page.locator("#tree-value")).toHaveText("guide");
    await expectLog(page, "tree-selection-requests", []);
  });

  test("tree-repair: removing the last root item falls back to the previous item, not the selected item", async ({
    page,
  }) => {
    const tree = workspace(page);
    await row(tree, "zulu").focus();
    await update(page, "Remove Zulu");
    await expect(row(tree, "alpine")).toBeFocused();
    await expect(row(tree, "guide")).toHaveAttribute("aria-selected", "true");
    await expectLog(page, "tree-selection-requests", []);
  });

  for (const change of ["Remove Guide", "Disable Guide"]) {
    test(`tree-repair: ${change} uses its surviving ancestor without changing retained selection`, async ({
      page,
    }) => {
      const tree = workspace(page);
      await row(tree, "guide").focus();
      await update(page, change);
      await expect(row(tree, "docs")).toBeFocused();
      await expect(page.locator("#tree-value")).toHaveText("guide");
      await expectLog(page, "tree-selection-requests", []);
      if (change === "Remove Guide") {
        await expect(row(tree, "guide")).toHaveCount(0);
        await expect(tree.locator('[aria-selected="true"]')).toHaveCount(0);
        await update(page, "Restore Guide");
        await expect(row(tree, "guide")).toHaveAttribute(
          "aria-selected",
          "true",
        );
      } else
        await expect(row(tree, "guide")).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      await expect(row(tree, "docs")).toBeFocused();
    });
  }

  test("tree-repair: explicit blur keeps body focused when an unfocused control removes the prior item", async ({
    page,
  }) => {
    const tree = workspace(page),
      guide = row(tree, "guide");
    await guide.focus();
    await guide.evaluate((node: HTMLElement) => node.blur());
    await expect(page.locator("body")).toBeFocused();
    await update(page, "Remove Guide");
    await expect(guide).toHaveCount(0);
    await expect(row(tree, "docs")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("body")).toBeFocused();
    await expect(page.locator("#tree-value")).toHaveText("guide");
    await expectLog(page, "tree-selection-requests", []);
    await expectLog(page, "tree-expansion-requests", []);
    await expectLog(page, "tree-activations", []);
  });

  test("tree-repair: top-level removal uses the old position and external changes never steal focus", async ({
    page,
  }) => {
    const tree = workspace(page);
    await row(tree, "alpha").focus();
    await update(page, "Remove Alpha");
    await expect(row(tree, "alpine")).toBeFocused();
    await control(page, "After workspace tree").focus();
    await update(page, "Collapse Projects externally");
    await update(page, "Disable Alpine");
    await expect(control(page, "After workspace tree")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(row(tree, "zulu")).toBeFocused();
    await expect(page.locator("#tree-value")).toHaveText("guide");
    await expect(row(tree, "projects")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("tree-repair: retained lazy selection and expansion return without automatically opening ancestors", async ({
    page,
  }) => {
    const tree = workspace(page);
    await control(page, "Remove Projects").click();
    await expect(row(tree, "projects")).toHaveCount(0);
    await expect(page.locator("#tree-value")).toHaveText("guide");
    await control(page, "Restore Projects").click();
    await expect(row(tree, "projects")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(row(tree, "docs")).toHaveAttribute("aria-expanded", "true");
    await expect(row(tree, "guide")).toHaveAttribute("aria-selected", "true");
    await control(page, "Collapse Projects externally").click();
    await control(page, "Remove Projects").click();
    await control(page, "Restore Projects").click();
    await expect(row(tree, "projects")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.locator("#tree-value")).toHaveText("guide");
    await expectLog(page, "tree-selection-requests", []);
  });

  for (const change of ["Empty workspace tree", "Disable all tree items"]) {
    test(`tree-repair: ${change} leaves Root as the sole tab stop and Tab exits normally`, async ({
      page,
    }) => {
      const tree = workspace(page);
      await row(tree, "guide").focus();
      await update(page, change);
      await expect(tree).toBeFocused();
      await expect(tree).toHaveAttribute("tabindex", "0");
      await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(
        0,
      );
      await page.keyboard.press("Tab");
      await expect(control(page, "After workspace tree")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(tree).toBeFocused();
    });
  }

  for (const [unavailable, restore] of [
    ["Empty workspace tree", "Restore workspace tree"],
    ["Disable all tree items", "Enable all tree items"],
  ]) {
    test(`tree-repair: ${restore} hands a focused fallback Root to the preferred item`, async ({
      page,
    }) => {
      const tree = workspace(page);
      await control(page, unavailable!).click();
      await tree.focus();
      await expect(tree).toBeFocused();
      await update(page, restore!);
      await expect(row(tree, "guide")).toBeFocused();
      await expect(tree).toHaveAttribute("tabindex", "-1");
      await page.keyboard.press("ArrowDown");
      await expect(row(tree, "api")).toBeFocused();
      await page.keyboard.press("n");
      await expect(row(tree, "notes")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(control(page, "After workspace tree")).toBeFocused();
      await expectLog(page, "tree-selection-requests", []);
      await expectLog(page, "tree-expansion-requests", []);
      await expectLog(page, "tree-activations", []);
    });

    test(`tree-repair: ${restore} does not move focus back from outside the Root`, async ({
      page,
    }) => {
      const tree = workspace(page);
      await control(page, unavailable!).click();
      await tree.focus();
      await expect(tree).toBeFocused();
      await control(page, "After workspace tree").focus();
      await update(page, restore!);
      await expect(row(tree, "guide")).toHaveAttribute("tabindex", "0");
      await expect(control(page, "After workspace tree")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(row(tree, "guide")).toBeFocused();
    });
  }

  test("tree-repair: disposal and remount clear stale typeahead and duplicate listeners", async ({
    page,
  }) => {
    const tree = workspace(page);
    await row(tree, "archive").focus();
    await page.keyboard.press("a");
    await control(page, "Unmount workspace tree").click();
    await expect(tree).toHaveCount(0);
    await control(page, "Mount workspace tree").click();
    await expect(tree).toBeVisible();
    await row(tree, "zulu").focus();
    await page.keyboard.press("g");
    await expect(row(tree, "guide")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expectLog(page, "tree-activations", ["api"]);
    await expectLog(page, "tree-selection-requests", ["api"]);
    const ids = await tree
      .locator("[id]")
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      await tree.getByRole("treeitem").evaluateAll((nodes) =>
        nodes.every((node) => {
          const ids = node.getAttribute("aria-labelledby")?.split(/\s+/) ?? [];
          return (
            ids.length > 0 &&
            ids.every((id) => document.getElementById(id)?.isConnected)
          );
        }),
      ),
    ).toBe(true);
  });
});

test("tree-ssr: server hierarchy, labels, selected state and IDs survive hydration on the original nodes", async ({
  page,
}, info) => {
  test.skip(
    info.project.name.endsWith("csr"),
    "Server-before-hydration assertion; interaction cases also run on CSR.",
  );
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      problems.push(message.text());
  });
  let release!: () => void;
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
  try {
    await page.goto("/", { waitUntil: "commit" });
    const tree = workspace(page);
    await expect(tree).toBeVisible({ timeout: 2000 });
    await expectHierarchy(tree);
    const server = await tree.evaluateHandle((node) => ({
      nodes: [
        node,
        ...node.querySelectorAll('[role="treeitem"], [role="group"], [id]'),
      ],
      ids: [...node.querySelectorAll("[id]")].map((element) => element.id),
    }));
    expect(
      await server.evaluate((snapshot) => snapshot.ids.length),
    ).toBeGreaterThan(0);
    release();
    await page.waitForLoadState("load");
    await expect(page.locator("#refs")).toHaveText("same host");
    await expectHierarchy(tree);
    expect(
      await tree.evaluate((node, snapshot) => {
        const current = [
          node,
          ...node.querySelectorAll('[role="treeitem"], [role="group"], [id]'),
        ];
        return (
          current.length === snapshot.nodes.length &&
          current.every(
            (element, index) =>
              element === snapshot.nodes[index] && element.isConnected,
          )
        );
      }, server),
    ).toBe(true);
    expect(
      await tree
        .locator("[id]")
        .evaluateAll((nodes) => nodes.map((node) => node.id)),
    ).toEqual(await server.evaluate((snapshot) => snapshot.ids));
    await row(tree, "guide").focus();
    await page.keyboard.press("ArrowDown");
    await expect(row(tree, "api")).toBeFocused();
    expect(problems).toEqual([]);
  } finally {
    release();
  }
});
