import { test, expect } from '@playwright/test';
import { signIn } from './admin-helper';
import { catalogFixture, mutate, orderByCode, voucherFixture } from './admin-operations-helper';
import type { OrderReceipt } from '../src/lib/api/contracts/types';

test.describe('Real order operations', () => {
  test.skip(process.env.PLAN10_REAL_BACKEND !== '1', 'Run npm run test:admin:e2e -- e2e/admin-orders.spec.ts');
  test('two note editors preserve the winning note and require explicit review of the stale draft', async ({ page, context }) => {
    await signIn(page); const origin = new URL(page.url()).origin;
    const { variant } = await catalogFixture(page, `notes-${Date.now()}-${test.info().project.name}`);
    const receipt = await mutate<OrderReceipt>(page.request, origin, '/orders', { orderType: 'ORDER', customerName: 'Khách ghi chú', phone: '0901234567', items: [{ variantId: variant.id, quantity: 1 }] });
    const order = await orderByCode(page, receipt.orderCode);
    await page.goto('/admin/orders/' + order.id);
    const second = await context.newPage();
    try {
      await second.goto('/admin/orders/' + order.id);
      await page.getByLabel('Ghi chú quản trị').fill('Bản nháp A cần giữ');
      await second.getByLabel('Ghi chú quản trị').fill('Ghi chú mới của B');
      await second.getByRole('button', { name: 'Lưu ghi chú' }).click();
      await expect(second.getByRole('status').filter({ hasText: 'Đã lưu ghi chú' })).toBeVisible();
      let patches = 0;
      page.on('request', (request) => { if (request.method() === 'PATCH' && request.url().endsWith('/note')) patches++; });
      await page.getByRole('button', { name: 'Lưu ghi chú' }).click();
      const review = page.getByRole('region', { name: 'Xem lại xung đột ghi chú' });
      await expect(review.getByText('Ghi chú mới của B', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Ghi chú quản trị')).toHaveValue('Bản nháp A cần giữ');
      await expect(page.getByRole('button', { name: 'Lưu ghi chú' })).toBeDisabled();
      expect((await (await page.request.get('/api/v1/admin/orders/' + order.id)).json()).adminNote).toBe('Ghi chú mới của B');
      expect(patches).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: test.info().outputPath('admin-note-conflict.png'), fullPage: true });
      await page.getByRole('button', { name: 'Đã xem ghi chú mới, tiếp tục chỉnh sửa' }).click();
      expect(patches).toBe(1);
      await page.getByRole('button', { name: 'Lưu ghi chú' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Đã lưu ghi chú' })).toBeVisible();
      expect((await (await page.request.get('/api/v1/admin/orders/' + order.id)).json()).adminNote).toBe('Bản nháp A cần giữ');
      expect(patches).toBe(2);
    } finally { await second.close(); }
  });

  for (const failure of ['timeout', '503']) test(`committed cancellation with lost ${failure} response recovers by GET and releases voucher once`, async ({ page }) => {
    await signIn(page); const origin = new URL(page.url()).origin;
    const suffix = `recover-${failure}-${Date.now()}-${test.info().project.name}`;
    const { variant } = await catalogFixture(page, suffix);
    const voucher = await voucherFixture(page, suffix);
    const receipt = await mutate<OrderReceipt>(page.request, origin, '/orders', { orderType: 'ORDER', customerName: 'Khách phục hồi', phone: '0901234567', voucherCode: voucher.code, items: [{ variantId: variant.id, quantity: 1 }] });
    const order = await orderByCode(page, receipt.orderCode);
    await page.goto('/admin/orders/' + order.id);
    await page.getByLabel('Ghi chú quản trị').fill('Draft qua phục hồi trạng thái');
    let patches = 0;
    await page.route(`**/api/v1/admin/orders/${order.id}/status`, async (route) => {
      patches++;
      const response = await route.fetch(); expect(response.status()).toBe(200);
      if (failure === 'timeout') await route.abort('timedout');
      else await route.fulfill({ status: 503, json: { code: 'SERVICE_UNAVAILABLE' } });
    });
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Hủy yêu cầu' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Kết quả đổi trạng thái chưa được xác nhận' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đã liên hệ', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Hủy yêu cầu' })).toBeDisabled();
    expect(patches).toBe(1);
    expect((await (await page.request.get('/api/v1/admin/vouchers/' + voucher.id)).json()).usedCount).toBe(0);
    await page.screenshot({ path: test.info().outputPath(`admin-status-unknown-${failure}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Tải lại trạng thái' }).click();
    await expect(page.getByText('Đã hủy', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hủy yêu cầu' })).toHaveCount(0);
    await expect(page.getByLabel('Ghi chú quản trị')).toHaveValue('Draft qua phục hồi trạng thái');
    expect(patches).toBe(1);
    expect((await (await page.request.get('/api/v1/admin/vouchers/' + voucher.id)).json()).usedCount).toBe(0);
  });

  test('guest checkout with voucher, status lifecycle, cancellation/conflict, expired note draft and quote completion', async ({ page, browser, context }) => {
    test.setTimeout(90_000);
    const suffix = `${Date.now()}-${test.info().project.name}`;
    await signIn(page); const origin = new URL(page.url()).origin;
    const { product, variant } = await catalogFixture(page, suffix);
    const voucher = await voucherFixture(page, suffix);
    const guestContext = await browser.newContext({ baseURL: origin });
    try {
      const guest = await guestContext.newPage();
      await guest.addInitScript((line) => {
        if (!localStorage.getItem('hm_naturals_cart_v1')) localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ version: 1, saleType: 'FIXED_PRICE', items: [line] }));
      }, { productId: product.id, productName: product.name, productSlug: product.slug, variantId: variant.id, variantName: variant.name, price: variant.price, quantity: 1, minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut' });
      await guest.goto('/checkout');
      await guest.getByLabel('Mã giảm giá (không bắt buộc)').fill(voucher.code);
      await guest.getByRole('button', { name: 'Kiểm tra voucher' }).click();
      await expect(guest.getByRole('status').filter({ hasText: 'Đã kiểm tra mã' })).toBeVisible();
      await guest.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Khách snapshot');
      await guest.getByPlaceholder('0912345678 hoặc +84912345678').fill('0901234567');
      await guest.getByRole('button', { name: 'Xem lại thông tin' }).click();
      await guest.getByRole('button', { name: 'Xác nhận và gửi yêu cầu', exact: true }).click();
      await expect(guest).toHaveURL(/\/orders\/DH-/);
      const code = new URL(guest.url()).pathname.split('/').pop()!; const order = await orderByCode(page, code);
      expect(order.totalAmount).toBe(153000); expect(order.voucherCodeSnapshot).toBe(voucher.code);
      await page.goto('/admin/orders'); await page.getByLabel('Mã đơn hoặc điện thoại').fill(code); await page.getByRole('button', { name: 'Lọc yêu cầu' }).click();
      await page.getByRole('link', { name: code, exact: true }).click();
      await expect(page.getByText(product.name, { exact: true })).toBeVisible();
      for (const label of ['Đã liên hệ', 'Xác nhận yêu cầu', 'Hoàn tất xử lý']) await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByText('Đã hoàn tất', { exact: true })).toBeVisible();
      await page.screenshot({ path: test.info().outputPath('admin-completed-order.png'), fullPage: true });
      const cancelledReceipt = await mutate<OrderReceipt>(guest.request, origin, '/orders', { orderType: 'ORDER', customerName: 'Khách hủy', phone: '0901234567', voucherCode: voucher.code, items: [{ variantId: variant.id, quantity: 1 }] });
      const cancelled = await orderByCode(page, cancelledReceipt.orderCode);
      await page.goto('/admin/orders/' + cancelled.id);
      await page.getByRole('button', { name: 'Đã liên hệ', exact: true }).click(); await expect(page.getByRole('button', { name: 'Xác nhận yêu cầu', exact: true })).toBeEnabled();
      const secondPage = await context.newPage();
      await secondPage.goto('/admin/orders/' + cancelled.id); await expect(secondPage.getByRole('button', { name: 'Xác nhận yêu cầu' })).toBeVisible();
      page.once('dialog', (dialog) => dialog.accept()); await page.getByRole('button', { name: 'Hủy yêu cầu' }).click(); await expect(page.getByText('Đã hủy', { exact: true })).toBeVisible();
      expect((await (await page.request.get('/api/v1/admin/vouchers/' + voucher.id)).json()).usedCount).toBe(1);
      await secondPage.getByLabel('Ghi chú quản trị').fill('Draft sau xung đột');
      await secondPage.getByRole('button', { name: 'Xác nhận yêu cầu' }).click();
      await expect(secondPage.getByRole('alert').filter({ hasText: 'Trạng thái đã thay đổi' })).toBeVisible(); await expect(secondPage.getByText('Đã hủy', { exact: true })).toBeVisible();
      await expect(secondPage.getByLabel('Ghi chú quản trị')).toHaveValue('Draft sau xung đột'); await secondPage.close();
      await page.getByLabel('Ghi chú quản trị').fill('Draft cần giữ sau login'); await context.clearCookies();
      await page.getByRole('button', { name: 'Lưu ghi chú' }).click(); const recovery = page.getByRole('dialog', { name: 'Đăng nhập lại' }); await expect(recovery).toBeVisible();
      await recovery.getByLabel('Email quản trị').fill(process.env.PLAN10_ADMIN_EMAIL!); await recovery.getByLabel('Mật khẩu').fill(process.env.PLAN10_ADMIN_PASSWORD!); await recovery.getByRole('button', { name: 'Đăng nhập', exact: true }).click(); await expect(recovery).toBeHidden();
      await expect(page.getByLabel('Ghi chú quản trị')).toHaveValue('Draft cần giữ sau login'); await page.getByRole('button', { name: 'Lưu ghi chú' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Đã lưu ghi chú' })).toBeVisible();
      const quoteFixture = await catalogFixture(page, 'quote-' + suffix, true);
      const quoteReceipt = await mutate<OrderReceipt>(guest.request, origin, '/orders', { orderType: 'QUOTE_REQUEST', customerName: 'Khách báo giá', phone: '0901234567', note: 'Khách muốn báo giá', items: [{ variantId: quoteFixture.variant.id, quantity: 1 }] });
      const quote = await orderByCode(page, quoteReceipt.orderCode); await page.goto('/admin/orders/' + quote.id);
      await expect(page.getByText('Yêu cầu báo giá', { exact: true })).toBeVisible(); await expect(page.getByText('Chưa có giá', { exact: true })).toHaveCount(4);
      await page.getByLabel('Ghi chú quản trị').fill('Đã gọi khách báo giá'); await page.getByRole('button', { name: 'Lưu ghi chú' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Đã lưu ghi chú' })).toBeVisible();
      for (const label of ['Đã liên hệ', 'Xác nhận yêu cầu', 'Hoàn tất xử lý']) await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page.getByText('Đã hoàn tất', { exact: true })).toBeVisible();
      const final = await (await page.request.get('/api/v1/admin/orders/' + quote.id)).json(); expect(final.totalAmount).toBeNull(); expect(final.subtotal).toBeNull(); expect(final.customerNote).toBe('Khách muốn báo giá'); expect(final.adminNote).toBe('Đã gọi khách báo giá');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); await page.screenshot({ path: test.info().outputPath('admin-quote.png'), fullPage: true });
      await page.goto('/admin/orders'); await page.getByLabel('Loại yêu cầu').selectOption('QUOTE_REQUEST'); await page.getByRole('button', { name: 'Lọc yêu cầu' }).click(); await expect(page.getByRole('link', { name: quote.orderCode, exact: true })).toBeVisible(); await page.screenshot({ path: test.info().outputPath('admin-orders-list.png'), fullPage: true });
    } finally { await guestContext.close(); }
  });
});

test('guest cannot read order/voucher administration or render protected forms', async ({ page }) => {
  test.skip(process.env.PLAN10_REAL_BACKEND !== '1', 'Requires disposable backend');
  expect((await page.request.get('/api/v1/admin/orders')).status()).toBe(401);
  expect((await page.request.get('/api/v1/admin/vouchers')).status()).toBe(401);
  await page.goto('/admin/orders'); await expect(page).toHaveURL(/\/admin\/login\?next=/);
  await expect(page.getByRole('heading', { name: 'Đơn hàng và báo giá' })).toHaveCount(0);
  await page.goto('/admin/vouchers/1'); await expect(page).toHaveURL(/\/admin\/login\?next=/);
  await expect(page.getByLabel('Mã voucher')).toHaveCount(0);
});

test('a 50-character voucher snapshot fits order totals on desktop and a small phone', async ({ page }) => {
  if (test.info().project.name === 'mobile') await page.setViewportSize({ width: 375, height: 812 });
  const code = 'W'.repeat(50);
  await page.route('**/api/v1/admin/auth/me', (route) => route.fulfill({ json: { id: '1', name: 'Admin', email: 'test@example.test' } }));
  await page.route('**/api/v1/admin/orders/1', (route) => route.fulfill({ json: { id: '1', orderCode: 'DH-LAYOUT', orderType: 'ORDER', status: 'NEW', subtotal: 170000, discountAmount: 17000, totalAmount: 153000, createdAt: '2026-10-02T00:00:00Z', updatedAt: '2026-10-02T00:00:00Z', customerName: 'Khách', phone: '0901234567', address: null, customerNote: null, adminNote: null, voucherCodeSnapshot: code, items: [{ productId: '1', variantId: '1', productNameSnapshot: 'Dầu snapshot', variantNameSnapshot: 'Chai 1L', quantity: 1, unitPrice: 170000, lineTotal: 170000 }] } }));
  await page.goto('/admin/orders/1'); const value = page.getByText(code, { exact: true }); await expect(value).toBeVisible();
  const bounds = await value.evaluate((element) => ({ right: element.getBoundingClientRect().right, viewport: window.innerWidth, content: element.scrollWidth, width: element.clientWidth }));
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport); expect(bounds.content).toBeLessThanOrEqual(bounds.width);
  await page.screenshot({ path: test.info().outputPath('admin-order-long-voucher.png'), fullPage: true });
});
