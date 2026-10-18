import { test } from '@playwright/test';
// Close-up shots for visual review (not assertions).
test('zoom shots', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const cards = page.locator('figure.card');
  for (let k = 0; k < 4; k++) await cards.nth(k).screenshot({ path: `e2e/screenshots/card-${k}.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?preset=bear');
  await page.locator('figure.card').nth(1).screenshot({ path: 'e2e/screenshots/phone-heatmap-bear.png' });
});
test('dark close-ups', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const cards = page.locator('figure.card');
  await cards.nth(0).screenshot({ path: 'e2e/screenshots/dark-card-0.png' });
  await cards.nth(1).screenshot({ path: 'e2e/screenshots/dark-card-1.png' });
});
