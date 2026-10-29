import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const fixture = (page: Page, id: string) => page.locator(`#${id}`);
const day = (grid: Locator, label: string) =>
  grid.getByRole("button", { name: label, exact: true });

async function withDiagnostics<T>(
  page: Page,
  run: () => Promise<T>,
): Promise<T> {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error")
      problems.push(message.text());
  });
  try {
    return await run();
  } finally {
    expect.soft(problems, "browser errors and warnings").toEqual([]);
  }
}

async function openGallery(
  page: Page,
  info: { project: { name: string } },
): Promise<void> {
  await page.goto(info.project.name.endsWith("csr") ? "/csr" : "/");
}

test("date picker independent refusal and focus", async ({ page }, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const refusedValue = fixture(page, "date-picker-refused-selection");
    const trigger = refusedValue.getByRole("button", {
      name: "Choose a date",
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await expect(refusedValue.getByLabel("Accepted date")).toHaveText(
      "2026-10-18",
    );
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Choose a date",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const grid = dialog.getByRole("grid");
    await expect(day(grid, "October 19, 2026")).toBeVisible();
    await day(grid, "October 19, 2026").click();
    await expect(refusedValue.getByLabel("Value requests")).toHaveText(
      "2026-10-19",
    );
    await expect(refusedValue.getByLabel("Accepted date")).toHaveText(
      "2026-10-18",
    );
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    const refusedOpen = fixture(page, "date-picker-refused-open");
    const refusedOpenTrigger = refusedOpen.getByRole("button", {
      name: "Cannot open yet",
      exact: true,
    });
    await expect(refusedOpenTrigger).toBeVisible();
    await refusedOpenTrigger.click();
    await expect(refusedOpen.getByLabel("Open requests")).toHaveText("true");
    await expect(
      page.getByRole("dialog", { name: "Cannot open yet", exact: true }),
    ).toHaveCount(0);
    await expect(refusedOpen.getByLabel("Accepted date")).toHaveText(
      "2026-10-18",
    );

    const refusedClose = fixture(page, "date-picker-refused-close");
    const closeTrigger = refusedClose.getByRole("button", {
      name: "Choose another date",
      exact: true,
    });
    await expect(closeTrigger).toBeVisible();
    await closeTrigger.click();
    const staysOpen = page.getByRole("dialog", {
      name: "Choose another date",
      exact: true,
    });
    await expect(staysOpen).toBeVisible();
    await day(staysOpen.getByRole("grid"), "October 19, 2026").click();
    await expect(refusedClose.getByLabel("Accepted date")).toHaveText(
      "2026-10-19",
    );
    await expect(refusedClose.getByLabel("Open requests")).toHaveText("false");
    await expect(staysOpen).toBeVisible();
    await expect(
      staysOpen.getByRole("heading", { name: "October 2026", exact: true }),
    ).toBeVisible();
    await expect(
      day(staysOpen.getByRole("grid"), "October 19, 2026"),
    ).toBeFocused();
    await openGallery(page, info);

    const refusedMonth = fixture(page, "date-picker-refused-month");
    const monthTrigger = refusedMonth.getByRole("button", {
      name: "Browse dates",
      exact: true,
    });
    await expect(monthTrigger).toBeVisible();
    await monthTrigger.click();
    const monthDialog = page.getByRole("dialog", {
      name: "Browse dates",
      exact: true,
    });
    await expect(monthDialog).toBeVisible();
    await monthDialog
      .getByRole("button", { name: "Next month", exact: true })
      .click();
    await expect(refusedMonth.getByLabel("Requested month")).toHaveText(
      "2026-11",
    );
    await expect(
      monthDialog.getByRole("heading", { name: "October 2026", exact: true }),
    ).toBeVisible();
    await expect(refusedMonth.getByLabel("Accepted date")).toHaveText(
      "2026-10-18",
    );
  }));
test("date picker reopens at accepted month without overriding controlled view", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const uncontrolled = fixture(page, "date-picker-reopen-selection");
    const trigger = uncontrolled.getByRole("button", {
      name: "Reopen selected date",
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Reopen selected date",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Next month", exact: true })
      .click();
    await expect(
      dialog.getByRole("heading", { name: "November 2026", exact: true }),
    ).toBeVisible();
    await day(dialog.getByRole("grid"), "November 19, 2026").click();
    await expect(uncontrolled.getByLabel("Accepted date")).toHaveText(
      "2026-11-19",
    );
    await expect(dialog).toBeHidden();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "November 2026", exact: true }),
    ).toBeVisible();

    const controlled = fixture(page, "date-picker-controlled-reopen");
    const controlledTrigger = controlled.getByRole("button", {
      name: "Controlled month date",
      exact: true,
    });
    await expect(controlledTrigger).toBeVisible();
    await controlled
      .getByRole("button", {
        name: "Set accepted date to November",
        exact: true,
      })
      .click();
    await controlledTrigger.click();
    const controlledDialog = page.getByRole("dialog", {
      name: "Controlled month date",
      exact: true,
    });
    await expect(controlledDialog).toBeVisible();
    await expect(controlled.getByLabel("Accepted date")).toHaveText(
      "2026-11-12",
    );
    await expect(
      controlledDialog.getByRole("heading", {
        name: "October 2026",
        exact: true,
      }),
    ).toBeVisible();
  }));

test("date picker native date form validity focus", async ({ page }, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-native-form");
    const form = scene.locator("form#native-date-form");
    const bridge = form.locator('input[type="date"][name="due"]');
    const trigger = scene.getByRole("button", {
      name: "Due date",
      exact: true,
    });
    const submit = scene.getByRole("button", {
      name: "Submit due date",
      exact: true,
    });
    const priorFocus = scene.getByRole("button", {
      name: "Before native date field",
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await priorFocus.focus();
    await expect(bridge).toHaveAttribute("tabindex", "-1");
    await expect(bridge).toHaveAttribute("aria-hidden", "true");
    await expect(bridge).toHaveAttribute("required", "");
    await expect(bridge).toHaveValue("");
    await expect(bridge).toHaveCount(1);
    await expect
      .poll(() =>
        form.evaluate((node) => (node as HTMLFormElement).checkValidity()),
      )
      .toBe(false);
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(/Choose a due date/);
    await expect(trigger).toHaveAccessibleDescription(
      /A due date is required and must be inside the allowed range/,
    );
    await expect(priorFocus).toBeFocused();
    await submit.click();
    await expect(scene.getByRole("status", { name: "Submission" })).toHaveText(
      "blocked",
    );

    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Due date", exact: true });
    await expect(dialog).toBeVisible();
    await day(dialog.getByRole("grid"), "October 18, 2026").click();
    await expect(bridge).toHaveValue("2026-10-18");
    await expect
      .poll(() =>
        form.evaluate((node) => (node as HTMLFormElement).checkValidity()),
      )
      .toBe(true);
    await expect(trigger).not.toHaveAttribute("aria-invalid", "true");
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["due", "2026-10-18"]]);
    await submit.click();
    await expect(scene.getByRole("status", { name: "Submission" })).toHaveText(
      "2026-10-18",
    );
    await scene
      .getByRole("button", {
        name: "Set minimum after accepted date",
        exact: true,
      })
      .click();
    await expect(bridge).toHaveValue("2026-10-18");
    await expect(bridge).toHaveAttribute("min", "2026-10-19");
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["due", "2026-10-18"]]);
    await expect
      .poll(() =>
        form.evaluate((node) => (node as HTMLFormElement).checkValidity()),
      )
      .toBe(false);
    await submit.click();
    await expect(scene.getByRole("status", { name: "Submission" })).toHaveText(
      "blocked",
    );
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.rangeUnderflow,
        ),
      )
      .toBe(true);
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      /A due date is required and must be inside the allowed range/,
    );
    await bridge.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Tab");
    const clear = scene.getByRole("button", {
      name: "Clear date",
      exact: true,
    });
    await expect(clear).toBeFocused();
    await scene
      .getByRole("button", {
        name: "Set maximum before accepted date",
        exact: true,
      })
      .click();
    await expect(bridge).not.toHaveAttribute("min");
    await expect(bridge).toHaveAttribute("max", "2026-10-17");
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.rangeOverflow,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.rangeUnderflow,
        ),
      )
      .toBe(false);
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      /A due date is required and must be inside the allowed range/,
    );
    await scene
      .getByRole("button", { name: "Clear date", exact: true })
      .click();
    await expect(bridge).toHaveValue("");
    await expect
      .poll(() =>
        form.evaluate((node) => (node as HTMLFormElement).checkValidity()),
      )
      .toBe(false);
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(scene.getByLabel("Date error")).toBeVisible();

    const unavailable = fixture(page, "date-picker-unavailable-form");
    const unavailableTrigger = unavailable.getByRole("button", {
      name: "Unavailable date",
      exact: true,
    });
    await expect(unavailableTrigger).toBeVisible();
    const unavailableBridge = unavailable.locator('input[type="date"]');
    await expect(unavailableBridge).toHaveValue("2026-10-18");
    await expect
      .poll(() =>
        unavailableBridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(true);
    await expect(unavailableTrigger).toHaveAttribute("aria-invalid", "true");
    await expect(unavailableTrigger).toHaveAccessibleDescription(
      /This date is unavailable/,
    );
    await expect(unavailableTrigger).toHaveAccessibleDescription(
      /Choose an available date/,
    );
    expect(
      await unavailable
        .locator("form")
        .evaluate((node) => [
          ...new FormData(node as HTMLFormElement).entries(),
        ]),
    ).toEqual([["due", "2026-10-18"]]);
    await expect
      .poll(() =>
        unavailable
          .locator("form")
          .evaluate((node) => (node as HTMLFormElement).checkValidity()),
      )
      .toBe(false);

    const readOnly = fixture(page, "date-picker-readonly-form");
    const readOnlyForm = readOnly.locator("form");
    const readOnlyBridge = readOnly.locator('input[type="date"]');
    const readOnlyTrigger = readOnly.getByRole("button", {
      name: "Read-only date",
      exact: true,
    });
    await expect(readOnlyTrigger).toBeVisible();
    await expect(readOnlyBridge).toHaveAttribute("readonly", "");
    expect(
      await readOnlyForm.evaluate((node) =>
        (node as HTMLFormElement).checkValidity(),
      ),
    ).toBe(true);
    await readOnlyTrigger.click();
    const readOnlyDialog = page.getByRole("dialog", {
      name: "Read-only date",
      exact: true,
    });
    await expect(readOnlyDialog).toBeVisible();
    const readOnlyGrid = readOnlyDialog.getByRole("grid");
    const day25 = day(readOnlyGrid, "October 25, 2026");
    await expect(day25).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(day(readOnlyGrid, "October 26, 2026")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(readOnlyDialog).toBeVisible();
    await expect(readOnlyBridge).toHaveValue("2026-10-18");
    expect(
      await readOnlyForm.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["due", "2026-10-18"]]);
    expect(
      await readOnlyForm.evaluate((node) =>
        (node as HTMLFormElement).checkValidity(),
      ),
    ).toBe(true);
    await expect(
      readOnly.getByRole("button", { name: "Clear date", exact: true }),
    ).toBeDisabled();
    const disabled = fixture(page, "date-picker-disabled-form");
    const disabledTrigger = disabled.getByRole("button", {
      name: "Disabled date",
      exact: true,
    });
    await expect(disabledTrigger).toBeVisible();
    await expect(disabledTrigger).toBeDisabled();
    await expect(disabled.locator('input[type="date"]')).toBeDisabled();
    expect(
      await disabled
        .locator("form")
        .evaluate((node) => [
          ...new FormData(node as HTMLFormElement).entries(),
        ]),
    ).toEqual([]);
  }));

test("date picker managed Form baseline labels revisions", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-managed-form");
    const form = scene.locator("form#scheduled-form");
    const bridge = form.locator('input[type="date"][name="scheduled"]');
    const trigger = scene.getByRole("button", {
      name: "Scheduled date",
      exact: true,
    });
    const label = scene.getByText("Choose the scheduled date", { exact: true });
    const field = label.locator('xpath=ancestor::*[.//input[@type="date"]][1]');
    const publicValidity = scene.getByLabel(
      "Scheduled date custom error state",
      { exact: true },
    );
    await expect(trigger).toBeVisible();
    await expect(scene.getByLabel("Choose the scheduled date")).toHaveCount(1);
    await expect(label).toBeVisible();
    await expect(
      scene.getByText("Server rejected date", { exact: true }),
    ).toBeHidden();
    await expect(
      scene.getByText("Date is unavailable", { exact: true }),
    ).toBeVisible();
    await label.click();
    await expect(trigger).toBeFocused();
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(true);
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["scheduled", "2026-10-18"]]);
    await expect(publicValidity).toHaveText("true");
    await expect(bridge).toHaveAttribute("data-invalid");
    await expect(field).toHaveAttribute("data-invalid");
    await expect(
      scene.getByText("Date is unavailable", { exact: true }),
    ).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      /Choose a date from the calendar/,
    );
    await expect(trigger).toHaveAccessibleDescription(
      /Target input explanation/,
    );
    await expect(trigger).toHaveAccessibleDescription(/Date is unavailable/);
    await scene
      .getByRole("button", { name: "Start older validation", exact: true })
      .focus();
    expect(
      await form.evaluate((node) => (node as HTMLFormElement).checkValidity()),
    ).toBe(false);
    await expect(trigger).toBeFocused();

    await scene
      .getByRole("button", { name: "Start older validation", exact: true })
      .click();
    await expect(bridge).toHaveValue("2026-10-20");
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(false);
    await expect(
      scene.getByText("Date is unavailable", { exact: true }),
    ).toBeHidden();
    await scene
      .getByRole("button", {
        name: "Change baseline and accepted date",
        exact: true,
      })
      .click();
    await expect(bridge).toHaveValue("2026-10-19");
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(true);
    await expect(
      scene.getByText("Date is unavailable", { exact: true }),
    ).toBeVisible();
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["scheduled", "2026-10-19"]]);

    await form.evaluate((node) => (node as HTMLFormElement).reset());
    await expect(bridge).toHaveValue("2026-10-18");
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(true);
    await expect(publicValidity).toHaveText("true");
    await expect(bridge).toHaveAttribute("data-invalid");
    await expect(field).toHaveAttribute("data-invalid");

    await scene
      .getByRole("button", { name: "Clear baseline", exact: true })
      .click();
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(false);
    await expect(publicValidity).toHaveText("false");
    await expect(bridge).not.toHaveAttribute("data-invalid");
    await expect(field).not.toHaveAttribute("data-invalid");
    await expect(trigger).toHaveAccessibleDescription(
      /Target input explanation/,
    );
    await expect(trigger).not.toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      /Choose a date from the calendar/,
    );
    await expect(trigger).not.toHaveAccessibleDescription(
      /Date is unavailable/,
    );
    await expect(
      scene.getByText("Server rejected date", { exact: true }),
    ).toBeHidden();
    await expect(
      scene.getByText("Date is unavailable", { exact: true }),
    ).toBeHidden();
    await scene
      .getByRole("button", { name: "Start older validation", exact: true })
      .click();
    await expect(bridge).toHaveValue("2026-10-20");
    await scene
      .getByRole("button", {
        name: "Set current accepted validation date",
        exact: true,
      })
      .click();
    await expect(bridge).toHaveValue("2026-10-21");
    await scene
      .getByRole("button", {
        name: "Resolve current accepted validation as invalid",
        exact: true,
      })
      .click();
    await expect(
      scene.getByText("Current date rejected", { exact: true }),
    ).toBeVisible();
    await expect(trigger).toHaveAccessibleDescription(/Current date rejected/);
    await scene
      .getByRole("button", { name: "Resolve older validation", exact: true })
      .click();
    await form.evaluate((node) => (node as HTMLFormElement).reset());
    await expect(bridge).toHaveValue("2026-10-18");
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(false);
    await expect(
      scene.getByText("Current date rejected", { exact: true }),
    ).toBeHidden();
    await expect(trigger).not.toHaveAccessibleDescription(
      /Current date rejected/,
    );
    await scene
      .getByRole("button", { name: "Restore server error", exact: true })
      .click();
    await expect(trigger).toHaveAccessibleDescription(/Server rejected date/);
    await expect(
      scene.getByText("Server rejected date", { exact: true }),
    ).toBeVisible();
    await form.evaluate((node) => (node as HTMLFormElement).reset());
    await expect(bridge).toHaveValue("2026-10-18");
    await expect(
      scene.getByText("Server rejected date", { exact: true }),
    ).toBeVisible();
    await expect(trigger).toHaveAccessibleDescription(/Server rejected date/);
    await scene
      .getByRole("button", { name: "Clear server error", exact: true })
      .click();
    await expect(
      scene.getByText("Server rejected date", { exact: true }),
    ).toBeHidden();
    await expect(trigger).not.toHaveAttribute("aria-invalid", "true");
    await expect(trigger).not.toHaveAccessibleDescription(
      /Server rejected date/,
    );
    await scene
      .getByRole("button", {
        name: "Unmount managed native control",
        exact: true,
      })
      .click();
    await expect(bridge).toHaveCount(0);
    await expect(trigger).not.toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      /Choose a date from the calendar/,
    );
    await expect(trigger).not.toHaveAccessibleDescription(
      /Target input explanation/,
    );
    await scene
      .getByRole("button", {
        name: "Remount managed native control",
        exact: true,
      })
      .click();
    await expect(bridge).toHaveCount(1);
    await expect(trigger).toHaveAccessibleDescription(
      /Target input explanation/,
    );
  }));
test("date picker scopes server field metadata and native descriptions by name", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-form-metadata");
    const trigger = scene.getByRole("button", {
      name: "Scoped scheduled date",
      exact: true,
    });
    await scene
      .getByRole("button", { name: "Restore scoped server error", exact: true })
      .click();
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      /Caller-provided scheduled date help/,
    );
    await expect(trigger).toHaveAccessibleDescription(/Raw button description/);
    await expect(trigger).toHaveAccessibleDescription(
      /Native target description/,
    );
    await expect(trigger).toHaveAccessibleDescription(
      /Server rejected scoped date/,
    );
    const descriptionIds =
      (await trigger.getAttribute("aria-describedby"))?.split(/\s+/) ?? [];
    expect(
      descriptionIds.filter((id) => id === "metadata-shared-help"),
    ).toHaveLength(1);

    const mismatch = scene.getByRole("button", {
      name: "Mismatched metadata date",
      exact: true,
    });
    await expect(mismatch).not.toHaveAttribute("aria-invalid", "true");
    await expect(mismatch).not.toHaveAccessibleDescription(
      /Server rejected scoped date/,
    );
    const barrier = scene.getByRole("button", {
      name: "Independent root barrier date",
      exact: true,
    });
    await expect(barrier).not.toHaveAttribute("aria-invalid", "true");
    await expect(barrier).not.toHaveAccessibleDescription(
      /Server rejected scoped date/,
    );

    await scene
      .getByRole("button", { name: "Clear scoped server error", exact: true })
      .click();
    await expect(trigger).not.toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      /Caller-provided scheduled date help/,
    );
    await expect(trigger).toHaveAccessibleDescription(/Raw button description/);
    await expect(trigger).toHaveAccessibleDescription(
      /Native target description/,
    );
    await expect(trigger).not.toHaveAccessibleDescription(
      /Server rejected scoped date/,
    );
    await scene
      .getByRole("button", { name: "Restore scoped server error", exact: true })
      .click();
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(trigger).toHaveAccessibleDescription(
      /Server rejected scoped date/,
    );
  }));

test("date picker preserves current accepted async validation", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-managed-form");
    const form = scene.locator("form#scheduled-form");
    const bridge = form.locator('input[type="date"][name="scheduled"]');
    const publicValidity = scene.getByLabel(
      "Scheduled date custom error state",
      { exact: true },
    );
    const trigger = scene.getByRole("button", {
      name: "Scheduled date",
      exact: true,
    });

    await scene
      .getByRole("button", { name: "Clear baseline", exact: true })
      .click();
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(false);
    await expect(publicValidity).toHaveText("false");
    await expect(
      scene.getByText("Date is unavailable", { exact: true }),
    ).toBeHidden();
    await scene
      .getByRole("button", { name: "Restore server error", exact: true })
      .click();

    await scene
      .getByRole("button", { name: "Start older validation", exact: true })
      .click();
    await expect(bridge).toHaveValue("2026-10-20");
    await scene
      .getByRole("button", {
        name: "Set current accepted validation date",
        exact: true,
      })
      .click();
    await expect(bridge).toHaveValue("2026-10-21");
    await expect(
      scene.getByText("Current date rejected", { exact: true }),
    ).toBeHidden();
    await expect(trigger).toHaveAccessibleDescription(/Server rejected date/);
    await scene
      .getByRole("button", { name: "Clear server error", exact: true })
      .click();
    await expect(trigger).not.toHaveAccessibleDescription(
      /Server rejected date/,
    );
    await scene
      .getByRole("button", { name: "Restore server error", exact: true })
      .click();
    await expect(trigger).toHaveAccessibleDescription(/Server rejected date/);
    await scene
      .getByRole("button", {
        name: "Resolve current accepted validation as invalid",
        exact: true,
      })
      .click();
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(true);
    await expect(publicValidity).toHaveText("true");
    await expect(
      scene.getByText("Current date rejected", { exact: true }),
    ).toBeVisible();
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["scheduled", "2026-10-21"]]);

    await scene
      .getByRole("button", { name: "Resolve older validation", exact: true })
      .click();
    await expect
      .poll(() =>
        bridge.evaluate(
          (node) => (node as HTMLInputElement).validity.customError,
        ),
      )
      .toBe(true);
    await expect(publicValidity).toHaveText("true");
    await expect(
      scene.getByText("Current date rejected", { exact: true }),
    ).toBeVisible();
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["scheduled", "2026-10-21"]]);
  }));

test("date picker rejects post-mount Root, owner and raw-child name/form conflicts", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const transitions = [
      "Make DatePicker Root name conflict",
      "Make DatePicker Root form conflict",
      "Make DatePicker owner name conflict",
      "Make DatePicker owner form conflict",
      "Make DatePicker raw-child name conflict",
      "Make DatePicker raw-child form conflict",
    ];
    const alerts = page.getByRole("alert", {
      name: "DatePicker dynamic configuration rejected",
    });
    await expect(alerts).toHaveCount(0);
    for (const transition of transitions)
      await page.getByRole("button", { name: transition, exact: true }).click();
    await expect(alerts).toHaveCount(6);
    for (const alert of await alerts.all())
      await expect(alert).toHaveAttribute("data-error-type", "TypeError");
  }));
test("date picker rejects initially invalid name and form identities when mounted", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-initial-conflicts");
    const cases = [
      ["Mount initial DatePicker raw name conflict", "raw-name", "raw name"],
      ["Mount initial DatePicker raw form conflict", "raw-form", "raw form"],
      [
        "Mount initial DatePicker masked Form.Field name conflict",
        "masked-field-name",
        "masked Form.Field name",
      ],
    ] as const;
    await expect(scene.getByRole("alert")).toHaveCount(0);
    for (const [button, kind, label] of cases) {
      await scene.getByRole("button", { name: button, exact: true }).click();
      const alert = scene.getByRole("alert", {
        name: `Initial DatePicker ${label} conflict rejected`,
      });
      await expect(alert).toHaveAttribute("data-error-type", "TypeError");
      await expect(alert).toHaveAttribute("data-conflict-kind", kind);
    }
  }));

test("date picker external reset lifecycle", async ({ page }, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-reset");
    const form = scene.locator("form#date-picker-reset-inner");
    const bridge = form.locator('input[type="date"][name="appointment"]');
    const trigger = scene.getByRole("button", {
      name: "Resettable date",
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await expect(bridge).toHaveValue("2026-10-18");
    await expect(scene.getByLabel("Native event trace")).toHaveText("");

    await scene
      .getByRole("button", { name: "Choose October 19, 2026", exact: true })
      .click();
    await expect(bridge).toHaveValue("2026-10-19");
    await expect(scene.getByLabel("Native event trace")).toHaveText(
      "input:2026-10-19:true,change:2026-10-19:true",
    );
    await scene
      .getByRole("button", { name: "Set date programmatically", exact: true })
      .click();
    await expect(bridge).toHaveValue("2026-10-20");
    await expect(scene.getByLabel("Native event trace")).toHaveText(
      "input:2026-10-19:true,change:2026-10-19:true,change:2026-10-20:false",
    );

    await scene
      .getByRole("button", { name: "No-op selection request", exact: true })
      .click();
    await scene
      .getByRole("button", { name: "Refuse next value request", exact: true })
      .click();
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Resettable date",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await day(dialog.getByRole("grid"), "October 21, 2026").click();
    await expect(bridge).toHaveValue("2026-10-20");
    await expect(scene.getByLabel("Native event trace")).toHaveText(
      "input:2026-10-19:true,change:2026-10-19:true,change:2026-10-20:false",
    );
    await scene
      .getByRole("button", { name: "Cancel next reset", exact: true })
      .click();
    await form.evaluate((node) => (node as HTMLFormElement).reset());
    await expect(bridge).toHaveValue("2026-10-20");
    await expect(scene.getByLabel("Native event trace")).toHaveText(
      "input:2026-10-19:true,change:2026-10-19:true,change:2026-10-20:false",
    );
    await form.evaluate((node) => (node as HTMLFormElement).reset());
    await expect(bridge).toHaveValue("2026-10-18");
    await expect(scene.getByLabel("Native event trace")).toHaveText(
      "input:2026-10-19:true,change:2026-10-19:true,change:2026-10-20:false",
    );
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["appointment", "2026-10-18"]]);

    await scene
      .getByRole("button", { name: "Reassociate external form", exact: true })
      .click();
    expect(
      await scene
        .locator("#external-date-form")
        .evaluate((node) => [
          ...new FormData(node as HTMLFormElement).entries(),
        ]),
    ).toEqual([["appointment", "2026-10-18"]]);
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([]);
    const externalForm = scene.locator("#external-date-form");
    await scene
      .getByRole("button", { name: "Set date programmatically", exact: true })
      .click();
    await expect(bridge).toHaveValue("2026-10-20");
    await externalForm.evaluate((node) => (node as HTMLFormElement).reset());
    await expect(bridge).toHaveValue("2026-10-18");
    expect(
      await externalForm.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["appointment", "2026-10-18"]]);

    await scene
      .getByRole("button", { name: "Unmount DatePicker", exact: true })
      .click();
    await expect(trigger).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Outside reset focus", exact: true }),
    ).toBeVisible();
    await scene
      .getByRole("button", { name: "Remount DatePicker", exact: true })
      .click();
    const remounted = scene.getByRole("button", {
      name: "Resettable date",
      exact: true,
    });
    await expect(remounted).toBeVisible();
    await remounted.click();
    await expect(
      page.getByRole("dialog", { name: "Resettable date", exact: true }),
    ).toBeVisible();
    await scene
      .getByRole("button", {
        name: "Queue reset and unmount DatePicker",
        exact: true,
      })
      .click();
    await expect(remounted).toHaveCount(0);
    await expect(
      page.getByRole("dialog", { name: "Resettable date", exact: true }),
    ).toBeHidden();
    await expect(scene.getByLabel("Native event trace")).toHaveText(
      "input:2026-10-19:true,change:2026-10-19:true,change:2026-10-20:false,change:2026-10-20:false",
    );
  }));
test("date picker controlled reset refusal preserves accepted projection", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-reset-refused");
    const trigger = scene.getByRole("button", {
      name: "Refused reset date",
      exact: true,
    });
    const bridge = scene.locator('input[type="date"]');
    const form = scene.locator("form");
    await expect(trigger).toBeVisible();
    await expect(bridge).toHaveValue("2026-10-19");
    await scene
      .getByRole("button", { name: "Reset date", exact: true })
      .click();
    await expect(scene.getByLabel("Accepted date")).toHaveText("2026-10-19");
    await expect(bridge).toHaveValue("2026-10-19");
    expect(
      await form.evaluate((node) => [
        ...new FormData(node as HTMLFormElement).entries(),
      ]),
    ).toEqual([["appointment", "2026-10-19"]]);
  }));

test("date picker SSR locale and nested layers", async ({ browser }, info) => {
  test.skip(
    info.project.name.endsWith("csr"),
    "server markup identity is exercised in SSR projects",
  );
  const context = await browser.newContext({
    baseURL: info.project.use.baseURL as string,
    timezoneId: "Pacific/Kiritimati",
  });
  const page = await context.newPage();
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error")
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
  let testFailed = false;
  let testError: unknown;
  try {
    await page.goto("/?date-picker-initially-open=1", { waitUntil: "commit" });
    await page.waitForFunction(() => {
      if (!document.querySelector("#root-a")) return false;
      const stylesheets = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
      ).filter((link) => new URL(link.href).origin === location.origin);
      return stylesheets.every((link) => link.sheet !== null);
    });
    const managed = fixture(page, "date-picker-managed-form");
    const managedTrigger = managed.getByRole("button", {
      name: "Scheduled date",
      exact: true,
    });
    const managedBridge = managed.locator('input[type="date"]');
    await expect(managedBridge).toHaveValue("2026-10-18");
    await expect
      .poll(() =>
        managedBridge.evaluate(
          (node) => (node as HTMLInputElement).validity.valid,
        ),
      )
      .toBe(true);
    await expect(managedTrigger).toHaveAttribute("aria-invalid", "true");
    await expect(managedTrigger).toHaveAccessibleDescription(
      /Choose a date from the calendar/,
    );
    await expect(managedTrigger).toHaveAccessibleDescription(
      /Server rejected date/,
    );
    await expect(
      managed.getByText("Server rejected date", { exact: true }),
    ).toBeVisible();
    await expect(
      managed.getByText("Date is unavailable", { exact: true }),
    ).toBeHidden();
    const metadata = fixture(page, "date-picker-form-metadata");
    const metadataTrigger = metadata.getByRole("button", {
      name: "Scoped scheduled date",
      exact: true,
    });
    await expect(metadataTrigger).toHaveAttribute("aria-invalid", "true");
    await expect(metadataTrigger).toHaveAccessibleDescription(
      /Caller-provided scheduled date help/,
    );
    await expect(metadataTrigger).toHaveAccessibleDescription(
      /Server rejected scoped date/,
    );
    const metadataDescriptionIds =
      (await metadataTrigger.getAttribute("aria-describedby"))?.split(/\s+/) ??
      [];
    expect(metadataDescriptionIds).toContain("metadata-server-error");
    await expect(
      metadata.getByText("Server rejected scoped date", { exact: true }),
    ).toBeVisible();
    const closed = fixture(page, "date-picker-ssr-closed");
    const closedTrigger = closed.getByRole("button", {
      name: "Closed SSR date",
      exact: true,
    });
    await expect(closedTrigger).toBeVisible();
    const open = fixture(page, "date-picker-ssr-open");
    await expect(open).toBeVisible();
    const openDialog = open.locator('[role="dialog"]');
    await expect(openDialog).toHaveCount(1);
    await expect(openDialog).toHaveAttribute("data-state", "open");
    const originalClosedTrigger = await closedTrigger.elementHandle();
    const openTrigger = open.getByRole("button", {
      name: "Open SSR date",
      exact: true,
    });
    const originalOpenTrigger = await openTrigger.elementHandle();
    const originalDialog = await openDialog.elementHandle();
    const title = openDialog.getByRole("heading", {
      name: "Open SSR date",
      exact: true,
    });
    await expect(title).toHaveText("Open SSR date");
    const originalTitle = await title.elementHandle();
    const originalGrid = await openDialog.getByRole("grid").elementHandle();
    const originalDay = await day(
      openDialog.getByRole("grid"),
      "October 18, 2026",
    ).elementHandle();
    await expect(closedTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(openTrigger).toHaveAttribute("aria-expanded", "true");
    expect(
      await page.evaluate(() => document.activeElement === document.body),
    ).toBe(true);
    release();
    await page.waitForLoadState("load");
    await expect(page.locator("#refs")).toHaveText("same host");
    const hydratedDialog = page.getByRole("dialog", {
      name: "Open SSR date",
      exact: true,
    });
    await expect(hydratedDialog).toBeVisible();
    await expect(hydratedDialog).toHaveAccessibleName("Open SSR date");
    expect(
      await closedTrigger.evaluate(
        (node, original) => node === original,
        originalClosedTrigger,
      ),
    ).toBe(true);
    expect(
      await openTrigger.evaluate(
        (node, original) => node === original,
        originalOpenTrigger,
      ),
    ).toBe(true);
    expect(
      await hydratedDialog.evaluate(
        (node, original) => node === original,
        originalDialog,
      ),
    ).toBe(true);
    expect(
      await hydratedDialog
        .getByRole("heading", { name: "Open SSR date", exact: true })
        .evaluate((node, original) => node === original, originalTitle),
    ).toBe(true);
    expect(
      await hydratedDialog
        .getByRole("grid")
        .evaluate((node, original) => node === original, originalGrid),
    ).toBe(true);
    expect(
      await day(hydratedDialog.getByRole("grid"), "October 18, 2026").evaluate(
        (node, original) => node === original,
        originalDay,
      ),
    ).toBe(true);
    await expect(
      day(hydratedDialog.getByRole("grid"), "October 18, 2026"),
    ).toBeFocused();
    await expect(closedTrigger).not.toBeFocused();
    await openTrigger.scrollIntoViewIfNeeded();
    await hydratedDialog
      .getByRole("button", { name: "Close date picker", exact: true })
      .click();
    await expect(hydratedDialog).toBeHidden();
    await expect(openTrigger).toBeFocused();
    const nested = fixture(page, "date-picker-nested-layers");

    const parentTrigger = nested.getByRole("button", {
      name: "Open date-picker host dialog",
      exact: true,
    });
    await expect(parentTrigger).toBeVisible();
    await parentTrigger.click();
    const parent = page.getByRole("dialog", {
      name: "Date-picker host dialog",
      exact: true,
    });
    await expect(parent).toBeVisible();
    await parent
      .getByRole("button", { name: "Choose nested date", exact: true })
      .click();
    const child = page.getByRole("dialog", {
      name: "Choose nested date",
      exact: true,
    });
    await expect(child).toBeVisible();
    await day(child.getByRole("grid"), "October 18, 2026").focus();
    await page.keyboard.press("Escape");
    await expect(child).toBeHidden();
    await expect(parent).toBeVisible();
    await expect(
      parent.getByRole("button", { name: "Choose nested date", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(parent).toBeHidden();
    await expect(parentTrigger).toBeFocused();

    const modes = fixture(page, "date-picker-tab-modes");
    const nonmodalTrigger = modes.getByRole("button", {
      name: "Open nonmodal date picker",
      exact: true,
    });
    await expect(nonmodalTrigger).toBeVisible();
    await nonmodalTrigger.click();
    const nonmodal = page.getByRole("dialog", {
      name: "Nonmodal date picker",
      exact: true,
    });
    await expect(nonmodal).toBeVisible();
    await expect(nonmodal).not.toHaveAttribute("aria-modal", "true");
    const outside = modes.getByRole("button", {
      name: "Outside date picker",
      exact: true,
      includeHidden: true,
    });
    const nonmodalFirst = nonmodal.getByRole("button", {
      name: "First date control",
      exact: true,
    });
    await nonmodal
      .getByRole("button", { name: "Close date picker", exact: true })
      .focus();
    await page.keyboard.press("Tab");
    await expect(nonmodalFirst).toBeFocused();
    await outside.focus();
    await expect(nonmodal).toBeHidden();
    await expect(outside).toBeFocused();
    const modalTrigger = modes.getByRole("button", {
      name: "Open modal date picker",
      exact: true,
    });
    await modalTrigger.click();
    const modal = page.getByRole("dialog", {
      name: "Modal date picker",
      exact: true,
    });
    await expect(modal).toBeVisible();
    const modalFirst = modal.getByRole("button", {
      name: "First date control",
      exact: true,
    });
    await modal
      .getByRole("button", { name: "Close date picker", exact: true })
      .focus();
    await page.keyboard.press("Tab");
    await expect(modalFirst).toBeFocused();
    expect(await modal.getAttribute("aria-modal")).toBe("true");
    await outside.focus();
    await expect(modal).toBeVisible();
    await expect(outside).not.toBeFocused();
    await modal
      .getByRole("button", { name: "Close date picker", exact: true })
      .click();
    await expect(modal).toBeHidden();
    await expect(modalTrigger).toBeFocused();
    const closedForcedModal = page.locator(
      '[role="dialog"][aria-label="Closed forced modal popover"]',
    );
    await expect(closedForcedModal).toHaveCount(1);
    await expect(closedForcedModal).toHaveAttribute("data-state", "closed");
    await expect(closedForcedModal).not.toHaveAttribute("aria-modal", "true");
    const localeScene = fixture(page, "date-picker-locale");
    const localeTrigger = localeScene.getByRole("button", {
      name: "Rendez-vous",
      exact: true,
    });
    await expect(localeTrigger).toBeVisible();
    const localeLabels = await page.evaluate(() => {
      const date = new Date(0);
      date.setUTCFullYear(2026, 9, 18);
      date.setUTCHours(12, 0, 0, 0);
      const formatter = new Intl.DateTimeFormat("fr-FR", {
        calendar: "gregory",
        timeZone: "UTC",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
        calendar: "gregory",
        timeZone: "UTC",
        day: "numeric",
      });
      return { full: formatter.format(date), day: dayFormatter.format(date) };
    });
    await expect(localeScene.getByLabel("Formatted date")).toHaveText(
      localeLabels.full,
    );
    await localeTrigger.click();
    const localeDialog = page.getByRole("dialog", {
      name: "Rendez-vous",
      exact: true,
    });
    await expect(localeDialog).toBeVisible();
    const localizedDay = localeDialog
      .getByRole("grid")
      .locator('[aria-current="date"]');
    await expect(localizedDay).toHaveText(localeLabels.day);
    await expect(localizedDay).toHaveAttribute("aria-label", localeLabels.full);
  } catch (error) {
    testFailed = true;
    testError = error;
  } finally {
    release();
    try {
      await context.close();
    } catch (error) {
      problems.push(`browserContext.close: ${String(error)}`);
    }
  }
  let diagnosticsError: unknown;
  try {
    expect(problems).toEqual([]);
  } catch (error) {
    diagnosticsError = error;
  }
  if (testFailed) {
    if (diagnosticsError)
      throw new AggregateError(
        [testError, diagnosticsError],
        "The test and page diagnostics both failed.",
        { cause: testError },
      );
    throw testError;
  }
  if (diagnosticsError) throw diagnosticsError;
});

test("date picker form control ownership, projection events, and names", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const standalone = fixture(page, "date-picker-explicit-bridge");
    const standAloneTrigger = standalone.getByRole("button", {
      name: "Appointment date",
      exact: true,
    });
    await expect(standAloneTrigger).toBeVisible();
    expect(
      await standalone
        .locator('input[type="date"]')
        .evaluate((node) => [
          ...new FormData((node as HTMLInputElement).form!).entries(),
        ]),
    ).toEqual([["appointment", ""]]);
    await expect(standalone.locator('input[type="date"]')).toHaveCount(1);
    await expect(
      standalone.getByRole("button", { name: "Root-only name", exact: true }),
    ).toBeVisible();
    expect(
      await standalone
        .locator("form")
        .evaluateAll((forms) =>
          forms.map((form) => [
            ...new FormData(form as HTMLFormElement).entries(),
          ]),
        ),
    ).toEqual(expect.arrayContaining([[], [["appointment", ""]]]));
    await expect(standalone.getByLabel("Form event trace")).toHaveText("");
    await standAloneTrigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Appointment date",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await day(dialog.getByRole("grid"), "October 18, 2026").click();
    await expect(standalone.locator('input[type="date"]')).toHaveValue(
      "2026-10-18",
    );
    await expect(standalone.getByLabel("Form event trace")).toHaveText(
      "input:2026-10-18:true,change:2026-10-18:true",
    );

    const host = fixture(page, "date-picker-host-arbitration");
    const hostTrigger = host.getByRole("button", {
      name: "Arbitrated date",
      exact: true,
    });
    await expect(hostTrigger).toBeVisible();
    const projected = host.locator('input[type="date"]');
    await expect(projected).toHaveAttribute("name", "due");
    await expect(projected).toHaveAttribute("required", "");
    await expect(projected).toHaveAttribute("min", "2026-10-10");
    await expect(projected).toHaveAttribute("max", "2026-10-25");
    await expect(projected).not.toHaveAttribute("readonly");
    await expect(projected).not.toBeDisabled();
    await expect(projected).toHaveValue("2026-10-18");
    await host
      .getByRole("button", { name: "Focus captured date input", exact: true })
      .click();
    await expect(hostTrigger).toBeFocused();
    const hostDialog = page.getByRole("dialog", {
      name: "Arbitrated date",
      exact: true,
    });
    await hostTrigger.click();
    await expect(hostDialog).toBeVisible();
    await day(hostDialog.getByRole("grid"), "October 19, 2026").click();
    await expect(hostDialog).toBeHidden();
    await expect(host.getByLabel("Pending date request")).toHaveText(
      "2026-10-19",
    );
    await expect(projected).toHaveValue("2026-10-18");
    expect(
      await projected.evaluate((node) => [
        ...new FormData((node as HTMLInputElement).form!).entries(),
      ]),
    ).toEqual([["due", "2026-10-18"]]);
    const targetEvents = host
      .getByLabel("Target event observations")
      .locator("[data-event-type]");
    await expect(targetEvents).toHaveCount(0);
    await host
      .getByRole("button", { name: "Resolve deferred refusal", exact: true })
      .click();
    await expect(host.getByLabel("Pending date request")).toHaveText("refused");
    await expect(projected).toHaveValue("2026-10-18");
    expect(
      await projected.evaluate((node) => [
        ...new FormData((node as HTMLInputElement).form!).entries(),
      ]),
    ).toEqual([["due", "2026-10-18"]]);
    await expect(targetEvents).toHaveCount(0);
    await host
      .getByRole("button", {
        name: "Accept date programmatically",
        exact: true,
      })
      .click();
    await expect(projected).toHaveValue("2026-10-19");
    await expect(targetEvents).toHaveCount(1);
    const observedChange = targetEvents.nth(0);
    await expect(observedChange).toHaveAttribute("data-event-type", "change");
    await expect(observedChange).toHaveAttribute(
      "data-event-value",
      "2026-10-19",
    );
    await expect(observedChange).toHaveAttribute("data-event-bubbles", "false");
    await host.evaluate((root) => {
      root
        .querySelector('input[type="date"]')!
        .dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(targetEvents).toHaveCount(2);
    const observedInput = targetEvents.nth(1);
    await expect(observedInput).toHaveAttribute("data-event-type", "input");
    await expect(observedInput).toHaveAttribute(
      "data-event-value",
      "2026-10-19",
    );
    await expect(observedInput).toHaveAttribute("data-event-bubbles", "true");
    expect(
      await projected.evaluate((node) => [
        ...new FormData((node as HTMLInputElement).form!).entries(),
      ]),
    ).toEqual([["due", "2026-10-19"]]);

    const maskedField = fixture(page, "date-picker-field-name-resolution");
    await expect(
      maskedField.getByRole("button", {
        name: "Form.Field owner picker",
        exact: true,
      }),
    ).toBeVisible();
    await expect(maskedField.locator('input[type="date"]')).toHaveAttribute(
      "name",
      "due",
    );
  }));

test("date picker dismissal and removed trigger preserve focus policy", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-dismissal");
    const trigger = scene.getByRole("button", {
      name: "Dismissible date",
      exact: true,
    });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Dismissible date",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const accepted = scene
      .locator("#dismiss-picker")
      .getByLabel("Accepted date");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(accepted).toHaveText("2026-10-18");
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog).toBeVisible();
    const outside = page.getByRole("button", {
      name: "Outside date-picker target",
      exact: true,
    });
    await outside.click();
    await expect(dialog).toBeHidden();
    await expect(outside).toBeFocused();
    await expect(accepted).toHaveText("2026-10-18");

    await trigger.click();
    await expect(dialog).toBeVisible();
    const remove = scene.getByRole("button", {
      name: "Remove date-picker trigger",
      exact: true,
    });
    await remove.click();
    await expect(trigger).toHaveCount(0);
    await expect(dialog).toBeHidden();
    await expect(remove).toBeFocused();
    expect(
      await page.evaluate(() => [
        document.body.style.pointerEvents,
        document.body.style.overflow,
      ]),
    ).toEqual(["", ""]);
  }));

test("date picker scoped roots preserve nested state isolation", async ({
  page,
}, info) =>
  withDiagnostics(page, async () => {
    await openGallery(page, info);
    const scene = fixture(page, "date-picker-scoped-roots");
    const outer = scene.getByRole("button", {
      name: "Open outer scoped date picker",
      exact: true,
    });
    await expect(outer).toBeVisible();
    await outer.click();
    const outerDialog = page.getByRole("dialog", {
      name: "Outer scoped date picker",
      exact: true,
    });
    await expect(outerDialog).toBeVisible();
    await outerDialog.evaluate((node) =>
      Object.assign((node as HTMLElement).style, {
        height: "120px",
        maxHeight: "120px",
        overflowY: "auto",
      }),
    );
    const inner = outerDialog.getByRole("button", {
      name: "Open inner scoped date picker",
      exact: true,
    });
    await inner.scrollIntoViewIfNeeded();
    await inner.focus();
    const outerScrollBeforeOpen = await outerDialog.evaluate(
      (node) => node.scrollTop,
    );
    await page.keyboard.press("Enter");
    const innerDialog = page.getByRole("dialog", {
      name: "Inner scoped date picker",
      exact: true,
    });
    await expect(innerDialog).toBeVisible();
    expect(await outerDialog.evaluate((node) => node.scrollTop)).toBe(
      outerScrollBeforeOpen,
    );
    const nestedFocusedDay = day(
      innerDialog.getByRole("grid"),
      "October 19, 2026",
    );
    await innerDialog.evaluate((node) =>
      Object.assign((node as HTMLElement).style, {
        height: "100px",
        maxHeight: "100px",
        overflowY: "auto",
      }),
    );
    await nestedFocusedDay.evaluate((node) => (node as HTMLElement).blur());
    await nestedFocusedDay.focus();
    await expect(nestedFocusedDay).toBeFocused();
    expect(
      await innerDialog.evaluate((node) => node.scrollTop),
    ).toBeGreaterThan(0);
    const focusedDayInsidePopup = await innerDialog.evaluate((node) => {
      const focused = node.querySelector<HTMLElement>(
        '[role="grid"] button:focus',
      );
      if (!focused) return false;
      const popupRect = node.getBoundingClientRect();
      const focusedRect = focused.getBoundingClientRect();
      const visibleTop = popupRect.top + node.clientTop;
      const visibleBottom = visibleTop + node.clientHeight;
      return (
        focusedRect.top >= visibleTop && focusedRect.bottom <= visibleBottom
      );
    });
    expect(focusedDayInsidePopup).toBe(true);
    expect(await outerDialog.evaluate((node) => node.scrollTop)).toBe(
      outerScrollBeforeOpen,
    );
    await page.keyboard.press("Enter");
    await expect(scene.getByLabel("Inner accepted date")).toHaveText(
      "2026-10-19",
    );
    await expect(scene.getByLabel("Outer accepted date")).toHaveText(
      "2026-10-18",
    );
    await expect(
      outerDialog.getByRole("heading", { name: "October 2026", exact: true }),
    ).toBeVisible();
    await expect(innerDialog).toBeHidden();
    await expect(outerDialog).toBeVisible();
    await expect(inner).toBeFocused();
    await inner.click();
    await expect(innerDialog).toBeVisible();
    await expect(
      innerDialog.getByRole("heading", { name: "October 2026", exact: true }),
    ).toBeVisible();
    await expect(scene.getByLabel("Inner accepted date")).toHaveText(
      "2026-10-19",
    );
    await expect(scene.getByLabel("Outer accepted date")).toHaveText(
      "2026-10-18",
    );
    await page.keyboard.press("Escape");
    await expect(innerDialog).toBeHidden();
    await expect(inner).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(outerDialog).toBeHidden();
    await expect(outer).toBeFocused();
  }));
