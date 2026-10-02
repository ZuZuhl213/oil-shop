import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { signIn } from './admin-helper';
import { catalogFixture, mutate, orderByCode } from './admin-operations-helper';
import type { OrderReceipt } from '../src/lib/api/contracts/types';

test.describe('release through the real Next proxy and PostgreSQL backend', () => {
  test.skip(process.env.PLAN10_REAL_BACKEND !== '1', 'Run npm run test:release:e2e for the disposable real backend');

  test('a one-use voucher is consumed once by concurrent requests; inactive variants cannot be ordered', async ({ page }) => {
    await signIn(page);
    const origin = new URL(page.url()).origin;
    const suffix = `release-${Date.now()}-${test.info().project.name}`;
    const { variant } = await catalogFixture(page, suffix);
    const voucher = await mutate<{ id: string; code: string }>(page.request, origin, '/admin/vouchers', {
      code: suffix.toUpperCase(), discountType: 'FIXED', discountValue: 10000,
      maxDiscount: null, minOrderValue: 0, quantity: 1, startAt: null, endAt: null, isActive: true,
    });
    const body = { orderType: 'ORDER', customerName: 'Synthetic release', phone: '0901234567',
      voucherCode: voucher.code, items: [{ variantId: variant.id, quantity: 1 }] };
    const responses = await Promise.all([1, 2].map(() => page.request.post('/api/v1/orders', {
      data: body, headers: { Origin: origin, 'Idempotency-Key': randomUUID() },
    })));
    expect(responses.map(response => response.status()).sort()).toEqual([201, 422]);
    const failure = responses.find(response => response.status() === 422)!;
    expect((await failure.json()).code).toBe('VOUCHER_EXHAUSTED');
    const receipt = await responses.find(response => response.status() === 201)!.json();
    expect((await orderByCode(page, receipt.orderCode)).totalAmount).toBe(160000);
    expect((await (await page.request.get('/api/v1/admin/vouchers/' + voucher.id)).json()).usedCount).toBe(1);
    await mutate(page.request, origin, `/admin/variants/${variant.id}/status`, { isActive: false }, 'PATCH');
    const rejected = await page.request.post('/api/v1/orders', {
      data: { ...body, voucherCode: null }, headers: { Origin: origin, 'Idempotency-Key': randomUUID() },
    });
    expect(rejected.status()).toBe(422);
    expect((await rejected.json()).code).toBe('ITEM_UNAVAILABLE');
  });

  test('a committed order with a dropped response replays after reload without a duplicate', async ({ page }) => {
    test.setTimeout(60_000);
    await signIn(page);
    const { product, variant } = await catalogFixture(page, `replay-${Date.now()}-${test.info().project.name}`);
    await page.evaluate(line => {
      localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ version: 1, saleType: 'FIXED_PRICE', items: [line] }));
    }, { productId: product.id, productName: product.name, productSlug: product.slug,
      variantId: variant.id, variantName: variant.name, price: variant.price, quantity: 1,
      minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut' });
    let receipt: OrderReceipt | undefined;
    const keys: string[] = [];
    await page.route('**/api/v1/orders', async route => {
      keys.push(route.request().headers()['idempotency-key']);
      const response = await route.fetch();
      if (keys.length === 1) {
        expect(response.status()).toBe(201);
        receipt = await response.json();
        await route.abort('connectionreset');
      } else {
        expect(response.status()).toBe(200);
        await route.fulfill({ response });
      }
    });
    await page.goto('/checkout');
    await page.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Synthetic replay');
    await page.getByPlaceholder('0912345678 hoặc +84912345678').fill('0901234567');
    await page.getByRole('button', { name: 'Xem lại thông tin' }).click();
    await page.getByRole('button', { name: 'Xác nhận và gửi yêu cầu', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Chưa xác định được kết quả gửi đơn' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Thử lại với cùng mã gửi' }).click();
    await expect(page).toHaveURL(new RegExp('/orders/' + receipt?.orderCode));
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
    expect((await orderByCode(page, receipt!.orderCode)).totalAmount).toBe(170000);
    await page.screenshot({ path: test.info().outputPath('release-replayed-receipt.png'), fullPage: true });
  });
});
