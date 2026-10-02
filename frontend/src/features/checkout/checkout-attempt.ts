import type { CreateOrderRequest } from '@/lib/api/contracts/types';
import {
  clearPendingOrder,
  readPendingOrder,
  savePendingOrder,
  type PendingOrderAttempt,
} from '@/lib/checkout-storage';

export function createCheckoutAttempt(payload: CreateOrderRequest): PendingOrderAttempt {
  if (!globalThis.crypto?.randomUUID) throw new Error('Secure request identifiers are unavailable in this browser.');
  return { key: globalThis.crypto.randomUUID(), payload };
}

export function saveCheckoutAttempt(attempt: PendingOrderAttempt): boolean {
  return savePendingOrder(undefined, attempt);
}

export function readCheckoutAttempt(): PendingOrderAttempt | null {
  return readPendingOrder();
}

export function clearCheckoutAttempt(): void {
  clearPendingOrder();
}
