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
  await expect(page.getByTestId('revenue')).toHaveText('$22,842');
  await expect(page.getByTestId('cost')).toHaveText('$18,144');
  await expect(page.getByTestId('profit')).toHaveText('$4,698');
  await expect(page.getByTestId('margin')).toHaveText('21% gross margin');
  await expect(page.getByTestId('equation')).toContainText('1.2B out · 74.2B in');
  await expect(page.getByTestId('chart-readout')).toHaveText('At 70% utilization: $4,698 a day renting on demand. Break-even at 56%.');
  await expect(page.getByTestId('profit-chart').getByRole('img')).toHaveAttribute('aria-label', /renting on demand breaks even at 56%; renting on a 3-yr contract breaks even at 31%; owning breaks even at 15%/);
  await expect(page.getByTestId('disclaimer')).toContainText('Not financial, investment, tax, or purchasing advice');
  await expect(page.getByTestId('disclaimer').getByRole('link')).toHaveAttribute('href', 'https://github.com/ganeshkumarashok/token-margin');
});

test('2. the contract toggle cuts rent to $421/hr and lands in the URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Rent on contract/ }).click();
  await expect(page.getByTestId('cost')).toHaveText('$10,109');
  await expect(page.getByTestId('profit')).toHaveText('$7,839');
  await expect(page.getByTestId('margin')).toHaveText('44% gross margin');
  await expect(page.getByTestId('s-sold')).toContainText('55%');
  await expect(page).toHaveURL(/rb=contract/);
});

test('3. lower utilization lowers profit; the break-even tick sits at 56%', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('s-sold')).toContainText('break-even 56%');
  const before = await money(page, 'profit');
  await nudge(page, 's-sold', 'ArrowLeft', 20);
  await expect(page.getByTestId('s-sold')).toContainText('50%');
  const after = await money(page, 'profit');
  expect(after).toBeLessThan(before);
  expect(after).toBeLessThan(0);
  await expect(page.getByTestId('chart-readout')).toContainText('At 50% utilization: −$1,828 a day');
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
  await expect(page.getByTestId('cost')).toHaveText('$5,036');
  await expect(page.getByTestId('s-capex')).toContainText('$3.90M · $2.91/GPU-hr all-in');
  await expect(page.getByTestId('equation')).toContainText('$210/hr all-in, owned');
  await expect(page.getByTestId('s-rent')).toHaveCount(0);
  await expect(page.getByTestId('chart-readout')).toContainText('a day owning');
  await expect(page.getByTestId('s-power')).toContainText('14.5¢/kWh · $355/day');
  await expect(page.getByTestId('s-ops')).toContainText('$400/day');
  await page.goto('/?t=own&e=0.25');
  await expect(page.getByTestId('s-power')).toContainText('25.0¢/kWh · $611/day');
});

test('6. GB300 uses its own curve, rent and price list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'GB300' }).click();
  await expect(page.getByTestId('cost')).toHaveText('$21,462');
  await expect(page.getByTestId('revenue')).toHaveText('$27,965');
  await expect(page.getByRole('radio', { name: /Rent on demand \$894\/hr/ })).toBeVisible();
});

test('7. a shared URL restores the scenario; reset returns to the defaults', async ({ page }) => {
  await page.goto('/?r=gb300&rb=contract&u=0.9&pp=list');
  await expect(page.getByTestId('s-sold')).toContainText('90%');
  await expect(page.getByRole('radio', { name: 'High' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('cost')).toHaveText('$11,405');
  await page.getByRole('button', { name: /Reset/ }).click();
  await expect(page.getByTestId('profit')).toHaveText('$4,698');
  await expect(page).toHaveURL(/\/$/);
});

test('8. phone: no sideways scroll, every control reachable', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.getByRole('radio', { name: /Rent on contract/ }).tap();
  await expect(page.getByTestId('profit')).toHaveText('$7,839');
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
  await expect(page.getByTestId('profit')).toHaveText('$4,698');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(18, 18, 17)');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('10. overhead adds a cost term and turns gross profit into profit', async ({ page }) => {
  await page.goto('/?oh=0.1');
  await expect(page.getByTestId('overhead')).toHaveText('$2,284');
  await expect(page.getByTestId('profit')).toHaveText('$2,414');
  await expect(page.getByTestId('margin')).toHaveText('11% margin');
  await expect(page.getByTestId('s-overhead')).toContainText('10% of revenue');
});

test('11. hovering the chart reads out all three ways of paying for the rack', async ({ page }) => {
  await page.goto('/');
  const box = await page.getByTestId('profit-chart').locator('rect').boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height / 2);
  await expect(page.getByTestId('chart-readout')).toContainText('At 50%');
  await expect(page.getByTestId('chart-readout')).toContainText('on demand');
  await expect(page.getByTestId('chart-readout')).toContainText('3-yr contract');
  await expect(page.getByTestId('chart-readout')).toContainText('own');
});

test('12. overhead and a typed rent stay with their own way of paying; a rack switch drops a typed rent', async ({ page }) => {
  await page.goto('/?oh=0.1');
  await page.getByRole('radio', { name: 'Own' }).click();
  await expect(page.getByTestId('s-overhead')).toContainText('0% of revenue');
  await page.getByRole('radio', { name: /Rent on demand/ }).click();
  await expect(page.getByTestId('s-overhead')).toContainText('10% of revenue');
  await page.goto('/?rent=8');
  await expect(page.getByTestId('s-rent')).toContainText('$576/hr');
  await page.getByRole('radio', { name: /Rent on contract/ }).click();
  await expect(page.getByTestId('s-rent')).toContainText('$421/hr');
  await page.getByRole('radio', { name: /Rent on demand/ }).click();
  await expect(page.getByTestId('s-rent')).toContainText('$576/hr');
  await page.getByRole('radio', { name: 'GB300' }).click();
  await expect(page.getByTestId('s-rent')).toContainText('$894/hr');
});
