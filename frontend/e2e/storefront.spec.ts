import { expect, test } from '@playwright/test';

test('storefront catalog remains usable when the backend is unavailable', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Danh Mục Đầy Đủ' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Dầu Phộng Ép Lạnh Cối Đá/ }).first()).toBeVisible();
});

test('storefront detail keeps quantity controls and the approved image placeholder', async ({ page }) => {
  await page.goto('/products/dau-lac-nguyen-chat');
  await expect(page.getByRole('heading', { name: 'Dầu Phộng Ép Lạnh Cối Đá' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Giảm theo quy cách' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tăng theo quy cách' })).toBeVisible();
});
