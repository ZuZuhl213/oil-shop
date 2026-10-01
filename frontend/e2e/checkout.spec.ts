import { expect, test, type Page, type Route } from '@playwright/test';
import type { CreateOrderRequest, OrderReceipt } from '../src/lib/api/contracts/types';

const fixedCartLine = {
  productId: '31', productName: 'Dầu lạc API', productSlug: 'dau-lac-api',
  variantId: '41', variantName: 'Chai 1L', price: 90000, quantity: 1,
  minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut',
};

const orderReceipt: OrderReceipt = {
  orderCode: 'DH-CHECKOUT-E2E', orderType: 'ORDER', status: 'NEW',
  subtotal: 90000, discountAmount: 0, totalAmount: 90000, createdAt: '2026-09-26T00:00:00Z',
};

async function seedCart(page: Page, quote = false) {
  const line = quote
    ? { ...fixedCartLine, variantId: '42', variantName: '0.5kg', price: null, quantity: 0.5, minQuantity: 0.5, quantityStep: 0.5, saleType: 'QUOTE' }
    : fixedCartLine;
  const cart = { version: 1, saleType: quote ? 'QUOTE' : 'FIXED_PRICE', items: [line] };
  await page.addInitScript((value) => {
    if (!localStorage.getItem('hm_naturals_cart_v1')) localStorage.setItem('hm_naturals_cart_v1', JSON.stringify(value));
  }, cart);
}

async function fixtureApi(page: Page, onOrder: (route: Route) => Promise<void>) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/csrf')) {
      await route.fulfill({ json: { token: 'csrf-checkout-e2e', headerName: 'X-CSRF-TOKEN' } });
      return;
    }
    if (url.pathname.endsWith('/orders')) {
      await onOrder(route);
      return;
    }
    await route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: 'Not found', fieldErrors: {} } });
  });
}

async function enterContactAndReview(page: Page) {
  await page.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Nguyen Van A');
  await page.getByPlaceholder('0912345678 hoặc +84912345678').fill('0912345678');
  await page.getByRole('button', { name: 'Xem lại thông tin' }).click();
  await expect(page.getByRole('heading', { name: 'Kiểm tra lại yêu cầu' })).toBeVisible();
}

test('retries an unclear committed order with the same key and payload after reload', async ({ page }) => {
  await seedCart(page);
  const requests: { key: string; csrf: string | undefined; payload: CreateOrderRequest }[] = [];
  const committedOrders = new Map<string, OrderReceipt>();
  await fixtureApi(page, async (route) => {
    const headers = route.request().headers();
    const key = headers['idempotency-key'];
    expect(headers['x-csrf-token']).toBe('csrf-checkout-e2e');
    const payload = route.request().postDataJSON() as CreateOrderRequest;
    requests.push({ key, csrf: headers['x-csrf-token'], payload });
    if (!committedOrders.has(key)) committedOrders.set(key, orderReceipt);
    if (requests.length === 1) {
      await route.abort('connectionreset');
      return;
    }
    await route.fulfill({ status: 200, json: committedOrders.get(key) });
  });

  await page.goto('/checkout');
  await enterContactAndReview(page);
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Xác nhận và gửi yêu cầu' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Chưa xác định được kết quả gửi đơn' })).toBeVisible();
  expect(requests).toHaveLength(1);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Kiểm tra lại yêu cầu' })).toBeVisible();
  await expect(page.getByText('Nguyen Van A')).toBeVisible();
  await page.getByRole('button', { name: 'Thử lại với cùng mã gửi' }).click();
  await expect(page).toHaveURL(/orders\/DH-CHECKOUT-E2E/);
  await expect(page.getByRole('heading', { name: 'Biên Nhận Đặt Hàng' })).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1].key).toBe(requests[0].key);
  expect(requests[1].payload).toEqual(requests[0].payload);
  expect(committedOrders.size).toBe(1);
});

test('submits a fractional quote without a voucher or monetary total', async ({ page }) => {
  await seedCart(page, true);
  let sentRequest: CreateOrderRequest | undefined;
  const quoteReceipt: OrderReceipt = {
    ...orderReceipt, orderCode: 'BG-CHECKOUT-E2E', orderType: 'QUOTE_REQUEST',
    subtotal: null, discountAmount: 0, totalAmount: null,
  };
  await fixtureApi(page, async (route) => {
    sentRequest = route.request().postDataJSON() as CreateOrderRequest;
    await route.fulfill({ status: 201, json: quoteReceipt });
  });

  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Gửi yêu cầu báo giá' })).toBeVisible();
  await expect(page.getByText('Quy cách: 0.5kg · Số lượng: 0,5')).toBeVisible();
  await expect(page.getByLabel('Mã giảm giá (không bắt buộc)')).toHaveCount(0);
  await expect(page.getByText('Tổng thanh toán:')).toHaveCount(0);
  await expect(page.getByText(/0\s*₫/)).toHaveCount(0);

  await enterContactAndReview(page);
  await expect(page.getByText('Tổng ước lượng')).toHaveCount(0);
  await page.getByRole('button', { name: 'Xác nhận và gửi yêu cầu báo giá' }).click();
  await expect(page).toHaveURL(/orders\/BG-CHECKOUT-E2E/);
  await expect(page.getByRole('heading', { name: 'Biên Nhận Yêu Cầu Báo Giá' })).toBeVisible();
  await expect(page.getByText('Yêu cầu báo giá không có tổng tiền cố định. Shop sẽ liên hệ để xác nhận số lượng và mức giá.')).toBeVisible();
  await expect(page.getByText('Tổng thanh toán:')).toHaveCount(0);
  expect(sentRequest).toMatchObject({ orderType: 'QUOTE_REQUEST', items: [{ variantId: '42', quantity: 0.5 }] });
  expect(sentRequest?.voucherCode).toBeUndefined();
});

test('edits decimal quantities through the drawer and cart before quote checkout', async ({ page }) => {
  await page.addInitScript((line) => {
    if (!localStorage.getItem('hm_naturals_cart_v1')) {
      localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
        version: 1, saleType: 'QUOTE', items: [{
          ...line, price: null, quantity: 0.2, minQuantity: 0.1, quantityStep: 0.1, saleType: 'QUOTE',
        }],
      }));
    }
  }, fixedCartLine);
  let sentRequest: CreateOrderRequest | undefined;
  await fixtureApi(page, async (route) => {
    sentRequest = route.request().postDataJSON() as CreateOrderRequest;
    await route.fulfill({ status: 201, json: {
      ...orderReceipt, orderCode: 'BG-DECIMAL-E2E', orderType: 'QUOTE_REQUEST',
      subtotal: null, discountAmount: 0, totalAmount: null,
    } });
  });
  const savedQuantity = () => page.evaluate(() =>
    JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0]?.quantity);

  await page.goto('/cart');
  await page.getByRole('button', { name: /Mở giỏ hàng/ }).click();
  const drawer = page.getByRole('dialog', { name: 'Giỏ hàng HM NATURALS' });
  await drawer.getByRole('button', { name: 'Tăng', exact: true }).click();
  await expect.poll(savedQuantity).toBe(0.3);
  await drawer.getByRole('button', { name: 'Giảm', exact: true }).click();
  await expect.poll(savedQuantity).toBe(0.2);
  await drawer.getByRole('button', { name: 'Đóng giỏ hàng' }).click();

  const input = page.getByRole('spinbutton', { name: 'Số lượng Dầu lạc API' });
  await input.fill('');
  await input.pressSequentially('0');
  await expect(input).toHaveValue('0');
  expect(await savedQuantity()).toBe(0.2);
  await input.pressSequentially('.5');
  await input.press('Enter');
  await expect.poll(savedQuantity).toBe(0.5);
  await input.fill('0');
  await page.getByRole('heading', { name: 'Giỏ hàng', exact: true }).click();
  await expect(input).toHaveValue('0.5');
  expect(await savedQuantity()).toBe(0.5);

  await page.getByRole('link', { name: 'Gửi yêu cầu báo giá', exact: true }).click();
  await enterContactAndReview(page);
  await page.getByRole('button', { name: 'Xác nhận và gửi yêu cầu báo giá' }).click();
  await expect(page).toHaveURL(/orders\/BG-DECIMAL-E2E/);
  expect(sentRequest).toMatchObject({ orderType: 'QUOTE_REQUEST', items: [{ variantId: '41', quantity: 0.5 }] });
});

test('real backend persists one order when its first committed response is dropped [real-backend]', async ({ page }, testInfo) => {
  test.skip(process.env.PLAN09_REAL_BACKEND !== '1', 'requires the disposable local PostgreSQL backend');
  await seedCart(page);
  const requests: { key: string; payload: CreateOrderRequest }[] = [];
  let committedReceipt: OrderReceipt | undefined;
  await page.route('**/api/v1/orders', async (route) => {
    const key = route.request().headers()['idempotency-key'];
    requests.push({ key, payload: route.request().postDataJSON() as CreateOrderRequest });
    if (requests.length === 1) {
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      committedReceipt = await response.json() as OrderReceipt;
      await route.abort('connectionreset');
      return;
    }
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.fulfill({ response });
  });

  await page.goto('/checkout');
  await enterContactAndReview(page);
  await page.screenshot({ path: testInfo.outputPath('checkout-review.png'), fullPage: true });
  await page.getByRole('button', { name: 'Xác nhận và gửi yêu cầu' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Chưa xác định được kết quả gửi đơn' })).toBeVisible();
  expect(committedReceipt?.orderType).toBe('ORDER');
  expect(requests).toHaveLength(1);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Kiểm tra lại yêu cầu' })).toBeVisible();
  await page.getByRole('button', { name: 'Thử lại với cùng mã gửi' }).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${committedReceipt?.orderCode}`));
  await expect(page.getByRole('heading', { name: 'Biên Nhận Đặt Hàng' })).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1].key).toBe(requests[0].key);
  expect(requests[1].payload).toEqual(requests[0].payload);
});
