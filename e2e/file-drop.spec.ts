import { expect, test, type Page } from "@playwright/test";

const zone = (page: Page) => page.locator("#file-drop-zone");
const input = (page: Page) =>
  page.locator('input[type="file"][name="file-drop-files"]');
const form = (page: Page) => page.locator("#file-drop-form");
const selection = (page: Page) => page.locator("#file-drop-selection");
const rejections = (page: Page) => page.locator("#file-drop-rejections");
const multipleZone = (page: Page) => page.locator("#file-drop-multiple-zone");
const multipleInput = (page: Page) =>
  page.locator('input[type="file"][name="multiple-file-drop-files"]');
const multipleForm = (page: Page) => page.locator("#file-drop-multiple-form");
const multipleRejections = (page: Page) =>
  page.locator("#file-drop-multiple-rejections");

async function submittedMultipleFiles(page: Page) {
  return multipleForm(page).evaluate((node) =>
    [
      ...new FormData(node as HTMLFormElement).getAll(
        "multiple-file-drop-files",
      ),
    ].map((value) =>
      value instanceof File
        ? { name: value.name, size: value.size, type: value.type }
        : value,
    ),
  );
}
async function submittedFiles(page: Page) {
  return form(page).evaluate((node) =>
    [...new FormData(node as HTMLFormElement).getAll("file-drop-files")].map(
      (value) =>
        value instanceof File
          ? { name: value.name, size: value.size, type: value.type }
          : value,
    ),
  );
}

async function f2Files(
  page: Page,
  formSelector = "#file-drop-f2-form",
  name = "docs",
) {
  return page.locator(formSelector).evaluate(async (node, fieldName) => {
    const form = node as HTMLFormElement;
    return Promise.all(
      new FormData(form).getAll(fieldName).map(async (value) =>
        value instanceof File
          ? {
              name: value.name,
              size: value.size,
              type: value.type,
              lastModified: value.lastModified,
              contents: await value.text(),
            }
          : value,
      ),
    );
  }, name);
}

async function selectFilesByProtocol(
  page: Page,
  selector: string,
  files: { name: string; type: string; contents: string }[],
) {
  // Assign a native FileList and dispatch the selection event protocol; this is not an OS chooser smoke test.
  await page.locator(selector).evaluate((node, selected) => {
    const input = node as HTMLInputElement;
    const transfer = new DataTransfer();
    for (const file of selected)
      transfer.items.add(
        new File([file.contents], file.name, {
          type: file.type,
          lastModified: 0,
        }),
      );
    input.files = transfer.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, files);
}

async function captureF2RawSelection(page: Page) {
  await page
    .locator('#file-drop-f2-zone input[type="file"]')
    .evaluate((node) => {
      const input = node as HTMLInputElement;
      const target = window as Window & {
        __fileDropF2Raw?: {
          type: string;
          bubbles: boolean;
          file: File | null;
        }[];
      };
      target.__fileDropF2Raw = [];
      for (const type of ["input", "change"])
        input.addEventListener(type, (event) => {
          target.__fileDropF2Raw!.push({
            type,
            bubbles: event.bubbles,
            file: input.files?.[0] ?? null,
          });
        });
    });
}

async function f2RawSelection(page: Page) {
  return page.evaluate(async () => {
    const target = window as Window & {
      __fileDropF2Raw?: { type: string; bubbles: boolean; file: File | null }[];
    };
    return Promise.all(
      (target.__fileDropF2Raw ?? []).map(async ({ type, bubbles, file }) => ({
        type,
        bubbles,
        name: file?.name ?? "",
        size: file?.size ?? 0,
        lastModified: file?.lastModified ?? 0,
        contents: await file?.text(),
      })),
    );
  });
}
async function provisionalFileDiffersFromCurrentProjection(page: Page) {
  return page.evaluate(() => {
    const target = window as Window & {
      __fileDropF2Raw?: { type: string; file: File | null }[];
    };
    const accepted = document.querySelector<HTMLInputElement>(
      '#file-drop-f2-zone input[type="file"]',
    )?.files?.[0];
    return (
      !!target.__fileDropF2Raw?.[0]?.file &&
      target.__fileDropF2Raw[0].file !== accepted
    );
  });
}

async function dropFiles(
  page: Page,
  files: { name: string; type: string; contents: string }[],
  text?: string,
  target = zone(page),
) {
  await target.dispatchEvent("drop", {
    dataTransfer: await page.evaluateHandle(
      ({ files, text }) => {
        const transfer = new DataTransfer();
        for (const file of files)
          transfer.items.add(
            new File([file.contents], file.name, { type: file.type }),
          );
        if (text !== undefined) transfer.setData("text/plain", text);
        return transfer;
      },
      { files, text },
    ),
  });
}

const diagnostics = new WeakMap<Page, string[]>();
async function expectConfigurationFallback(page: Page, button: string) {
  const fileDrop = page.getByRole("region", {
    name: "Native FileDrop F2",
    exact: true,
  });
  await fileDrop.getByRole("button", { name: button, exact: true }).click();
  await expect(
    fileDrop.getByRole("alert", {
      name: "FileDrop composition rejected",
      exact: true,
    }),
  ).toBeVisible();
}

test.describe("native FileDrop F1", () => {
  test.beforeEach(async ({ page }, info) => {
    const captured: string[] = [];
    diagnostics.set(page, captured);
    page.on("pageerror", (error) => captured.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning")
        captured.push(message.text());
    });
    await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  });

  test.afterEach(async ({ page }) => {
    expect(diagnostics.get(page)).toEqual([]);
  });

  test("file drop native browse and nested drag replace accepted selection", async ({
    page,
  }) => {
    const chooser = input(page);
    // Missing named control is the deliberate initial RED against the existing gallery.
    await expect(chooser).toBeAttached({ timeout: 2000 });
    await expect(zone(page).locator('input[type="file"]')).toHaveCount(1);
    await expect(zone(page)).toHaveAttribute("data-dragging", "false");
    const fileChooserEvent = page.waitForEvent("filechooser");
    await zone(page)
      .getByRole("button", { name: "Browse files", exact: true })
      .click();
    await (
      await fileChooserEvent
    ).setFiles({
      name: "first.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("first"),
    });
    await expect(selection(page)).toHaveText("first.txt");
    expect(await submittedFiles(page)).toEqual([
      { name: "first.txt", size: 5, type: "text/plain" },
    ]);
    await chooser.setInputFiles({
      name: "empty.txt",
      mimeType: "text/plain",
      buffer: Buffer.alloc(0),
    });
    await expect(selection(page)).toHaveText("empty.txt");
    expect(await submittedFiles(page)).toEqual([
      { name: "empty.txt", size: 0, type: "text/plain" },
    ]);
    await dropFiles(page, [
      { name: "dropped.txt", type: "text/plain", contents: "drop" },
    ]);
    await expect(selection(page)).toHaveText("dropped.txt");
    expect(await submittedFiles(page)).toEqual([
      { name: "dropped.txt", size: 4, type: "text/plain" },
    ]);
    await dropFiles(
      page,
      [{ name: "direct.txt", type: "text/plain", contents: "input" }],
      undefined,
      chooser,
    );
    await expect(selection(page)).toHaveText("direct.txt");
    await expect(page.locator("#file-drop-change-count")).toHaveText("4");
    expect(await submittedFiles(page)).toEqual([
      { name: "direct.txt", size: 5, type: "text/plain" },
    ]);
    const textTransfer = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.setData("text/plain", "not a file");
      return data;
    });
    await zone(page).dispatchEvent("dragenter", { dataTransfer: textTransfer });
    await expect(zone(page)).toHaveAttribute("data-dragging", "false");
    await zone(page).dispatchEvent("dragleave", { dataTransfer: textTransfer });

    const transfer = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.items.add(new File(["drag"], "drag.txt", { type: "text/plain" }));
      return data;
    });
    const zoneHandle = await zone(page).elementHandle();
    const nested = zone(page).locator("[data-file-drop-nested]");
    await zone(page).dispatchEvent("dragenter", { dataTransfer: transfer });
    await nested.dispatchEvent("dragenter", {
      dataTransfer: transfer,
      relatedTarget: zoneHandle,
    });
    await expect(zone(page)).toHaveAttribute("data-dragging", "true");
    await nested.dispatchEvent("dragleave", {
      dataTransfer: transfer,
      relatedTarget: zoneHandle,
    });
    await expect(zone(page)).toHaveAttribute("data-dragging", "true");
    await zone(page).dispatchEvent("dragleave", { dataTransfer: transfer });
    await expect(zone(page)).toHaveAttribute("data-dragging", "false");
  });

  test("file drop native cancel empty change empty drop", async ({ page }) => {
    const chooser = input(page);
    await expect(chooser).toBeAttached({ timeout: 2000 });
    await chooser.setInputFiles({
      name: "keep.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("keep"),
    });
    const initialRejections = await rejections(page).innerText();
    await expect(page.locator("#file-drop-change-count")).toHaveText("1");
    await chooser.dispatchEvent("cancel");
    await expect(selection(page)).toHaveText("keep.txt");
    expect(await submittedFiles(page)).toEqual([
      { name: "keep.txt", size: 4, type: "text/plain" },
    ]);
    await expect(rejections(page)).toHaveText(initialRejections);
    await expect(page.locator("#file-drop-change-count")).toHaveText("1");
    // Synthetic cancel-event coverage only; native OS chooser cancellation is still a platform acceptance check.
    await chooser.setInputFiles([]);
    await expect(selection(page)).toHaveText("");
    expect(await submittedFiles(page)).toEqual([
      { name: "", size: 0, type: "application/octet-stream" },
    ]);
    await expect(page.locator("#file-drop-change-count")).toHaveText("2");
    await expect(rejections(page)).toHaveText(initialRejections);
    await dropFiles(page, []);
    await expect(rejections(page)).toContainText("no-files");
    expect(await submittedFiles(page)).toEqual([
      { name: "", size: 0, type: "application/octet-stream" },
    ]);
    await expect(page.locator("#file-drop-change-count")).toHaveText("2");
  });

  test("file drop candidate filtering rejects whole invalid batches through picker and drop", async ({
    page,
  }) => {
    const chooser = multipleInput(page);
    await expect(chooser).toBeAttached({ timeout: 2000 });
    await expect(multipleZone(page).locator('input[type="file"]')).toHaveCount(
      1,
    );

    await chooser.setInputFiles({
      name: "accepted.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("ok"),
    });
    await chooser.setInputFiles([
      { name: "valid.txt", mimeType: "text/plain", buffer: Buffer.from("yes") },
      {
        name: "bad.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("no"),
      },
    ]);
    await expect(multipleRejections(page)).toContainText("accept-mismatch");
    expect(await submittedMultipleFiles(page)).toEqual([
      { name: "accepted.txt", size: 2, type: "text/plain" },
    ]);
    await dropFiles(
      page,
      [
        { name: "valid.txt", type: "text/plain", contents: "yes" },
        { name: "bad.pdf", type: "application/pdf", contents: "no" },
      ],
      undefined,
      multipleZone(page),
    );
    await expect(multipleRejections(page)).toContainText("accept-mismatch");
    expect(await submittedMultipleFiles(page)).toEqual([
      { name: "accepted.txt", size: 2, type: "text/plain" },
    ]);
  });

  test("file drop multiple=false rejects two files and mixed drops process only files", async ({
    page,
  }) => {
    const chooser = input(page);
    await expect(chooser).toBeAttached({ timeout: 2000 });
    await chooser.setInputFiles({
      name: "accepted.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("ok"),
    });
    await dropFiles(page, [
      { name: "one.txt", type: "text/plain", contents: "one" },
      { name: "two.txt", type: "text/plain", contents: "two" },
    ]);
    await expect(rejections(page)).toContainText("too-many-files");
    expect(await submittedFiles(page)).toEqual([
      { name: "accepted.txt", size: 2, type: "text/plain" },
    ]);
    await dropFiles(
      page,
      [{ name: "valid.txt", type: "text/plain", contents: "file" }],
      "ordinary text",
    );
    await expect(selection(page)).toHaveText("valid.txt");
    expect(await submittedFiles(page)).toEqual([
      { name: "valid.txt", size: 4, type: "text/plain" },
    ]);
    await dropFiles(page, [], "https://example.invalid/");
    await expect(rejections(page)).toContainText("no-files");
    await expect(page).toHaveURL(/\/(csr)?$/);
    expect(await submittedFiles(page)).toEqual([
      { name: "valid.txt", size: 4, type: "text/plain" },
    ]);
  });
  test("file drop file drag clears zone after drop without target dragend", async ({
    page,
  }) => {
    const transfer = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.items.add(
        new File(["dragged"], "dragged.txt", {
          type: "text/plain",
          lastModified: 0,
        }),
      );
      return data;
    });
    await zone(page).dispatchEvent("dragenter", { dataTransfer: transfer });
    await expect(zone(page)).toHaveAttribute("data-dragging", "true");
    await zone(page).dispatchEvent("dragover", { dataTransfer: transfer });
    // dragend belongs to the actual source; do not synthesize it at the drop target.
    await zone(page).dispatchEvent("drop", { dataTransfer: transfer });
    await expect(zone(page)).toHaveAttribute("data-dragging", "false");
    await expect(selection(page)).toHaveText("dragged.txt");
    const submitted = await form(page).evaluate(async (node) => {
      const file = new FormData(node as HTMLFormElement).get("file-drop-files");
      return file instanceof File
        ? {
            name: file.name,
            size: file.size,
            type: file.type,
            contents: await file.text(),
          }
        : null;
    });
    expect(submitted).toEqual({
      name: "dragged.txt",
      size: 7,
      type: "text/plain",
      contents: "dragged",
    });
    const changeCountBeforePreventedDrop = await page
      .locator("#file-drop-change-count")
      .textContent();
    const preventedTransfer = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.items.add(
        new File(["ignored"], "ignored.txt", { type: "text/plain" }),
      );
      return data;
    });
    await zone(page).dispatchEvent("dragenter", {
      dataTransfer: preventedTransfer,
    });
    await expect(zone(page)).toHaveAttribute("data-dragging", "true");
    await zone(page).dispatchEvent("dragover", {
      dataTransfer: preventedTransfer,
    });
    await page
      .getByRole("button", { name: "Prevent next drop processing" })
      .click();
    await zone(page).dispatchEvent("drop", { dataTransfer: preventedTransfer });
    await expect(zone(page)).toHaveAttribute("data-dragging", "false");
    await expect(selection(page)).toHaveText("dragged.txt");
    expect(await submittedFiles(page)).toEqual([
      { name: "dragged.txt", size: 7, type: "text/plain" },
    ]);
    await expect(page.locator("#file-drop-change-count")).toHaveText(
      changeCountBeforePreventedDrop ?? "",
    );
  });
});
test.describe("native FileDrop F2", () => {
  test.beforeEach(async ({ page }, info) => {
    const captured: string[] = [];
    diagnostics.set(page, captured);
    page.on("pageerror", (error) => captured.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning")
        captured.push(message.text());
    });
    await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
  });

  test.afterEach(async ({ page }) => {
    expect(diagnostics.get(page)).toEqual([]);
  });

  test("file drop controlled settlement and event policy", async ({ page }) => {
    const fileInput = '#file-drop-f2-zone input[type="file"]';
    await page
      .getByRole("button", { name: "Keep accepted same-name file" })
      .click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await captureF2RawSelection(page);
    await selectFilesByProtocol(page, fileInput, [
      { name: "same.txt", type: "text/plain", contents: "evil" },
    ]);
    await expect.poll(() => f2RawSelection(page)).toHaveLength(2);
    expect(await f2RawSelection(page)).toEqual([
      {
        type: "input",
        bubbles: true,
        name: "same.txt",
        size: 4,
        lastModified: 0,
        contents: "evil",
      },
      {
        type: "change",
        bubbles: true,
        name: "same.txt",
        size: 4,
        lastModified: 0,
        contents: "evil",
      },
    ]);
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await expect(page.getByLabel("F2 proposal count")).toHaveText("1");
    await expect(page.getByLabel("F2 rejection count")).toHaveText("0");
    await expect(
      page.getByRole("button", { name: "Resolve provisional matcher" }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Resolve provisional matcher" })
      .click();
    await expect(page.getByText("Current accepted files invalid")).toBeHidden();
    await expect(page.getByLabel("F2 public custom error")).toHaveText("false");
    await selectFilesByProtocol(page, fileInput, [
      { name: "later.txt", type: "text/plain", contents: "later" },
    ]);
    await expect(page.getByLabel("F2 proposal count")).toHaveText("2");
    await page.getByRole("button", { name: "Adopt proposed files" }).click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "later.txt",
          size: 5,
          type: "text/plain",
          lastModified: 0,
          contents: "later",
        },
      ]);
    let events = await f2RawSelection(page);
    expect(
      events.filter((event) => event.bubbles).map((event) => event.type),
    ).toEqual(["input", "change", "input", "change"]);
    expect(events.at(-1)).toMatchObject({
      type: "change",
      bubbles: false,
      contents: "later",
    });
    await page
      .getByRole("button", { name: "Accept next proposal immediately" })
      .click();
    await dropFiles(
      page,
      [{ name: "drop.txt", type: "text/plain", contents: "drop" }],
      undefined,
      page.locator("#file-drop-f2-zone"),
    );
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "drop.txt",
          size: 4,
          type: "text/plain",
          lastModified: expect.any(Number),
          contents: "drop",
        },
      ]);
    events = await f2RawSelection(page);
    expect(
      events
        .slice(-2)
        .map((event) => [event.type, event.bubbles, event.contents]),
    ).toEqual([
      ["input", true, "drop"],
      ["change", true, "drop"],
    ]);
  });
  test("file drop rejected-drop adoption of the exact candidate is programmatic", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Adopt rejected F2 candidate" })
      .click();
    await captureF2RawSelection(page);
    await dropFiles(
      page,
      [{ name: "rejected.pdf", type: "application/pdf", contents: "rejected" }],
      undefined,
      page.locator("#file-drop-f2-zone"),
    );
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "rejected.pdf",
          size: 8,
          type: "application/pdf",
          lastModified: expect.any(Number),
          contents: "rejected",
        },
      ]);
    await expect(page.getByLabel("F2 rejection count")).toHaveText("1");
    expect(await f2RawSelection(page)).toEqual([
      {
        type: "change",
        bubbles: false,
        name: "rejected.pdf",
        size: 8,
        lastModified: expect.any(Number),
        contents: "rejected",
      },
    ]);
  });

  test("file drop same-turn reentrant settlement uses newest accepted files", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Keep accepted same-name file" })
      .click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await captureF2RawSelection(page);
    const inputCount = Number(
      await page.getByLabel("F2 raw input count").textContent(),
    );
    const changeCount = Number(
      await page.getByLabel("F2 raw change count").textContent(),
    );
    await page
      .getByRole("button", { name: "Adopt candidate then replace it" })
      .click();
    await dropFiles(
      page,
      [{ name: "candidate.txt", type: "text/plain", contents: "candidate" }],
      undefined,
      page.locator("#file-drop-f2-zone"),
    );
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "latest.txt",
          size: 6,
          type: "text/plain",
          lastModified: 0,
          contents: "latest",
        },
      ]);
    expect(await f2RawSelection(page)).toEqual([
      {
        type: "change",
        bubbles: false,
        name: "latest.txt",
        size: 6,
        lastModified: 0,
        contents: "latest",
      },
    ]);
    await expect(page.getByLabel("F2 raw input count")).toHaveText(
      String(inputCount),
    );
    await expect(page.getByLabel("F2 raw change count")).toHaveText(
      String(changeCount + 2),
    );
    await expect(page.getByLabel("F2 proposal count")).toHaveText("1");
    await expect(page.getByLabel("F2 rejection count")).toHaveText("0");
  });

  test("file drop same fakepath async validation revision", async ({
    page,
  }) => {
    const fileInput = '#file-drop-f2-zone input[type="file"]';
    await page
      .getByRole("button", { name: "Keep accepted same-name file" })
      .click();
    await captureF2RawSelection(page);
    await selectFilesByProtocol(page, fileInput, [
      { name: "same.txt", type: "text/plain", contents: "evil" },
    ]);
    await expect.poll(() => f2RawSelection(page)).toHaveLength(2);
    await page
      .getByRole("button", { name: "Replace accepted same-name file" })
      .click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "good",
        },
      ]);
    const raw = await f2RawSelection(page);
    const accepted = await f2Files(page);
    expect(raw[0]).toMatchObject({
      name: "same.txt",
      size: 4,
      lastModified: 0,
      contents: "evil",
    });
    expect(accepted[0]).toMatchObject({
      name: "same.txt",
      size: 4,
      lastModified: 0,
      contents: "good",
    });
    expect(await provisionalFileDiffersFromCurrentProjection(page)).toBe(true);
    await expect(
      page.getByRole("button", { name: "Resolve provisional matcher" }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Resolve provisional matcher" })
      .click();
    await expect(page.getByText("Current accepted files invalid")).toBeHidden();
    await expect(page.getByLabel("F2 public custom error")).toHaveText("false");
  });
  test("file drop revalidates the latest accepted file after a simultaneous policy change", async ({
    page,
  }) => {
    const fileInput = '#file-drop-f2-zone input[type="file"]';
    await page
      .getByRole("button", { name: "Prepare exact F2 policy transition" })
      .click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "kept.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await page
      .getByRole("button", { name: "Hold public Form validations" })
      .click();
    await page
      .getByRole("button", {
        name: "Adopt next proposal and narrow accept to .json",
      })
      .click();
    await selectFilesByProtocol(page, fileInput, [
      { name: "new.json", type: "application/json", contents: "new" },
    ]);
    await expect(page.locator(fileInput)).toHaveAttribute("accept", ".json");
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "new.json",
          size: 3,
          type: "application/json",
          lastModified: 0,
          contents: "new",
        },
      ]);
    const resolveAll = page.getByRole("button", {
      name: "Resolve all held Form validations",
    });
    await expect(resolveAll).toBeEnabled();
    await resolveAll.click();
    await expect(
      page.getByText("Current accepted files invalid"),
    ).toBeVisible();
    await expect(page.getByLabel("F2 public custom error")).toHaveText("true");
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "new.json",
          size: 3,
          type: "application/json",
          lastModified: 0,
          contents: "new",
        },
      ]);
  });

  test("file drop revalidates unchanged accepted files after a rejected picker candidate", async ({
    page,
  }) => {
    const fileSelector = '#file-drop-f2-zone input[type="file"]';
    const fileInput = page.locator(fileSelector);
    await page
      .getByRole("button", { name: "Keep accepted same-name file" })
      .click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await page
      .getByRole("button", { name: "Hold public Form validations" })
      .click();
    await selectFilesByProtocol(page, fileSelector, [
      { name: "same.txt", type: "text/plain", contents: "evil" },
    ]);
    await page.getByRole("button", { name: "Adopt proposed files" }).click();
    const acceptedData = [
      {
        name: "same.txt",
        size: 4,
        type: "text/plain",
        lastModified: 0,
        contents: "evil",
      },
    ];
    await expect.poll(() => f2Files(page)).toEqual(acceptedData);
    const resolveAll = page.getByRole("button", {
      name: "Resolve all held Form validations",
    });
    await expect(resolveAll).toBeEnabled();
    await resolveAll.click();
    await expect(
      page.getByText("Current accepted files invalid"),
    ).toBeVisible();
    await expect(page.getByLabel("F2 public custom error")).toHaveText("true");
    expect(
      await fileInput.evaluate(
        (node) => (node as HTMLInputElement).validity.customError,
      ),
    ).toBe(true);
    const acceptedFile = await fileInput.evaluateHandle(
      (node) => (node as HTMLInputElement).files?.[0],
    );

    await selectFilesByProtocol(page, fileSelector, [
      { name: "rejected.pdf", type: "application/pdf", contents: "rejected" },
    ]);
    await expect.poll(() => f2Files(page)).toEqual(acceptedData);
    expect(
      await fileInput.evaluate(
        (node, accepted) => (node as HTMLInputElement).files?.[0] === accepted,
        acceptedFile,
      ),
    ).toBe(true);
    await expect(page.getByLabel("F2 public custom error")).toHaveText("false");
    expect(
      await fileInput.evaluate(
        (node) => (node as HTMLInputElement).validity.customError,
      ),
    ).toBe(false);

    await expect(resolveAll).toBeEnabled();
    await resolveAll.click();
    await expect(
      page.getByText("Current accepted files invalid"),
    ).toBeVisible();
    await expect(page.getByLabel("F2 public custom error")).toHaveText("true");
    expect(
      await fileInput.evaluate(
        (node) => (node as HTMLInputElement).validity.customError,
      ),
    ).toBe(true);
    await expect.poll(() => f2Files(page)).toEqual(acceptedData);
    expect(
      await fileInput.evaluate(
        (node, accepted) => (node as HTMLInputElement).files?.[0] === accepted,
        acceptedFile,
      ),
    ).toBe(true);
    await acceptedFile.dispose();
  });

  test("file drop rejected and controlled-refused drops preserve pending accepted validation", async ({
    page,
  }) => {
    const fileSelector = '#file-drop-f2-zone input[type="file"]';
    const acceptedData = [
      {
        name: "same.txt",
        size: 4,
        type: "text/plain",
        lastModified: 0,
        contents: "evil",
      },
    ];
    const drops = [
      {
        label: "rejected PDF",
        file: {
          name: "rejected.pdf",
          type: "application/pdf",
          contents: "rejected",
        },
        rejectionCount: "1",
      },
      {
        label: "controlled-refused TXT",
        file: { name: "refused.txt", type: "text/plain", contents: "refused" },
        rejectionCount: "0",
      },
    ];
    for (let index = 0; index < drops.length; index++) {
      if (index > 0) await page.reload();
      const fileInput = page.locator(fileSelector);
      await page
        .getByRole("button", { name: "Keep accepted same-name file" })
        .click();
      await expect
        .poll(() => f2Files(page))
        .toEqual([
          {
            name: "same.txt",
            size: 4,
            type: "text/plain",
            lastModified: 0,
            contents: "kept",
          },
        ]);
      await page
        .getByRole("button", { name: "Hold public Form validations" })
        .click();
      await selectFilesByProtocol(page, fileSelector, [
        { name: "same.txt", type: "text/plain", contents: "evil" },
      ]);
      await page.getByRole("button", { name: "Adopt proposed files" }).click();
      await expect.poll(() => f2Files(page)).toEqual(acceptedData);
      const resolveAll = page.getByRole("button", {
        name: "Resolve all held Form validations",
      });
      await expect(resolveAll).toBeEnabled();
      const acceptedFile = await fileInput.evaluateHandle(
        (node) => (node as HTMLInputElement).files?.[0],
      );
      await captureF2RawSelection(page);

      await dropFiles(
        page,
        [drops[index]!.file],
        undefined,
        page.locator("#file-drop-f2-zone"),
      );
      await expect.poll(() => f2Files(page)).toEqual(acceptedData);
      expect(
        await fileInput.evaluate(
          (node, accepted) =>
            (node as HTMLInputElement).files?.[0] === accepted,
          acceptedFile,
        ),
      ).toBe(true);
      expect(await f2RawSelection(page)).toEqual([]);
      await expect(page.getByLabel("F2 rejection count")).toHaveText(
        drops[index]!.rejectionCount,
      );
      await expect(resolveAll).toBeEnabled();
      await resolveAll.click();
      await expect(
        page.getByText("Current accepted files invalid"),
      ).toBeVisible();
      await expect(page.getByLabel("F2 public custom error")).toHaveText(
        "true",
      );
      expect(
        await fileInput.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      ).toBe(true);
      await expect.poll(() => f2Files(page)).toEqual(acceptedData);
      expect(
        await fileInput.evaluate(
          (node, accepted) =>
            (node as HTMLInputElement).files?.[0] === accepted,
          acceptedFile,
        ),
      ).toBe(true);
      await acceptedFile.dispose();
    }
  });

  test("file drop Form composition cancels an unmounted pending matcher", async ({
    page,
  }) => {
    const fileInput = page.locator('#file-drop-f2-zone input[type="file"]');
    await page
      .getByRole("button", { name: "Keep accepted same-name file" })
      .click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await expect(
      page.getByRole("button", { name: "Resolve provisional matcher" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Resolve all held Form validations" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Hold public Form validations" })
      .click();
    await page
      .getByRole("button", { name: "Replace accepted same-name file" })
      .click();
    const resolveHeld = page.getByRole("button", {
      name: "Resolve all held Form validations",
    });
    await expect(resolveHeld).toBeEnabled();
    const acceptedData = await f2Files(page);
    expect(acceptedData).toEqual([
      {
        name: "same.txt",
        size: 4,
        type: "text/plain",
        lastModified: 0,
        contents: "good",
      },
    ]);
    const acceptedFile = await fileInput.evaluateHandle(
      (node) => (node as HTMLInputElement).files?.[0],
    );

    await page.getByRole("button", { name: "Unmount F2 Form.Message" }).click();
    await resolveHeld.click();
    await expect(
      page.getByRole("button", { name: "Resolve provisional matcher" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Resolve all held Form validations" }),
    ).toBeDisabled();
    await expect(page.getByLabel("F2 public custom error")).toHaveText("false");
    expect(
      await fileInput.evaluate(
        (node) => (node as HTMLInputElement).validity.customError,
      ),
    ).toBe(false);
    expect(
      await fileInput.evaluate(
        (node, accepted) => (node as HTMLInputElement).files?.[0] === accepted,
        acceptedFile,
      ),
    ).toBe(true);
    await expect.poll(() => f2Files(page)).toEqual(acceptedData);
    await acceptedFile.dispose();
  });

  test("file drop disable while chooser open", async ({ page }) => {
    const fileInput = '#file-drop-f2-zone input[type="file"]';
    await page
      .getByRole("button", { name: "Keep accepted same-name file" })
      .click();
    await page.getByRole("button", { name: "Toggle F2 disabled" }).click();
    await expect(page.locator(fileInput)).toBeDisabled();
    await captureF2RawSelection(page);
    await selectFilesByProtocol(page, fileInput, [
      { name: "same.txt", type: "text/plain", contents: "evil" },
    ]);
    await expect.poll(() => f2Files(page)).toEqual([]);
    await expect
      .poll(async () =>
        page.locator(fileInput).evaluate(async (node) => {
          const file = (node as HTMLInputElement).files?.[0];
          return file ? { name: file.name, contents: await file.text() } : null;
        }),
      )
      .toEqual({ name: "same.txt", contents: "kept" });
    expect(await f2RawSelection(page)).toHaveLength(2);
    await expect(page.getByLabel("F2 proposal count")).toHaveText("0");
    await expect(page.getByLabel("F2 rejection count")).toHaveText("0");
    await page.getByRole("button", { name: "Toggle F2 disabled" }).click();
    await expect(page.locator(fileInput)).toBeEnabled();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await selectFilesByProtocol(page, fileInput, [
      { name: "same.txt", type: "text/plain", contents: "evil" },
    ]);
    await expect(page.getByLabel("F2 proposal count")).toHaveText("1");
    await expect(page.getByLabel("F2 rejection count")).toHaveText("0");
    // Direct FileList/event protocol only; no real OS chooser lifecycle is claimed here.
  });

  test("file drop native required empty sentinel", async ({ page }) => {
    const fileInput = page.locator('#file-drop-f2-zone input[type="file"]');
    await expect(fileInput).toHaveAttribute("required");
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "",
          size: 0,
          type: "application/octet-stream",
          lastModified: expect.any(Number),
          contents: "",
        },
      ]);
    expect(
      await fileInput.evaluate(
        (node) => (node as HTMLInputElement).validity.valueMissing,
      ),
    ).toBe(true);
    await page
      .locator("#file-drop-f2-form")
      .evaluate((node) => (node as HTMLFormElement).requestSubmit());
    await expect(fileInput).toBeFocused();
    await page
      .getByRole("button", { name: "Keep accepted same-name file" })
      .click();
    await selectFilesByProtocol(
      page,
      '#file-drop-f2-zone input[type="file"]',
      [],
    );
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await expect(page.getByLabel("F2 rejection count")).toHaveText("0");
    await expect(fileInput).toHaveAttribute("required");
    await page.getByRole("button", { name: "Adopt proposed files" }).click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "",
          size: 0,
          type: "application/octet-stream",
          lastModified: expect.any(Number),
          contents: "",
        },
      ]);
    expect(
      await fileInput.evaluate(
        (node) => (node as HTMLInputElement).validity.valueMissing,
      ),
    ).toBe(true);
  });

  test("file drop Form composition and constraint changes", async ({
    page,
  }) => {
    const fileInput = page.locator('#file-drop-f2-zone input[type="file"]');
    await expect(fileInput).toHaveAttribute("id", "file-drop-f2-input");
    await expect(fileInput).toHaveAttribute("name", "docs");
    await expect(fileInput).toHaveAttribute("form", "file-drop-f2-form");
    await expect(fileInput).toHaveAttribute("accept", ".txt");
    await expect(fileInput).toHaveAttribute("required");
    await expect(fileInput).not.toHaveAttribute("multiple");
    await expect(fileInput).toBeEnabled();
    const host = await fileInput.evaluate((node) => {
      const input = node as HTMLInputElement;
      return {
        type: input.type,
        readOnly: input.readOnly,
        value: input.value,
        describedBy: input.getAttribute("aria-describedby"),
      };
    });
    expect(host).toMatchObject({ type: "file", readOnly: false, value: "" });
    expect(host.describedBy?.split(/\s+/)).toEqual(
      expect.arrayContaining([
        "file-drop-f2-wrapper-description",
        "file-drop-f2-child-description",
      ]),
    );
    await page.getByRole("button", { name: "Focus captured F2 input" }).click();
    await expect(fileInput).toBeFocused();
    await selectFilesByProtocol(page, '#file-drop-f2-zone input[type="file"]', [
      { name: "same.txt", type: "text/plain", contents: "kept" },
    ]);
    await expect(page.getByLabel("F2 raw input count")).toHaveText("2");
    await page.getByRole("button", { name: "Adopt proposed files" }).click();
    await expect(page.getByLabel("F2 raw change count")).toHaveText("4");
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await page
      .getByRole("button", { name: "Toggle accepted extension" })
      .click();
    await expect(fileInput).toHaveAttribute("accept", ".exe");
    await expect(page.getByLabel("F2 public custom error")).toHaveText("true");
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await page
      .getByRole("button", { name: "Toggle accepted extension" })
      .click();
    await expect(page.getByLabel("F2 public custom error")).toHaveText("false");
    await page.getByRole("button", { name: "Set accepted two files" }).click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "one.txt",
          size: 3,
          type: "text/plain",
          lastModified: 0,
          contents: "one",
        },
        {
          name: "two.txt",
          size: 3,
          type: "text/plain",
          lastModified: 0,
          contents: "two",
        },
      ]);
    await expect(page.getByLabel("F2 public custom error")).toHaveText("true");
    await page
      .getByRole("button", { name: "Toggle accepted multiple" })
      .click();
    await expect(fileInput).toHaveAttribute("multiple");
    await expect(page.getByLabel("F2 public custom error")).toHaveText("false");
    await expect(page.getByLabel("F2 proposal count")).toHaveText("1");
    await expect(page.getByLabel("F2 rejection count")).toHaveText("0");
  });
  test("file drop rejects post-mount Root, owner and raw-child name/form conflicts", async ({
    page,
  }) => {
    const transitions = [
      "Make F2 Root name conflict",
      "Make F2 Root form conflict",
      "Make F2 owner name conflict",
      "Make F2 owner form conflict",
      "Make F2 raw-child name conflict",
      "Make F2 raw-child form conflict",
    ];
    for (const transition of transitions)
      await page.getByRole("button", { name: transition }).click();
    await expect(
      page.getByRole("alert", { name: "F2 dynamic configuration rejected" }),
    ).toHaveCount(6);
  });

  test("file drop Trigger honors native and Root disabled constraints together", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", {
      name: "F2 effective-disabled trigger",
    });
    await expect(trigger).toBeDisabled();
    await page
      .getByRole("button", { name: "Toggle F2 Trigger Root disabled" })
      .click();
    await expect(trigger).toBeEnabled();
    await page
      .getByRole("button", { name: "Toggle F2 Trigger native disabled" })
      .click();
    await expect(trigger).toBeDisabled();
    await page
      .getByRole("button", { name: "Toggle F2 Trigger Root disabled" })
      .click();
    await expect(trigger).toBeDisabled();
    await page
      .getByRole("button", { name: "Toggle F2 Trigger native disabled" })
      .click();
    await expect(trigger).toBeDisabled();
    await page
      .getByRole("button", { name: "Toggle F2 Trigger Root disabled" })
      .click();
    await expect(trigger).toBeEnabled();
  });

  test("file drop Form composition equivalent wrapper preserves native File reference order", async ({
    page,
  }) => {
    const fileInput = page.locator('#file-drop-f2-zone input[type="file"]');
    await page
      .getByRole("button", { name: "Toggle accepted multiple" })
      .click();
    await page.getByRole("button", { name: "Set accepted two files" }).click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "one.txt",
          size: 3,
          type: "text/plain",
          lastModified: 0,
          contents: "one",
        },
        {
          name: "two.txt",
          size: 3,
          type: "text/plain",
          lastModified: 0,
          contents: "two",
        },
      ]);
    const acceptedRefs = await fileInput.evaluateHandle((node) =>
      Array.from((node as HTMLInputElement).files ?? []),
    );
    await captureF2RawSelection(page);
    const inputCount = Number(
      await page.getByLabel("F2 raw input count").textContent(),
    );
    const changeCount = Number(
      await page.getByLabel("F2 raw change count").textContent(),
    );
    await page
      .getByRole("button", { name: "Rewrap accepted File list" })
      .click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "one.txt",
          size: 3,
          type: "text/plain",
          lastModified: 0,
          contents: "one",
        },
        {
          name: "two.txt",
          size: 3,
          type: "text/plain",
          lastModified: 0,
          contents: "two",
        },
      ]);
    expect(
      await acceptedRefs.evaluate((files) => {
        const current = Array.from(
          document.querySelector<HTMLInputElement>(
            '#file-drop-f2-zone input[type="file"]',
          )?.files ?? [],
        );
        return (
          files.length === current.length &&
          files.every((file, index) => file === current[index])
        );
      }),
    ).toBe(true);
    expect(await f2RawSelection(page)).toEqual([]);
    await expect(page.getByLabel("F2 raw input count")).toHaveText(
      String(inputCount),
    );
    await expect(page.getByLabel("F2 raw change count")).toHaveText(
      String(changeCount),
    );
    await expect(page.getByLabel("F2 proposal count")).toHaveText("0");
    await expect(page.getByLabel("F2 rejection count")).toHaveText("0");
  });

  test("file drop external reset dispose", async ({ page }) => {
    const defaultForm = page.locator("#file-drop-f2-default-form");
    const first = page.locator("#file-drop-f2-default-a-input");
    const second = page.locator("#file-drop-f2-default-b-input");
    await expect
      .poll(() =>
        defaultForm.evaluate(async (node) => {
          const form = node as HTMLFormElement;
          return Promise.all(
            [
              ...new FormData(form).getAll("default-a-files"),
              ...new FormData(form).getAll("default-b-files"),
            ].map(async (value) =>
              value instanceof File
                ? `${value.name}:${await value.text()}`
                : String(value),
            ),
          );
        }),
      )
      .toEqual(["alpha.txt:alpha", "bravo.txt:bravo"]);
    await page
      .getByRole("button", { name: "Keep accepted same-name file" })
      .click();
    await page.getByRole("button", { name: "Reset F2 form" }).click();
    await expect
      .poll(() => f2Files(page))
      .toEqual([
        {
          name: "same.txt",
          size: 4,
          type: "text/plain",
          lastModified: 0,
          contents: "kept",
        },
      ]);
    await selectFilesByProtocol(page, "#file-drop-f2-default-a-input", [
      { name: "changed.txt", type: "text/plain", contents: "changed" },
    ]);
    await page
      .getByRole("button", { name: "Toggle reset cancellation" })
      .click();
    await page.getByRole("button", { name: "Reset default files" }).click();
    await expect
      .poll(() =>
        first.evaluate((node) => (node as HTMLInputElement).files?.[0]?.name),
      )
      .toBe("changed.txt");
    await page
      .getByRole("button", { name: "Toggle reset cancellation" })
      .click();
    await page.getByRole("button", { name: "Reset default files" }).click();
    await expect
      .poll(() =>
        first.evaluate((node) => (node as HTMLInputElement).files?.[0]?.text()),
      )
      .toBe("alpha");
    await expect
      .poll(() =>
        second.evaluate((node) =>
          (node as HTMLInputElement).files?.[0]?.text(),
        ),
      )
      .toBe("bravo");
    const externalInput = page.locator("#file-drop-f2-external-input");
    await expect
      .poll(() =>
        externalInput.evaluate((node) => (node as HTMLInputElement).form?.id),
      )
      .toBe("file-drop-f2-external-form");
    await selectFilesByProtocol(page, "#file-drop-f2-external-input", [
      { name: "outside.txt", type: "text/plain", contents: "outside" },
    ]);
    await expect
      .poll(() =>
        f2Files(page, "#file-drop-f2-external-form", "external-files"),
      )
      .toEqual([
        {
          name: "outside.txt",
          size: 7,
          type: "text/plain",
          lastModified: 0,
          contents: "outside",
        },
      ]);
    await page
      .getByRole("region", { name: "Native FileDrop F2", exact: true })
      .getByRole("button", { name: "Reassociate external form", exact: true })
      .click();
    await expect
      .poll(() =>
        externalInput.evaluate((node) => (node as HTMLInputElement).form?.id),
      )
      .toBe("file-drop-f2-other-form");
    await expect
      .poll(() => f2Files(page, "#file-drop-f2-other-form", "external-files"))
      .toEqual([
        {
          name: "outside.txt",
          size: 7,
          type: "text/plain",
          lastModified: 0,
          contents: "outside",
        },
      ]);
    await expect
      .poll(() =>
        f2Files(page, "#file-drop-f2-external-form", "external-files"),
      )
      .toEqual([]);
    await page.locator("#file-drop-f2-disposed-input").evaluate((node) => {
      const input = node as HTMLInputElement;
      const target = window as Window & {
        __fileDropDisposedInput?: HTMLInputElement;
        __fileDropDisposedEvents?: {
          type: string;
          bubbles: boolean;
          name: string;
        }[];
      };
      target.__fileDropDisposedInput = input;
      target.__fileDropDisposedEvents = [];
      for (const type of ["input", "change"] as const)
        input.addEventListener(type, (event) =>
          target.__fileDropDisposedEvents!.push({
            type,
            bubbles: event.bubbles,
            name: input.files?.[0]?.name ?? "",
          }),
        );
      const transfer = new DataTransfer();
      transfer.items.add(
        new File(["dispose"], "dispose.txt", { type: "text/plain" }),
      );
      input.files = transfer.files;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(page.locator("#file-drop-f2-disposed-input")).toHaveCount(0);
    await expect(page.getByLabel("F2 disposed proposals")).toHaveText("1");
    const disposedState = await page.evaluate(async () => {
      const target = window as Window & {
        __fileDropDisposedInput?: HTMLInputElement;
        __fileDropDisposedEvents?: {
          type: string;
          bubbles: boolean;
          name: string;
        }[];
      };
      const input = target.__fileDropDisposedInput;
      return {
        connected: input?.isConnected ?? null,
        files: await Promise.all(
          Array.from(input?.files ?? []).map(async (file) => ({
            name: file.name,
            contents: await file.text(),
          })),
        ),
        events: target.__fileDropDisposedEvents ?? [],
      };
    });
    expect(disposedState).toEqual({
      connected: false,
      files: [{ name: "dispose.txt", contents: "dispose" }],
      events: [
        { type: "input", bubbles: true, name: "dispose.txt" },
        { type: "change", bubbles: true, name: "dispose.txt" },
      ],
    });
  });

  test("file drop SSR defaults isolation capability", async ({ page }) => {
    const first = page.locator("#file-drop-f2-default-a-input");
    const second = page.locator("#file-drop-f2-default-b-input");
    await expect(first).toBeAttached();
    await expect(second).toBeAttached();
    await expect
      .poll(() =>
        first.evaluate((node) => (node as HTMLInputElement).files?.[0]?.text()),
      )
      .toBe("alpha");
    await expect
      .poll(() =>
        second.evaluate((node) =>
          (node as HTMLInputElement).files?.[0]?.text(),
        ),
      )
      .toBe("bravo");
    await expect(page.getByLabel("F2 default proposals")).toHaveText("0");
    await expect(page.getByLabel("F2 default events")).toHaveText("0");
    await selectFilesByProtocol(page, "#file-drop-f2-default-a-input", [
      { name: "changed.txt", type: "text/plain", contents: "changed" },
    ]);
    await expect
      .poll(() =>
        first.evaluate((node) => (node as HTMLInputElement).files?.[0]?.text()),
      )
      .toBe("changed");
    await expect
      .poll(() =>
        second.evaluate((node) =>
          (node as HTMLInputElement).files?.[0]?.text(),
        ),
      )
      .toBe("bravo");
    await page.getByRole("button", { name: "Reset default files" }).click();
    await expect
      .poll(() =>
        first.evaluate((node) => (node as HTMLInputElement).files?.[0]?.text()),
      )
      .toBe("alpha");
    await expect
      .poll(() =>
        second.evaluate((node) =>
          (node as HTMLInputElement).files?.[0]?.text(),
        ),
      )
      .toBe("bravo");
    await expect(page.getByLabel("F2 default proposals")).toHaveText("2");
    await expect(page.getByLabel("F2 default events")).toHaveText("2");
    await page
      .getByRole("button", { name: "Toggle default instances" })
      .click();
    await expect(first).toHaveCount(0);
    await page
      .getByRole("button", { name: "Toggle default instances" })
      .click();
    await expect
      .poll(() =>
        first.evaluate((node) => (node as HTMLInputElement).files?.[0]?.text()),
      )
      .toBe("alpha");
    await expect
      .poll(() =>
        second.evaluate((node) =>
          (node as HTMLInputElement).files?.[0]?.text(),
        ),
      )
      .toBe("bravo");
    await expect(page.getByLabel("F2 default proposals")).toHaveText("2");
    await expect(page.getByLabel("F2 default events")).toHaveText("2");
  });
  test("file drop Form composition rejects target name conflicts", async ({
    page,
  }) => {
    await expectConfigurationFallback(page, "Mount conflicting target name");
  });

  test("file drop Form composition rejects Form.Field name masking", async ({
    page,
  }) => {
    await expectConfigurationFallback(page, "Mount masked field name");
  });

  test("file drop Form composition rejects target form conflicts", async ({
    page,
  }) => {
    await expectConfigurationFallback(page, "Mount conflicting target form");
  });
  test("file drop Form composition rejects Form.Control form masking", async ({
    page,
  }) => {
    await expectConfigurationFallback(
      page,
      "Mount conflicting Form.Control form",
    );
  });
});
