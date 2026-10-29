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
  await expect(page.getByTestId('revenue')).toHaveText('$20,676');
  await expect(page.getByTestId('cost')).toHaveText('$10,109');
  await expect(page.getByTestId('overhead')).toHaveText('$103');
  await expect(page.getByTestId('profit')).toHaveText('$10,464');
  await expect(page.getByTestId('margin')).toHaveText('51% margin');
  await expect(page.getByTestId('equation')).toContainText('1.1B out · 67.2B in');
  await expect(page.getByTestId('unit-line')).toHaveText('Each GPU sells 171 output tokens/s at $19.39 per million, input included: $11.97 an hour against $5.85 rent. Each user sees 95 tok/s, what OpenRouter calls throughput.');
  await expect(page.getByTestId('chart-readout')).toHaveText('At 65% utilization: $10,464 a day renting on a 3-yr contract. Break-even at 32%.');
  await expect(page.getByTestId('profit-chart').getByRole('img')).toHaveAttribute('aria-label', /^Profit per day against GPU utilization\. renting on a 3-yr contract, the selected option, breaks even at 32% and makes \$10,464 a day at 65% utilization\. For comparison, renting on demand breaks even at 57%; owning breaks even at 16%\.$/);
  await expect(page.locator('.byline')).toContainText('Ganeshkumar Ashokavardhanan');
  await expect(page.locator('.byline a')).toHaveAttribute('href', 'https://ganeshkumarashok.com');
  // Each revenue line multiplies out from what it shows.
  await expect(page.getByTestId('receipt')).toContainText('1.0661B × $4.40/M');
  await expect(page.getByTestId('receipt')).toContainText('$4,691');
  await expect(page.getByTestId('disclaimer')).toContainText('Not financial, investment, tax, or purchasing advice');
  await expect(page.getByTestId('disclaimer').getByRole('link')).toHaveAttribute('href', 'https://github.com/ganeshkumarashok/token-margin');
  await expect(page.getByTestId('repo-link')).toHaveAttribute('href', 'https://github.com/ganeshkumarashok/token-margin');
});

test('2. the on-demand toggle raises rent to $756/hr and lands in the URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Rent on demand/ }).click();
  await expect(page.getByTestId('cost')).toHaveText('$18,144');
  await expect(page.getByTestId('profit')).toHaveText('$2,428');
  await expect(page.getByTestId('margin')).toHaveText('12% margin');
  await expect(page.getByTestId('s-sold')).toContainText('65%');
  await expect(page).toHaveURL(/rb=onDemand/);
});

test('3. lower utilization lowers profit; the break-even tick sits at 32%', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('s-sold')).toContainText('break-even 32%');
  const before = await money(page, 'profit');
  await nudge(page, 's-sold', 'ArrowLeft', 40);
  await expect(page.getByTestId('s-sold')).toContainText('25%');
  const after = await money(page, 'profit');
  expect(after).toBeLessThan(before);
  expect(after).toBeLessThan(0);
  await expect(page.getByTestId('chart-readout')).toContainText('At 25% utilization: −$2,196 a day');
  await expect(page).toHaveURL(/u=0\.25/);
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
  await page.getByRole('radio', { name: /^Own, all-in/ }).click();
  await expect(page.getByTestId('cost')).toHaveText('$5,069');
  await expect(page.getByTestId('s-capex')).toContainText('$3.90M · $2.93/GPU-hr all-in');
  await expect(page.getByTestId('equation')).toContainText('$211/hr all-in, owned');
  await expect(page.getByTestId('s-rent')).toHaveCount(0);
  await expect(page.getByTestId('chart-readout')).toContainText('a day owning');
  await expect(page.getByTestId('profit-chart').getByRole('img')).toHaveAttribute('aria-label', /owning, the selected option, breaks even at 16%/);
  await expect(page.getByTestId('s-power')).toContainText('14.5¢/kWh · $388/day');
  await expect(page.getByTestId('s-ops')).toContainText('$400/day');
  await page.goto('/?t=own&e=0.25');
  await expect(page.getByTestId('s-power')).toContainText('25.0¢/kWh · $667/day');
});

test('6. GB300 uses its own curve, rent and price list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'GB300' }).click();
  await expect(page.getByTestId('cost')).toHaveText('$11,405');
  await expect(page.getByTestId('revenue')).toHaveText('$25,967');
  await expect(page.getByRole('radio', { name: /Rent on demand\s*\$894\/hr/ })).toBeVisible();
});

test('7. a shared URL restores the scenario; reset returns to the defaults', async ({ page }) => {
  await page.goto('/?r=gb300&rb=contract&u=0.9&pp=list');
  await expect(page.getByTestId('s-sold')).toContainText('90%');
  await expect(page.getByRole('radio', { name: 'High' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('cost')).toHaveText('$11,405');
  await page.getByRole('button', { name: /Reset/ }).click();
  await expect(page.getByTestId('profit')).toHaveText('$10,464');
  await expect(page).toHaveURL(/\/$/);
});

test('8. phone: no sideways scroll, every control reachable', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await page.getByRole('radio', { name: /Rent on demand/ }).tap();
  await expect(page.getByTestId('profit')).toHaveText('$2,428');
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
  await expect(page.getByTestId('profit')).toHaveText('$10,464');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(18, 18, 17)');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('10. overhead adds a cost term and turns gross profit into profit', async ({ page }) => {
  await page.goto('/?oh=0.1');
  await expect(page.getByTestId('overhead')).toHaveText('$2,068');
  await expect(page.getByTestId('profit')).toHaveText('$8,499');
  await expect(page.getByTestId('margin')).toHaveText('41% margin');
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
  await page.getByRole('radio', { name: /^Own, all-in/ }).click();
  await expect(page.getByTestId('s-overhead')).toContainText('0.5% of revenue');
  await page.getByRole('radio', { name: /Rent, 3-yr contract/ }).click();
  await expect(page.getByTestId('s-overhead')).toContainText('10% of revenue');
  await page.goto('/?rent=8');
  await expect(page.getByTestId('s-rent')).toContainText('$576/hr');
  await page.getByRole('radio', { name: /Rent on demand/ }).click();
  await expect(page.getByTestId('s-rent')).toContainText('$756/hr');
  await page.getByRole('radio', { name: /Rent, 3-yr contract/ }).click();
  await expect(page.getByTestId('s-rent')).toContainText('$576/hr');
  await page.getByRole('radio', { name: 'GB300' }).click();
  await expect(page.getByTestId('s-rent')).toContainText('$475/hr');
});

test('13. without JavaScript the page still shows the day, the receipt and the sources', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What are the margins on inference?');
  await expect(page.getByTestId('profit')).toHaveText('$10,464');
  await expect(page.getByTestId('receipt')).toContainText('Profit');
  await expect(page.getByTestId('disclaimer')).toContainText('Not financial, investment, tax, or purchasing advice');
  await ctx.close();
});

test('14. a shared link with settings renders its own numbers over the pre-rendered default', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/?rb=onDemand');
  await expect(page.getByTestId('profit')).toHaveText('$2,428');
  await expect(page.locator('#root .answer')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('15. robots.txt and the sitemap point at the canonical address', async ({ page, request }) => {
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://tokens.ganeshkumarashok.com/sitemap.xml');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://tokens.ganeshkumarashok.com/</loc>');
  await page.goto('/');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://tokens.ganeshkumarashok.com/');
});

test('16. the page can be cited, and the citation follows the reader\'s settings', async ({ page }) => {
  await page.goto('/');
  const cite = page.getByTestId('cite');
  await expect(cite).toContainText('Ashokavardhanan, G. (2026). What are the margins on inference? Token margin, data as of Oct 25, 2026. https://tokens.ganeshkumarashok.com/');
  await cite.getByText('BibTeX').click();
  await expect(cite.locator('pre')).toContainText('@misc{ashokavardhanan2026margins,');
  await page.goto('/?rb=onDemand&utm_source=x');
  await expect(cite).toContainText('https://tokens.ganeshkumarashok.com/?rb=onDemand');
  await expect(cite).not.toContainText('utm_source');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld.author.name).toBe('Ganeshkumar Ashokavardhanan');
  expect(ld.version).toBe('data-2026-10-25');
});

test('17. the traffic mix says it is computed from OpenRouter counts and links the source', async ({ page }) => {
  await page.goto('/');
  const ratio = page.getByTestId('s-ratio');
  await expect(ratio).toContainText('30 days: 63 : 1 (35 to 85 by day)');
  await expect(ratio.getByRole('link', { name: "OpenRouter's GLM-5.3 page" })).toHaveAttribute('href', 'https://openrouter.ai/z-ai/glm-5.3');
  await ratio.getByRole('link', { name: 'how it is worked out' }).click();
  await expect(page.locator('#faq-ratio').getByRole('link', { name: 'calculation' })).toHaveAttribute('href', /research\/openrouter_ratios\.py$/);
  await expect(page.getByTestId('s-cache').getByRole('link', { name: 'OpenRouter' })).toHaveAttribute('href', 'https://openrouter.ai/z-ai/glm-5.3');
});

test('18. FAQ and sources start folded; a question opens on its own; a footnote opens the sources at its entry', async ({ page }) => {
  await page.goto('/');
  const faq = page.getByTestId('faq');
  await expect(faq).not.toHaveAttribute('open', '');
  await expect(faq.getByText('How is "63 input tokens per output" worked out?')).toBeHidden();
  await faq.locator('summary').first().click();
  const ratio = faq.locator('#faq-ratio');
  await expect(ratio.locator('summary')).toHaveText('How is "63 input tokens per output" worked out?');
  await expect(ratio.getByText('62.7 to 1')).toBeHidden();
  await ratio.locator('summary').click();
  await expect(ratio.getByText('62.7 to 1')).toBeVisible();
  await expect(faq.locator('#faq-setup').getByText('NVIDIA Dynamo')).toBeHidden();
  const sources = page.getByTestId('sources');
  await expect(sources.locator('ol')).toBeHidden();
  await page.getByTestId('receipt').locator('sup a').first().click();
  await expect(sources.locator('ol')).toBeVisible();
  await expect(page).toHaveURL(/#src-1$/);
  await expect(page.locator('#src-1')).toBeInViewport();
});

test('19. the cost box shows the rent the slider sets, and each way of renting keeps its own', async ({ page }) => {
  await page.goto('/');
  const contract = page.getByRole('radio', { name: /Rent, 3-yr contract/ });
  const onDemand = page.getByRole('radio', { name: /Rent on demand/ });
  await expect(contract).toHaveText(/\$421\/hr$/);
  await nudge(page, 's-rent', 'ArrowRight', 40);
  await expect(contract).toHaveText(/\$565\/hr$/);
  await expect(page.getByTestId('s-rent')).toContainText('$565/hr · $7.85/GPU');
  await expect(page.getByTestId('cost')).toHaveText('$13,565');
  await onDemand.click();
  await expect(onDemand).toHaveText(/\$756\/hr$/);
  await expect(contract).toHaveText(/\$565\/hr$/);
  await page.getByRole('radio', { name: 'GB300' }).click();
  await expect(contract).toHaveText(/\$475\/hr$/);
});

test('20. the utilization hint opens the FAQ at its own entry; the link works on its own', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'why 65% by default' }).click();
  await expect(page).toHaveURL(/#faq-utilization$/);
  await expect(page.locator('#faq-utilization').getByText('0.84 × 0.82 × 0.95 ≈ 65%')).toBeVisible();
  await expect(page.locator('#faq-utilization')).toBeInViewport();
  await page.goto('/#faq-owning');
  await expect(page.locator('#faq-owning').getByText('hand the rack back')).toBeVisible();
});
