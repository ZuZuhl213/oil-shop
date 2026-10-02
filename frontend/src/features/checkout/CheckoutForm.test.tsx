import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CartProvider } from '@/context/CartContext';
import { clearPendingOrder, clearQuoteDraft, saveQuoteDraft } from '@/lib/checkout-storage';
import type { OrderReceipt } from '@/lib/api/contracts/types';
import { CheckoutForm } from './CheckoutForm';

const navigation = vi.hoisted(() => ({ query: '', push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

const fixedCart = {
  version: 1,
  saleType: 'FIXED_PRICE',
  items: [{
    productId: '1', productName: 'Dầu lạc', productSlug: 'dau-lac',
    variantId: '15', variantName: '1L', price: 90000, quantity: 1,
    minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut',
  }],
};

const receipt: OrderReceipt = {
  orderCode: 'DH-CHECKOUT-1', orderType: 'ORDER', status: 'NEW',
  subtotal: 90000, discountAmount: 0, totalAmount: 85000, createdAt: '2026-09-26T00:00:00Z',
};

type OrderRequest = { key: string | null; csrf: string | null; payload: unknown };
let orderRequests: OrderRequest[];

function stubApi(order: (request: OrderRequest) => Promise<Response> = async () => Response.json(receipt, { status: 201 })) {
  let csrfIndex = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/csrf')) {
      csrfIndex += 1;
      return Response.json({ token: 'csrf-' + csrfIndex, headerName: 'X-CSRF-TOKEN' });
    }
    if (url.endsWith('/orders')) {
      const headers = new Headers(init?.headers);
      const request = {
        key: headers.get('Idempotency-Key'),
        csrf: headers.get('X-CSRF-TOKEN'),
        payload: JSON.parse(init?.body as string),
      };
      orderRequests.push(request);
      return order(request);
    }
    throw new Error('Unexpected request: ' + url);
  }));
}

function mount() {
  return render(<CartProvider><CheckoutForm /></CartProvider>);
}

async function fillContact(name = 'Nguyen Van A', phone = '0912345678') {
  fireEvent.change(await screen.findByPlaceholderText('Ví dụ: Nguyễn Văn An'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('0912345678 hoặc +84912345678'), { target: { value: phone } });
}

function continueToReview() {
  fireEvent.click(screen.getByRole('button', { name: 'Xem lại thông tin' }));
}

function confirmSend() {
  fireEvent.click(screen.getByRole('button', { name: /Xác nhận và gửi|Thử lại với cùng mã gửi/ }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearPendingOrder();
  clearQuoteDraft();
  navigation.query = '';
  navigation.push.mockReset();
  orderRequests = [];
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify(fixedCart));
});

afterEach(() => {
  clearPendingOrder();
  clearQuoteDraft();
  vi.unstubAllGlobals();
});

it('shows a review step before sending an order', async () => {
  stubApi();
  mount();
  await fillContact();

  continueToReview();

  expect(screen.getByText('Kiểm tra lại yêu cầu')).toBeVisible();
  expect(orderRequests).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận và gửi yêu cầu' }));
  await waitFor(() => expect(orderRequests).toHaveLength(1));
});

it('refreshes an expired CSRF token and retries with the same idempotency key', async () => {
  stubApi(async () => orderRequests.length === 1
    ? Response.json({ code: 'CSRF_INVALID', message: 'CSRF token expired', fieldErrors: {} }, { status: 403 })
    : Response.json(receipt, { status: 201 }));
  mount();
  await fillContact();
  continueToReview();
  confirmSend();

  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/orders/DH-CHECKOUT-1'));
  expect(orderRequests).toHaveLength(2);
  expect(orderRequests[1].key).toBe(orderRequests[0].key);
  expect(orderRequests[1].csrf).not.toBe(orderRequests[0].csrf);
});

it('submits quote cart quantities without a price total', async () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
    version: 1,
    saleType: 'QUOTE',
    items: [{
      ...fixedCart.items[0], variantId: '9', variantName: '0.5kg', price: null,
      quantity: 0.5, minQuantity: 0.5, quantityStep: 0.5, saleType: 'QUOTE',
    }],
  }));
  stubApi();
  mount();

  expect(await screen.findByText('Yêu cầu báo giá')).toBeVisible();
  expect(screen.queryByText('Tổng thanh toán:')).not.toBeInTheDocument();
  expect(screen.queryByText(/0\s*₫/)).not.toBeInTheDocument();
});

it('does not persist customer contact details in the receipt after success', async () => {
  stubApi();
  mount();
  await fillContact();
  continueToReview();
  confirmSend();

  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/orders/DH-CHECKOUT-1'));
  expect(screen.getByText('DH-CHECKOUT-1')).toBeVisible();
  expect(screen.getByText(/85\.000 ₫/)).toBeVisible();
  const storedReceipt = sessionStorage.getItem('hm_order_receipt_DH-CHECKOUT-1') ?? '';
  expect(storedReceipt).not.toContain('0912345678');
  expect(storedReceipt).not.toContain('Nguyen Van A');
  expect(sessionStorage.getItem('hm_pending_order_v1')).toBeNull();
});

it('keeps contact and cart data after a validation error, then creates a new attempt after correction', async () => {
  stubApi(async () => orderRequests.length === 1
    ? Response.json({
      code: 'VALIDATION_ERROR', message: 'Phone number is invalid',
      fieldErrors: { phone: 'Số điện thoại chưa hợp lệ.' },
    }, { status: 422 })
    : Response.json(receipt, { status: 201 }));
  mount();
  await fillContact();
  continueToReview();
  confirmSend();

  expect(await screen.findByText('Phone number is invalid')).toBeVisible();
  expect(screen.getAllByText('Số điện thoại chưa hợp lệ.')).toHaveLength(2);
  const phoneInput = screen.getByRole('textbox', { name: /Số điện thoại/ });
  expect(phoneInput).toHaveValue('0912345678');
  expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toHaveLength(1);

  fireEvent.change(phoneInput, { target: { value: '+84912345678' } });
  continueToReview();
  confirmSend();
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/orders/DH-CHECKOUT-1'));
  expect(orderRequests).toHaveLength(2);
  expect(orderRequests[1].key).not.toBe(orderRequests[0].key);
  expect((orderRequests[1].payload as { phone: string }).phone).toBe('+84912345678');
});

it('keeps a cart changed in another tab while the order request is pending', async () => {
  let resolveOrder!: (response: Response) => void;
  stubApi(() => new Promise<Response>((resolve) => { resolveOrder = resolve; }));
  mount();
  await fillContact();
  continueToReview();
  confirmSend();
  await waitFor(() => expect(orderRequests).toHaveLength(1));

  const changedCart = {
    ...fixedCart,
    items: [{ ...fixedCart.items[0], quantity: 2 }],
  };
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify(changedCart));
  fireEvent(window, new StorageEvent('storage', {
    key: 'hm_naturals_cart_v1', newValue: JSON.stringify(changedCart),
  }));
  resolveOrder(Response.json(receipt, { status: 201 }));

  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/orders/DH-CHECKOUT-1'));
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toMatchObject([{ quantity: 2 }]);
});

it('links an unavailable variant response back to the cart', async () => {
  stubApi(async () => Response.json({
    code: 'ITEM_UNAVAILABLE',
    message: 'Catalog item is unavailable',
    fieldErrors: { variantId: '41' },
  }, { status: 422 }));
  mount();
  await fillContact();
  continueToReview();
  confirmSend();

  expect(await screen.findByText(/Catalog item is unavailable/)).toBeVisible();
  expect(screen.getByRole('link', { name: /Quay lại giỏ hàng/i })).toHaveAttribute('href', '/cart');
});

it('removes a stale voucher preview after the backend rejects the voucher and keeps the cart', async () => {
  let orderCount = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf-voucher', headerName: 'X-CSRF-TOKEN' });
    if (url.endsWith('/vouchers/validate')) return Response.json({ subtotal: 90000, discountAmount: 5000, totalAmount: 85000, voucherCode: 'SAVE5' });
    if (url.endsWith('/orders')) {
      orderCount += 1;
      return Response.json({ code: 'VOUCHER_EXHAUSTED', message: 'Voucher has no remaining uses', fieldErrors: {} }, { status: 422 });
    }
    throw new Error('Unexpected request: ' + url);
  }));
  mount();
  const voucherInput = await screen.findByLabelText('Mã giảm giá (không bắt buộc)');
  fireEvent.change(voucherInput, { target: { value: 'save5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra voucher' }));
  expect(await screen.findByText(/Đã kiểm tra mã SAVE5/)).toBeVisible();
  expect(screen.getByText('Chiết khấu voucher:')).toBeVisible();

  await fillContact();
  continueToReview();
  confirmSend();
  expect(await screen.findByText('Voucher has no remaining uses')).toBeVisible();

  expect(screen.queryByText('Chiết khấu voucher:')).not.toBeInTheDocument();
  expect(screen.getByText('Tổng ước lượng:').parentElement).toHaveTextContent('90.000 ₫');
  expect(orderCount).toBe(1);
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toHaveLength(1);
});

it('keeps the fixed price cart after a quote request succeeds', async () => {
  saveQuoteDraft(undefined, {
    productId: '2', productName: 'Dầu lạc sỉ', productSlug: 'dau-lac-si',
    variantId: '99', variantName: '5L', quantity: 5, minQuantity: 5, quantityStep: 5, thumbnailType: 'peanut',
  });
  stubApi();
  render(<CartProvider><CheckoutForm legacyQuoteMode /></CartProvider>);
  await fillContact();
  continueToReview();
  confirmSend();
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/orders/DH-CHECKOUT-1'));

  expect(orderRequests[0].payload).toMatchObject({ orderType: 'QUOTE_REQUEST', items: [{ variantId: '99', quantity: 5 }] });
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toMatchObject([{ variantId: '15', quantity: 1 }]);
});

it('handles ITEM_UNAVAILABLE with empty fieldErrors and leaves cart items intact', async () => {
  stubApi(async () => Response.json({ code: 'ITEM_UNAVAILABLE', message: 'Catalog item is unavailable', fieldErrors: {} }, { status: 422 }));
  mount();
  await fillContact();
  continueToReview();
  confirmSend();

  expect(await screen.findByText(/Catalog item is unavailable/)).toBeVisible();
  expect(screen.getByRole('link', { name: /Quay lại giỏ hàng/i })).toHaveAttribute('href', '/cart');
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toHaveLength(1);
});

it('does not retry a non-CSRF 403 and allows a new submission attempt', async () => {
  stubApi(async () => Response.json({ code: 'FORBIDDEN', message: 'Origin is not allowed', fieldErrors: {} }, { status: 403 }));
  mount();
  await fillContact();
  continueToReview();
  confirmSend();

  expect(await screen.findByText('Origin is not allowed')).toBeVisible();
  expect(orderRequests).toHaveLength(1);
  expect(screen.getByPlaceholderText('Ví dụ: Nguyễn Văn An')).not.toBeDisabled();
});

it('treats a 401 as a definite rejection and releases the saved attempt for correction', async () => {
  stubApi(async () => Response.json({ code: 'UNAUTHENTICATED', message: 'Authentication is required', fieldErrors: {} }, { status: 401 }));
  mount();
  await fillContact();
  continueToReview();
  confirmSend();

  expect(await screen.findByText('Authentication is required')).toBeVisible();
  expect(orderRequests).toHaveLength(1);
  expect(sessionStorage.getItem('hm_pending_order_v1')).toBeNull();
  expect(screen.getByPlaceholderText('Ví dụ: Nguyễn Văn An')).not.toBeDisabled();
});

it('clears a conflicting pending key and does not offer an infinite retry with it', async () => {
  stubApi(async () => Response.json({ code: 'IDEMPOTENCY_CONFLICT', message: 'conflict', fieldErrors: {} }, { status: 409 }));
  mount();
  await fillContact();
  continueToReview();
  confirmSend();

  expect(await screen.findByText(/Mã gửi này đã được dùng/)).toBeVisible();
  expect(sessionStorage.getItem('hm_pending_order_v1')).toBeNull();
  expect(screen.getByPlaceholderText('Ví dụ: Nguyễn Văn An')).not.toBeDisabled();
});

it('reuses the persisted payload and key after remount when the result is unknown', async () => {
  stubApi(async () => Response.json({ code: 'SERVICE_UNAVAILABLE', message: 'offline', fieldErrors: {} }, { status: 503 }));
  const first = mount();
  await fillContact();
  continueToReview();
  confirmSend();
  expect(await screen.findByText(/Chưa xác định được kết quả gửi đơn/i)).toBeVisible();
  const saved = JSON.parse(sessionStorage.getItem('hm_pending_order_v1')!);
  first.unmount();

  mount();
  confirmSend();
  await waitFor(() => expect(orderRequests).toHaveLength(2));
  expect(orderRequests[1].key).toBe(saved.key);
  expect(orderRequests[1].payload).toEqual(saved.payload);
});
