import { expect, test } from '@playwright/test';
import { categories, product } from '../src/test/catalog-fixtures';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/categories')) return route.fulfill({ json: categories });
    return route.fulfill({ json: { content: [{ ...product, variants: [...product.variants,
      { ...product.variants[0], id: '43', name: 'Quy cách ngừng bán', isActive: false },
    ] }], page: 0, size: 12, totalElements: 1, totalPages: 1 } });
  });
});

test('button stays inside its card and popup fits narrow and wide viewports without shifting the card', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products');
    const card = page.getByRole('article', { name: product.name });
    const button = card.getByRole('button', { name: `Chọn mua ${product.name}` });
    await expect(button).toBeVisible();
    const before = (await card.boundingBox())!;
    const action = (await button.boundingBox())!;
    const price = (await card.locator('.g-price-text').boundingBox())!;
    expect(action.x).toBeGreaterThanOrEqual(before.x);
    expect(action.y + action.height).toBeLessThanOrEqual(before.y + before.height);
    expect(action.x + action.width).toBeLessThanOrEqual(before.x + before.width);
    expect(price.x + price.width).toBeLessThanOrEqual(action.x);
    await button.click();
    const popup = page.getByRole('menu');
    await expect(popup).toBeVisible();
    const bounds = (await popup.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
    expect((await card.boundingBox())!.height).toBeCloseTo(before.height, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  }
});

test('keyboard selection merges the chosen API variant and stays on the listing', async ({ page }) => {
  await page.goto('/products');
  const button = page.getByRole('button', { name: `Chọn mua ${product.name}` });
  await button.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /Chai 1L/ })).toBeFocused();
  await expect(page.getByRole('menuitem', { name: /ngừng bán/ })).toHaveCount(0);
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /Can 5L.*400.000/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Đã thêm vào giỏ' })).toBeVisible();
  await expect(button).toBeFocused();
  await button.click();
  await page.getByRole('menuitem', { name: /Can 5L/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items)).toMatchObject([{ variantId: '42', quantity: 4 }]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items.length)).toBe(1);
  await expect(page).toHaveURL(/\/products$/);
  await button.click();
  await page.getByRole('textbox', { name: 'Tìm kiếm sản phẩm' }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(button).toBeFocused();
});

test('out-of-stock cards remain visible with contact links and aligned disabled purchase controls', async ({ page }) => {
  const soldOut = { ...product, id: '32', slug: 'het-hang', name: 'Dầu đã hết hàng', variants: [] };
  await page.route('**/api/v1/products**', route => {
    if (new URL(route.request().url()).pathname.endsWith('/het-hang')) return route.fulfill({ json: soldOut });
    return route.fulfill({ json: { content: [product, soldOut], page: 0, size: 12, totalElements: 2, totalPages: 1 } });
  });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products');
    const available = page.getByRole('article', { name: product.name });
    const unavailable = page.getByRole('article', { name: soldOut.name });
    const label = unavailable.getByRole('button', { name: `Hết hàng ${soldOut.name}` });
    await expect(label).toBeDisabled();
    await expect(unavailable.getByText('Sẵn sàng giao tận bếp')).toHaveCount(0);
    const availableButton = (await available.getByRole('button').boundingBox())!;
    const soldOutButton = (await label.boundingBox())!;
    expect((await available.locator('.g-price-text').boundingBox())!.height).toBeLessThanOrEqual(36);
    expect(await available.locator('.g-price-text').evaluate(element => {
      const text = element.firstChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, text.textContent!.indexOf(' '));
      return range.getClientRects().length;
    })).toBe(1);
    expect(availableButton.y + availableButton.height).toBeCloseTo(soldOutButton.y + soldOutButton.height, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await unavailable.getByRole('link', { name: 'Liên hệ để biết thêm thông tin' }).click();
    await expect(page).toHaveURL(/\/contact$/);
  }
  await page.goto('/products/het-hang');
  await expect(page.locator('.d-status-pill')).toHaveText('Hết hàng');
  await expect(page.getByRole('button', { name: 'Đặt Mua Ngay', exact: true })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Liên hệ để biết thêm thông tin' })).toHaveAttribute('href', '/contact');
});
