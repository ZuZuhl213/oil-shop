import { expect, test, type Page } from '@playwright/test';
import { product } from '../src/test/catalog-fixtures';

const line = {
  productId: product.id, productName: product.name, productSlug: product.slug,
  variantId: '41', variantName: 'Chai 1L', price: 90000, quantity: 3,
  minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut',
};

async function seedCart(page: Page) {
  await page.addInitScript((item) => {
    if (!localStorage.getItem('hm_naturals_cart_v1')) {
      localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ version: 1, saleType: 'FIXED_PRICE', items: [item] }));
    }
  }, line);
}

test('drawer traps keyboard focus, restores its trigger and scroll, and supports backdrop close', async ({ page, isMobile }, testInfo) => {
  await seedCart(page);
  await page.route('**/api/v1/products/**', (route) => route.fulfill({ json: product }));
  await page.goto('/cart');
  await page.evaluate(() => {
    document.body.style.setProperty('overflow-x', 'hidden', 'important');
    document.body.style.overflowY = 'scroll';
    document.documentElement.style.overflowY = 'auto';
  });
  const trigger = page.getByRole('button', { name: /Mở giỏ hàng/ });
  const scrollStyles = () => page.evaluate(() => [document.body, document.documentElement].map((element) =>
    ['overflow-x', 'overflow-y'].map((name) => [element.style.getPropertyValue(name), element.style.getPropertyPriority(name)])));
  const overflowBefore = await scrollStyles();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Giỏ hàng HM NATURALS' });
  const close = dialog.getByRole('button', { name: 'Đóng giỏ hàng' });
  await expect(close).toBeFocused();
  await close.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: /Tiếp tục đặt hàng/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  expect(await page.evaluate(() => [document.body.style.overflow, document.documentElement.style.overflow])).toEqual(['hidden', 'hidden']);
  await page.screenshot({ path: testInfo.outputPath('cart-drawer.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await scrollStyles()).toEqual(overflowBefore);

  await trigger.click();
  await page.locator('.cart-drawer-backdrop').click({ position: { x: 5, y: 100 } });
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  // The existing desktop header uses full navigation links; its menu button is hidden.
  if (!isMobile) return;
  const menuTrigger = page.getByRole('button', { name: /Mở thực đơn/ });
  await menuTrigger.click();
  const menu = page.getByRole('dialog', { name: 'Menu điều hướng' });
  await expect(menu.getByRole('button', { name: 'Đóng menu' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(menuTrigger).toBeFocused();
});

test('Catalog retry preserves cart and variant change renders adjusted quantity and price without sending orders', async ({ page }, testInfo) => {
  await seedCart(page);
  let catalogRequests = 0;
  const orders: string[] = [];
  await page.route('**/api/v1/**', async (route) => {
    if (route.request().url().includes('/products/')) {
      catalogRequests++;
      if (catalogRequests === 1) {
        await route.fulfill({ status: 503, json: { code: 'UNAVAILABLE', message: 'Unavailable' } });
      } else {
        await route.fulfill({ json: { ...product, variants: [...product.variants,
          { ...product.variants[1], id: 'inactive', name: 'Không bán', isActive: false },
        ] } });
      }
    } else {
      if (route.request().method() === 'POST' && route.request().url().endsWith('/orders')) orders.push(route.request().url());
      await route.fulfill({ status: 404, json: {} });
    }
  });
  await page.goto('/cart');
  await expect(page.getByRole('alert').filter({ hasText: 'Không tải được quy cách' })).toBeVisible();
  await expect(page.getByText('Quy cách: Chai 1L')).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveValue('3');
  await page.getByRole('button', { name: `Thử lại tải quy cách ${product.name}` }).click();
  const select = page.getByRole('combobox');
  await expect(select).toHaveValue('41');
  await expect(select.getByRole('option', { name: 'Không bán' })).toHaveCount(0);
  await select.selectOption('42');
  await expect(page.getByText('Quy cách: Can 5L')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Số lượng 3 không phù hợp' })).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveValue('2');
  await expect(page.getByText('400.000 ₫ / quy cách')).toBeVisible();
  await expect(page.getByText('Tạm tính dòng hàng: 800.000 ₫')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('cart-variant.png'), fullPage: true });
  await page.reload();
  await expect(page.getByText('Quy cách: Can 5L')).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveValue('2');
  expect(orders).toEqual([]);
});

test('an inactive current variant stays visible and replacement controls fit the viewport', async ({ page }) => {
  await seedCart(page);
  await page.route('**/api/v1/products/**', (route) => route.fulfill({ json: {
    ...product, variants: [{ ...product.variants[0], isActive: false }, product.variants[1]],
  } }));
  await page.goto('/cart');
  const select = page.getByRole('combobox');
  await expect(select).toHaveValue('');
  await expect(select.getByRole('option', { name: 'Chai 1L' })).toHaveCount(0);
  await expect(page.getByText('Quy cách: Chai 1L')).toBeVisible();
  expect(await page.getByRole('article').evaluate((element) => element.getBoundingClientRect().right <= innerWidth)).toBe(true);
  await select.selectOption('42');
  await expect(page.getByText('Quy cách: Can 5L')).toBeVisible();
});
