import { expect, test, type Page } from '@playwright/test';

const products = [
  { id: 'ENCHANTED_DIAMOND', name: 'Enchanted Diamond', buyPrice: 172000, sellPrice: 165000, margin: 7000, buyVolume: 1, sellVolume: 1, buyMovingWeek: 1, sellMovingWeek: 1, buyOrders: 1, sellOrders: 1, updatedAt: new Date().toISOString() },
];

async function mockApi(page: Page) {
  await page.route('**/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    switch (url.pathname) {
      case '/v1/status':
        return json({ indicator: 'none', description: 'All systems operational', components: [], incidents: [], checkedAt: new Date().toISOString() });
      case '/v1/me':
        return json({ error: 'unauthorized', message: 'Sign in required' }, 401);
      case '/v1/flags':
        return json({ flags: {} });
      case '/v1/bazaar':
        return json({ products });
      case '/v1/news':
        return json({ news: [{ id: 'https://hypixel.net/threads/1', title: 'SkyBlock 0.23.1', publishedAt: new Date().toISOString() }] });
      default:
        return json({ error: 'not_found', message: 'mocked' }, 404);
    }
  });
}

test.beforeEach(async ({ page }) => mockApi(page));

test('home page shows Hypixel status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('All systems operational').first()).toBeVisible();
});

test('command palette finds a bazaar item and opens it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcut test is desktop only');
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByRole('dialog', { name: 'Command palette' }).getByRole('textbox').fill('diam');
  await page.getByRole('option', { name: /Enchanted Diamond/ }).click();
  await expect(page).toHaveURL(/\/bazaar\/ENCHANTED_DIAMOND/);
});

test('keyboard shortcut list opens with ?', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await page.keyboard.press('Shift+?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
});

test('theme setting applies and survives a reload', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Theme').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('mobile menu opens', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.locator('#main-nav')).toBeVisible();
  await page.locator('#main-nav').getByText('Bazaar').click();
  await expect(page).toHaveURL(/\/bazaar$/);
});

test('news drawer lists patch notes', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await page.getByRole('button', { name: 'News' }).click();
  await expect(page.getByRole('link', { name: 'SkyBlock 0.23.1' })).toBeVisible();
});
