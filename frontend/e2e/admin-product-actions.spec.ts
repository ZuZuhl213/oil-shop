import { test, expect } from '@playwright/test';
import { categories, product } from '../src/test/catalog-fixtures';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/admin/auth/me', (route) => route.fulfill({ json: { id: '1', name: 'Admin', email: 'admin@test.local' } }));
  await page.route('**/api/v1/csrf', (route) => route.fulfill({ json: { token: 'csrf', headerName: 'X-CSRF-TOKEN' } }));
  await page.route('**/api/v1/admin/categories', (route) => route.fulfill({ json: categories }));
  await page.route('**/api/v1/admin/products?*', (route) => route.fulfill({ json: { content: [product], page: 0, size: 100, totalPages: 1, totalElements: 1 } }));
});

test('permanent deletion requires confirmation and removes the card after success without viewport overflow', async ({ page }) => {
  let deletes = 0;
  await page.route('**/api/v1/admin/products/31', async (route) => {
    if (route.request().method() === 'DELETE') {
      deletes++;
      expect(route.request().headers()['x-csrf-token']).toBe('csrf');
      await route.fulfill({ status: 204 });
    } else await route.fulfill({ json: product });
  });
  await page.goto('/admin/products');
  const remove = page.getByRole('button', { name: `Xóa vĩnh viễn ${product.name}`, exact: true });
  await expect(remove).toBeVisible();
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain(product.name);
    expect(dialog.message()).toContain('Không thể khôi phục');
    await dialog.dismiss();
  });
  await remove.click();
  expect(deletes).toBe(0);
  await expect(page.getByRole('link', { name: product.name, exact: true })).toBeVisible();
  const layout = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth,
    right: Math.max(...[...document.querySelectorAll('main button')].map((button) => button.getBoundingClientRect().right)) }));
  expect(layout.width).toBeLessThanOrEqual(layout.viewport);
  expect(layout.right).toBeLessThanOrEqual(layout.viewport);
  page.once('dialog', (dialog) => dialog.accept());
  await remove.click();
  await expect(page.getByRole('status')).toContainText('Đã xóa vĩnh viễn');
  await expect(page.getByRole('link', { name: product.name, exact: true })).toHaveCount(0);
  expect(deletes).toBe(1);
});

test('editing confirms before PUT and keeps the draft when cancelled', async ({ page }) => {
  let writes = 0;
  await page.route('**/api/v1/admin/products/31', async (route) => {
    if (route.request().method() === 'PUT') {
      writes++;
      expect(route.request().postDataJSON().name).toBe('Dầu lạc mới');
      await route.fulfill({ json: { ...product, name: 'Dầu lạc mới' } });
    } else await route.fulfill({ json: product });
  });
  await page.goto('/admin/products/31');
  await page.getByLabel('Tên sản phẩm', { exact: true }).fill('Dầu lạc mới');
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain(product.name);
    await dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Lưu sản phẩm', exact: true }).click();
  expect(writes).toBe(0);
  await expect(page.getByLabel('Tên sản phẩm', { exact: true })).toHaveValue('Dầu lạc mới');
  await expect(page.getByRole('button', { name: `Xóa vĩnh viễn ${product.name}`, exact: true })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Lưu sản phẩm', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Đã lưu thành công');
  expect(writes).toBe(1);
});
