import { test } from '@playwright/test';

// The social card image (public/og.png) is rendered from the page itself, plus close-ups for visual review.
test('social card', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'public/og.png' });
  await ctx.close();
});

test('close-ups', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const [name, q] of [['rent', ''], ['contract', '?rb=contract'], ['own', '?t=own'], ['loss', '?u=0.4'], ['overhead', '?oh=0.15']]) {
    await page.goto(`/${q}`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.answer').screenshot({ path: `e2e/screenshots/answer-${name}.png` });
  }
  await page.locator('.controls').screenshot({ path: 'e2e/screenshots/controls.png' });
});
