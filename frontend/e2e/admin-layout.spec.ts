import { test, expect } from '@playwright/test';
import { categories, product } from '../src/test/catalog-fixtures';

test('admin product controls fit the viewport with a long valid category name', async ({ page }) => {
  await page.route('**/api/v1/admin/auth/me', (route) => route.fulfill({ json: { id: '1', name: 'Admin', email: 'admin@test.local' } }));
  await page.route('**/api/v1/admin/categories', (route) => route.fulfill({ json: [{ ...categories[0], name: 'Danh mục kiểm tra '.repeat(5).trim() }] }));
  await page.route('**/api/v1/admin/products/31', (route) => route.fulfill({ json: product }));
  await page.goto('/admin/products/31');
  await expect(page.getByRole('heading', { name: 'Thông tin sản phẩm' })).toBeVisible();
  const layout = await page.evaluate(() => {
    const form = document.querySelector('form')!.getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      formRight: form.right,
      controls: [...document.querySelectorAll('form input, form select, form textarea')].map((element) => element.getBoundingClientRect().right),
    };
  });
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport);
  expect(Math.max(...layout.controls)).toBeLessThanOrEqual(layout.formRight);
});
