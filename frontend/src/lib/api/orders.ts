import { apiFetch, mutationHeaders } from './client';
import type { CreateOrderRequest, OrderReceipt } from './contracts/types';

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
