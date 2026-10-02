import { randomUUID } from 'node:crypto';
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import type { AdminOrder } from '../src/features/admin/orders/orders-admin-api';
import type { Voucher } from '../src/features/admin/vouchers/voucher-admin-api';
export async function mutate<T>(request: APIRequestContext, origin: string, path: string, body: unknown, method = 'POST'): Promise<T> {
  const csrf = await (await request.get('/api/v1/csrf')).json();
  const response = await request.fetch('/api/v1' + path, { method, data: body, headers: { Origin: origin, [csrf.headerName]: csrf.token, 'Idempotency-Key': randomUUID() } });
  expect(response.ok(), `${method} ${path}: ${await response.text()}`).toBe(true);
  return response.json() as Promise<T>;
}
export async function catalogFixture(page: Page, suffix: string, quote = false) {
  const origin = new URL(page.url()).origin;
  const category = await mutate<{ id: string }>(page.request, origin, '/admin/categories', { name: 'Operations ' + suffix, slug: 'ops-cat-' + suffix, description: null, sortOrder: 0, isActive: true });
  const product = await mutate<{ id: string; name: string; slug: string }>(page.request, origin, '/admin/products', { categoryId: category.id, name: 'Snapshot ' + suffix, slug: 'ops-product-' + suffix, saleType: quote ? 'QUOTE' : 'FIXED_PRICE', status: 'ACTIVE', sortOrder: 0, shortDescription: null, description: null, thumbnailUrl: null });
  const variant = await mutate<{ id: string; name: string; price: number | null }>(page.request, origin, `/admin/products/${product.id}/variants`, { name: 'Quy cách snapshot', sku: 'OPS-' + suffix, price: quote ? null : 170000, minQuantity: 1, quantityStep: 1, sortOrder: 0, isActive: true });
  return { product, variant };
}
export async function voucherFixture(page: Page, suffix: string) {
  return mutate<Voucher>(page.request, new URL(page.url()).origin, '/admin/vouchers', { code: 'OPS-' + suffix, discountType: 'PERCENT', discountValue: 10, maxDiscount: null, minOrderValue: 0, quantity: 10, startAt: null, endAt: null, isActive: true });
}
export async function orderByCode(page: Page, code: string): Promise<AdminOrder> {
  const result = await (await page.request.get('/api/v1/admin/orders?keyword=' + encodeURIComponent(code))).json();
  expect(result.content).toHaveLength(1); return result.content[0];
}
