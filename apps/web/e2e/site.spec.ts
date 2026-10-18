import { expect, test } from '@playwright/test';

const kpi = (page: import('@playwright/test').Page, id: string) => page.getByTestId(id).locator('.kpi-value');
const shots = 'e2e/screenshots';

test('1. defaults: payback 4 mo, 7.7B tokens/day, disclaimer present', async ({ page }) => {
  await page.goto('/');
  await expect(kpi(page, 'kpi-payback')).toHaveText('4 mo');
  await expect(kpi(page, 'kpi-tokens')).toHaveText('7.7B');
  await expect(page.getByTestId('disclaimer')).toContainText('Not affiliated with, sponsored by, or representing the views of any employer');
  await expect(page.getByTestId('disclaimer')).toContainText('Not financial, investment, tax, or purchasing advice');
});

test('2. utilization 100% via number input raises revenue and lands in the URL', async ({ page }) => {
  await page.goto('/');
  const before = await kpi(page, 'kpi-revenue').textContent();
  const input = page.getByTestId('knob-utilization').locator('input.knob-num');
  await input.fill('100');
  await input.press('Enter');
  await expect(kpi(page, 'kpi-revenue')).not.toHaveText(before!);
  await expect(kpi(page, 'kpi-revenue')).toHaveText('$67.5K');
  await expect.poll(() => page.url()).toContain('u=1');
});

test('3. presets: pitch pays back within a month, bear never', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pitch' }).click();
  await expect(kpi(page, 'kpi-payback')).toHaveText('≤1 mo');
  await expect.poll(() => page.url()).toContain('preset=pitch');
  await page.getByRole('button', { name: 'Bear' }).click();
  await expect(kpi(page, 'kpi-payback')).toContainText('never');
});

test('4. GB300: speed slider min becomes 67 and KPIs change', async ({ page }) => {
  await page.goto('/');
  const tokens = await kpi(page, 'kpi-tokens').textContent();
  await page.getByTestId('rack-switch').getByRole('radio', { name: 'GB300 NVL72' }).click();
  await expect(page.getByTestId('knob-speed').locator('input[type=range]')).toHaveAttribute('min', '67');
  await expect(kpi(page, 'kpi-tokens')).not.toHaveText(tokens!);
  await expect(kpi(page, 'kpi-tokens')).toHaveText('9.0B');
});

test('5. phone has no horizontal scroll; screenshots at phone and desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(kpi(page, 'kpi-payback')).toHaveText('4 mo');
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(390);
  await page.screenshot({ path: `${shots}/phone-full.png`, fullPage: true });
  await page.getByRole('button', { name: /Advanced/ }).click();
  const sw2 = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw2).toBeLessThanOrEqual(390);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.screenshot({ path: `${shots}/desktop.png` });
  await page.screenshot({ path: `${shots}/desktop-full.png`, fullPage: true });
  // the short disclaimer is above the fold on desktop
  const note = page.locator('.header-note');
  await expect(note).toBeInViewport();
});

test('6. URL restores knob values', async ({ page }) => {
  await page.goto('/?r=gb300&u=0.8&d=0.3');
  await expect(page.getByTestId('rack-switch').getByRole('radio', { name: 'GB300 NVL72' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('knob-utilization').locator('input.knob-num')).toHaveValue('80');
  await expect(page.getByLabel('Price decline value')).toHaveValue('30');
});

test('7. About opens with sources and the disclaimer; dark mode renders', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About' }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText('Not financial, investment, tax, or purchasing advice');
  await expect(dlg.getByRole('link').first()).toBeVisible();
  await page.screenshot({ path: `${shots}/about.png` });
  await page.keyboard.press('Escape');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: `${shots}/desktop-dark.png`, fullPage: true });
});
