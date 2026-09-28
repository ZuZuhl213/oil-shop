import type { CreateOrderRequest } from './api/contracts/types';

export const PENDING_ORDER_STORAGE_KEY = 'hm_pending_order_v1';
export const QUOTE_DRAFT_STORAGE_KEY = 'hm_quote_draft_v1';

export interface PendingOrderAttempt {
  key: string;
  payload: CreateOrderRequest;
}

export type QuoteThumbnailType = 'peanut' | 'sesame' | 'sachi' | 'byproduct' | 'gac' | 'coconut' | 'seeds';

export interface QuoteDraft {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  quantity: number;
  minQuantity: number;
  quantityStep: number;
  thumbnailType: QuoteThumbnailType;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

let memoryPendingOrder: PendingOrderAttempt | null = null;
let pendingOrderMemoryIsLatest = false;
let memoryQuoteDraft: QuoteDraft | null = null;
let quoteDraftMemoryIsLatest = false;
const memoryReceipts = new Map<string, unknown>();

function browserSessionStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function storageOrBrowser(storage?: StorageLike | null): StorageLike | null {
  return storage === undefined ? browserSessionStorage() : storage;
}

function isItem(value: unknown): value is { variantId: string; quantity: number } {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.variantId === 'string'
    && item.variantId.trim().length > 0
    && typeof item.quantity === 'number'
    && Number.isFinite(item.quantity)
    && item.quantity > 0;
}

function isCreateOrderRequest(value: unknown): value is CreateOrderRequest {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (payload.orderType === 'ORDER' || payload.orderType === 'QUOTE_REQUEST')
    && typeof payload.customerName === 'string'
    && typeof payload.phone === 'string'
    && Array.isArray(payload.items)
    && payload.items.length > 0
    && payload.items.every(isItem)
    && (payload.address === undefined || typeof payload.address === 'string')
    && (payload.note === undefined || typeof payload.note === 'string')
    && (payload.voucherCode === undefined || typeof payload.voucherCode === 'string');
}

function isPendingOrder(value: unknown): value is PendingOrderAttempt {
  if (!value || typeof value !== 'object') return false;
  const attempt = value as Record<string, unknown>;
  return typeof attempt.key === 'string'
    && attempt.key.trim().length > 0
    && isCreateOrderRequest(attempt.payload);
}

export function savePendingOrder(
  storage: StorageLike | null | undefined,
  attempt: PendingOrderAttempt,
): boolean {
  if (!isPendingOrder(attempt)) return false;
  memoryPendingOrder = attempt;
  pendingOrderMemoryIsLatest = true;
  try {
    const target = storageOrBrowser(storage);
    target?.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(attempt));
    return target !== null;
  } catch {
    return false;
  }
}

export function readPendingOrder(storage?: StorageLike | null): PendingOrderAttempt | null {
  if (pendingOrderMemoryIsLatest) return memoryPendingOrder;
  try {
    const saved = storageOrBrowser(storage)?.getItem(PENDING_ORDER_STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isPendingOrder(parsed)) {
        memoryPendingOrder = parsed;
        pendingOrderMemoryIsLatest = true;
        return parsed;
      }
    }
  } catch {
    // Use the in-memory attempt when sessionStorage is blocked or malformed.
  }
  return memoryPendingOrder;
}

export function clearPendingOrder(storage?: StorageLike | null): void {
  memoryPendingOrder = null;
  pendingOrderMemoryIsLatest = false;
  const target = storageOrBrowser(storage);
  try {
    target?.removeItem(PENDING_ORDER_STORAGE_KEY);
  } catch {
    // Storage cleanup is best effort; the in-memory attempt is already cleared.
    pendingOrderMemoryIsLatest = true;
  }
  if (target === null) pendingOrderMemoryIsLatest = true;
}

export function isQuoteDraft(value: unknown): value is QuoteDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  return typeof draft.productId === 'string'
    && typeof draft.productName === 'string'
    && typeof draft.productSlug === 'string'
    && typeof draft.variantId === 'string'
    && typeof draft.variantName === 'string'
    && typeof draft.quantity === 'number'
    && Number.isFinite(draft.quantity)
    && draft.quantity > 0
    && typeof draft.minQuantity === 'number'
    && Number.isFinite(draft.minQuantity)
    && draft.minQuantity > 0
    && typeof draft.quantityStep === 'number'
    && Number.isFinite(draft.quantityStep)
    && draft.quantityStep > 0
    && typeof draft.thumbnailType === 'string';
}

export function saveQuoteDraft(storage: StorageLike | null | undefined, draft: QuoteDraft): boolean {
  if (!isQuoteDraft(draft)) return false;
  memoryQuoteDraft = draft;
  quoteDraftMemoryIsLatest = true;
  try {
    const target = storageOrBrowser(storage);
    target?.setItem(QUOTE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return target !== null;
  } catch {
    return false;
  }
}

export function readQuoteDraft(storage?: StorageLike | null): QuoteDraft | null {
  if (quoteDraftMemoryIsLatest) return memoryQuoteDraft;
  try {
    const saved = storageOrBrowser(storage)?.getItem(QUOTE_DRAFT_STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isQuoteDraft(parsed)) {
        memoryQuoteDraft = parsed;
        quoteDraftMemoryIsLatest = true;
        return parsed;
      }
    }
  } catch {
    // Use memory fallback when sessionStorage is blocked or malformed.
  }
  return memoryQuoteDraft;
}

export function clearQuoteDraft(storage?: StorageLike | null): void {
  memoryQuoteDraft = null;
  quoteDraftMemoryIsLatest = false;
  const target = storageOrBrowser(storage);
  try {
    target?.removeItem(QUOTE_DRAFT_STORAGE_KEY);
  } catch {
    // Best effort cleanup.
    quoteDraftMemoryIsLatest = true;
  }
  if (target === null) quoteDraftMemoryIsLatest = true;
}

export function rememberReceipt<T>(orderCode: string, receipt: T): void {
  memoryReceipts.set(orderCode, receipt);
}

export function readReceipt<T>(storage: StorageLike | null | undefined, orderCode: string): T | null {
  try {
    const saved = storageOrBrowser(storage)?.getItem('hm_order_receipt_' + orderCode);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && (parsed as { orderCode?: unknown }).orderCode === orderCode) {
        return parsed as T;
      }
    }
  } catch {
    // Use the in-memory receipt below.
  }
  return (memoryReceipts.get(orderCode) as T | undefined) ?? null;
}
