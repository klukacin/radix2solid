import axe from 'axe-core';
import type { Page } from '@playwright/test';

export async function accessibilityViolations(page: Page, context?: string) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity)
      .map(animation => animation.finished.catch(() => {})));
  });
  await page.evaluate(axe.source);
  return page.evaluate(async context => {
    const result = context
      ? await (window as unknown as { axe: typeof axe }).axe.run(context)
      : await (window as unknown as { axe: typeof axe }).axe.run();
    return result.violations.map(({ id, nodes }) => ({
      id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    }));
  }, context);
}
