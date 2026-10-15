import type { Page } from "@playwright/test";
import axe from "axe-core";

export async function accessibilityViolations(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  await page.evaluate(axe.source);
  return page.evaluate(async () => {
    const result = await (window as unknown as { axe: typeof axe }).axe.run();
    return result.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ target, failureSummary }) => ({
        target,
        failureSummary,
      })),
    }));
  });
}
