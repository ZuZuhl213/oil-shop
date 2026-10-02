import { test, expect } from '@playwright/test';
import { signIn } from './admin-helper';
import { catalogFixture, mutate } from './admin-operations-helper';
import type { Voucher } from '../src/features/admin/vouchers/voucher-admin-api';
test.describe('Real voucher administration', () => {
  test.skip(process.env.PLAN10_REAL_BACKEND !== '1', 'Run npm run test:admin:e2e -- e2e/admin-vouchers.spec.ts');
  test('creates, edits, converts Vietnam time, refreshes concurrent usage and changes status without losing draft', async ({ page, browser }) => {
    const suffix = `${Date.now()}-${test.info().project.name}`;
    await signIn(page); await page.getByRole('link', { name: 'Voucher', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo voucher', exact: true }).click();
    await page.getByLabel('Mã voucher').fill(' ui-' + suffix + ' ');
    await page.getByLabel('Loại giảm').selectOption('PERCENT');
    await page.getByLabel('Giá trị giảm', { exact: true }).fill('10');
    await page.getByLabel('Tổng lượt').fill('5');
    await page.getByLabel('Bắt đầu (giờ Việt Nam)').fill('2020-01-01T07:00');
    await page.getByLabel('Kết thúc (giờ Việt Nam)').fill('2030-01-01T07:30');
    await page.getByRole('button', { name: 'Lưu voucher', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/vouchers\/\d+$/);
    const id = new URL(page.url()).pathname.split('/').pop()!;
    const read = async () => (await (await page.request.get(`/api/v1/admin/vouchers/${id}`)).json()) as Voucher;
    const value = await read(); expect(value.code).toBe(('UI-' + suffix).toUpperCase()); expect(value.startAt).toBe('2020-01-01T00:00:00Z'); expect(value.endAt).toBe('2030-01-01T00:30:00Z'); expect(value.maxDiscount).toBeNull(); expect(value.minOrderValue).toBe(0);
    const { variant } = await catalogFixture(page, suffix);
    const guest = await browser.newContext({ baseURL: new URL(page.url()).origin });
    try { await mutate(guest.request, new URL(page.url()).origin, '/orders', { orderType: 'ORDER', customerName: 'Khách voucher', phone: '0901234567', voucherCode: value.code, items: [{ variantId: variant.id, quantity: 1 }] }); } finally { await guest.close(); }
    await page.getByLabel('Tổng lượt').fill('0');
    await page.getByRole('button', { name: 'Lưu voucher', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'không hợp lệ' })).toBeVisible();
    await expect(page.getByText('Đã dùng: 1 · Còn lại: 4', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Tổng lượt')).toHaveValue('0'); expect((await read()).quantity).toBe(5);
    await page.getByLabel('Tổng lượt').fill('6');
    await page.getByRole('button', { name: 'Lưu voucher', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu' })).toBeVisible();
    await page.getByRole('button', { name: 'Ẩn voucher' }).click();
    await expect(page.getByRole('button', { name: 'Kích hoạt voucher' })).toBeVisible();
    await expect(page.getByLabel('Voucher hoạt động')).not.toBeChecked();
    await page.getByRole('button', { name: 'Lưu voucher', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu' })).toBeVisible(); expect((await read()).isActive).toBe(false);
    await page.getByRole('button', { name: 'Kích hoạt voucher' }).click();
    await expect(page.getByRole('button', { name: 'Ẩn voucher' })).toBeVisible(); expect((await read()).isActive).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('admin-voucher.png'), fullPage: true });
    await page.getByRole('link', { name: '← Danh sách voucher' }).click();
    await expect(page.getByRole('link', { name: value.code, exact: true })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('admin-vouchers-list.png'), fullPage: true });
  });
});

test('a valid 50-character voucher code fits list controls on desktop and a small phone', async ({ page }) => {
  if (test.info().project.name === 'mobile') await page.setViewportSize({ width: 375, height: 812 });
  const code = 'W'.repeat(50);
  await page.route('**/api/v1/admin/auth/me', (route) => route.fulfill({ json: { id: '1', name: 'Admin', email: 'test@example.test' } }));
  await page.route('**/api/v1/admin/vouchers?**', (route) => route.fulfill({ json: { content: [{ id: '1', code, discountType: 'PERCENT', discountValue: 10, maxDiscount: null, minOrderValue: 0, quantity: 5, usedCount: 0, startAt: null, endAt: null, isActive: true }], page: 0, size: 20, totalElements: 1, totalPages: 1 } }));
  await page.goto('/admin/vouchers'); await expect(page.getByRole('link', { name: code, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const detailControl = page.getByRole('link', { name: 'Chi tiết ' + code, exact: true });
  const bounds = await detailControl.evaluate((element) => ({ right: element.getBoundingClientRect().right, viewport: window.innerWidth, content: element.scrollWidth, width: element.clientWidth }));
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport); expect(bounds.content).toBeLessThanOrEqual(bounds.width);
  await page.screenshot({ path: test.info().outputPath('admin-vouchers-long-code.png'), fullPage: true });
});
