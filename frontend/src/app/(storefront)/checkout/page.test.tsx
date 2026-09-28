import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CartProvider } from '@/context/CartContext';
import { clearPendingOrder, clearQuoteDraft, readReceipt } from '@/lib/checkout-storage';
import type { CreateOrderRequest, OrderReceipt } from '@/lib/api/contracts/types';
import CheckoutPage from './page';

const navigation = vi.hoisted(() => ({ query: '', push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));

const cartLine = {
  productId: '1', productName: 'Dầu thật', productSlug: 'dau-that',
  variantId: '15', variantName: '1L', price: 90000, quantity: 1,
  minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut',
};
const receipt: OrderReceipt = {
  orderCode: 'DH-TEST-1', orderType: 'ORDER', status: 'NEW',
  subtotal: 90000, discountAmount: 0, totalAmount: 90000, createdAt: '2026-09-26T00:00:00Z',
};
let requests: { key: string | null; payload: CreateOrderRequest }[];

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  clearPendingOrder(); clearQuoteDraft();
  navigation.query = ''; navigation.push.mockReset(); requests = [];
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({version: 1, saleType: 'FIXED_PRICE', items: [cartLine]}));
});
afterEach(() => { clearPendingOrder(); clearQuoteDraft(); vi.unstubAllGlobals(); });

function api(order: () => Promise<Response> = () => Promise.reject(new Error('lost response'))) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf-test', headerName: 'X-CSRF-TOKEN' });
    if (url.endsWith('/orders')) {
      requests.push({ key: new Headers(init?.headers).get('Idempotency-Key'), payload: JSON.parse(init?.body as string) });
      return order();
    }
    throw new Error('Unexpected request: ' + url);
  }));
}
function mount() { return render(<CartProvider><CheckoutPage /></CartProvider>); }
async function submit(name = 'Nguyen Van A') {
  const input = await screen.findByPlaceholderText('Ví dụ: Nguyễn Văn An');
  fireEvent.change(input, { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('Ví dụ: 0912 345 678'), { target: { value: '0912345678' } });
  fireEvent.submit(input.closest('form')!);
}

it('reuses the original key and payload after a timeout and remount', async () => {
  api(); const first = mount(); await submit();
  await screen.findByRole('alert');
  const sent = requests[0];
  first.unmount(); mount();
  const retry = await screen.findByRole('button', { name: /Gửi|Thử/ });
  fireEvent.submit(retry.closest('form')!);
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[1]).toEqual(sent);
});

it('does not replace an uncertain payload with edited form data', async () => {
  api(); mount(); await submit(); await screen.findByRole('alert');
  const sent = requests[0];
  await submit('Changed name');
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[1]).toEqual(sent);
});

it('keeps an uncertain attempt if a later retry is rejected before order lookup', async () => {
  let count=0;
  api(async()=>++count===1 ? Promise.reject(new Error('lost response'))
    : Response.json({code:'FORBIDDEN',message:'Origin is not allowed',fieldErrors:{}},{status:403}));
  mount();await submit();await screen.findByRole('alert');
  const sent=requests[0];await submit();
  await waitFor(()=>expect(requests).toHaveLength(2));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Thử Lại Yêu Cầu Đã Gửi'})).toBeEnabled());
  expect(JSON.parse(sessionStorage.getItem('hm_pending_order_v1')!)).toEqual(sent);
});

it('can retry the saved payload even when the local cart is missing after reload', async () => {
  api();const first=mount();await submit();await screen.findByRole('alert');
  const sent=requests[0];first.unmount();localStorage.clear();mount();
  const retry=await screen.findByRole('button',{name:'Thử Lại Yêu Cầu Đã Gửi'});
  fireEvent.submit(retry.closest('form')!);
  await waitFor(()=>expect(requests).toHaveLength(2));
  expect(requests[1]).toEqual(sent);
});

it('does not expose the retail cart when quote draft is missing', async () => {
  api(); navigation.query = 'mode=quote'; mount();
  expect(await screen.findByText(/Chưa có sản phẩm báo giá|Không tìm thấy yêu cầu báo giá/)).toBeVisible();
  expect(screen.queryByPlaceholderText('Ví dụ: Nguyễn Văn An')).not.toBeInTheDocument();
  expect(requests).toHaveLength(0);
});

it('only sends one request when the form is submitted twice before response', async () => {
  let resolve!: (value: Response) => void;
  api(() => new Promise<Response>((done) => { resolve = done; })); mount(); await submit();
  fireEvent.submit(screen.getByPlaceholderText('Ví dụ: Nguyễn Văn An').closest('form')!);
  await waitFor(() => expect(requests).toHaveLength(1));
  resolve(Response.json(receipt, { status: 201 }));
  await waitFor(() => expect(navigation.push).toHaveBeenCalled());
  expect(requests).toHaveLength(1);
});

it('does not send a second quote while the successful request is leaving the page', async () => {
  navigation.query = 'mode=quote';
  sessionStorage.setItem('hm_quote_draft_v1', JSON.stringify({
    productId: '3', productName: 'Dầu Sachi', productSlug: 'dau-sachi',
    variantId: '9', variantName: '0.5kg', quantity: 0.5, minQuantity: 0.5,
    quantityStep: 0.5, thumbnailType: 'sachi',
  }));
  api(async () => Response.json({ ...receipt, orderCode: 'BG-TEST-1', orderType: 'QUOTE_REQUEST', subtotal: null, totalAmount: null }, { status: 201 }));
  mount();
  await submit();
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/orders/BG-TEST-1'));

  const form = screen.getByPlaceholderText('Ví dụ: Nguyễn Văn An').closest('form')!;
  fireEvent.submit(form);

  await waitFor(() => expect(requests).toHaveLength(1));
  expect(screen.getByRole('button', { name: 'Gửi Yêu Cầu Báo Giá' })).toBeDisabled();
});

it('calculates a retry summary from the pending payload instead of the current cart', async () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ version: 1, saleType: 'FIXED_PRICE', items: [{ ...cartLine, quantity: 5 }] }));
  sessionStorage.setItem('hm_pending_order_v1', JSON.stringify({
    key: 'pending-key',
    payload: { ...receipt, orderType: 'ORDER', customerName: 'Nguyen Van A', phone: '0912345678', items: [{ variantId: '15', quantity: 1 }] },
  }));
  api();
  mount();

  await screen.findByText('Quy cách: 1L • Số lượng: 1');
  const pricingSummary = screen.getByText('Tạm tính tiền hàng:').parentElement!;
  expect(pricingSummary).toHaveTextContent('90.000 ₫');
  expect(pricingSummary).not.toHaveTextContent('450.000 ₫');
});

it('uses a new key after a definitive validation error and corrected form', async () => {
  let count = 0;
  api(async () => ++count === 1
    ? Response.json({code:'VALIDATION_ERROR',message:'Invalid name',fieldErrors:{customerName:'Invalid name'}}, {status:422})
    : Response.json(receipt, {status:201}));
  mount(); await submit(); await screen.findByRole('alert');
  await submit('Corrected name');
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[1].key).not.toBe(requests[0].key);
  expect(requests[1].payload.customerName).toBe('Corrected name');
});

it('retains the successful receipt in memory when storage writes fail', async () => {
  api(async () => Response.json(receipt, {status:201}));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  mount(); await submit();
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/orders/DH-TEST-1'));
  expect(readReceipt(undefined, 'DH-TEST-1')).toMatchObject(receipt);
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toHaveLength(1);
});
