import { expect, test, type Page } from '@playwright/test';

const text = (page: Page, id: string) => page.getByTestId(id).innerText();
const money = async (page: Page, id: string) => Number((await text(page, id)).replace(/[^0-9.−-]/g, '').replace('−', '-'));

/** Moves a range input with the keyboard, the way a reader on a laptop would. */
async function nudge(page: Page, testId: string, key: 'ArrowRight' | 'ArrowLeft' | 'Home' | 'End', times = 1) {
  const input = page.getByTestId(testId).locator('input[type=range]');
  await input.focus();
  for (let k = 0; k < times; k++) await input.press(key);
}

test('1. defaults answer the four questions: rent, tokens, revenue, profit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('revenue')).toHaveText('$23,309');
  await expect(page.getByTestId('cost')).toHaveText('$18,144');
  await expect(page.getByTestId('profit')).toHaveText('$5,165');
  await expect(page.getByTestId('margin')).toHaveText('22% margin');
  await expect(page.getByTestId('equation')).toContainText('1.2B out · 75.7B in');
  await expect(page.getByTestId('rack-caption')).toHaveText('11 GPUs earn the profit · 39 pay the rent · 22 idle');
  await expect(page.getByTestId('disclaimer')).toContainText('Not financial, investment, tax, or purchasing advice');
});

test('2. the contract toggle cuts rent to $317/hr and lands in the URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Rent on contract/ }).click();
  await expect(page.getByTestId('cost')).toHaveText('$7,603');
  await expect(page.getByTestId('profit')).toHaveText('$15,705');
  await expect(page.getByTestId('margin')).toHaveText('67% margin');
  await expect(page).toHaveURL(/rb=contract/);
});

test('3. selling less capacity lowers profit; the break-even tick sits at 54%', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('s-sold')).toContainText('break-even 54%');
  const before = await money(page, 'profit');
  await nudge(page, 's-sold', 'ArrowLeft', 20);
  await expect(page.getByTestId('s-sold')).toContainText('50%');
  const after = await money(page, 'profit');
  expect(after).toBeLessThan(before);
  expect(after).toBeLessThan(0);
  await expect(page.getByTestId('rack-caption')).toContainText('working GPUs cover');
  await expect(page).toHaveURL(/u=0\.5/);
});

test('4. more input per output raises revenue (agents resend context)', async ({ page }) => {
  await page.goto('/');
  const before = await money(page, 'revenue');
  await nudge(page, 's-ratio', 'ArrowRight', 20);
  await expect(page.getByTestId('s-ratio')).toContainText('83 : 1');
  expect(await money(page, 'revenue')).toBeGreaterThan(before);
});

test('5. owning swaps rent for the cost of owning and a rack-price slider', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Own' }).click();
  await expect(page.getByTestId('cost')).toHaveText('$4,132');
  await expect(page.getByTestId('s-capex')).toContainText('$3.90M');
  await expect(page.getByTestId('s-rent')).toHaveCount(0);
  await expect(page.getByTestId('rack-caption')).toContainText('pay for the rack');
});

test('6. GB300 uses its own curve, rent and price list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'GB300' }).click();
  await expect(page.getByTestId('cost')).toHaveText('$21,462');
  await expect(page.getByTestId('revenue')).toHaveText('$28,535');
  await expect(page.getByRole('radio', { name: /Rent on demand \$894\/hr/ })).toBeVisible();
});

test('7. a shared URL restores the scenario; reset returns to the defaults', async ({ page }) => {
  await page.goto('/?r=gb300&rb=contract&u=0.9&pp=list');
  await expect(page.getByTestId('s-sold')).toContainText('90%');
  await expect(page.getByRole('radio', { name: 'Z.ai list' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('cost')).toHaveText('$8,640');
  await page.getByRole('button', { name: /Reset/ }).click();
  await expect(page.getByTestId('profit')).toHaveText('$5,165');
  await expect(page).toHaveURL(/\/$/);
});

test('8. phone: no sideways scroll, every control reachable', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.getByRole('radio', { name: /Rent on contract/ }).tap();
  await expect(page.getByTestId('profit')).toHaveText('$15,705');
  await page.screenshot({ path: 'e2e/screenshots/phone.png', fullPage: true });
  await ctx.close();
});

test('9. dark mode renders with no console errors', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByTestId('profit')).toHaveText('$5,165');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(18, 18, 17)');
  expect(errors).toEqual([]);
  await ctx.close();
});
