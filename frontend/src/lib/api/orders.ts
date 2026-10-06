import { apiFetch, mutationHeaders } from './client';
import type { CreateOrderRequest, OrderReceipt, OrderTracking } from './contracts/types';

export async function createOrder(
  body: CreateOrderRequest,
  idempotencyKey: string,
): Promise<OrderReceipt> {
  return apiFetch<OrderReceipt>('/orders', {
    method: 'POST',
    headers: await mutationHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    }),
    body: JSON.stringify(body),
  });
}

export async function trackOrder(orderCode: string, phone: string): Promise<OrderTracking> {
  return apiFetch<OrderTracking>('/orders/tracking', {
    method: 'POST',
    headers: await mutationHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ orderCode, phone }),
  });
}
