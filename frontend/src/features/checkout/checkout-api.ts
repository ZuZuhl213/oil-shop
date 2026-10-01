import { ApiClientError, apiFetch, mutationHeaders } from '@/lib/api/client';
import type { CreateOrderRequest, ItemInput, OrderReceipt, PricePreview } from '@/lib/api/contracts/types';

export async function validateVoucher(code: string, items: ItemInput[]): Promise<PricePreview> {
  return apiFetch<PricePreview>('/vouchers/validate', {
    method: 'POST',
    headers: await mutationHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ code: code.trim().toUpperCase(), items }),
  });
}

async function postOrder(payload: CreateOrderRequest, key: string): Promise<OrderReceipt> {
  return apiFetch<OrderReceipt>('/orders', {
    method: 'POST',
    headers: await mutationHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    }),
    body: JSON.stringify(payload),
  });
}

export async function createOrder(payload: CreateOrderRequest, key: string): Promise<OrderReceipt> {
  try {
    return await postOrder(payload, key);
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 403) throw error;
    // postOrder fetches a new CSRF token through mutationHeaders and reuses the same idempotency key.
    return postOrder(payload, key);
  }
}
